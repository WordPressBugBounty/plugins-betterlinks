<?php
/**
 * Update settings ability.
 *
 * @package BetterLinks\Abilities\Settings
 */

declare(strict_types=1);

namespace BetterLinks\Abilities\Settings;

use BetterLinks\Abilities\Ability_Base;
use BetterLinks\Admin\Cache;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Update selected BetterLinks settings.
 *
 * The BetterLinks settings endpoint stores the entire settings object as one
 * blob, so posting only the changed keys would wipe everything else. This
 * ability reads the current settings, merges the requested keys on top, and
 * saves the full object — the same "never reset what the caller did not
 * mention" contract used elsewhere in the plugin.
 */
class Update_Settings extends Ability_Base {

	// Supplies get_settings_schema(), used below to know which setting names are real.
	use \BetterLinks\Traits\ArgumentSchema;

	/**
	 * Settings the free plugin owns and shows on its own screens (Settings tabs,
	 * Custom Fields, Quick Link Creation, Fluent Boards). Grouped settings list
	 * their writable fields. Locked Pro teasers (force_https,
	 * uncloak_categories, …) and the usage-data consent are not here on purpose.
	 */
	private const FREE_SETTINGS = [
		'redirect_type'                => null,
		'nofollow'                     => null,
		'sponsored'                    => null,
		'track_me'                     => null,
		'param_forwarding'             => null,
		'default_category'             => null,
		'url_slug_generation_type'     => null,
		'prefix'                       => null,
		'enable_auto_title_suggestion' => null,
		'is_case_sensitive'            => null,
		'wildcards'                    => null,
		'is_allow_gutenberg'           => null,
		'enable_custom_domain_menu'    => null,
		'disablebotclicks'             => null,
		'is_disable_analytics_ip'      => null,
		'enable_mcp'                   => null,
		'customFields'                 => null,
		'cle'                          => [ 'enable_cle', 'powered_by' ],
		'fbs'                          => [ 'enable_fbs', 'cat_id', 'delete_on', 'show_fbs_category' ],
	];

	/**
	 * Free settings that are plain on/off switches.
	 */
	private const TOGGLES = [
		'nofollow',
		'sponsored',
		'track_me',
		'param_forwarding',
		'enable_auto_title_suggestion',
		'is_case_sensitive',
		'wildcards',
		'is_allow_gutenberg',
		'enable_custom_domain_menu',
		'disablebotclicks',
		'is_disable_analytics_ip',
		'enable_mcp',
		'cle.enable_cle',
		'cle.powered_by',
		'fbs.enable_fbs',
		'fbs.show_fbs_category',
	];

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->id          = 'betterlinks/update-settings';
		$this->label       = __( 'Update BetterLinks settings', 'betterlinks' );
		$this->description = __( 'Update one or more BetterLinks settings. Only the keys you pass are changed; everything else is preserved.', 'betterlinks' );
	}

	/**
	 * {@inheritDoc}
	 *
	 * @return array<string, bool|float|string>
	 */
	public function get_annotations() {
		return [
			'readonly'      => false,
			// Replaces the whole settings blob, including keys it was not asked to change.
			'destructive'   => true,
			'idempotent'    => true,
			'priority'      => 2.0,
			'openWorldHint' => false,
		];
	}

	/**
	 * {@inheritDoc}
	 *
	 * @return array<string, mixed>
	 */
	public function get_input_schema() {
		return [
			'type'                 => 'object',
			'additionalProperties' => false,
			'properties'           => [
				'settings' => [
					'type'                 => 'object',
					'description'          => __( 'A map of setting keys to new values, merged over the existing settings. On/off: nofollow, sponsored, track_me, param_forwarding, wildcards, is_case_sensitive, is_allow_gutenberg (instant redirect), disablebotclicks, is_disable_analytics_ip, enable_auto_title_suggestion, enable_custom_domain_menu, enable_mcp. Values: redirect_type (301|302|307), url_slug_generation_type (from_title|from_url|random_string|random_number|random_mixed), prefix, default_category (category ID). Groups (only the fields you pass change): cle {enable_cle, powered_by} for Quick Link Creation, fbs {enable_fbs, cat_id, delete_on: task_delete|task_archive, show_fbs_category} for Fluent Boards. customFields: [{label, value}] replaces the Custom Field list. Example: { "fbs": { "enable_fbs": false } }.', 'betterlinks' ),
					'additionalProperties' => true,
				],
				'confirm'  => self::confirm_property(),
			],
			'required'             => [ 'settings' ],
		];
	}

	/**
	 * {@inheritDoc}
	 *
	 * @return array<string, mixed>
	 */
	public function get_output_schema() {
		return [
			'type'       => 'object',
			'properties' => [
				'success' => [ 'type' => 'boolean' ],
				'data'    => [ 'type' => [ 'object', 'array', 'null' ] ],
			],
		];
	}

	/**
	 * Execute ability.
	 *
	 * @param array<string, mixed> $input Ability input payload.
	 * @return array<string, mixed>|\WP_Error
	 */
	public function execute( $input ) {
		$patch = isset( $input['settings'] ) && is_array( $input['settings'] ) ? $input['settings'] : [];
		if ( empty( $patch ) ) {
			return new \WP_Error( 'betterlinks_no_settings', __( 'Provide a "settings" object with at least one key to change.', 'betterlinks' ), [ 'status' => 400 ] );
		}

		$current = Cache::get_json_settings();
		$current = is_array( $current ) ? $current : [];
		$pro     = \BetterLinks\Helper::is_pro_active();

		// A fixed list, so what an assistant may change no longer depends on
		// which keys this site happens to have saved. With Pro active, keys
		// already stored stay writable too: those are Pro's settings, and Pro
		// sites could change them before this list existed.
		$known = array_keys( self::FREE_SETTINGS );
		if ( method_exists( $this, 'get_settings_schema' ) ) {
			$schema = $this->get_settings_schema();
			if ( is_array( $schema ) ) {
				$known = array_merge( $known, array_keys( $schema ) );
			}
		}
		if ( $pro ) {
			$known = array_merge( $known, array_keys( $current ) );
		}
		$known = array_values( array_unique( array_filter( $known, 'is_string' ) ) );
		/**
		 * Filters the setting keys the update-settings tool may write.
		 *
		 * @param string[] $known Allowed keys.
		 */
		$known   = (array) apply_filters( 'betterlinks/mcp/writable_settings', $known );
		$unknown = array_values( array_diff( array_keys( $patch ), $known ) );
		if ( ! empty( $unknown ) ) {
			sort( $known );
			return new \WP_Error(
				'betterlinks_unknown_setting',
				sprintf(
					/* translators: 1: comma-separated unknown keys, 2: comma-separated valid keys */
					__( 'Not a BetterLinks setting: %1$s. Valid keys are: %2$s.', 'betterlinks' ),
					implode( ', ', $unknown ),
					implode( ', ', $known )
				),
				[ 'status' => 400, 'unknown_keys' => $unknown ]
			);
		}

		// The MCP switch is administrator-only, as on the MCP page (POST /mcp/enabled).
		// A role granted MCP must not turn it off, or on, through this tool either.
		if ( array_key_exists( 'enable_mcp', $patch ) && ! \BetterLinks\Mcp\Mcp_Access::is_admin() ) {
			return new \WP_Error(
				'betterlinks_mcp_admin_only',
				__( 'Only administrators can turn MCP on or off.', 'betterlinks' ),
				[ 'status' => 403 ]
			);
		}

		foreach ( $patch as $key => $value ) {
			$checked = self::validate_value( (string) $key, $value, $current, $pro );
			if ( is_wp_error( $checked ) ) {
				return $checked;
			}
			$patch[ $key ] = $checked;
		}

		// Merge the requested keys over the stored settings, then push the full
		// object through the existing REST controller so its sanitization,
		// caching and side effects (JSON settings file, custom-domain option)
		// all run exactly as they do for the admin UI.
		$merged = $current;
		foreach ( $patch as $key => $value ) {
			// Grouped settings (`cle`, `fbs`) merge one level deeper, so changing
			// `fbs.enable_fbs` keeps the board's category and delete behaviour.
			// Lists such as customFields are replaced whole.
			if ( self::is_assoc( $value ) && isset( $merged[ $key ] ) && self::is_assoc( $merged[ $key ] ) ) {
				$merged[ $key ] = array_merge( $merged[ $key ], $value );
			} else {
				$merged[ $key ] = $value;
			}
		}
		$patch = array_intersect_key( $merged, $patch );

		// Settings are site-wide: changing the link prefix, say, moves every
		// short URL on the site at once. Show what changes before writing.
		$changes = [];
		foreach ( $patch as $key => $value ) {
			$old = array_key_exists( $key, $current ) ? $current[ $key ] : null;
			if ( $old === $value ) {
				continue;
			}
			$changes[ (string) $key ] = sprintf(
				'%s → %s',
				null === $old ? __( '(not set)', 'betterlinks' ) : wp_json_encode( $old ),
				wp_json_encode( $value )
			);
		}
		if ( empty( $changes ) ) {
			return [
				'success' => true,
				'data'    => [ 'message' => __( 'Those settings already hold those values; nothing was changed.', 'betterlinks' ) ],
			];
		}
		$gate = $this->confirmation_gate(
			$input,
			'update-settings',
			sprintf(
				/* translators: %d: number of settings being changed */
				__( 'Change %d site-wide BetterLinks setting(s). These apply to every link on the site, not just one.', 'betterlinks' ),
				count( $changes )
			),
			$changes
		);
		if ( null !== $gate ) {
			return $gate;
		}

		// The REST controller only accepts the uncloaked-category list as a JSON
		// string and resets anything else to an empty list.
		if ( isset( $merged['uncloaked_categories'] ) && is_array( $merged['uncloaked_categories'] ) ) {
			$merged['uncloaked_categories'] = wp_json_encode( array_values( $merged['uncloaked_categories'] ) );
		}

		return $this->dispatch( 'PUT', '/settings', $merged );
	}

	/**
	 * Check and normalise one incoming setting.
	 *
	 * @param string               $key     Setting key.
	 * @param mixed                $value   Caller-supplied value.
	 * @param array<string, mixed> $current Stored settings.
	 * @param bool                 $pro     Whether BetterLinks Pro is active.
	 * @return mixed|\WP_Error
	 */
	private static function validate_value( string $key, $value, array $current, bool $pro ) {
		if ( in_array( $key, self::TOGGLES, true ) ) {
			return self::to_bool( $key, $value );
		}

		switch ( $key ) {
			case 'redirect_type':
				if ( ! in_array( (string) $value, [ '301', '302', '307' ], true ) ) {
					return self::invalid( __( 'redirect_type must be one of 301, 302 or 307.', 'betterlinks' ) );
				}
				return (string) $value;

			case 'url_slug_generation_type':
				$types = [ 'from_title', 'from_url', 'random_string', 'random_number', 'random_mixed' ];
				if ( ! in_array( (string) $value, $types, true ) ) {
					/* translators: %s: comma-separated allowed values */
					return self::invalid( sprintf( __( 'url_slug_generation_type must be one of: %s.', 'betterlinks' ), implode( ', ', $types ) ) );
				}
				return (string) $value;

			case 'prefix':
				$prefix = sanitize_title( (string) $value );
				if ( '' === $prefix ) {
					return self::invalid( __( 'prefix must contain at least one letter or number.', 'betterlinks' ) );
				}
				return $prefix;

			case 'default_category':
				return self::category_id( 'default_category', $value );

			case 'customFields':
				return self::normalise_custom_fields( $value );

			case 'cle':
			case 'fbs':
				return self::validate_group( $key, $value, $current, $pro );
		}

		return $value;
	}

	/**
	 * Check a grouped setting (`cle` or `fbs`) field by field.
	 *
	 * @param string               $key     `cle` or `fbs`.
	 * @param mixed                $value   Caller-supplied object.
	 * @param array<string, mixed> $current Stored settings.
	 * @param bool                 $pro     Whether BetterLinks Pro is active.
	 * @return array<string, mixed>|\WP_Error
	 */
	private static function validate_group( string $key, $value, array $current, bool $pro ) {
		if ( ! self::is_assoc( $value ) ) {
			/* translators: %s: setting key */
			return self::invalid( sprintf( __( '%s must be an object of named fields.', 'betterlinks' ), $key ) );
		}

		$allowed = self::FREE_SETTINGS[ $key ];
		// Pro adds fields to these groups (e.g. cle.advanced_options); keep the
		// ones it has already saved writable while it is active.
		if ( $pro && isset( $current[ $key ] ) && is_array( $current[ $key ] ) ) {
			$allowed = array_merge( $allowed, array_keys( $current[ $key ] ) );
		}
		$unknown = array_values( array_diff( array_keys( $value ), $allowed ) );
		if ( ! empty( $unknown ) ) {
			return self::invalid(
				sprintf(
					/* translators: 1: setting key, 2: unknown fields, 3: allowed fields */
					__( 'Not a %1$s field: %2$s. Valid fields are: %3$s.', 'betterlinks' ),
					$key,
					implode( ', ', $unknown ),
					implode( ', ', array_unique( $allowed ) )
				)
			);
		}

		foreach ( $value as $field => $field_value ) {
			$path = $key . '.' . $field;
			if ( in_array( $path, self::TOGGLES, true ) ) {
				$field_value = self::to_bool( $path, $field_value );
			} elseif ( 'fbs.cat_id' === $path ) {
				$field_value = self::category_id( $path, $field_value );
			} elseif ( 'fbs.delete_on' === $path && ! in_array( (string) $field_value, [ 'task_delete', 'task_archive' ], true ) ) {
				$field_value = self::invalid( __( 'fbs.delete_on must be task_delete or task_archive.', 'betterlinks' ) );
			}
			if ( is_wp_error( $field_value ) ) {
				return $field_value;
			}
			$value[ $field ] = $field_value;
		}

		return $value;
	}

	/**
	 * Coerce an on/off value to a real boolean.
	 *
	 * @param string $key   Setting key, for the error message.
	 * @param mixed  $value Caller-supplied value.
	 * @return bool|\WP_Error
	 */
	private static function to_bool( string $key, $value ) {
		if ( is_bool( $value ) ) {
			return $value;
		}
		if ( in_array( $value, [ 1, 0, '1', '0', 'true', 'false', '' ], true ) ) {
			return in_array( $value, [ 1, '1', 'true' ], true );
		}
		/* translators: %s: setting key */
		return self::invalid( sprintf( __( '%s must be true or false.', 'betterlinks' ), $key ) );
	}

	/**
	 * Accept only the ID of an existing BetterLinks category.
	 *
	 * @param string $key   Setting key, for the error message.
	 * @param mixed  $value Caller-supplied value.
	 * @return string|\WP_Error
	 */
	private static function category_id( string $key, $value ) {
		global $wpdb;
		$id = is_numeric( $value ) ? absint( $value ) : 0;
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery
		$found = $id ? $wpdb->get_var( $wpdb->prepare( "SELECT ID FROM {$wpdb->prefix}betterlinks_terms WHERE ID = %d AND term_type = 'category'", $id ) ) : null;
		if ( ! $found ) {
			/* translators: %s: setting key */
			return self::invalid( sprintf( __( '%s must be the ID of an existing BetterLinks category (see list-categories).', 'betterlinks' ), $key ) );
		}
		return (string) $id;
	}

	/**
	 * Whether a value is a non-empty array with string keys.
	 *
	 * @param mixed $value Value.
	 * @return bool
	 */
	private static function is_assoc( $value ): bool {
		return is_array( $value ) && ! empty( $value ) && array_keys( $value ) !== range( 0, count( $value ) - 1 );
	}

	/**
	 * Build a 400 invalid-setting error.
	 *
	 * @param string $message Message.
	 * @return \WP_Error
	 */
	private static function invalid( string $message ): \WP_Error {
		return new \WP_Error( 'betterlinks_invalid_setting', $message, [ 'status' => 400 ] );
	}

	/**
	 * Coerce a caller-supplied `customFields` value into the [{label, value}]
	 * shape the React admin expects, generating slugs from labels when the
	 * caller omitted the `value`, and de-duplicating slugs so the per-link
	 * `param_struct[<slug>]` mapping stays unambiguous.
	 *
	 * Accepts:
	 *   [{"label":"UTM Source","value":"utm_source"}, ...]  — full shape
	 *   [{"label":"UTM Source"}, ...]                        — value slugified from label
	 *   []                                                    — clears all custom fields
	 *
	 * Rejects: non-array; any entry missing a usable label; duplicate slugs.
	 *
	 * @param mixed $raw Caller-supplied value.
	 * @return array<int, array{label:string, value:string}>|\WP_Error
	 */
	private static function normalise_custom_fields( $raw ) {
		if ( ! is_array( $raw ) ) {
			return new \WP_Error(
				'betterlinks_invalid_setting',
				__( 'customFields must be an array of {label, value} objects.', 'betterlinks' ),
				[ 'status' => 400 ]
			);
		}
		$out  = [];
		$seen = [];
		foreach ( $raw as $idx => $entry ) {
			if ( ! is_array( $entry ) ) {
				return new \WP_Error(
					'betterlinks_invalid_setting',
					sprintf( __( 'customFields[%d] must be an object with label and value.', 'betterlinks' ), $idx ),
					[ 'status' => 400 ]
				);
			}
			$label = isset( $entry['label'] ) ? trim( sanitize_text_field( (string) $entry['label'] ) ) : '';
			if ( '' === $label ) {
				return new \WP_Error(
					'betterlinks_invalid_setting',
					sprintf( __( 'customFields[%d].label is required.', 'betterlinks' ), $idx ),
					[ 'status' => 400 ]
				);
			}
			$value = isset( $entry['value'] ) && '' !== trim( (string) $entry['value'] )
				? sanitize_title( (string) $entry['value'] )
				: sanitize_title( $label );
			if ( '' === $value ) {
				return new \WP_Error(
					'betterlinks_invalid_setting',
					sprintf( __( 'customFields[%d].value could not be derived from the label; supply a URL-safe slug.', 'betterlinks' ), $idx ),
					[ 'status' => 400 ]
				);
			}
			if ( isset( $seen[ $value ] ) ) {
				return new \WP_Error(
					'betterlinks_invalid_setting',
					sprintf( __( 'customFields has duplicate slug "%s"; each field needs a unique value.', 'betterlinks' ), $value ),
					[ 'status' => 400 ]
				);
			}
			$seen[ $value ] = true;
			$out[]           = [ 'label' => $label, 'value' => $value ];
		}
		return $out;
	}
}
