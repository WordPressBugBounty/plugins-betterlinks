<?php
namespace BetterLinks\Services;
if ( ! defined( 'ABSPATH' ) ) { exit; }

use BetterLinks\Helper;

// phpcs:disable PluginCheck.Security.DirectDB, WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL

/**
 * Country Detection Service
 * 
 * Handles IP-to-country detection with caching and efficient database storage
 */
class CountryDetectionService {

    /**
     * Cache duration for IP-to-country mapping (24 hours)
     */
    const CACHE_DURATION = DAY_IN_SECONDS;

    /**
     * Ceiling on outbound provider lookups per hour, across the whole site.
     *
     * Cache hits do not count, and lookups are keyed on the real peer, so on a
     * normal site this tracks new unique visitors per hour. Deliberately set well
     * above real-world traffic: it is a runaway circuit breaker, not a functional
     * quota, and must not throttle geolocation on a busy site. Override with the
     * `betterlinks/geolocation/hourly_lookup_limit` filter (0 or less disables it).
     */
    const MAX_LOOKUPS_PER_HOUR = 5000;

    /**
     * Multiple API endpoints for fallback support
     * Tries APIs in order until one succeeds
     */
    const API_ENDPOINTS = array(
        array(
            'url' => 'http://ip-api.com/json/{IP}',
            'limit' => '45 requests per minute',
            'country_field' => 'country',
            'country_code_field' => 'countryCode'
        ),
        array(
            'url' => 'https://api.db-ip.com/v2/free/{IP}',
            'limit' => '500 requests per day',
            'country_field' => 'countryName',
            'country_code_field' => 'countryCode'
        ),
        array(
            'url' => 'https://free.freeipapi.com/api/json/{IP}',
            'limit' => '60 requests per minute',
            'country_field' => 'countryName',
            'country_code_field' => 'countryCode'
        ),
        array(
            'url' => 'https://api.ipinfo.io/lite/{IP}?token=42ae8aabca02ac',
            'limit' => 'depends on token plan',
            'country_field' => 'country',
            'country_code_field' => 'country_code'
        )
    );

    /**
     * Get country information for an IP address
     *
     * Note: Country data is primarily detected on the frontend via JavaScript.
     * This method is used as a fallback when frontend detection fails.
     *
     * @param string $ip The IP address to lookup
     * @return array|null Array with country_code and country_name, or null if not found
     */
    public static function get_country_by_ip( $ip ) {
        if ( empty( $ip ) || ! filter_var( $ip, FILTER_VALIDATE_IP ) ) {
            return null;
        }

        // Check cache first
        $cached_country = self::get_cached_country( $ip );
        if ( $cached_country !== null ) {
            return $cached_country;
        }

        // Try to fetch from APIs if not cached
        $country_data = self::fetch_country_from_api( $ip );
        if ( $country_data ) {
            // Cache the result
            self::cache_country( $ip, $country_data );
            return $country_data;
        }

        return null;
    }

    /**
     * Get cached country data for an IP
     * 
     * @param string $ip The IP address
     * @return array|null Cached country data or null
     */
    private static function get_cached_country( $ip ) {
        $cache_key = 'btl_country_' . md5( $ip );
        $cached = get_transient( $cache_key );
        
        if ( $cached && is_array( $cached ) ) {
            return $cached;
        }
        
        return null;
    }

    /**
     * Cache country data for an IP
     *
     * @param string $ip The IP address
     * @param array $country_data Country information
     */
    public static function cache_country( $ip, $country_data ) {
        $cache_key = 'btl_country_' . md5( $ip );
        set_transient( $cache_key, $country_data, self::CACHE_DURATION );
    }

    /**
     * Fetch country data from multiple APIs with fallback support
     *
     * @param string $ip The IP address
     * @return array|null Country data from API or null
     */
    private static function fetch_country_from_api( $ip ) {
        // Global circuit breaker on OUTBOUND lookups (cache misses only). Bounds
        // upstream provider quota burn and the number of per-IP transients this
        // plugin can create in an hour, no matter which caller triggers it.
        if ( ! self::consume_lookup_budget() ) {
            return null;
        }

        foreach ( self::API_ENDPOINTS as $api_config ) {
            $country_data = self::try_single_api( $ip, $api_config );
            if ( $country_data ) {
                return $country_data;
            }
        }
        return null;
    }

    /**
     * Fixed-window budget for outbound geolocation lookups.
     *
     * @return bool True when this lookup is allowed to proceed.
     */
    private static function consume_lookup_budget() {
        $limit  = (int) apply_filters( 'betterlinks/geolocation/hourly_lookup_limit', self::MAX_LOOKUPS_PER_HOUR );
        $window = HOUR_IN_SECONDS;

        if ( $limit <= 0 ) {
            return true; // Explicitly disabled by the site owner.
        }

        return self::consume_bucket( 'btl_geo_lookup_budget', $limit, $window );
    }

    /**
     * Fixed-window counter shared by the lookup budget and the REST rate limiter.
     *
     * @param string $key    Transient key.
     * @param int    $limit  Allowed hits per window.
     * @param int    $window Window length in seconds.
     * @return bool True when the hit is within budget.
     */
    public static function consume_bucket( $key, $limit, $window ) {
        $bucket = get_transient( $key );
        $now    = time();

        if ( ! is_array( $bucket ) || ! isset( $bucket['start'], $bucket['count'] ) || ( $now - (int) $bucket['start'] ) >= $window ) {
            $bucket = array(
                'start' => $now,
                'count' => 0,
            );
        }

        ++$bucket['count'];

        // Keep the transient alive only for the remainder of the current window
        // so the counter cannot be held open indefinitely by continued traffic.
        $ttl = max( 1, $window - ( $now - (int) $bucket['start'] ) );
        set_transient( $key, $bucket, $ttl );

        return ( $bucket['count'] <= $limit );
    }

    /**
     * Try a single API endpoint
     *
     * @param string $ip The IP address
     * @param array $api_config API configuration
     * @return array|null Country data or null if failed
     */
    private static function try_single_api( $ip, $api_config ) {
        $rate_limit_key = 'btl_api_rate_limit_' . md5( $api_config['url'] );
        if ( get_transient( $rate_limit_key ) ) {
            return null;
        }

        $api_url = str_replace( '{IP}', $ip, $api_config['url'] );

        $response = wp_remote_get( $api_url, array(
            'timeout' => 10,
            'headers' => array(
                'User-Agent' => 'BetterLinks/' . BETTERLINKS_VERSION
            )
        ) );

        if ( is_wp_error( $response ) ) {
            return null;
        }

        $response_code = wp_remote_retrieve_response_code( $response );

        if ( $response_code === 429 ) {
            set_transient( $rate_limit_key, true, 5 * MINUTE_IN_SECONDS );
            return null;
        }

        if ( $response_code !== 200 ) {
            return null;
        }

        $body = wp_remote_retrieve_body( $response );
        $data = json_decode( $body, true );

        if ( ! $data ) {
            return null;
        }

        if ( isset( $data['status'] ) && $data['status'] === 'fail' ) {
            return null;
        }

        $country_field = $api_config['country_field'];
        $country_code_field = $api_config['country_code_field'];

        if ( ! isset( $data[$country_field] ) || ! isset( $data[$country_code_field] ) ) {
            return null;
        }

        return array(
            'country_code' => sanitize_text_field( $data[$country_code_field] ),
            'country_name' => sanitize_text_field( $data[$country_field] ),
        );
    }

    /**
     * Get or create country record and return country_id
     *
     * @param string $country_code The country code
     * @param string $country_name The country name
     * @return int|null Country ID or null if failed
     */
    public static function get_or_create_country_id( $country_code, $country_name ) {
        global $wpdb;

        if ( empty( $country_code ) || empty( $country_name ) ) {
            return null;
        }

        $table_name = $wpdb->prefix . 'betterlinks_countries';

        // Try to get existing country
        $country = $wpdb->get_row( $wpdb->prepare(
            "SELECT id FROM {$table_name} WHERE country_code = %s",
            $country_code
        ), ARRAY_A );

        if ( $country ) {
            return (int) $country['id'];
        }

        // Create new country record
        $inserted = $wpdb->insert(
            $table_name,
            array(
                'country_code' => $country_code,
                'country_name' => $country_name,
            ),
            array( '%s', '%s' )
        );

        if ( $inserted ) {
            return (int) $wpdb->insert_id;
        }

        return null;
    }

    /**
     * Get country data from lookup table by country code
     *
     * @param string $country_code The country code
     * @return array|null Country data or null
     */
    public static function get_country_from_lookup_table( $country_code ) {
        global $wpdb;

        $table_name = $wpdb->prefix . 'betterlinks_countries';

        $country = $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM {$table_name} WHERE country_code = %s",
            $country_code
        ), ARRAY_A );

        return $country ? $country : null;
    }

    /**
     * Get country data by country_id
     *
     * @param int $country_id The country ID
     * @return array|null Country data or null
     */
    public static function get_country_by_id( $country_id ) {
        global $wpdb;

        $table_name = $wpdb->prefix . 'betterlinks_countries';

        $country = $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM {$table_name} WHERE id = %d",
            $country_id
        ), ARRAY_A );

        return $country ? $country : null;
    }

    /**
     * Get all countries from lookup table
     * 
     * @return array Array of all countries
     */
    public static function get_all_countries() {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'betterlinks_countries';
        
        $countries = $wpdb->get_results(
            "SELECT * FROM {$table_name} ORDER BY country_name ASC",
            ARRAY_A
        );
        
        return $countries ? $countries : array();
    }

    /**
     * Clear country cache for an IP
     * 
     * @param string $ip The IP address
     */
    public static function clear_country_cache( $ip ) {
        $cache_key = 'btl_country_' . md5( $ip );
        delete_transient( $cache_key );
    }



    /**
     * Get country statistics for analytics
     *
     * @param string $from Start date
     * @param string $to End date
     * @param int|null $link_id Optional link ID to filter by
     * @param int|null $limit Optional row cap. Null returns every country, which
     *                        the geography map needs so it can shade the whole
     *                        world; the list view passes a small number.
     * @return array Country statistics
     */
    public static function get_country_statistics( $from, $to, $link_id = null, $limit = null ) {
        global $wpdb;

        $cache_key = 'btl_country_stats_' . md5( $from . $to . $link_id . '_' . $limit );
        $cached = get_transient( $cache_key );

        if ( $cached && is_array( $cached ) ) {
            return $cached;
        }

        $clicks_table = $wpdb->prefix . 'betterlinks_clicks';
        $countries_table = $wpdb->prefix . 'betterlinks_countries';

        $where_clause = "WHERE c.created_at BETWEEN %s AND %s AND c.country_id IS NOT NULL";
        $params = array( $from . ' 00:00:00', $to . ' 23:59:59' );

        if ( $link_id ) {
            $where_clause .= " AND c.link_id = %d";
            $params[] = $link_id;
        }

        $limit_clause = '';
        if ( null !== $limit ) {
            $limit_clause = ' LIMIT %d';
            $params[]     = (int) $limit;
        }

        // Placeholders supplied via $params; $clicks_table/$countries_table/$where_clause built from controlled internal values.
        // phpcs:disable WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        $query = $wpdb->prepare(
            "SELECT co.country_code, co.country_name, COUNT(*) as clicks, COUNT(DISTINCT c.ip) as unique_clicks
             FROM {$clicks_table} c
             LEFT JOIN {$countries_table} co ON c.country_id = co.id
             {$where_clause}
             GROUP BY c.country_id, co.country_code, co.country_name
             ORDER BY clicks DESC{$limit_clause}",
            $params
        );
        // phpcs:enable WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare,WordPress.DB.PreparedSQL.InterpolatedNotPrepared

        $results = $wpdb->get_results( $query, ARRAY_A );

        set_transient( $cache_key, $results, self::CACHE_DURATION );
        return $results ? $results : array();
    }

    /**
     * Get current client IP address
     *
     * Only REMOTE_ADDR is trusted by default. Forwarding headers
     * (X-Forwarded-For and friends) are attacker-controlled on any request that
     * does not physically come through a reverse proxy: previously an anonymous
     * caller could send an arbitrary public IP per request, which defeated the
     * per-IP transient cache and forced one fresh outbound geolocation lookup
     * (up to four providers, 10s timeout each) for every request — burning the
     * site owner's upstream quota and tying up PHP workers.
     *
     * A forwarding header is honored only when the immediate peer (REMOTE_ADDR)
     * is inside an operator-configured trusted-proxy range, and then only for a
     * single named header whose chain is parsed from the trusted (right) end.
     *
     * Configure with either:
     *   - option `betterlinks_trusted_proxies` (array or newline/comma separated
     *     list of IPs / CIDRs), or
     *   - filter `betterlinks/geolocation/trusted_proxies`.
     * The header can be swapped with `betterlinks/geolocation/forwarded_header`
     * (e.g. `HTTP_CF_CONNECTING_IP` behind Cloudflare).
     *
     * @return string|null The client IP address or null
     */
    public static function get_current_client_ip() {
        $remote_addr = isset( $_SERVER['REMOTE_ADDR'] )
            ? trim( sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) )
            : '';

        $client_ip = self::get_forwarded_client_ip( $remote_addr );

        if ( null === $client_ip ) {
            $client_ip = $remote_addr;
        }

        // Compatibility fallback. If REMOTE_ADDR is private/reserved, the request
        // definitively arrived through a local load balancer or reverse proxy and
        // REMOTE_ADDR carries no visitor information at all — returning null here
        // would silently switch country detection off for every site on that kind
        // of hosting. Those setups cannot be attacked by varying a header either:
        // the peer is the operator's own proxy. Fall back to the legacy header
        // walk, which is no worse than the previous behaviour for these sites.
        if ( ! filter_var( $client_ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE )
            && filter_var( $remote_addr, FILTER_VALIDATE_IP ) ) {
            $legacy = self::get_legacy_forwarded_ip();

            if ( null !== $legacy ) {
                $client_ip = $legacy;
            }
        }

        // Reject private/reserved space: those are never resolvable to a country
        // and must not be handed to an outbound provider lookup.
        if ( filter_var( $client_ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE ) ) {
            return $client_ip;
        }

        return null;
    }

    /**
     * Resolve the client IP from a forwarding header, if and only if the request
     * actually arrived through a trusted proxy.
     *
     * @param string $remote_addr The immediate peer address.
     * @return string|null Forwarded client IP, or null to fall back to REMOTE_ADDR.
     */
    private static function get_forwarded_client_ip( $remote_addr ) {
        $trusted = self::get_trusted_proxies();

        if ( empty( $trusted ) || ! self::ip_matches_any( $remote_addr, $trusted ) ) {
            return null;
        }

        // Behind Cloudflare the canonical header is CF-Connecting-IP, and it is a
        // single address rather than a chain. Only reachable when REMOTE_ADDR is a
        // Cloudflare edge, which the trusted-proxy check above has established.
        $default_header = ( self::ip_matches_any( $remote_addr, self::cloudflare_ranges() ) && ! empty( $_SERVER['HTTP_CF_CONNECTING_IP'] ) )
            ? 'HTTP_CF_CONNECTING_IP'
            : 'HTTP_X_FORWARDED_FOR';

        $header = apply_filters( 'betterlinks/geolocation/forwarded_header', $default_header );
        $header = is_string( $header ) ? strtoupper( str_replace( '-', '_', $header ) ) : '';

        if ( '' === $header || empty( $_SERVER[ $header ] ) ) {
            return null;
        }

        $raw = sanitize_text_field( wp_unslash( $_SERVER[ $header ] ) );

        // Single-value headers (CF-Connecting-IP, True-Client-IP) carry one address.
        if ( strpos( $raw, ',' ) === false ) {
            $candidate = trim( $raw );
            return filter_var( $candidate, FILTER_VALIDATE_IP ) ? $candidate : null;
        }

        // X-Forwarded-For style chain: the rightmost entries were appended by our
        // own proxies, so walk from the trusted end inward and take the first hop
        // that is not itself a trusted proxy. Anything an external client
        // prepended stays to the left of that and is never reached.
        $chain = array_map( 'trim', explode( ',', $raw ) );

        for ( $i = count( $chain ) - 1; $i >= 0; $i-- ) {
            $candidate = $chain[ $i ];

            if ( ! filter_var( $candidate, FILTER_VALIDATE_IP ) ) {
                // Ambiguous / malformed chain — refuse to guess.
                return null;
            }

            if ( ! self::ip_matches_any( $candidate, $trusted ) ) {
                return $candidate;
            }
        }

        return null;
    }

    /**
     * Operator-configured trusted proxy IPs / CIDRs.
     *
     * @return array
     */
    private static function get_trusted_proxies() {
        $configured = get_option( 'betterlinks_trusted_proxies', array() );

        if ( is_string( $configured ) ) {
            $configured = preg_split( '/[\s,]+/', $configured, -1, PREG_SPLIT_NO_EMPTY );
        }

        // Cloudflare is trusted out of the box: it is by far the most common proxy
        // in front of WordPress sites, and without it every Cloudflare-fronted site
        // would suddenly resolve all visitors to a Cloudflare edge IP. Override the
        // whole list — including this default — with the filter below.
        $configured = array_merge( self::cloudflare_ranges(), (array) $configured );
        $configured = apply_filters( 'betterlinks/geolocation/trusted_proxies', $configured );

        return array_values( array_filter( array_map( 'trim', array_map( 'strval', $configured ) ) ) );
    }

    /**
     * Cloudflare's published edge ranges.
     *
     * Source: https://www.cloudflare.com/ips/ — refresh with the
     * `betterlinks/geolocation/cloudflare_ranges` filter if Cloudflare adds a
     * block before the next plugin release.
     *
     * @return array
     */
    private static function cloudflare_ranges() {
        return (array) apply_filters(
            'betterlinks/geolocation/cloudflare_ranges',
            array(
                '173.245.48.0/20',
                '103.21.244.0/22',
                '103.22.200.0/22',
                '103.31.4.0/22',
                '141.101.64.0/18',
                '108.162.192.0/18',
                '190.93.240.0/20',
                '188.114.96.0/20',
                '197.234.240.0/22',
                '198.41.128.0/17',
                '162.158.0.0/15',
                '104.16.0.0/13',
                '104.24.0.0/14',
                '172.64.0.0/13',
                '131.0.72.0/22',
                '2400:cb00::/32',
                '2606:4700::/32',
                '2803:f800::/32',
                '2405:b500::/32',
                '2405:8100::/32',
                '2a06:98c0::/29',
                '2c0f:f248::/32',
            )
        );
    }

    /**
     * Legacy forwarding-header walk.
     *
     * Only used as a fallback when REMOTE_ADDR is private/reserved, i.e. the site
     * sits behind a proxy we could not identify and REMOTE_ADDR is useless. Not
     * reachable on directly-connected sites, where header spoofing is the actual
     * attack.
     *
     * @return string|null
     */
    private static function get_legacy_forwarded_ip() {
        $ip_keys = array(
            'HTTP_CF_CONNECTING_IP',
            'HTTP_TRUE_CLIENT_IP',
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_REAL_IP',
            'HTTP_CLIENT_IP',
        );

        foreach ( $ip_keys as $key ) {
            if ( empty( $_SERVER[ $key ] ) ) {
                continue;
            }

            $ip = sanitize_text_field( wp_unslash( $_SERVER[ $key ] ) );

            if ( strpos( $ip, ',' ) !== false ) {
                $ip = explode( ',', $ip )[0];
            }

            $ip = trim( $ip );

            if ( filter_var( $ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE ) ) {
                return $ip;
            }
        }

        return null;
    }

    /**
     * Does $ip fall inside any of the given IPs / CIDR ranges?
     *
     * @param string $ip     Address to test.
     * @param array  $ranges IPs or CIDR blocks.
     * @return bool
     */
    private static function ip_matches_any( $ip, $ranges ) {
        if ( ! filter_var( $ip, FILTER_VALIDATE_IP ) ) {
            return false;
        }

        foreach ( $ranges as $range ) {
            if ( self::ip_in_range( $ip, $range ) ) {
                return true;
            }
        }

        return false;
    }

    /**
     * CIDR / exact-address match for both IPv4 and IPv6.
     *
     * @param string $ip    Address to test.
     * @param string $range IP or CIDR block.
     * @return bool
     */
    private static function ip_in_range( $ip, $range ) {
        if ( strpos( $range, '/' ) === false ) {
            $packed_ip    = @inet_pton( $ip );    // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
            $packed_range = @inet_pton( $range ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged

            return ( false !== $packed_ip && false !== $packed_range && $packed_ip === $packed_range );
        }

        list( $subnet, $bits ) = explode( '/', $range, 2 );

        if ( ! is_numeric( $bits ) ) {
            return false;
        }

        $bits         = (int) $bits;
        $packed_ip    = @inet_pton( $ip );     // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
        $packed_range = @inet_pton( $subnet ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged

        if ( false === $packed_ip || false === $packed_range || strlen( $packed_ip ) !== strlen( $packed_range ) ) {
            return false;
        }

        $max_bits = strlen( $packed_ip ) * 8;

        if ( $bits < 0 || $bits > $max_bits ) {
            return false;
        }

        $whole_bytes     = intdiv( $bits, 8 );
        $remaining_bits  = $bits % 8;

        if ( $whole_bytes > 0 && strncmp( $packed_ip, $packed_range, $whole_bytes ) !== 0 ) {
            return false;
        }

        if ( 0 === $remaining_bits ) {
            return true;
        }

        $mask = chr( ( 0xff << ( 8 - $remaining_bits ) ) & 0xff );

        return ( ( $packed_ip[ $whole_bytes ] & $mask ) === ( $packed_range[ $whole_bytes ] & $mask ) );
    }

    /**
     * Backfill country data for existing clicks without country information
     *
     * @param int $limit Number of records to process per batch
     * @return array Processing results
     */
    public static function backfill_country_data( $limit = 100 ) {
        global $wpdb;

        // Get clicks without country_id
        $clicks = $wpdb->get_results( $wpdb->prepare(
            "SELECT ID, ip FROM {$wpdb->prefix}betterlinks_clicks
             WHERE ip IS NOT NULL AND ip != ''
             AND country_id IS NULL
             LIMIT %d",
            $limit
        ), ARRAY_A );

        $processed = 0;
        $updated = 0;
        $errors = 0;

        foreach ( $clicks as $click ) {
            $processed++;

            $country_data = self::get_country_by_ip( $click['ip'] );

            if ( $country_data ) {
                // Get or create country record and get its ID
                $country_id = self::get_or_create_country_id(
                    $country_data['country_code'],
                    $country_data['country_name']
                );

                if ( $country_id ) {
                    $result = $wpdb->update(
                        $wpdb->prefix . 'betterlinks_clicks',
                        array( 'country_id' => $country_id ),
                        array( 'ID' => $click['ID'] ),
                        array( '%d' ),
                        array( '%d' )
                    );

                    if ( $result !== false ) {
                        $updated++;
                    } else {
                        $errors++;
                    }
                } else {
                    $errors++;
                }
            } else {
                $errors++;
            }

            // Add a small delay to avoid overwhelming the API
            usleep( 100000 ); // 0.1 second delay
        }

        return array(
            'processed' => $processed,
            'updated' => $updated,
            'errors' => $errors,
            'remaining' => self::get_clicks_without_country_count()
        );
    }

    /**
     * Get count of clicks without country data
     *
     * @return int Number of clicks without country data
     */
    public static function get_clicks_without_country_count() {
        global $wpdb;

        return (int) $wpdb->get_var(
            "SELECT COUNT(*) FROM {$wpdb->prefix}betterlinks_clicks
             WHERE ip IS NOT NULL AND ip != ''
             AND country_id IS NULL"
        );
    }


}
