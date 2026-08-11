<?php
/**
 * Rename a category or tag ability.
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
 * Rename an existing link category or tag.
 */
class Update_Term extends Ability_Base {

	public function __construct() {
		$this->id          = 'betterlinks/update-term';
		$this->label       = __( 'Rename a category or tag', 'betterlinks' );
		$this->description = __( 'Rename an existing link category or tag.', 'betterlinks' );
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
				'ID'        => [ 'type' => 'integer', 'description' => __( 'The term ID to rename.', 'betterlinks' ) ],
				'term_name' => [ 'type' => 'string', 'description' => __( 'New display name.', 'betterlinks' ) ],
				'term_slug' => [ 'type' => 'string', 'description' => __( 'New slug (optional).', 'betterlinks' ) ],
				'term_type' => [ 'type' => 'string', 'enum' => [ 'category', 'tags' ] ],
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
		$name = isset( $input['term_name'] ) ? (string) $input['term_name'] : '';
		if ( ! $id || '' === $name ) {
			return new \WP_Error( 'betterlinks_invalid_term', __( 'Both ID and term_name are required.', 'betterlinks' ), [ 'status' => 400 ] );
		}
		$slug = isset( $input['term_slug'] ) && '' !== $input['term_slug'] ? (string) $input['term_slug'] : sanitize_title( $name );
		$type = isset( $input['term_type'] ) ? (string) $input['term_type'] : 'category';
		return $this->dispatch( 'PUT', '/terms', [ 'params' => [ 'ID' => $id, 'term_name' => $name, 'term_slug' => $slug, 'term_type' => $type ] ] );
	}
}
