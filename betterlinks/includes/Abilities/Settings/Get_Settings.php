<?php
/**
 * Get BetterLinks settings ability.
 *
 * @package BetterLinks\Abilities\Settings
 */

declare(strict_types=1);

namespace BetterLinks\Abilities\Settings;

use BetterLinks\Abilities\Ability_Base;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Get the current BetterLinks plugin settings.
 */
class Get_Settings extends Ability_Base {

	public function __construct() {
		$this->id          = 'betterlinks/get-settings';
		$this->label       = __( 'Get BetterLinks settings', 'betterlinks' );
		$this->description = __( 'Get the current BetterLinks plugin settings.', 'betterlinks' );
	}

	public function get_annotations() {
		return [
			'readonly'      => true,
			'destructive'   => false,
			'idempotent'    => true,
			'priority'      => 1.0,
			'openWorldHint' => false,
		];
	}

	public function get_input_schema() {
		return [
			'type'                 => 'object',
			'additionalProperties' => false,
			'properties'           => [],
		];
	}

	public function get_output_schema() {
		return [
			'type'       => 'object',
			'properties' => [
				'success' => [ 'type' => 'boolean' ],
				'data'    => [ 'type' => [ 'object', 'array', 'string', 'null' ] ],
			],
		];
	}

	public function execute( $input ) {
		return $this->dispatch( 'GET', '/settings' );
	}
}
