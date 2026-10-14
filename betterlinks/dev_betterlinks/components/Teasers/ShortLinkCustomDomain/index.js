import { useUpgradeProModal } from 'utils/customHooks';
import UpgradeToPro from '../UpgradeToPro';
import { UpgradeToProSpecial } from '../UpgradeToProSpecial';
import { Field, Form, Formik } from 'formik';
import { is_pro_enabled, pro_version_check, saveSettingsHandler, site_url } from 'utils/helper';
import { update_option } from 'redux/actions/settings.actions';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { isURL } from '@wordpress/url';
import ClipLoader from 'react-spinners/ClipLoader';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import CodeSnippet from './CodeSnippet';
import CopyField from './CopyField';
// Passed through the `BetterLinksCustomDomain` filter for older Pro builds, whose
// Custom Domain screen renders a `CodeBlock` supplied by the free plugin. Unused
// by the redesigned free teaser itself (see CodeBlock.js).
import CodeBlock from './CodeBlock';
import { AlertIcon, ArrowRightIcon, BoltIcon, ExternalIcon, GlobeIcon, InfoIcon, LockIcon, SaveIcon, ServerIcon, WordPressIcon } from './Icons';

const DOCS = 'https://betterlinks.io/docs/configure-custom-domain/';
const DOCS_DNS = 'https://betterlinks.io/docs/configure-custom-domain/#1-toc-title';

const ShortLinkCustomDomain = (props) => {
	const { update_option } = props;
	const [formSubmitText, setFormSubmitText] = useState(__('Save Settings', 'betterlinks'));
	const { settings } = props.settings;
	return (
		<Formik
			enableReinitialize
			initialValues={{ ...settings, server_type: 'apache' }}
			onSubmit={(values, { setFieldError }) => {
				const result = betterLinksHooks.applyFilters('BetterLinksCustomDomainSettings', false, { values, setFieldError, isURL });
				if (!result) {
					window.scrollTo(0, 250);
					return;
				}
				saveSettingsHandler(values, update_option, setFormSubmitText);
			}}
		>
			{(props) => (
				<Form>
					{betterLinksHooks.applyFilters('BetterLinksCustomDomain', <TeaserContent />, {
						...props,
						ClipLoader,
						CodeBlock,
						formSubmitText,
						...{ Tab, Tabs, TabList, TabPanel, Field },
					})}
				</Form>
			)}
		</Formik>
	);
};
const mapStateToProps = (state) => ({
	settings: state.settings,
});
const mapDispatchToProps = (dispatch) => {
	return {
		update_option: bindActionCreators(update_option, dispatch),
	};
};

export default connect(mapStateToProps, mapDispatchToProps)(ShortLinkCustomDomain);

// staging.betterlinks.io -> betterlinks.io; example.com -> go.example.com
const suggestBrandedHost = (host) => {
	const parts = (host || '').split('.');
	return parts.length > 2 ? parts.slice(1).join('.') : `go.${host}`;
};

// Static preview of a single stepper node — mirrors the Pro `Step` component
// but with no live state (the teaser only ever renders the "active" look).
const Step = ({ index, title, description, children }) => (
	<div className="bl-cd__step is-active">
		<div className="bl-cd__step-rail">
			<span className="bl-cd__step-marker">{index}</span>
		</div>
		<div className="bl-cd__step-main">
			<div className="bl-cd__step-head">
				<div>
					<h4 className="bl-cd__step-title">{title}</h4>
					<p className="bl-cd__step-desc">{description}</p>
				</div>
			</div>
			<div className="bl-cd__step-body">{children}</div>
		</div>
	</div>
);

// Free teaser: a static, locked preview of the redesigned Pro Custom Domain
// screen. Every affordance funnels to the upgrade modal; the whole panel sits
// under the shared UpgradeToProSpecial overlay + UpgradeToPro modal.
const TeaserContent = () => {
	const [isOpenUpgradeToProModal, openUpgradeToProModal, closeUpgradeToProModal] = useUpgradeProModal();
	const isProUpdated = pro_version_check('2.0.0');

	// Sample data derived from the real site so the preview feels tailored.
	let siteHost = 'yoursite.com';
	try {
		siteHost = new URL(site_url).host;
	} catch (e) {
		// site_url may be relative in odd setups — fall back to the placeholder.
	}
	const brandedHost = suggestBrandedHost(siteHost);
	const siteIp = '192.0.2.10';

	const apacheLines = [
		'RewriteEngine On',
		`RewriteCond %{HTTP_HOST} ^${brandedHost}$ [OR]`,
		`RewriteCond %{HTTP_HOST} ^www.${brandedHost}$`,
		`RewriteRule (.*)$ ${siteHost}/$1 [R=301,L]`,
	];

	const onLocked = openUpgradeToProModal;

	return (
		<div className="bl-cd-teaser">
			<UpgradeToPro isOpenModal={isOpenUpgradeToProModal} closeModal={closeUpgradeToProModal} />

			{is_pro_enabled && !isProUpdated && (
				<div className="bl-cd__update-note">
					<InfoIcon size={16} />
					<span>
						{__('The redesigned Custom Domain is available in', 'betterlinks')} <strong>{__('BetterLinks Pro v2.0.0 and later', 'betterlinks')}</strong>.{' '}
						{__('Update to the latest version to use this feature.', 'betterlinks')}
					</span>
				</div>
			)}

			<div style={{ position: 'relative' }}>
				<UpgradeToProSpecial
					description={__(
						'Serve your short links from your own branded domain — pointed with a single A record and a server-side 301 redirect to WordPress.',
						'betterlinks'
					)}
				>
					<ul className="bl-cd__sell">
						<li>
							<GlobeIcon size={18} />
							{__('Replace the default site host with your own branded domain', 'betterlinks')}
						</li>
						<li>
							<ServerIcon size={18} />
							{__('Guided setup with copy-ready A record & Apache/Nginx rules', 'betterlinks')}
						</li>
						<li>
							<BoltIcon size={18} />
							{__('One-click connection check to verify your domain is pointed', 'betterlinks')}
						</li>
					</ul>
				</UpgradeToProSpecial>

				<div className="bl-cd bl-cd--teaser-locked" aria-hidden="true">
					<div className="bl-cd__header">
						<div className="bl-cd__header-text">
							<h2 className="bl-cd__title">
								{__('Custom Domain', 'betterlinks')}
								<span className="bl-cd__pro">
									<LockIcon size={12} />
									{__('PRO', 'betterlinks')}
								</span>
							</h2>
							<p className="bl-cd__subtitle">
								{__(
									'Serve your short links from your own branded domain — pointed with a single A record and a server-side redirect to WordPress.',
									'betterlinks'
								)}
							</p>
						</div>
						<a className="bl-cd__guide" href={DOCS} target="_blank" rel="noreferrer">
							<ExternalIcon size={16} />
							{__('Setup guide', 'betterlinks')}
						</a>
					</div>

					{/* Status card — the branded domain and its redirect flow */}
					<div className="bl-cd__status">
						<div className="bl-cd__status-head">
							<span className="bl-cd__status-badge">
								<GlobeIcon size={22} />
							</span>
							<div className="bl-cd__status-text">
								<strong className="bl-cd__status-domain">{brandedHost}</strong>
								<span className="bl-cd__status-note">
									<AlertIcon size={14} />
									{__('This domain is not pointed to this WordPress installation yet.', 'betterlinks')}
								</span>
							</div>
							<span className="bl-cd__chip bl-cd__chip--warn">
								<i className="bl-cd__dot" />
								{__('Not pointed yet', 'betterlinks')}
							</span>
						</div>
						<div className="bl-cd__flow">
							<span className="bl-cd__flow-node">
								<i className="bl-cd__flow-icon">
									<GlobeIcon size={16} />
								</i>
								<code>{brandedHost}</code>
							</span>
							<span className="bl-cd__flow-arrow">
								<ArrowRightIcon size={16} />
								<em>301</em>
							</span>
							<span className="bl-cd__flow-node">
								<i className="bl-cd__flow-icon">
									<WordPressIcon size={16} />
								</i>
								{__('WordPress', 'betterlinks')}
							</span>
						</div>
					</div>

					{/* Three-step guided setup */}
					<div className="bl-cd__steps">
						<Step
							index={1}
							title={__('Enter your custom domain', 'betterlinks')}
							description={__('The branded domain your short links will be served from.', 'betterlinks')}
						>
							<div className="bl-cd__domain">
								<div className="bl-cd__domain-input">
									<span className="bl-cd__domain-scheme">https://</span>
									<input
										type="text"
										value={brandedHost}
										placeholder={__('example.com', 'betterlinks')}
										onClick={onLocked}
										readOnly
										autoComplete="off"
										spellCheck="false"
									/>
								</div>
								<button type="button" className="bl-cd__btn bl-cd__btn--primary" onClick={onLocked}>
									<BoltIcon size={16} />
									{__('Verify', 'betterlinks')}
								</button>
							</div>
							<p className="bl-cd__note">
								<InfoIcon size={14} />
								<span>
									{__('Enter a root domain (', 'betterlinks')}
									<strong>{brandedHost}</strong>
									{__(') or a subdomain (', 'betterlinks')}
									<strong>{`go.${brandedHost}`}</strong>
									{__('). You can change it any time before verifying.', 'betterlinks')}
								</span>
							</p>
						</Step>

						<Step
							index={2}
							title={__('Add the A record to your DNS', 'betterlinks')}
							description={
								<>
									{__('At your domain provider, add this A record so your domain points to this server.', 'betterlinks')}{' '}
									<a href={DOCS_DNS} target="_blank" rel="noreferrer">
										{__('Learn more', 'betterlinks')}
									</a>
								</>
							}
						>
							<div className="bl-cd__record">
								<div className="bl-cd__record-row">
									<span className="bl-cd__record-label">{__('Record type', 'betterlinks')}</span>
									<span className="bl-cd__record-type">{__('A', 'betterlinks')}</span>
								</div>
								<div className="bl-cd__record-row">
									<span className="bl-cd__record-label">
										{__('Host', 'betterlinks')}
										<em>{__('Use @ for root domain', 'betterlinks')}</em>
									</span>
									<CopyField value={brandedHost} onLocked={onLocked} />
								</div>
								<div className="bl-cd__record-row">
									<span className="bl-cd__record-label">{__('Value', 'betterlinks')}</span>
									<CopyField value={siteIp} onLocked={onLocked} />
								</div>
							</div>
							<p className="bl-cd__note">
								<InfoIcon size={14} />
								<span>
									{__('DNS changes can take up to', 'betterlinks')} <strong>{__('72 hours', 'betterlinks')}</strong>{' '}
									{__('to propagate, though it\'s usually much faster. Then add the redirect rule below to point traffic to WordPress.', 'betterlinks')}
								</span>
							</p>
						</Step>

						<Step
							index={3}
							title={__('Add the server redirect rule', 'betterlinks')}
							description={__(
								'Place this rewrite rule at the top of your server config to 301-redirect your domain to this WordPress install.',
								'betterlinks'
							)}
						>
							<div className="bl-cd__server">
								<div className="bl-cd__seg" role="group" aria-label={__('Server type', 'betterlinks')}>
									<button type="button" className="bl-cd__seg-btn is-active" onClick={onLocked} aria-pressed="true">
										<ServerIcon size={15} />
										{__('Apache', 'betterlinks')}
									</button>
									<button type="button" className="bl-cd__seg-btn" onClick={onLocked} aria-pressed="false">
										<ServerIcon size={15} />
										{__('Nginx', 'betterlinks')}
									</button>
								</div>
								<span className="bl-cd__server-file">.htaccess</span>
							</div>

							<CodeSnippet lines={apacheLines} label=".htaccess" onLocked={onLocked} />

							<p className="bl-cd__note">
								<InfoIcon size={14} />
								<span>{__('Add this at the beginning of the .htaccess file in your site\'s root directory.', 'betterlinks')}</span>
							</p>
						</Step>
					</div>

					<div className="bl-cd__footer">
						<div className="bl-cd__footer-left">
							<button type="button" className="bl-cd__btn bl-cd__btn--primary" onClick={onLocked}>
								<SaveIcon size={16} />
								{__('Save Settings', 'betterlinks')}
							</button>
							<button type="button" className="bl-cd__btn bl-cd__btn--ghost" onClick={onLocked}>
								<BoltIcon size={16} />
								{__('Verify connection', 'betterlinks')}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
