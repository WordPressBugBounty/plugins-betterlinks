/**
 * MCP Connected AI apps.
 *
 * Lists the OAuth apps currently connected to this site via MCP and lets an
 * admin cut any of them off. Header-based (static-token) clients share one
 * secret and have no per-client identity, so they are not listed here — they
 * are rotated from the connect card instead.
 *
 * Data: GET /betterlinks/v1/mcp/apps; revoking hits POST .../mcp/apps/revoke,
 * which returns the refreshed list.
 */

import { useState, useEffect, useCallback } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { API, namespace, betterlinks_date_format } from 'utils/helper';
import { toastSuccess, toastError } from 'components/Toast';
import ConfirmDeleteModal from 'components/ConfirmDeleteModal';
import { PlugIcon, RefreshIcon, TrashIcon, SpinnerIcon, ClaudeIcon, ChatGptIcon } from './Icons';

// The server lists everyone's apps for administrators and only the user's own
// apps for everyone else (#127); this only picks the matching wording.
const isAdmin = !!window.betterLinksGlobal?.mcp?.is_admin;

// Match a connected client to a known mark. Anything unrecognised falls back to
// an initial avatar, so we never show a wrong brand.
const resolveBrand = (name) => {
	const n = (name || '').toLowerCase();
	if (n.includes('claude') || n.includes('anthropic')) return { Icon: ClaudeIcon, accent: '#d97757' };
	if (n.includes('chatgpt') || n.includes('openai')) return { Icon: ChatGptIcon, accent: '#000000' };
	return null;
};

const formatLastUsed = (value) => {
	if (!value) return __('Never used', 'betterlinks');
	const ts = typeof value === 'number' ? value * 1000 : Date.parse(value);
	if (Number.isNaN(ts)) return __('Never used', 'betterlinks');
	return sprintf(
		/* translators: %s: formatted date. */
		__('Last used %s', 'betterlinks'),
		new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
	);
};

const AppRow = ({ name, readOnly, meta, revoking, onRevoke }) => {
	const brand = resolveBrand(name);
	const initial = (name || '?').trim().charAt(0).toUpperCase();

	return (
		<div className="bl-mcp-app">
			{brand ? (
				<span className="bl-mcp-app__icon" style={{ color: brand.accent, backgroundColor: `${brand.accent}14` }}>
					<brand.Icon size={20} />
				</span>
			) : (
				<span className="bl-mcp-app__icon is-initial" aria-hidden="true">
					{initial}
				</span>
			)}
			<div className="bl-mcp-app__body">
				<span className="bl-mcp-app__name">
					{name}
					<span className={`bl-mcp-badge ${readOnly ? 'is-warning' : 'is-good'}`}>{readOnly ? __('Read-only', 'betterlinks') : __('Read & write', 'betterlinks')}</span>
				</span>
				<span className="bl-mcp-app__meta">{meta}</span>
			</div>
			<button type="button" onClick={onRevoke} disabled={revoking} className="bl-mcp-app__revoke" title={__('Revoke', 'betterlinks')} aria-label={sprintf(__('Revoke %s', 'betterlinks'), name)}>
				{revoking ? <SpinnerIcon /> : <TrashIcon />}
			</button>
		</div>
	);
};

const MCPConnectedApps = () => {
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState('');
	const [pending, setPending] = useState(null);
	const [revoking, setRevoking] = useState(false);

	// `announce` fires a toast — passed only for the user's Refresh click, never
	// for the silent load on mount.
	const load = useCallback(async (announce = false) => {
		setLoading(true);
		setLoadError('');
		try {
			const res = await API.get(`${namespace}mcp/apps`);
			setData(res?.data || null);
			if (announce) toastSuccess(__('Connected apps refreshed.', 'betterlinks'));
		} catch (error) {
			setLoadError(__('Couldn’t load connected apps. Reload and try again.', 'betterlinks'));
			if (announce) toastError(__('Couldn’t refresh connected apps.', 'betterlinks'));
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const confirmRevoke = useCallback(async () => {
		if (!pending) return;
		setRevoking(true);
		try {
			const res = await API.post(`${namespace}mcp/apps/revoke`, { client_id: pending.client_id });
			setData(res?.data || null);
			setPending(null);
			toastSuccess(__('Connection revoked.', 'betterlinks'));
		} catch (error) {
			toastError(__('Couldn’t revoke that connection. Please try again.', 'betterlinks'));
		} finally {
			setRevoking(false);
		}
	}, [pending]);

	const oauthApps = Array.isArray(data?.oauth_apps) ? data.oauth_apps : [];

	return (
		<div className="bl-mcp-apps">
			<div className="bl-mcp__panel-head">
				<div>
					<h3 className="bl-mcp__panel-title">
						<span className="bl-mcp__panel-icon">
							<PlugIcon />
						</span>
						{__('Connected AI apps', 'betterlinks')}
					</h3>
					<p className="bl-mcp__panel-desc">{isAdmin
							? __('Apps connected to this site via MCP. Each connection acts as the person who approved it — revoking cuts it off immediately.', 'betterlinks')
							: __('Apps you have connected via MCP. They act as you — revoking one cuts it off immediately.', 'betterlinks')}</p>
				</div>
				<button type="button" className="bl-mcp-btn" onClick={() => load(true)}>
					<RefreshIcon />
					{__('Refresh', 'betterlinks')}
				</button>
			</div>

			{loadError && <div className="bl-mcp-alert is-error">{loadError}</div>}

			{loading ? (
				<p className="bl-mcp__muted">{__('Loading connected apps…', 'betterlinks')}</p>
			) : oauthApps.length === 0 ? (
				<div className="bl-mcp-empty">
					<span className="bl-mcp-empty__icon">
						<PlugIcon size={26} />
					</span>
					<h4 className="bl-mcp-empty__title">{__('No apps connected yet', 'betterlinks')}</h4>
					<p className="bl-mcp-empty__text">{isAdmin ? __('When an AI client connects to this site, it will appear here.', 'betterlinks') : __('When you connect an AI client, it will appear here.', 'betterlinks')}</p>
				</div>
			) : (
				<div className="bl-mcp-applist">
					{oauthApps.map((app) => (
						<AppRow
							key={app.client_id}
							name={app.name}
							readOnly={app.read_only}
							meta={`${app.approved_by} · ${formatLastUsed(app.last_used)}`}
							revoking={revoking && pending?.client_id === app.client_id}
							onRevoke={() => setPending({ client_id: app.client_id, name: app.name })}
						/>
					))}
				</div>
			)}

			<ConfirmDeleteModal
				isOpen={!!pending}
				onClose={() => (revoking ? null : setPending(null))}
				onConfirm={confirmRevoke}
				busy={revoking}
				title={__('Revoke connection?', 'betterlinks')}
				description={sprintf(
					/* translators: %s: app name. */
					__('“%s” will lose access immediately and must be re-approved to reconnect.', 'betterlinks'),
					pending?.name || ''
				)}
				confirmLabel={__('Revoke', 'betterlinks')}
			/>
		</div>
	);
};

export default MCPConnectedApps;
