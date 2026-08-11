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
			'destructive'   => false,
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
					'description'          => __( 'A map of setting keys to new values (e.g. { "enable_mcp": true, "is_case_sensitive": false }). Merged over the existing settings.', 'betterlinks' ),
					'additionalProperties' => true,
				],
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

		// Merge the requested keys over the stored settings, then push the full
		// object through the existing REST controller so its sanitization,
		// caching and side effects (JSON settings file, custom-domain option)
		// all run exactly as they do for the admin UI.
		$merged = array_merge( $current, $patch );

		return $this->dispatch( 'PUT', '/settings', $merged );
	}
}
