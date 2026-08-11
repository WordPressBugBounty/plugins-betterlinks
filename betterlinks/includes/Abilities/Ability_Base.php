<?php
/**
 * Ability base class.
 *
 * @package BetterLinks\Abilities
 */

declare(strict_types=1);

namespace BetterLinks\Abilities;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Base ability implementation for BetterLinks.
 *
 * Each BetterLinks MCP ability extends this class, providing an input/output
 * JSON schema and an execute() body. Abilities are registered with the
 * WordPress Abilities API and exposed to AI clients through the MCP server.
 *
 * Most abilities reuse BetterLinks' existing REST controllers by dispatching an
 * internal WP_REST_Request (see {@see self::dispatch()}) rather than
 * re-implementing link/term/analytics logic. That keeps a single source of
 * truth for validation, sanitization and side effects, and means server-side
 * fixes to the REST layer flow through to MCP automatically.
 */
abstract class Ability_Base {

	/**
	 * Minimum capability allowed for BetterLinks abilities.
	 */
	private const MIN_CAPABILITY = 'manage_options';

	/**
	 * REST namespace the internal dispatcher targets.
	 */
	protected const NS = 'betterlinks/v1';

	/**
	 * Unique ability identifier (e.g. `betterlinks/create-link`).
	 *
	 * @var string
	 */
	protected $id = '';

	/**
	 * Human-readable label.
	 *
	 * @var string
	 */
	protected $label = '';

	/**
	 * Ability description.
	 *
	 * @var string
	 */
	protected $description = '';

	/**
	 * Ability category.
	 *
	 * @var string
	 */
	protected $category = 'betterlinks';

	/**
	 * Required WordPress capability.
	 *
	 * @var string
	 */
	protected $capability = 'manage_options';

	/**
	 * Get the JSON Schema for ability input.
	 *
	 * @return array<string, mixed>
	 */
	abstract public function get_input_schema();

	/**
	 * Get the JSON Schema for ability output.
	 *
	 * @return array<string, mixed>
	 */
	abstract public function get_output_schema();

	/**
	 * Execute the ability.
	 *
	 * @param array<string, mixed> $input Validated input.
	 * @return array<string, mixed>|\WP_Error
	 */
	abstract public function execute( $input );

	/**
	 * Check whether abilities are enabled.
	 *
	 * @return bool
	 */
	public static function abilities_enabled() {
		return (bool) apply_filters( 'betterlinks_abilities_api_enabled', true );
	}

	/**
	 * Check whether this ability can be registered and executed.
	 *
	 * @return bool
	 */
	public function is_enabled() {
		return (bool) apply_filters( 'betterlinks_ability_enabled', self::abilities_enabled(), $this->id, $this );
	}

	/**
	 * Permission callback for the abilities API.
	 *
	 * @return bool
	 */
	public function permission_callback() {
		if ( ! $this->is_enabled() ) {
			return false;
		}

		return current_user_can( $this->capability );
	}

	/**
	 * Enforce BetterLinks' current admin capability policy.
	 *
	 * @return bool
	 */
	public function meets_capability_policy() {
		return self::MIN_CAPABILITY === $this->capability;
	}

	/**
	 * MCP-compatible annotations for this ability. Override per ability.
	 *
	 * @return array<string, bool|float|string>
	 */
	public function get_annotations() {
		return [
			'readonly'      => false,
			'destructive'   => false,
			'idempotent'    => false,
			'priority'      => 2.0,
			'openWorldHint' => false,
		];
	}

	/**
	 * Wrapper around execute() with action hooks.
	 *
	 * @param array<string, mixed> $input Validated input.
	 * @return array<string, mixed>|\WP_Error
	 */
	public function execute_wrapper( $input ) {
		do_action( 'betterlinks_before_ability_execute', $this->id, $input );

		$output = $this->execute( $input );

		do_action( 'betterlinks_after_ability_execute', $this->id, $input, $output );

		return $output;
	}

	/**
	 * Dispatch an internal WP_REST_Request against BetterLinks' own routes and
	 * return the response body, so abilities reuse the existing controllers.
	 *
	 * The request runs in-process: rest_do_request() still invokes the route's
	 * permission_callback (BetterLinks gates on `manage_options`), but skips the
	 * cookie-nonce check that only applies to real HTTP requests — which is
	 * correct here, because the MCP server has already set the current user to
	 * the admin who granted the credential.
	 *
	 * @param string               $method HTTP verb (GET/POST/PUT/DELETE).
	 * @param string               $route  Route beneath the namespace, e.g. `/links`.
	 * @param array<string, mixed> $params Query/body params (shape matches the controller).
	 * @return array<string, mixed>|\WP_Error Decoded `data` payload, or the WP_Error.
	 */
	protected function dispatch( string $method, string $route, array $params = [] ) {
		$request = new \WP_REST_Request( strtoupper( $method ), '/' . self::NS . $route );

		if ( 'GET' === strtoupper( $method ) ) {
			$request->set_query_params( $params );
		} else {
			$request->set_header( 'content-type', 'application/json' );
			$request->set_body_params( $params );
		}

		$response = rest_do_request( $request );

		if ( $response->is_error() ) {
			return $response->as_error();
		}

		$data = $response->get_data();

		// BetterLinks controllers answer `{ success, data }`; unwrap to the
		// meaningful payload, but tolerate controllers that return a bare array.
		if ( is_array( $data ) && array_key_exists( 'data', $data ) ) {
			return [
				'success' => isset( $data['success'] ) ? (bool) $data['success'] : true,
				'data'    => $data['data'],
			];
		}

		return [
			'success' => true,
			'data'    => $data,
		];
	}

	/**
	 * Register the ability with the WordPress Abilities API.
	 *
	 * @return void
	 */
	public function register() {
		if ( ! function_exists( 'wp_register_ability' ) ) {
			return;
		}

		wp_register_ability(
			$this->id,
			[
				'label'               => $this->label,
				'description'         => $this->description,
				'category'            => $this->category,
				'input_schema'        => $this->get_input_schema(),
				'output_schema'       => $this->get_output_schema(),
				'permission_callback' => [ $this, 'permission_callback' ],
				'execute_callback'    => [ $this, 'execute_wrapper' ],
				'meta'                => [
					'show_in_rest' => true,
					'annotations'  => $this->get_annotations(),
					'mcp'          => [
						'public' => false,
					],
				],
			]
		);
	}

	/**
	 * Get the ability ID.
	 *
	 * @return string
	 */
	public function get_id() {
		return $this->id;
	}
}
