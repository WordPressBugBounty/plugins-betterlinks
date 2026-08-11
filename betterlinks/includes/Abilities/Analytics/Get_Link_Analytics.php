<?php
/**
 * Get analytics for one link ability.
 *
 * @package BetterLinks\Abilities\Analytics
 */

declare(strict_types=1);

namespace BetterLinks\Abilities\Analytics;

use BetterLinks\Abilities\Ability_Base;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Get click analytics for a single short link by its ID.
 */
class Get_Link_Analytics extends Ability_Base {

	public function __construct() {
		$this->id          = 'betterlinks/get-link-analytics';
		$this->label       = __( 'Get analytics for one link', 'betterlinks' );
		$this->description = __( 'Get click analytics for a single short link by its ID.', 'betterlinks' );
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
			'properties'           => [
				'link_id' => [ 'type' => 'integer', 'description' => __( 'The link ID. Required.', 'betterlinks' ) ],
				'ID'      => [ 'type' => 'integer', 'description' => __( 'Deprecated alias for link_id.', 'betterlinks' ) ],
				'from' => [ 'type' => 'string', 'default' => '', 'description' => __( 'Start date (Y-m-d). Omit for the last 30 days.', 'betterlinks' ) ],
				'to'   => [ 'type' => 'string', 'default' => '', 'description' => __( 'End date (Y-m-d). Omit for today.', 'betterlinks' ) ],
			],
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
		$id = isset( $input['link_id'] ) ? absint( $input['link_id'] ) : ( isset( $input['ID'] ) ? absint( $input['ID'] ) : 0 );
		if ( ! $id ) {
			return new \WP_Error( 'betterlinks_missing_link_id', __( 'A link ID is required.', 'betterlinks' ), [ 'status' => 400 ] );
		}
		// The clicks controller REQUIRES from/to and 400s without them — it does
		// not apply a default range. The tool documents "omit for the last 30
		// days", so the default is resolved here rather than promised and broken.
		$from = ! empty( $input['from'] ) ? sanitize_text_field( (string) $input['from'] ) : gmdate( 'Y-m-d', strtotime( '-30 days' ) );
		$to   = ! empty( $input['to'] ) ? sanitize_text_field( (string) $input['to'] ) : gmdate( 'Y-m-d' );

		$params = [
			'from' => $from,
			'to'   => $to,
		];
		return $this->dispatch( 'GET', '/clicks/' . $id, $params );
	}
}
