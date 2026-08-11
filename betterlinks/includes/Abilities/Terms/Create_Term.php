<?php
/**
 * Create a category or tag ability.
 *
 * @package BetterLinks\Abilities\Terms
 */

declare(strict_types=1);

namespace BetterLinks\Abilities\Terms;

use BetterLinks\Abilities\Ability_Base;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Create a new link category or tag.
 */
class Create_Term extends Ability_Base {

	public function __construct() {
		$this->id          = 'betterlinks/create-term';
		$this->label       = __( 'Create a category or tag', 'betterlinks' );
		$this->description = __( 'Create a new link category or tag.', 'betterlinks' );
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
				'term_name' => [ 'type' => 'string', 'description' => __( 'Display name of the category or tag.', 'betterlinks' ) ],
				'term_slug' => [ 'type' => 'string', 'description' => __( 'URL-safe slug. Defaults to a slugified name.', 'betterlinks' ) ],
				'term_type' => [ 'type' => 'string', 'enum' => [ 'category', 'tags' ], 'description' => __( 'Either "category" or "tags".', 'betterlinks' ) ],
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
		$name = isset( $input['term_name'] ) ? (string) $input['term_name'] : '';
		$type = isset( $input['term_type'] ) ? (string) $input['term_type'] : 'category';
		if ( '' === $name ) {
			return new \WP_Error( 'betterlinks_missing_term_name', __( 'A term_name is required.', 'betterlinks' ), [ 'status' => 400 ] );
		}
		$slug = isset( $input['term_slug'] ) && '' !== $input['term_slug'] ? (string) $input['term_slug'] : sanitize_title( $name );
		return $this->dispatch( 'POST', '/terms', [ 'params' => [ 'term_name' => $name, 'term_slug' => $slug, 'term_type' => $type ] ] );
	}
}
