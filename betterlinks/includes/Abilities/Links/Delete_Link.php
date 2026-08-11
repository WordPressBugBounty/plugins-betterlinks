<?php
/**
 * Delete a short link ability.
 *
 * @package BetterLinks\Abilities\Links
 */

declare(strict_types=1);

namespace BetterLinks\Abilities\Links;

use BetterLinks\Abilities\Ability_Base;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Permanently delete a short link and its click data.
 */
class Delete_Link extends Ability_Base {

	public function __construct() {
		$this->id          = 'betterlinks/delete-link';
		$this->label       = __( 'Delete a short link', 'betterlinks' );
		$this->description = __( 'Permanently delete a short link and its click data.', 'betterlinks' );
	}

	public function get_annotations() {
		return [
			'readonly'      => false,
			'destructive'   => false,
			'idempotent'    => false,
			'priority'      => 2.0,
			'openWorldHint' => false,
		];
	}

	public function get_input_schema() {
		return [
			'type'                 => 'object',
			'additionalProperties' => false,
			'properties'           => [
				'ID' => [ 'type' => 'integer', 'description' => __( 'The link ID to delete. Required.', 'betterlinks' ) ],
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
		$id = isset( $input['ID'] ) ? absint( $input['ID'] ) : 0;
		if ( ! $id ) {
			return new \WP_Error( 'betterlinks_missing_link_id', __( 'A link ID is required to delete a link.', 'betterlinks' ), [ 'status' => 400 ] );
		}
		$row       = \BetterLinks\Helper::get_link_by_ID( $id );
		$short_url = ! empty( $row[0]['short_url'] ) ? $row[0]['short_url'] : '';
		return $this->dispatch( 'DELETE', '/links/' . $id, [ 'id' => $id, 'ID' => $id, 'short_url' => $short_url ] );
	}
}
