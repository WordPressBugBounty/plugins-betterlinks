import { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { fetch_links_data } from 'redux/actions/links.actions';
import { update_option } from 'redux/actions/settings.actions';
import { __ } from '@wordpress/i18n';
import { is_pro_enabled, saveSettingsHandler } from 'utils/helper';
import { useUpgradeProModal } from 'utils/customHooks';
import UpgradeToPro from 'components/Teasers/UpgradeToPro';
import SettingsSidebar from './SettingsSidebar';
import { buildSettingsNav, flattenNav, firstLeafId } from './navModel';
import { MenuIcon } from './Icons';

const SettingsShell = ({
	settings,
	terms,
	postdatas,
	trackingSettings,
	setTrackingSettings,
	autoCreateLinkSettings,
	setAutoCreateLinkSettings,
	query,
	initialActive,
}) => {
	const [isOpenUpgradeToProModal, openUpgradeToProModal, closeUpgradeToProModal] = useUpgradeProModal();
	const [mobileNavOpen, setMobileNavOpen] = useState(false);
	const dispatch = useDispatch();

	const ctx = {
		// Lets panels injected by BetterLinks Pro refresh the free plugin's link list.
		refreshLinks: () => dispatch(fetch_links_data()),
		// Saves the whole settings object (the same path the settings form uses) and
		// drives an optional submit-label setter: `(values, setLabel?) => void`.
		saveSettings: (values, setLabel) => saveSettingsHandler(values, (item) => dispatch(update_option(item)), setLabel),
		settings,
		terms,
		postdatas,
		trackingSettings,
		setTrackingSettings,
		autoCreateLinkSettings,
		setAutoCreateLinkSettings,
		query,
		openUpgradeToProModal,
	};

	// The Pro filter can add/replace/remove items, so rebuild when its inputs change.
	const model = useMemo(() => buildSettingsNav(ctx), [settings, terms, postdatas, trackingSettings, autoCreateLinkSettings]);
	const leafMap = useMemo(() => flattenNav(model), [model]);

	const defaultId = initialActive && leafMap[initialActive] ? initialActive : firstLeafId(model);
	const [activeId, setActiveId] = useState(defaultId);

	const active = leafMap[activeId] || leafMap[firstLeafId(model)];

	// Runtime cross-version guard: if Pro is active but hasn't overridden the
	// License item (still flagged `pro`), it's an outdated Pro that predates the
	// `betterLinksSettingsNav` hook — the free teasers stand in, with a nudge.
	const proOutdated = is_pro_enabled && leafMap.license && leafMap.license.pro === true;

	const select = (id) => {
		setActiveId(id);
		setMobileNavOpen(false);
		if (typeof window !== 'undefined') {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	};

	const activeLabel = active?.label || __('Settings', 'betterlinks');

	return (
		<div className="bl-settings">
			{/* <div className="bl-settings__head">
				<h1 className="bl-settings__title">{__('Settings', 'betterlinks')}</h1>
				<p className="bl-settings__subtitle">{__('Configure how BetterLinks builds, redirects and tracks your links.', 'betterlinks')}</p>
			</div> */}

			<button type="button" className="bl-settings__mobilebar" onClick={() => setMobileNavOpen((v) => !v)}>
				<MenuIcon size={18} />
				{activeLabel}
			</button>

			<SettingsSidebar model={model} activeId={activeId} onSelect={select} isOpen={mobileNavOpen} />

			<div className="bl-settings__content">
				{proOutdated && (
					<div className="bl-set-updatenotice">
						<span>
							{__('Please update', 'betterlinks')} <strong>{__('BetterLinks Pro', 'betterlinks')}</strong>{' '}
							{__('to the latest version to manage License and Role Management here.', 'betterlinks')}
						</span>
					</div>
				)}
				{active && active.render(ctx)}
			</div>

			<UpgradeToPro isOpenModal={isOpenUpgradeToProModal} closeModal={closeUpgradeToProModal} />
		</div>
	);
};

export default SettingsShell;
