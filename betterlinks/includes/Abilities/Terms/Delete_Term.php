<?php
/**
 * Delete a category or tag ability.
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
 * Delete a link category or tag by ID. Protected terms such as Uncategorized cannot be deleted.
 */
class Delete_Term extends Ability_Base {

	public function __construct() {
		$this->id          = 'betterlinks/delete-term';
		$this->label       = __( 'Delete a category or tag', 'betterlinks' );
		$this->description = __( 'Delete a link category or tag by ID. Protected terms such as Uncategorized cannot be deleted.', 'betterlinks' );
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
				'ID'        => [ 'type' => 'integer', 'description' => __( 'The term ID to delete.', 'betterlinks' ) ],
				'term_type' => [ 'type' => 'string', 'enum' => [ 'category', 'tags' ], 'description' => __( 'Whether the ID is a category or a tag.', 'betterlinks' ) ],
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
			return new \WP_Error( 'betterlinks_missing_term_id', __( 'A term ID is required.', 'betterlinks' ), [ 'status' => 400 ] );
		}
		$type = isset( $input['term_type'] ) ? (string) $input['term_type'] : 'category';
		$key  = ( 'tags' === $type ) ? 'tag_id' : 'cat_id';
		return $this->dispatch( 'DELETE', '/terms', [ $key => $id ] );
	}
}
