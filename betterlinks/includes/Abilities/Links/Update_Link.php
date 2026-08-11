<?php
/**
 * Update a short link ability.
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
 * Update an existing short link — its title, target URL, slug, redirect type, category or status.
 */
class Update_Link extends Ability_Base {

	public function __construct() {
		$this->id          = 'betterlinks/update-link';
		$this->label       = __( 'Update a short link', 'betterlinks' );
		$this->description = __( 'Update an existing short link — its title, target URL, slug, redirect type, category or status.', 'betterlinks' );
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
				'ID'            => [ 'type' => 'integer', 'description' => __( 'The link ID to update. Required.', 'betterlinks' ) ],
				'link_title'    => [ 'type' => 'string' ],
				'target_url'    => [ 'type' => 'string' ],
				'link_slug'     => [ 'type' => 'string' ],
				'redirect_type' => [ 'type' => 'string', 'enum' => [ '301', '302', '307' ] ],
				'cat_id'        => [ 'type' => 'integer' ],
				'nofollow'      => [ 'type' => 'boolean' ],
				'sponsored'     => [ 'type' => 'boolean' ],
				'link_status'   => [ 'type' => 'string', 'enum' => [ 'publish', 'draft' ] ],
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
			return new \WP_Error( 'betterlinks_missing_link_id', __( 'A link ID is required to update a link.', 'betterlinks' ), [ 'status' => 400 ] );
		}
		$params = [ 'ID' => $id ];
		if ( isset( $input['link_title'] ) )    { $params['link_title'] = (string) $input['link_title']; }
		if ( isset( $input['target_url'] ) )     { $params['target_url'] = esc_url_raw( (string) $input['target_url'] ); }
		if ( isset( $input['link_slug'] ) )      { $params['link_slug'] = sanitize_title( (string) $input['link_slug'] ); $params['short_url'] = $params['link_slug']; }
		if ( isset( $input['redirect_type'] ) )  { $params['redirect_type'] = (string) $input['redirect_type']; }
		if ( isset( $input['link_status'] ) )    { $params['link_status'] = (string) $input['link_status']; }
		if ( array_key_exists( 'nofollow', $input ) )  { $params['nofollow'] = ! empty( $input['nofollow'] ) ? '1' : ''; }
		if ( array_key_exists( 'sponsored', $input ) ) { $params['sponsored'] = ! empty( $input['sponsored'] ) ? '1' : ''; }
		if ( ! empty( $input['cat_id'] ) )       { $params['cat_id'] = absint( $input['cat_id'] ); }
		return $this->dispatch( 'PUT', '/links/' . $id, $params );
	}
}
