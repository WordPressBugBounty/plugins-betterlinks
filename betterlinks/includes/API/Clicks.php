<?php // phpcs:ignore
namespace BetterLinks\API;

use BetterLinks\Traits\ArgumentSchema;

class Clicks extends Controller {

	use \BetterLinks\Traits\Clicks;
	use ArgumentSchema;

	/**
	 * Initialize hooks and option name
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the routes for the objects of the controller.
	 */
	public function register_routes() {
		$endpoint = '/clicks/';
		register_rest_route(
			$this->namespace,
			$endpoint,
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => $this->get_clicks_schema(),
				),
			)
		);
		register_rest_route(
			$this->namespace,
			$endpoint . 'get_graphs/',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_graphs' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => $this->get_clicks_schema(),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			$endpoint . '(?P<id>[\d]+)',
			array(
				'args' => array(
					'id' => array(
						'description' => __( 'Unique identifier for the object.' ),
						'type'        => 'integer',
					),
				),
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => $this->get_clicks_schema(),
				),
			)
		);
		register_rest_route(
			$this->namespace,
			$endpoint . 'tags/' . '(?P<id>[\d]+)',
			array(
				'args' => array(
					'id' => array(
						'description' => __( 'Unique identifier for the object.' ),
						'type'        => 'integer',
					),
				),
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_tags_analytics' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => $this->get_clicks_schema(),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			$endpoint . 'tags/get_graphs/' . '(?P<id>[\d]+)',
			array(
				'args' => array(
					'id' => array(
						'description' => __( 'Unique identifier for the object.' ),
						'type'        => 'integer',
					),
				),
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_tags_graph' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => $this->get_clicks_schema(),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			$endpoint,
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => $this->get_clicks_schema(),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			$endpoint,
			array(
				array(
					'methods'             => \WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => $this->get_clicks_schema(),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			$endpoint,
			array(
				array(
					'methods'             => \WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_item' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => $this->get_clicks_schema(),
				),
			)
		);

		do_action( 'betterlinks_register_clicks_routes', $this );
	}

	/**
	 * Get Analytics Graph Data
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_Error|WP_REST_Response
	 */
	public function get_graphs( $request ) {
		$request = $request->get_params();
		$from    = $this->sanitize_date( $request['from'] ) ? $request['from'] : date( 'Y-m-d', strtotime( ' - 30 days' ) );
		$to      = $this->sanitize_date( $request['to'] ) ? $request['to'] : date( 'Y-m-d' );

		$graph_data = $this->get_analytics_graph_data( $from, $to );
		return new \WP_REST_Response(
			array(
				'success' => true,
				'data'    => array(
					'clicks' => $graph_data,
				),
			)
		);
	}

	/**
	 * Get analytics graph data by Tag ID
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_Error|WP_REST_Response
	 */
	public function get_tags_graph( $request ) {
		$request = $request->get_params();
		$from    = $this->sanitize_date( $request['from']) ? $request['from'] : '';
		$to      = $this->sanitize_date( $request['to']) ? $request['to'] : '';
		$id      = isset( $request['id'] ) ? $request['id'] : '';

		if( empty( $from ) || empty( $to ) ) {
			return new \WP_REST_Response(
				array(
					'success' => false,
					'message' => __( "Invalid date range provided.", 'betterlinks' ),
				),
				400
			);
		}

		$results = $this->get_analytics_graph_data_by_tag( $from, $to, $id );

		return new \WP_REST_Response(
			array(
				'success' => true,
				'data'    => $results,
			),
			200
		);
	}

	/**
	 * Get unique analytics list by Tag ID
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_Error|WP_REST_Response
	 */
	public function get_tags_analytics( $request ) {
		$request = $request->get_params();
		
		$from = $this->sanitize_date( $request['from'] ) ? $request['from'] : '';
		$to   = $this->sanitize_date( $request['to'] ) ? $request['to'] : '';
		$id   = isset( $request['id'] ) ? $request['id'] : '';

		if( empty( $from ) || empty( $to ) ) {
			return new \WP_REST_Response(
				array(
					'success' => false,
					'message' => __( "Invalid date range provided.", 'betterlinks' ),
				),
				400
			);
		}

		$results = $this->get_analytics_unique_list_by_tag( $from, $to, $id );

		$analytic = get_option( 'betterlinks_analytics_data' );
		$analytic = $analytic ? json_decode( $analytic, true ) : array();

		return new \WP_REST_Response(
			array(
				'success' => true,
				'data'    => array(
					'list'     => $results,
					'analytic' => $analytic,
				),
			),
			200
		);
	}

	/**
	 * Get betterlinks
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_Error|WP_REST_Response
	 */
	public function get_items( $request ) {
		$request = $request->get_params();

		$from = isset($request['from']) && $this->sanitize_date( $request['from'] ) ? $request['from'] : '';
		$to = isset($request['to']) && $this->sanitize_date( $request['to'] ) ? $request['to'] : '';

		if( empty( $from ) || empty( $to ) ) {
			return new \WP_REST_Response(
				array(
					'success' => false,
					'data' => [],
					'message' => __( "Invalid date range provided.", 'betterlinks' ),
				),
				400
			);
		}

		$unique_list = $this->get_analytics_unique_list( $from, $to );
		$unique_click_count = $this->get_unique_clicks_count($from, $to);

		// $analytic = get_option( 'betterlinks_analytics_data' );
		$analytic = $this->get_analytics_data($from, $to);
		$analytic = $analytic ? json_decode( $analytic, true ) : array();

		return new \WP_REST_Response(
			array(
				'success' => true,
				'data'    => array(
					'unique_list' => $unique_list,
					'unique_count' => $unique_click_count,
					'analytic'    => $analytic,
				),
			),
			200
		);
	}


	/**
	 * Get Individual Clicks
	 *
	 * @param WP_Rest_Request $request
	 * @return WP_Error|WP_Rest_Response
	 */
	public function get_item( $request ) {
		$request = $request->get_params();

		$id   = ! empty( $request['id'] ) ? sanitize_text_field( $request['id'] ) : null;
		$from = $this->sanitize_date( $request['from'] ) ? sanitize_text_field( $request['from'] ) : '';
		$to   = $this->sanitize_date( $request['to'] ) ? sanitize_text_field( $request['to'] ) : '';
		
		if( empty( $from ) || empty( $to ) ) {
			return new \WP_REST_Response(
				array(
					'success' => false,
					'message' => __( "Invalid date range provided.", 'betterlinks' ),
				),
				400
			);
		}

		$results      = $this->get_individual_analytics_clicks( $id, $from, $to );
		$link_details = $this->get_individual_link_details( $id );
		$graph_data   = array(
			'total_count'  => array(),
			'unique_count' => array(),
		);
		$graph_data = apply_filters( 'betterlinkspro/get_individual_graph_data', $graph_data, $id, $from, $to );

		return new \WP_REST_Response(
			array(
				'data' => array(
					'analytics'    => $results,
					'graph_data'   => $graph_data,
					'link_details' => $link_details,
				),
				'id'   => $id,
			),
			200
		);
	}

	/**
	 * Create OR Update betterlinks
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_Error|WP_REST_Request
	 */
	public function create_item( $request ) {
		return new \WP_REST_Response(
			array(
				'success' => false,
				'data'    => array(),
			),
			200
		);
	}

	/**
	 * Create OR Update betterlinks
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_Error|WP_REST_Request
	 */
	public function update_item( $request ) {
		return new \WP_REST_Response(
			array(
				'success' => false,
				'data'    => array(),
			),
			200
		);
	}

	/**
	 * Delete betterlinks
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_Error|WP_REST_Request
	 */
	public function delete_item( $request ) {
		return new \WP_REST_Response(
			array(
				'success' => false,
				'data'    => array(),
			),
			200
		);
	}

	/**
	 * Check if a given request has access to update a setting
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_Error|bool
	 */
	public function get_items_permissions_check( $request ) {
		return apply_filters( 'betterlinks/api/analytics_items_permissions_check', current_user_can( 'manage_options' ) );
	}
	/**
	 * Check if a given request has access to update a setting
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_Error|bool
	 */
	public function permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}
}
