import { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { update_option } from 'redux/actions/settings.actions';
import { is_fbs_enabled, is_pro_enabled, pro_version_check, saveSettingsHandler } from 'utils/helper';
import ProBadge from 'components/Badge/ProBadge';
import ToggleSwitch from '../ToggleSwitch';
import { ChevronIcon } from '../Icons';

import CustomFields from 'containers/CustomFields';
import CreateLinkExternally from 'components/CreateLinkExternally';
import FluentBoardSettings from 'components/FluentBoardSettings';
import PasswordProtection from 'components/Teasers/PasswordProtection';
import BioLinksSettings from 'components/BioLinksSettings';

// Compact inline icons for the module cards.
const I = (d) => (props) => (
	<svg viewBox="0 0 24 24" width={props?.size || 22} height={props?.size || 22} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		{d}
	</svg>
);
const QrIcon = I(<><rect x="3.5" y="3.5" width="7" height="7" rx="1" /><rect x="13.5" y="3.5" width="7" height="7" rx="1" /><rect x="3.5" y="13.5" width="7" height="7" rx="1" /><path d="M13.5 13.5h3v3M20.5 20.5h.01M17 20.5h.01M20.5 17h.01" /></>);
const FieldsIcon = I(<><rect x="3.5" y="5" width="17" height="5" rx="1.5" /><rect x="3.5" y="14" width="11" height="5" rx="1.5" /></>);
const PlusIcon = I(<><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></>);
const BoardIcon = I(<><rect x="3.5" y="3.5" width="17" height="17" rx="2" /><path d="M9 4v16M15 4v10" /></>);
const ShieldIcon = I(<><path d="M12 3 20 6v5.5c0 4.6-3.3 8.2-8 9.5-4.7-1.3-8-4.9-8-9.5V6l8-3Z" /><path d="m8.75 12 2 2 4.5-4.5" /></>);
const EyeIcon = I(<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>);
const GlobeIcon = I(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18Z" /></>);
const CardIcon = I(<><rect x="3" y="4.5" width="18" height="15" rx="2" /><path d="M3 10h18M7.5 14h5" /></>);
const BioIcon = I(<><rect x="6" y="2.5" width="12" height="19" rx="3" /><circle cx="12" cy="8" r="2" /><path d="M9 13h6M9 16.5h6" /></>);
const ScanIcon = I(<><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" /><path d="M4 12h16" /></>);

const ModuleCard = ({ icon: Icon, title, desc, badge, footState, action }) => (
	<div className={`bl-module-card${action?.locked ? ' is-locked' : ''}`} onClick={action?.locked ? action.onClick : undefined}>
		<div className="bl-module-card__head">
			<span className="bl-module-card__icon">
				<Icon />
			</span>
			{action?.toggle ? (
				<ToggleSwitch checked={action.toggle.checked} onChange={action.toggle.onChange} ariaLabel={title} />
			) : (
				badge
			)}
		</div>
		<h3 className="bl-module-card__title">{title}</h3>
		<p className="bl-module-card__desc">{desc}</p>
		<div className="bl-module-card__foot">
			<span className={`bl-module-card__state${footState?.on ? ' is-on' : ''}`}>{footState?.label}</span>
			{action?.onConfigure && (
				<button type="button" className="bl-module-card__link" onClick={action.onConfigure}>
					{__('Configure', 'betterlinks')}
					<ChevronIcon size={14} />
				</button>
			)}
			{action?.locked && (
				<button type="button" className="bl-module-card__link" onClick={action.onClick}>
					{__('Unlock', 'betterlinks')}
					<ChevronIcon size={14} />
				</button>
			)}
		</div>
	</div>
);

const FeatureModules = ({ settings, terms, openUpgradeToProModal, update_option }) => {
	const [detail, setDetail] = useState(null);
	const [qrOn, setQrOn] = useState(!!settings?.is_allow_qr);
	// Absent on installs predating the key, which counts as enabled.
	const [promoCardsOn, setPromoCardsOn] = useState(settings?.enable_promo_cards !== false);
	const [bioLinksOn, setBioLinksOn] = useState(settings?.enable_bio_links !== false);
	const [metaPreviewOn, setMetaPreviewOn] = useState(!!settings?.enable_customize_meta_tags);
	const [, setSavingText] = useState('');

	// Customize Link Preview shipped in Pro 1.8.0; older Pro builds can't act on
	// the setting, so the card explains that instead of offering a dead toggle.
	const metaPreviewSupported = pro_version_check('1.8.0');

	// QR is a real setting — persist the whole settings object on toggle.
	const toggleQr = () => {
		const next = !qrOn;
		setQrOn(next);
		saveSettingsHandler({ ...settings, is_allow_qr: next }, update_option, setSavingText);
	};

	// Single on/off — the whole feature is one flag, so it lives on the card
	// rather than behind a Configure panel.
	const toggleMetaPreview = () => {
		const next = !metaPreviewOn;
		setMetaPreviewOn(next);
		saveSettingsHandler({ ...settings, enable_customize_meta_tags: next }, update_option, setSavingText);
	};

	// Hides the "Promo Cards" submenu. Pro-only: for free users the screen is the
	// upgrade teaser, so it stays visible and the card is a locked upsell instead.
	const togglePromoCards = () => {
		const next = !promoCardsOn;
		setPromoCardsOn(next);
		saveSettingsHandler({ ...settings, enable_promo_cards: next }, update_option, setSavingText);
	};

	// Hides the "Bio Links" submenu. Pro-only for the same reason as Promo Cards:
	// in free that screen is the upgrade teaser, so it must stay reachable.
	const toggleBioLinks = () => {
		const next = !bioLinksOn;
		setBioLinksOn(next);
		saveSettingsHandler({ ...settings, enable_bio_links: next }, update_option, setSavingText);
	};

	// Panels reachable via "Configure". Pro-only ones render their teaser in free
	// and self-swap to the real Pro settings via their internal filters.
	const panels = {
		'custom-fields': <CustomFields settings={settings} />,
		'quick-link-creation': <CreateLinkExternally settings={settings} terms={terms} />,
		'fluent-boards': <FluentBoardSettings settings={settings} terms={terms} />,
		password: <PasswordProtection settings={settings} />,
		'bio-links': <BioLinksSettings settings={settings} />,
	};

	// Titles for the detail view so each module page has ONE main heading
	// (anything the panel renders internally is demoted to a subsection).
	const panelTitles = {
		'custom-fields': __('Custom Fields', 'betterlinks'),
		'quick-link-creation': __('Quick Link Creation', 'betterlinks'),
		'fluent-boards': __('Fluent Boards', 'betterlinks'),
		password: __('Password Protection', 'betterlinks'),
		'bio-links': __('Bio Links', 'betterlinks'),
	};

	if (detail && panels[detail]) {
		return (
			<div className="bl-settings__panel">
				<button type="button" className="bl-module-back" onClick={() => setDetail(null)}>
					<ChevronIcon size={16} style={{ transform: 'rotate(180deg)' }} />
					{__('Back to Feature Modules', 'betterlinks')}
				</button>
				<div className="bl-settings__panel-head">
					<h2 className="bl-settings__panel-title">{panelTitles[detail]}</h2>
				</div>
				{panels[detail]}
			</div>
		);
	}

	const open = (id) => () => setDetail(id);

	return (
		<div className="bl-settings__panel">
			<div className="bl-settings__panel-head">
				<h2 className="bl-settings__panel-title">{__('Feature Modules', 'betterlinks')}</h2>
				<p className="bl-settings__panel-desc">{__('Turn optional BetterLinks features on or off and manage their settings.', 'betterlinks')}</p>
			</div>

			<div className="bl-module-grid">
				{is_pro_enabled ? (
					<ModuleCard
						icon={CardIcon}
						title={__('Promo Cards', 'betterlinks')}
						desc={__('Show affiliate links as conversion-focused product cards.', 'betterlinks')}
						footState={{ on: promoCardsOn, label: promoCardsOn ? __('Enabled', 'betterlinks') : __('Disabled', 'betterlinks') }}
						action={{ toggle: { checked: promoCardsOn, onChange: togglePromoCards } }}
					/>
				) : (
					<ModuleCard
						icon={CardIcon}
						title={__('Promo Cards', 'betterlinks')}
						desc={__('Show affiliate links as conversion-focused product cards.', 'betterlinks')}
						badge={<ProBadge />}
						footState={{ label: __('Pro', 'betterlinks') }}
						action={{ locked: true, onClick: openUpgradeToProModal }}
					/>
				)}
				{is_pro_enabled ? (
					<ModuleCard
						icon={BioIcon}
						title={__('Bio Links', 'betterlinks')}
						desc={__('Share every important link from one branded page.', 'betterlinks')}
						footState={{ on: bioLinksOn, label: bioLinksOn ? __('Enabled', 'betterlinks') : __('Disabled', 'betterlinks') }}
						action={{ toggle: { checked: bioLinksOn, onChange: toggleBioLinks }, onConfigure: open('bio-links') }}
					/>
				) : (
					<ModuleCard
						icon={BioIcon}
						title={__('Bio Links', 'betterlinks')}
						desc={__('Share every important link from one branded page.', 'betterlinks')}
						badge={<ProBadge />}
						footState={{ label: __('Pro', 'betterlinks') }}
						action={{ locked: true, onClick: openUpgradeToProModal }}
					/>
				)}
				<ModuleCard
					icon={QrIcon}
					title={__('QR Code Generator', 'betterlinks')}
					desc={__('Generate & download a QR code for every short link.', 'betterlinks')}
					footState={{ on: qrOn, label: qrOn ? __('Enabled', 'betterlinks') : __('Disabled', 'betterlinks') }}
					action={{ toggle: { checked: qrOn, onChange: toggleQr } }}
				/>
				{/* One flag (`enable_customize_meta_tags`), so it toggles in place
				    like QR Code Generator instead of opening a Configure panel. */}
				{!is_pro_enabled ? (
					<ModuleCard
						icon={EyeIcon}
						title={__('Customize Link Preview', 'betterlinks')}
						desc={__('Control the meta preview for shared links.', 'betterlinks')}
						badge={<ProBadge />}
						footState={{ label: __('Pro', 'betterlinks') }}
						action={{ locked: true, onClick: openUpgradeToProModal }}
					/>
				) : metaPreviewSupported ? (
					<ModuleCard
						icon={EyeIcon}
						title={__('Customize Link Preview', 'betterlinks')}
						desc={__('Control the meta preview for shared links.', 'betterlinks')}
						footState={{ on: metaPreviewOn, label: metaPreviewOn ? __('Enabled', 'betterlinks') : __('Disabled', 'betterlinks') }}
						action={{ toggle: { checked: metaPreviewOn, onChange: toggleMetaPreview } }}
					/>
				) : (
					<ModuleCard
						icon={EyeIcon}
						title={__('Customize Link Preview', 'betterlinks')}
						desc={__('Update BetterLinks Pro to v1.8.0 or later to use this feature.', 'betterlinks')}
						badge={<ProBadge />}
						footState={{ label: __('Update required', 'betterlinks') }}
					/>
				)}
				<ModuleCard
					icon={FieldsIcon}
					title={__('Custom Fields', 'betterlinks')}
					desc={__('Add your own metadata fields to links.', 'betterlinks')}
					footState={{ label: __('Free', 'betterlinks') }}
					action={{ onConfigure: open('custom-fields') }}
				/>

				<ModuleCard
					icon={PlusIcon}
					title={__('Quick Link Creation', 'betterlinks')}
					desc={__('Create short links from outside the dashboard.', 'betterlinks')}
					footState={{ label: __('Free', 'betterlinks') }}
					action={{ onConfigure: open('quick-link-creation') }}
				/>

				{is_fbs_enabled && (
					<ModuleCard
						icon={BoardIcon}
						title={__('Fluent Boards', 'betterlinks')}
						desc={__('Integrate BetterLinks with Fluent Boards.', 'betterlinks')}
						footState={{ label: __('Free', 'betterlinks') }}
						action={{ onConfigure: open('fluent-boards') }}
					/>
				)}

				<ModuleCard
					icon={ShieldIcon}
					title={__('Password Protection', 'betterlinks')}
					desc={__('Gate short links behind a password.', 'betterlinks')}
					badge={<ProBadge />}
					footState={{ label: is_pro_enabled ? __('Manage', 'betterlinks') : __('Pro', 'betterlinks') }}
					action={{ onConfigure: open('password') }}
				/>

				

				{/* Custom Domain & Link Scanner have their own top-level menus in Pro;
				    here they're upgrade teasers for free users only. */}
				{!is_pro_enabled && (
					<>
						<ModuleCard
							icon={GlobeIcon}
							title={__('Custom Domain', 'betterlinks')}
							desc={__('Serve links from your own branded domain.', 'betterlinks')}
							badge={<ProBadge />}
							footState={{ label: __('Pro', 'betterlinks') }}
							action={{ locked: true, onClick: openUpgradeToProModal }}
						/>
						<ModuleCard
							icon={ScanIcon}
							title={__('Full-Site Link Scanner', 'betterlinks')}
							desc={__('Scan your whole site for broken links.', 'betterlinks')}
							badge={<ProBadge />}
							footState={{ label: __('Pro', 'betterlinks') }}
							action={{ locked: true, onClick: openUpgradeToProModal }}
						/>
					</>
				)}
			</div>
		</div>
	);
};

const mapDispatchToProps = (dispatch) => ({ update_option: bindActionCreators(update_option, dispatch) });

export default connect(null, mapDispatchToProps)(FeatureModules);
