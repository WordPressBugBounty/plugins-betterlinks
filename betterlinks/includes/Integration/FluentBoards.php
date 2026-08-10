<?php
namespace BetterLinks\Integration;
if ( ! defined( 'ABSPATH' ) ) { exit; }

use BetterLinks\Admin\Cache;
use BetterLinks\Helper;
use BetterLinks\Traits\Links;

class FluentBoards {
	use Links;

	public static function init() {
		$self = new self();
		add_action( 'fluent_boards/task_deleted', array( $self, 'fbs_task_deleted' ), 10, 1 );
		add_action( 'fluent_boards/board_task_archived', array( $self, 'fbs_task_archive' ), 10, 1 );
		add_filter( 'betterlinks__intlfbs_filter_category_from_dashboard', array( $self, 'filter_category_from_dashboard' ), 10, 2 );
	}

	/**
	 * Fluent Boards Task Delete
	 */
	public function fbs_task_deleted( $task ) {
		$settings = Cache::get_json_settings();
		if ( ! isset( $settings['fbs']['delete_on'] ) || 'task_delete' !== $settings['fbs']['delete_on'] ) {
			return;
		}

		$this->fbs_shorten_link_delete( $task );
	}

	/**
	 * Fluent Boards Task Archive
	 */
	public function fbs_task_archive( $task ) {
		$settings = Cache::get_json_settings();
		if ( ! isset( $settings['fbs']['delete_on'] ) || 'task_archive' !== $settings['fbs']['delete_on'] ) {
			return;
		}

		$this->fbs_shorten_link_delete( $task );
	}

	public function fbs_shorten_link_delete( $task ) {
		$page_url = fluent_boards_page_url();
		$task_url = $page_url . 'boards/' . $task->board_id . '/tasks/' . $task->id;

		$link = Helper::get_link_by_permalink( $task_url, 'id, short_url' );
		if ( ! empty( $link ) ) {
			$args = array(
				'ID'        => ( isset( $link['id'] ) ? sanitize_text_field( $link['id'] ) : '' ),
				'short_url' => ( isset( $link['short_url'] ) ? sanitize_text_field( $link['short_url'] ) : '' ),
			);
			$this->delete_link( $args );
		}
	}

	/**
	 * Fluent Boards Category Filter from Dashboard
	 *
	 * Keeps the Fluent Boards task category off Manage Links unless the admin
	 * opts to show it. The IDs are interpolated into the `get_prepare_all_links()`
	 * query, so they are cast to int here.
	 */
	public function filter_category_from_dashboard( $value, $settings ) {
		if ( ! empty( $settings['fbs']['enable_fbs'] ) && ! empty( $settings['fbs']['show_fbs_category'] ) ) {
			return $value;
		}
		$fbs_cat_arr = array();
		$fbs_cat     = Helper::get_term_by_slug( 'fluent-boards' );
		if ( ! empty( $fbs_cat[0]['ID'] ) ) {
			array_push( $fbs_cat_arr, (int) $fbs_cat[0]['ID'] );
		}

		if ( ! empty( $settings['fbs']['cat_id'] ) ) {
			array_push( $fbs_cat_arr, (int) $settings['fbs']['cat_id'] );
		}

		// Never hide a category the dashboard depends on. The Fluent Boards
		// settings default `cat_id` to "Uncategorized" (ID 1), and that is where
		// every link without a category of its own lives — excluding it drops
		// Uncategorized and all of its links off Manage Links entirely.
		$protected   = array_map( 'intval', (array) apply_filters( 'betterlinks/protected_term_ids', array( 1 ) ) );
		$fbs_cat_arr = array_diff( array_unique( array_filter( $fbs_cat_arr ) ), $protected );

		// `NOT IN ()` is a syntax error that would take the whole links query
		// down, so with nothing left to hide leave the query untouched.
		if ( empty( $fbs_cat_arr ) ) {
			return $value;
		}

		return sprintf( 'WHERE bt.ID NOT IN (%1$s)', implode( ',', $fbs_cat_arr ) );
	}
}
