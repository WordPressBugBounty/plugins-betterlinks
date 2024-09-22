<?php
namespace BetterLinks\Admin;

class Cache {
	public static function init() {
		self::write_json_settings();
	}
	public static function write_json_settings() {
		$betterlinks_links = get_option( BETTERLINKS_LINKS_OPTION_NAME, array() );
		if ( is_string( $betterlinks_links ) ) {
			$betterlinks_links = json_decode( $betterlinks_links, true );
		}
		if( !is_dir( BETTERLINKS_UPLOAD_DIR_PATH ) ){
			wp_mkdir_p(BETTERLINKS_UPLOAD_DIR_PATH);
		}
		return file_put_contents( BETTERLINKS_UPLOAD_DIR_PATH . '/settings.json', json_encode( $betterlinks_links ) );
	}

	public static function get_json_settings() {
		if ( file_exists( BETTERLINKS_UPLOAD_DIR_PATH . '/settings.json' ) ) {
			$settings = json_decode( file_get_contents( BETTERLINKS_UPLOAD_DIR_PATH . '/settings.json' ), true );
			if ( ! empty( $settings ) ) {
				return $settings;
			}
		}
		return self::write_json_settings();
	}
}
