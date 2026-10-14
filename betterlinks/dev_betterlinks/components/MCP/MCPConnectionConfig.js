/**
 * MCP Connection Config — the "connect an AI client" guide.
 *
 * The connection token is minted server-side the moment MCP is enabled, so
 * there is no manual "create a token" step; this component just presents the
 * ready-to-use client recipes across two tabs:
 *   - OAuth: connector clients (Claude web/mobile/desktop, ChatGPT) that need
 *     only the server URL and sign in with a one-time approval.
 *   - Editors & CLI: deep-link installs (Cursor, VS Code) and copy-a-payload
 *     clients (Claude Code).
 */

import { useState, useEffect, useCallback } from 'react';
import { __ } from '@wordpress/i18n';
import { API, namespace, copyToClipboard as copyText } from 'utils/helper';
import { toastSuccess, toastError } from 'components/Toast';
import ConfirmDeleteModal from 'components/ConfirmDeleteModal';
import { ClaudeIcon, ChatGptIcon, CursorIcon, CodeIcon, SparkIcon, CopyIcon, CheckIcon, ExternalIcon } from './Icons';

const LEARN_MORE_MCP = 'https://modelcontextprotocol.io/docs/concepts/transports';
const LEARN_MORE_CHATGPT = 'https://developers.openai.com/apps-sdk/deploy/connect-chatgpt';

// UTF-8 safe base64 — btoa chokes on multi-byte. Used for the Cursor deep link.
const toBase64 = (str) => {
	try {
		return window.btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))));
	} catch (e) {
		return '';
	}
};

const MCPConnectionConfig = () => {
	const [status, setStatus] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState('');
	// One id at a time so the check mark shows on exactly one control.
	const [copiedId, setCopiedId] = useState(null);
	const [activeTab, setActiveTab] = useState('auth');
	const [showReset, setShowReset] = useState(false);
	const [resetting, setResetting] = useState(false);

	const loadStatus = useCallback(async () => {
		try {
			const res = await API.get(`${namespace}mcp/connection`);
			setStatus(res?.data || null);
		} catch (err) {
			setError(__('Couldn’t load the MCP connection status.', 'betterlinks'));
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadStatus();
	}, [loadStatus]);

	const copyWith = (text, id) => {
		if (!text) return;
		copyText(text);
		setCopiedId(id);
		setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 2000);
	};

	// Rotating is the leaked-secret escape hatch: it cuts off every header-based
	// client at once and leaves OAuth-connected apps untouched.
	const resetToken = async () => {
		setResetting(true);
		try {
			const res = await API.post(`${namespace}mcp/rotate`, {});
			setStatus(res?.data || null);
			setShowReset(false);
			toastSuccess(__('Connection token reset.', 'betterlinks'), { title: __('Token Rotated', 'betterlinks') });
		} catch (err) {
			toastError(__('Couldn’t reset the connection token.', 'betterlinks'));
		} finally {
			setResetting(false);
		}
	};

	if (isLoading) {
		return <p className="bl-mcp__muted">{__('Preparing your connection…', 'betterlinks')}</p>;
	}

	const connected = !!status?.connected;
	// Users who have MCP but are not administrators never receive the shared
	// connection token; their editor and CLI setups sign in instead, and so act
	// as them (#127).
	const signinOnly = !!status?.signin_only;
	const token = status?.connection_token || '';
	const endpoint = status?.mcp_endpoint || '';
	const claudeCodeCommand = status?.config?.cli || '';

	const serverEntry = signinOnly ? { url: endpoint } : { url: endpoint, headers: { Authorization: `Bearer ${token}` } };
	const cursorDeepLink = `cursor://anysphere.cursor-deeplink/mcp/install?name=betterlinks&config=${encodeURIComponent(toBase64(JSON.stringify(serverEntry)))}`;
	const vscodeDeepLink = `vscode:mcp/install?${encodeURIComponent(JSON.stringify({ name: 'betterlinks', type: 'http', ...serverEntry }))}`;

	const authConnectors = [
		{
			id: 'claude',
			name: __('Claude (web, mobile & desktop)', 'betterlinks'),
			Icon: ClaudeIcon,
			accent: '#d97757',
			steps: [
				__('In Claude, open Settings → Connectors → Add Connector → Add custom connector.', 'betterlinks'),
				__('Paste the connector URL above and give it a name (e.g. BetterLinks).', 'betterlinks'),
				__('Click Add, then approve access when Claude asks you to sign in.', 'betterlinks'),
			],
		},
		{
			id: 'chatgpt',
			name: 'ChatGPT',
			Icon: ChatGptIcon,
			accent: '#000000',
			learnMore: LEARN_MORE_CHATGPT,
			steps: [
				__('In ChatGPT, open Settings → Plugins → Add New.', 'betterlinks'),
				__('Enter a name (e.g. BetterLinks).', 'betterlinks'),
				__('Paste the Connection URL above.', 'betterlinks'),
				__('Save, then approve access when ChatGPT asks you to sign in.', 'betterlinks'),
			],
		},
	];

	const otherClients = [
		{
			id: 'claude-code',
			name: 'Claude Code',
			Icon: SparkIcon,
			accent: '#d97757',
			badge: __('CLI', 'betterlinks'),
			action: 'copy',
			fieldLabel: __('Command', 'betterlinks'),
			payload: claudeCodeCommand,
			sub: signinOnly ? __('Signs in with your account. No token to paste.', 'betterlinks') : '',
			steps: signinOnly
				? [__('Copy the command above and run it in your terminal.', 'betterlinks'), __('Run /mcp in Claude Code, pick BetterLinks, and sign in to this site when your browser opens.', 'betterlinks')]
				: [__('Copy the command above.', 'betterlinks'), __('Run it in your terminal from your project directory.', 'betterlinks')],
		},
		{
			id: 'cursor',
			name: 'Cursor',
			Icon: CursorIcon,
			accent: '#0f172a',
			badge: __('Editor', 'betterlinks'),
			action: 'link',
			href: cursorDeepLink,
			cta: __('Add to Cursor', 'betterlinks'),
			sub: signinOnly ? __('Signs in with your account. No token to paste.', 'betterlinks') : '',
			steps: signinOnly
				? [__('Click "Add to Cursor". It opens Cursor with BetterLinks prefilled.', 'betterlinks'), __('Confirm the install, then sign in to this site when Cursor asks.', 'betterlinks')]
				: [__('Click "Add to Cursor". It opens Cursor with BetterLinks prefilled.', 'betterlinks'), __('Confirm the install when Cursor asks.', 'betterlinks')],
		},
		{
			id: 'vscode',
			name: 'VS Code',
			Icon: CodeIcon,
			accent: '#0098ff',
			badge: __('Editor', 'betterlinks'),
			action: 'link',
			href: vscodeDeepLink,
			cta: __('Add to VS Code', 'betterlinks'),
			sub: signinOnly ? __('Signs in with your account. No token to paste.', 'betterlinks') : '',
			steps: signinOnly
				? [__('Click "Add to VS Code". It opens VS Code with BetterLinks prefilled.', 'betterlinks'), __('Confirm the install, then sign in to this site when VS Code asks.', 'betterlinks')]
				: [__('Click "Add to VS Code". It opens VS Code with BetterLinks prefilled.', 'betterlinks'), __('Confirm the install when VS Code asks.', 'betterlinks')],
		},
	];

	const TABS = [
		{ id: 'auth', label: __('OAuth', 'betterlinks') },
		{ id: 'others', label: __('Editors & CLI', 'betterlinks') },
	];

	return (
		<div className="bl-mcp-connect">
			<div className="bl-mcp__panel-head">
				<div>
					<h3 className="bl-mcp__panel-title">{__('Add BetterLinks to your client', 'betterlinks')}</h3>
					<p className="bl-mcp__panel-desc">
						{__('Pick your assistant below — it opens or copies fully configured.', 'betterlinks')}{' '}
						<a href={LEARN_MORE_MCP} target="_blank" rel="noopener noreferrer" className="bl-mcp__link">
							{__('How it works', 'betterlinks')}
							<ExternalIcon />
						</a>
					</p>
				</div>
			</div>

			{error && <div className="bl-mcp-alert is-error">{error}</div>}

			{!connected ? (
				<p className="bl-mcp__muted">
					{signinOnly ? __('MCP is turned off. An administrator has to turn it on before you can connect.', 'betterlinks') : __('Preparing your connection… reload the page if this persists.', 'betterlinks')}
				</p>
			) : (
				<>
					<div className="bl-mcp-tabs" role="tablist">
						{TABS.map((tab) => (
							<button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} className={`bl-mcp-tabs__tab${activeTab === tab.id ? ' is-active' : ''}`} onClick={() => setActiveTab(tab.id)}>
								{tab.label}
							</button>
						))}
					</div>

					{activeTab === 'auth' && (
						<div className="bl-mcp-grid">
							{authConnectors.map((c) => (
								<AuthConnectorCard key={c.id} connector={c} endpoint={endpoint} copied={copiedId === c.id} onCopy={() => copyWith(endpoint, c.id)} />
							))}
						</div>
					)}

					{activeTab === 'others' && (
						<>
							<div className="bl-mcp-grid">
								{otherClients.map((c) => (
									<ClientCard key={c.id} client={c} copied={copiedId === c.id} onCopy={() => copyWith(c.payload, c.id)} />
								))}
							</div>
							{/* Reset lives here: it only affects these header-based clients.
							    Like the token itself, it is an administrator control. */}
							{!signinOnly && (
							<div className="bl-mcp-reset">
								<p className="bl-mcp-reset__text">
									{__('Reset the connection token if it may have leaked. This disconnects Claude Code, Cursor, VS Code and Claude Desktop — they’ll need the new command to reconnect. OAuth-connected apps are unaffected.', 'betterlinks')}
								</p>
								<button type="button" className="bl-mcp-btn" onClick={() => setShowReset(true)}>
									{__('Reset token', 'betterlinks')}
								</button>
							</div>
							)}
						</>
					)}
				</>
			)}

			<ConfirmDeleteModal
				isOpen={showReset}
				onClose={() => (resetting ? null : setShowReset(false))}
				onConfirm={resetToken}
				busy={resetting}
				title={__('Reset connection token?', 'betterlinks')}
				description={__('A new token is generated immediately. Every header-based client (Claude Code, Cursor, VS Code, Claude Desktop) is disconnected and must reconnect with the new command. OAuth-connected apps like Claude on the web keep working.', 'betterlinks')}
				confirmLabel={__('Reset token', 'betterlinks')}
			/>
		</div>
	);
};

/* ------------------------------------------------------------------ pieces */

const CopyField = ({ label, value, copied, onCopy }) => (
	<div className="bl-mcp-field">
		<span className="bl-mcp-field__label">{label}</span>
		<div className="bl-mcp-field__control">
			<code className="bl-mcp-field__value">{value}</code>
			<button type="button" onClick={onCopy} className="bl-mcp-field__copy" title={__('Copy', 'betterlinks')}>
				{copied ? (
					<>
						<CheckIcon />
						{__('Copied!', 'betterlinks')}
					</>
				) : (
					<>
						<CopyIcon />
						{__('Copy', 'betterlinks')}
					</>
				)}
			</button>
		</div>
	</div>
);

const Steps = ({ steps }) => (
	<ol className="bl-mcp-steps">
		{steps.map((step, i) => (
			<li key={step} className="bl-mcp-steps__item">
				<span className="bl-mcp-steps__num">{i + 1}</span>
				<span>{step}</span>
			</li>
		))}
	</ol>
);

const AuthConnectorCard = ({ connector, endpoint, copied, onCopy }) => {
	const { name, Icon, accent, steps, learnMore } = connector;
	return (
		<div className="bl-mcp-card">
			<div className="bl-mcp-card__head">
				<span className="bl-mcp-card__icon" style={{ color: accent, backgroundColor: `${accent}14` }}>
					<Icon />
				</span>
				<div className="bl-mcp-card__headtext">
					<span className="bl-mcp-card__title">
						{name}
						<span className="bl-mcp-badge is-info">{__('OAuth', 'betterlinks')}</span>
					</span>
					<span className="bl-mcp-card__sub">{__('Signs in with a one-time approval. No token to paste.', 'betterlinks')}</span>
				</div>
			</div>

			<CopyField label={__('Connector URL', 'betterlinks')} value={endpoint} copied={copied} onCopy={onCopy} />
			<Steps steps={steps} />

			{learnMore && (
				<a href={learnMore} target="_blank" rel="noopener noreferrer" className="bl-mcp__link is-small">
					{__('How to add a connector', 'betterlinks')}
					<ExternalIcon size={11} />
				</a>
			)}
		</div>
	);
};

const ClientCard = ({ client, copied, onCopy }) => {
	const { name, Icon, accent, badge, action, fieldLabel, payload, href, cta, steps, sub } = client;
	return (
		<div className="bl-mcp-card">
			<div className="bl-mcp-card__head">
				<span className="bl-mcp-card__icon" style={{ color: accent, backgroundColor: `${accent}14` }}>
					<Icon />
				</span>
				<div className="bl-mcp-card__headtext">
					<span className="bl-mcp-card__title">
						{name}
						{badge && <span className="bl-mcp-badge">{badge}</span>}
					</span>
					{sub && <span className="bl-mcp-card__sub">{sub}</span>}
				</div>
			</div>

			{action === 'copy' ? (
				<CopyField label={fieldLabel} value={payload} copied={copied} onCopy={onCopy} />
			) : (
				<a href={href} className="bl-mcp-btn is-outline">
					<ExternalIcon size={14} />
					{cta}
				</a>
			)}

			<Steps steps={steps} />
		</div>
	);
};

export default MCPConnectionConfig;
