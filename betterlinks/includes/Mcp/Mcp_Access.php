<?php
/**
 * Who may use BetterLinks' MCP connector.
 *
 * @package BetterLinks
 */

namespace BetterLinks\Mcp;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The single answer to "may this user use MCP?".
 *
 * MCP used to be hard-wired to `manage_options` in five places: the MCP admin
 * routes, the OAuth consent page, the sign-in check on every MCP request, the
 * ability permission callback, and the MCP menu entry. Every one of them now
 * asks this class instead, so the rule cannot drift between them.
 *
 * Administrators always have MCP. Nothing else does, unless a filter grants it.
 * BetterLinks Pro's Role Management uses {@see self::FILTER} to give MCP to the
 * roles ticked under "Who can use MCP?". Without Pro, or with a Pro that does
 * not know the filter, MCP stays administrator-only exactly as before.
 *
 * Granting MCP does not grant administrator rights. Requests run as the user who
 * connected the assistant, and only BetterLinks' own permission checks are
 * relaxed, and only while an MCP tool is running ({@see self::run_tool()}).
 */
final class Mcp_Access {

	/**
	 * Filter that grants MCP to a non-administrator.
	 *
	 * Receives `false` and the WP_User being checked. Anything other than a
	 * strict `true` is a refusal, so a broken callback fails closed.
	 */
	public const FILTER = 'betterlinks/mcp/user_can_access';

	/**
	 * How many MCP tool calls are currently running in this request.
	 *
	 * A counter rather than a flag, so a tool that dispatches more than one
	 * internal request cannot switch the exemption off part-way through.
	 *
	 * @var int
	 */
	private static $tool_depth = 0;

	/**
	 * Whether a user may use MCP.
	 *
	 * @param \WP_User|int|null $user The user, a user id, or null for the current user.
	 * @return bool
	 */
	public static function user_can( $user = null ): bool {
		if ( null === $user ) {
			$user = wp_get_current_user();
		} elseif ( is_numeric( $user ) ) {
			$user = get_user_by( 'id', (int) $user );
		}

		if ( ! $user instanceof \WP_User || ! $user->exists() ) {
			return false;
		}

		// Administrators keep MCP unconditionally. A filter may add roles; it
		// may never take MCP away from an administrator.
		if ( user_can( $user, 'manage_options' ) ) {
			return true;
		}

		return true === apply_filters( self::FILTER, false, $user );
	}

	/**
	 * Whether a user is an administrator, for the parts of MCP that stay theirs.
	 *
	 * A role granted MCP uses the tools as itself, but site-wide controls stay
	 * with administrators: the shared connection token (seeing, resetting or
	 * owning it), the MCP on/off switch, "disconnect everything", and other
	 * users' connected apps. See #127.
	 *
	 * @param \WP_User|int|null $user The user, a user id, or null for the current user.
	 * @return bool
	 */
	public static function is_admin( $user = null ): bool {
		if ( null === $user ) {
			$user = wp_get_current_user();
		} elseif ( is_numeric( $user ) ) {
			$user = (int) $user > 0 ? get_user_by( 'id', (int) $user ) : false;
		}

		return $user instanceof \WP_User && $user->exists() && user_can( $user, 'manage_options' );
	}

	/**
	 * Run an MCP tool's work with BetterLinks' own permission checks relaxed.
	 *
	 * The tools reuse BetterLinks' REST controllers internally, and those check
	 * their own permissions: "Write links" for a create, "Edit settings" for a
	 * settings change, plain `manage_options` for a delete. A role granted MCP is
	 * meant to use every tool, so those checks have to pass for it while a tool
	 * runs, without handing the user any WordPress capability. Only controllers
	 * that consult {@see self::is_running_tool()} relax, and only here.
	 *
	 * @param callable $work The tool's work.
	 * @return mixed Whatever `$work` returns.
	 */
	public static function run_tool( callable $work ) {
		if ( ! self::user_can() ) {
			return $work();
		}

		++self::$tool_depth;
		try {
			return $work();
		} finally {
			--self::$tool_depth;
		}
	}

	/**
	 * Whether the current request is inside an MCP tool call by a user with MCP.
	 *
	 * BetterLinks' REST permission callbacks OR this onto their normal answer.
	 * It re-checks the user, so it cannot outlive the user switch.
	 *
	 * @return bool
	 */
	public static function is_running_tool(): bool {
		return self::$tool_depth > 0 && self::user_can();
	}
}
