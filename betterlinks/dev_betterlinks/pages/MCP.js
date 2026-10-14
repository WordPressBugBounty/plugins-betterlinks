/**
 * MCP (Model Context Protocol) page.
 *
 * Lets site owners open a permission-scoped bridge between their links and
 * MCP-capable AI assistants, and walks them through connecting a client.
 */

import { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { update_option } from 'redux/actions/settings.actions';
import { API, namespace } from 'utils/helper';
import ToggleSwitch from 'components/Settings/ToggleSwitch';
import MCPConnectionConfig from 'components/MCP/MCPConnectionConfig';
import MCPConnectedApps from 'components/MCP/MCPConnectedApps';
import MCPConnectionHealth from 'components/MCP/MCPConnectionHealth';
import { McpIcon, CheckIcon, ChevronIcon } from 'components/MCP/Icons';

// What an agent can touch once connected. Mirrors the tool catalog registered
// in Abilities_Registrar — keep the two in sync.
const CAPABILITIES = [
	__('Create, update & delete short links', 'betterlinks'),
	__('Slugs, target URLs & redirect types', 'betterlinks'),
	__('Categories & tags', 'betterlinks'),
	__('Click analytics & unique visitors', 'betterlinks'),
	__('Per-link performance reports', 'betterlinks'),
	__('Click trends over a date range', 'betterlinks'),
	__('Nofollow, sponsored & parameter forwarding', 'betterlinks'),
	__('Link status & publishing state', 'betterlinks'),
	__('BetterLinks settings', 'betterlinks'),
];

const MCP = (props) => {
	// The live (possibly unsaved) toggle drives the status pill and the connect
	// guide, so both react the moment MCP is switched on.
	const [enableMcp, setEnableMcp] = useState(false);
	const [savedMcp, setSavedMcp] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [notice, setNotice] = useState(null);
	const [showCapabilities, setShowCapabilities] = useState(false);

	const globals = (typeof window !== 'undefined' && window.betterLinksGlobal?.mcp) || {};
	// The tool catalog is the bundled Abilities API. Without it the endpoint
	// answers but offers nothing, so the page has to say so.
	const dependenciesReady = !!globals.abilities_api_available;
	// Decided on the server by Mcp_Access: administrators, plus any role
	// BetterLinks Pro grants MCP. Every MCP route enforces the same rule.
	const canAccess = !!globals.can_access;
	// The on/off switch cuts everyone off, so only administrators can flip it.
	// Everyone else sees its state.
	const isAdmin = !!globals.is_admin;

	const settings = props.settings?.settings;

	// The switch is read and written through its own MCP route, not the Settings
	// endpoint, so a role with MCP but without "Edit settings" can still use it.
	useEffect(() => {
		if (!canAccess) {
			setIsLoading(false);
			return undefined;
		}
		let cancelled = false;
		API.get(`${namespace}mcp/enabled`)
			.then((res) => {
				if (cancelled) return;
				const enabled = !!res?.data?.enabled;
				setEnableMcp(enabled);
				setSavedMcp(enabled);
			})
			.catch(() => {
				if (cancelled) return;
				setNotice({ type: 'error', message: __('Couldn’t load your MCP settings. Reload the page and try again.', 'betterlinks') });
			})
			.finally(() => {
				if (!cancelled) setIsLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [canAccess]);

	// Toggling saves immediately — no separate Save button. Flip optimistically,
	// persist, roll back if the request fails.
	const handleToggle = async () => {
		if (isSaving || !isAdmin) return;
		const next = !enableMcp;
		setEnableMcp(next);
		setIsSaving(true);
		setNotice(null);
		try {
			const res = await API.post(`${namespace}mcp/enabled`, { enabled: next });
			const saved = !!res?.data?.enabled;
			setEnableMcp(saved);
			setSavedMcp(saved);
			// Keep the shared settings store in step for users who loaded it.
			if (settings) {
				props.update_option({ ...settings, enable_mcp: saved });
			}
			setNotice({
				type: 'success',
				message: saved ? __('MCP is on. Connect an AI client below.', 'betterlinks') : __('MCP is off. AI clients can no longer connect.', 'betterlinks'),
			});
		} catch (error) {
			setEnableMcp(savedMcp);
			setNotice({ type: 'error', message: __('Couldn’t save your MCP settings.', 'betterlinks') });
		} finally {
			setIsSaving(false);
		}
	};

	if (!canAccess) {
		return (
			<div className="bl-mcp">
				<div className="bl-mcp__panel">
					<div className="bl-mcp-alert is-warning">
						<span>
							<strong>{__('You don’t have access to MCP.', 'betterlinks')}</strong>{' '}
							{__('Connecting AI assistants is limited to administrators and to roles an administrator has allowed under Settings → Role Management.', 'betterlinks')}
						</span>
					</div>
				</div>
			</div>
		);
	}

	if (isLoading) {
		return <div className="bl-mcp__loading">{__('Loading…', 'betterlinks')}</div>;
	}

	// Status pill: the live toggle plus whether the runtime is actually present.
	let status = { variant: 'neutral', label: __('Off', 'betterlinks') };
	if (enableMcp && dependenciesReady) {
		status = { variant: 'good', label: __('Active', 'betterlinks') };
	} else if (enableMcp && !dependenciesReady) {
		status = { variant: 'warning', label: __('Setup needed', 'betterlinks') };
	}

	return (
		<div className="bl-mcp">
			{notice && (
				<div className={`bl-mcp-alert is-${notice.type}`}>
					<span>{notice.message}</span>
					<button type="button" className="bl-mcp-alert__x" onClick={() => setNotice(null)} aria-label={__('Dismiss', 'betterlinks')}>
						×
					</button>
				</div>
			)}

			<div className="bl-mcp__panel is-flush">
				{/* Hero — the enable toggle sits beside the title. */}
				<div className="bl-mcp__hero">
					<span className="bl-mcp__hero-icon">
						<McpIcon />
					</span>
					<div className="bl-mcp__hero-body">
						<div className="bl-mcp__hero-titlerow">
							<h2 className="bl-mcp__hero-title">{__('AI agent access', 'betterlinks')}</h2>
							<span className={`bl-mcp-badge is-${status.variant}`}>{status.label}</span>
						</div>
						<p className="bl-mcp__hero-desc">
							{__(
								'Open a secure, permission-scoped bridge so assistants like Claude, ChatGPT and Cursor can create and manage your links for you. Access runs through a revocable connection token or a one-time OAuth approval, always tied to the account that approved it. Turn it off and BetterLinks serves no tools — every AI connection is refused.',
								'betterlinks'
							)}
						</p>
					</div>
					<div className="bl-mcp__hero-toggle">
						<label className="bl-mcp__togglelabel" htmlFor="betterlinks-enable-mcp">
							{__('Enable MCP access', 'betterlinks')}
						</label>
						<ToggleSwitch id="betterlinks-enable-mcp" checked={enableMcp} onChange={handleToggle} disabled={isSaving || !isAdmin} ariaLabel={__('Enable MCP access', 'betterlinks')} />
						{isSaving && <span className="bl-mcp__saving">{__('Saving…', 'betterlinks')}</span>}
						{!isAdmin && <span className="bl-mcp__saving">{__('Only administrators can change this.', 'betterlinks')}</span>}
					</div>
				</div>

				{/* Capability overview — collapsed by default. */}
				<div className="bl-mcp__collapse">
					<button type="button" className="bl-mcp__collapse-btn" onClick={() => setShowCapabilities((v) => !v)} aria-expanded={showCapabilities} aria-controls="bl-mcp-capabilities">
						<span>
							<span className="bl-mcp__collapse-title">{__('What a connected agent can do', 'betterlinks')}</span>
							<span className="bl-mcp__collapse-desc">{__('Every action honours the signed-in user’s capabilities and can be reviewed or reverted in BetterLinks.', 'betterlinks')}</span>
						</span>
						<span className="bl-mcp__collapse-chevron">
							<ChevronIcon open={showCapabilities} />
						</span>
					</button>
					{showCapabilities && (
						<ul id="bl-mcp-capabilities" className="bl-mcp__caps">
							{CAPABILITIES.map((item) => (
								<li key={item} className="bl-mcp__cap">
									<span className="bl-mcp__cap-check">
										<CheckIcon />
									</span>
									<span>{item}</span>
								</li>
							))}
						</ul>
					)}
				</div>
			</div>

			{savedMcp && (
				<div className="bl-mcp__panel">
					{!dependenciesReady && (
						<div className="bl-mcp-alert is-warning">
							<span>
								<strong>{__('MCP runtime not loaded.', 'betterlinks')}</strong>{' '}
								{__(
									'The bundled Abilities API could not be loaded, so no tools can be served to AI clients. This usually means the plugin build is incomplete (dependencies/vendor is missing). Reinstall BetterLinks from an official package.',
									'betterlinks'
								)}
							</span>
						</div>
					)}
					<MCPConnectionConfig />
				</div>
			)}

			{savedMcp && dependenciesReady && (
				<div className="bl-mcp__panel">
					<MCPConnectedApps />
				</div>
			)}

			{savedMcp && (
				<div className="bl-mcp__panel">
					<MCPConnectionHealth />
				</div>
			)}
		</div>
	);
};

const mapStateToProps = (state) => ({ settings: state.settings });
const mapDispatchToProps = (dispatch) => bindActionCreators({ update_option }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(MCP);
