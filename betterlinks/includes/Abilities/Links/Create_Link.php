<?php
/**
 * Create a short link ability.
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
 * Create a new short link with a slug, target URL and options.
 */
class Create_Link extends Ability_Base {

	public function __construct() {
		$this->id          = 'betterlinks/create-link';
		$this->label       = __( 'Create a short link', 'betterlinks' );
		$this->description = __( 'Create a new short link with a slug, target URL and options.', 'betterlinks' );
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
				'link_title'    => [ 'type' => 'string', 'description' => __( 'Internal title for the link.', 'betterlinks' ) ],
				'target_url'    => [ 'type' => 'string', 'description' => __( 'Destination URL the short link redirects to. Required.', 'betterlinks' ) ],
				'link_slug'     => [ 'type' => 'string', 'description' => __( 'The short URL slug (e.g. "go/deal"). Auto-generated when omitted.', 'betterlinks' ) ],
				'redirect_type' => [ 'type' => 'string', 'enum' => [ '301', '302', '307' ], 'description' => __( 'HTTP redirect type. Defaults to 307.', 'betterlinks' ) ],
				'cat_id'        => [ 'type' => 'integer', 'description' => __( 'Category ID to file the link under.', 'betterlinks' ) ],
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
		$target = isset( $input['target_url'] ) ? esc_url_raw( (string) $input['target_url'] ) : '';
		if ( '' === $target ) {
			return new \WP_Error( 'betterlinks_missing_target', __( 'A target_url is required to create a link.', 'betterlinks' ), [ 'status' => 400 ] );
		}
		$title = isset( $input['link_title'] ) ? (string) $input['link_title'] : '';
		$slug  = isset( $input['link_slug'] ) && '' !== $input['link_slug'] ? sanitize_title( (string) $input['link_slug'] ) : sanitize_title( '' !== $title ? $title : 'link-' . substr( md5( uniqid( '', true ) ), 0, 8 ) );
		$params = [
			'link_title'    => '' !== $title ? $title : $slug,
			'link_slug'     => $slug,
			'short_url'     => $slug,
			'target_url'    => $target,
			'redirect_type' => isset( $input['redirect_type'] ) ? (string) $input['redirect_type'] : '307',
			'link_status'   => isset( $input['link_status'] ) ? (string) $input['link_status'] : 'publish',
			'nofollow'      => ! empty( $input['nofollow'] ) ? '1' : '',
			'sponsored'     => ! empty( $input['sponsored'] ) ? '1' : '',
			'track_me'      => '1',
		];
		if ( ! empty( $input['cat_id'] ) ) {
			$params['cat_id'] = absint( $input['cat_id'] );
		}
		return $this->dispatch( 'POST', '/links', $params );
	}
}
