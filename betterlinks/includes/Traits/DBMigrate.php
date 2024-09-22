<?php
namespace BetterLinks\Traits;

use BetterLinks\Admin\Cache;
use BetterLinks\Helper;

trait DBMigrate {

	public function db_migration_1_1() {
		$table_name  = $this->wpdb->prefix . 'betterlinks';
		$betterlinks = $this->wpdb->get_row( "SELECT * FROM $table_name" );
		// Add column if not present.
		if ( ! isset( $betterlinks->wildcards ) ) {
			$this->wpdb->query( "ALTER TABLE $table_name ADD wildcards BOOLEAN NOT NULL DEFAULT 0" );
		}
	}
	public function db_migration_1_2() {
		$table_name  = $this->wpdb->prefix . 'betterlinks';
		$betterlinks = $this->wpdb->get_row( "SELECT * FROM $table_name" );
		// Add column if not present.
		if ( ! isset( $betterlinks->expire ) ) {
			$this->wpdb->query( "ALTER TABLE $table_name ADD expire text default NULL" );
		}
	}
	public function db_migration_1_4() {
		// links
		$betterlinks_table = $this->wpdb->prefix . 'betterlinks';
		$betterlinks       = $this->wpdb->get_row( "SELECT * FROM $betterlinks_table" );
		// Add column if not present.
		if ( ! isset( $betterlinks->dynamic_redirect ) ) {
			$this->wpdb->query( "ALTER TABLE $betterlinks_table ADD dynamic_redirect text default NULL" );
		}
		// clicks
		$betterlinks_clicks_table = $this->wpdb->prefix . 'betterlinks_clicks';
		$betterlinks_clicks       = $this->wpdb->get_row( "SELECT * FROM $betterlinks_clicks_table" );
		// Add column if not present.
		if ( ! isset( $betterlinks_clicks->rotation_target_url ) ) {
			$this->wpdb->query( "ALTER TABLE  $betterlinks_clicks_table ADD rotation_target_url varchar(255) NULL" );
		}
	}
	public function update_fluent_settings() {
		if ( ! defined( 'FLUENT_BOARDS' ) ) {
			return;
		}
		$settings = Cache::get_json_settings();
		if ( empty( $settings['fbs']['enable_fbs'] ) ) {
			$args    = array(
				'ID'        => 0,
				'term_name' => 'Fluent Boards',
				'term_slug' => 'btl-fluent-boards',
				'term_type' => 'category',
			);
			$results = $this->create_term( $args );
			$fbs_cat = ! empty( $results['ID'] ) ? $results['ID'] : 0;

			$settings['fbs'] = array();
			$settings['fbs'] = array(
				'enable_fbs' => true,
				'cat_id'     => $fbs_cat,
				'delete_on'  => 'task_delete',
			);
		}
		if ( $settings ) {
			Helper::clear_query_cache();
			$settings = wp_json_encode( $settings );
			update_option( BETTERLINKS_LINKS_OPTION_NAME, $settings );
			Cache::write_json_settings();
			Helper::write_links_inside_json();
		}
	}

	public function update_fluent_task_delete_settings() {
		if ( ! defined( 'FLUENT_BOARDS' ) ) {
			return;
		}

		$settings = Cache::get_json_settings();
		if ( ! empty( $settings['fbs']['delete_on'] ) ) {
			return;
		}
		$settings['fbs']['delete_on'] = 'task_delete';

		if ( $settings ) {
			Helper::clear_query_cache();
			$settings = wp_json_encode( $settings );
			update_option( BETTERLINKS_LINKS_OPTION_NAME, $settings );
			Cache::write_json_settings();
			Helper::write_links_inside_json();
		}
	}

	public function update_cle_category() {
		$settings = Cache::get_json_settings();
		if ( isset( $settings['cle'] ) && empty( $settings['cle']['category'] ) ) {
			$settings['cle']['category'] = '1';

			if ( $settings ) {
				Helper::clear_query_cache();
				$settings = wp_json_encode( $settings );
				update_option( BETTERLINKS_LINKS_OPTION_NAME, $settings );
				Cache::write_json_settings();
				Helper::write_links_inside_json();
			}
		}
	}


	public function update_settings() {
		$settings = Cache::get_json_settings();

		if ( empty( $settings['enable_custom_domain_menu'] ) ) {
			$settings['enable_custom_domain_menu'] = true;
		}
		$settings = json_encode( $settings );
		delete_transient( BETTERLINKS_CACHE_LINKS_NAME );
		if ( $settings ) {
			update_option( BETTERLINKS_LINKS_OPTION_NAME, $settings );
			Cache::write_json_settings();
		}
		if ( empty( get_option( BETTERLINKS_CUSTOM_DOMAIN_MENU, false ) ) ) {
			update_option( BETTERLINKS_CUSTOM_DOMAIN_MENU, true );
		}
		// regenerate links for wildcards option update
		Helper::write_links_inside_json();
	}
}
