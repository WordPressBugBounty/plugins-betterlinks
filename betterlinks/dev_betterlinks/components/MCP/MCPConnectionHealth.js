/**
 * MCP Connection Health — the troubleshooting surface.
 *
 * Reads the read-only `connection-status` report to show, at a glance, whether
 * an external MCP client could reach and use this site — scheme agreement, how
 * many tools are registered, the signed-in user's permissions, database
 * currency — and offers a live "Test connection" that exercises the real round
 * trip and names the step that failed.
 */

import { useState, useEffect, useCallback } from 'react';
import { __, sprintf, _n } from '@wordpress/i18n';
import { API, namespace } from 'utils/helper';
import { toastSuccess, toastError } from 'components/Toast';
import { RefreshIcon, PlayIcon } from './Icons';

// Self-test stages that are cautionary rather than hard failures — a
// token-pasting client still works when these fail; only clients that connect
// by URL alone (ChatGPT, claude.ai) are affected.
const WARN_STAGES = ['tls', 'redirect', 'no_tools', 'rewrite', 'discovery', 'challenge', 'ua_filter', 'unreached'];

const alertVariantFor = (result) => {
	if (!result) return 'info';
	if (result.ok) return 'success';
	return WARN_STAGES.includes(result.stage) ? 'warning' : 'error';
};

const HealthRow = ({ label, variant, badge, detail }) => (
	<div className="bl-mcp-health__row">
		<div className="bl-mcp-health__rowtext">
			<span className="bl-mcp-health__label">{label}</span>
			{detail && <span className="bl-mcp-health__detail">{detail}</span>}
		</div>
		<span className={`bl-mcp-badge is-${variant}`}>{badge}</span>
	</div>
);

const MCPConnectionHealth = () => {
	const [report, setReport] = useState(null);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState('');
	const [testing, setTesting] = useState(false);
	const [testResult, setTestResult] = useState(null);

	const loadStatus = useCallback(async (announce = false) => {
		setLoading(true);
		setLoadError('');
		try {
			const res = await API.get(`${namespace}connection-status`);
			setReport(res?.data || null);
			if (announce) toastSuccess(__('Connection health refreshed.', 'betterlinks'));
		} catch (error) {
			setLoadError(__('Couldn’t load connection health. Reload the page and try again.', 'betterlinks'));
			if (announce) toastError(__('Couldn’t refresh connection health.', 'betterlinks'));
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadStatus();
	}, [loadStatus]);

	const runTest = useCallback(async () => {
		setTesting(true);
		setTestResult(null);
		try {
			const res = await API.post(`${namespace}mcp/self-test`, {});
			setTestResult(res?.data || null);
		} catch (error) {
			setTestResult({
				ok: false,
				stage: 'unreachable',
				message: __('The test request itself failed. Reload the page and try again.', 'betterlinks'),
			});
		} finally {
			setTesting(false);
		}
	}, []);

	if (loading) {
		return <p className="bl-mcp__muted">{__('Checking connection health…', 'betterlinks')}</p>;
	}
	if (loadError) {
		return <div className="bl-mcp-alert is-error">{loadError}</div>;
	}
	if (!report) {
		return null;
	}

	const { abilities, urls, user, database, plugin, links } = report;

	const secureOk = urls.is_https && urls.home_siteurl_match && urls.rest_matches_home;
	const secureDetail = (() => {
		if (!urls.is_https) return __('Site is served over HTTP. MCP clients expect HTTPS; some refuse to connect otherwise.', 'betterlinks');
		if (!urls.home_siteurl_match) return __('Site Address and WordPress Address use different schemes — requests can bounce between HTTP and HTTPS.', 'betterlinks');
		if (!urls.rest_matches_home) return __('The REST API URL scheme differs from the site address, which can redirect MCP requests.', 'betterlinks');
		return __('HTTPS is on and all WordPress URLs agree.', 'betterlinks');
	})();

	const toolCount = abilities?.betterlinks_count || 0;
	const abilitiesDetail = abilities?.registered
		? sprintf(
				/* translators: %d: number of registered BetterLinks tools. */
				_n('%d BetterLinks tool is registered and discoverable.', '%d BetterLinks tools are registered and discoverable.', toolCount, 'betterlinks'),
				toolCount
			)
		: __('No BetterLinks tools are registered — MCP may be off or the runtime failed to load.', 'betterlinks');

	// `can_use_mcp` covers administrators and roles BetterLinks Pro grants MCP.
	// Older servers only report `is_admin`, which meant the same thing then.
	const permsOk = user?.can_use_mcp ?? !!user?.is_admin;
	let permsBadge = __('Limited', 'betterlinks');
	if (user?.is_admin) permsBadge = __('Administrator', 'betterlinks');
	else if (permsOk) permsBadge = __('MCP access', 'betterlinks');
	const dbOk = !!database?.up_to_date;

	return (
		<div className="bl-mcp-health">
			<div className="bl-mcp__panel-head">
				<div>
					<h3 className="bl-mcp__panel-title">{__('Connection health', 'betterlinks')}</h3>
					<p className="bl-mcp__panel-desc">{__('What an AI client sees when it tries to reach this site. Use Test connection to exercise the real round trip.', 'betterlinks')}</p>
				</div>
				<div className="bl-mcp__panel-actions">
					<button type="button" className="bl-mcp-btn" onClick={() => loadStatus(true)}>
						<RefreshIcon />
						{__('Re-check', 'betterlinks')}
					</button>
					<button type="button" className="bl-mcp-btn is-primary" onClick={runTest} disabled={testing}>
						<PlayIcon />
						{testing ? __('Testing…', 'betterlinks') : __('Test connection', 'betterlinks')}
					</button>
				</div>
			</div>

			{testResult && <div className={`bl-mcp-alert is-${alertVariantFor(testResult)}`}>{testResult.message}</div>}

			{Array.isArray(testResult?.checks) && testResult.checks.length > 0 && (
				<ul className="bl-mcp-checks">
					{testResult.checks.map((check) => (
						<li key={check.id} className="bl-mcp-checks__item">
							<span aria-hidden="true" className={check.ok ? 'bl-mcp-checks__ok' : 'bl-mcp-checks__warn'}>
								{check.ok ? '✓' : '!'}
							</span>
							<span>
								<strong>{check.label}</strong>
								{' — '}
								{check.detail}
							</span>
						</li>
					))}
				</ul>
			)}

			<div className="bl-mcp-health__list">
				<HealthRow label={__('Secure connection', 'betterlinks')} variant={secureOk ? 'good' : 'warning'} badge={secureOk ? __('OK', 'betterlinks') : __('Check', 'betterlinks')} detail={secureDetail} />
				<HealthRow label={__('Registered tools', 'betterlinks')} variant={abilities?.registered ? 'good' : 'warning'} badge={String(toolCount)} detail={abilitiesDetail} />
				<HealthRow
					label={__('Your permissions', 'betterlinks')}
					variant={permsOk ? 'good' : 'poor'}
					badge={permsBadge}
					detail={permsOk ? __('You can use every BetterLinks tool.', 'betterlinks') : __('Your account does not have MCP access, so the tools will be refused.', 'betterlinks')}
				/>
				<HealthRow
					label={__('Links available', 'betterlinks')}
					variant={links?.links > 0 ? 'good' : 'neutral'}
					badge={String(links?.links ?? 0)}
					detail={sprintf(
						/* translators: 1: number of categories, 2: number of tags. */
						__('Across %1$d categories and %2$d tags.', 'betterlinks'),
						links?.categories ?? 0,
						links?.tags ?? 0
					)}
				/>
				<HealthRow
					label={__('Database', 'betterlinks')}
					variant={dbOk ? 'good' : 'warning'}
					badge={dbOk ? __('Up to date', 'betterlinks') : __('Update due', 'betterlinks')}
					detail={
						dbOk
							? sprintf(
									/* translators: %s: database schema version. */
									__('Schema v%s installed.', 'betterlinks'),
									String(database?.installed_version)
								)
							: __('A database update is pending. Reload the admin to run it.', 'betterlinks')
					}
				/>
				<HealthRow
					label={__('Version', 'betterlinks')}
					variant="neutral"
					badge={String(plugin?.betterlinks_version)}
					detail={plugin?.pro_active ? __('BetterLinks Pro is active.', 'betterlinks') : __('BetterLinks (free) is active.', 'betterlinks')}
				/>
			</div>
		</div>
	);
};

export default MCPConnectionHealth;
