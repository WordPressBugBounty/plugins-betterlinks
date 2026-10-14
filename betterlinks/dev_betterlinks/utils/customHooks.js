import { __ } from '@wordpress/i18n';
import { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';

export const useBtlExpireStatusDot = ({ data = {}, view = 'dnd' }) => {
	return (
		<>
			{!!betterLinksHooks.applyFilters('isActivePro', false) && (
				<>
					<div className="dnd-link-button btl-tooltip btl-expire-status-dot-parent c-default">
						{data.link_status == 'broken' ? (
							<span className="icon error">
								<i className="btl btl-unlink" />
							</span>
						) : (
							<span className={`btl-expire-status-dot ${data.link_status || 'publish'} ${view == 'dnd' ? 'dnd-view-expire-dot-layout' : 'list-view-expire-dot-layout'} `} />
						)}
						<span className="btl-tooltiptext">{__(`${!data.link_status || data.link_status == 'publish' ? 'active' : data.link_status}`, 'betterlinks')}</span>
					</div>
				</>
			)}
		</>
	);
};

export const useUpgradeProModal = (value = false) => {
	const [isOpenUpgradeToProModal, setUpgradeToProModal] = useState(value);
	const openUpgradeToProModal = () => setUpgradeToProModal(true);
	const closeUpgradeToProModal = () => setUpgradeToProModal(false);

	return [isOpenUpgradeToProModal, openUpgradeToProModal, closeUpgradeToProModal];
};
// usage
// const [isOpenUpgradeToProModal, openUpgradeToProModal, closeUpgradeToProModal] = useUpgradeProModal();

/**
 * Custom hook to check if all settings data has been prefetched
 * Returns an object with loading state and all settings data
 * 
 * @returns  {Object} - Settings loading state and data
 * @property {boolean} isLoading - True if data is still being prefetched
 * @property {boolean} isPrefetched - True if prefetch is complete
 * @property {Object} settings - General settings data
 * @property {Object} tracking - Tracking settings data
 * @property {Array} terms - Terms data
 * @property {Object} postdatas - Post types data
 * @property {Object} autoCreateLinkSettings - Auto create link settings (Pro)
 */
export const useSettingsData = () => {
	const settingsState = useSelector((state) => state.settings);
	const terms = useSelector((state) => state.terms);
	const postdatas = useSelector((state) => state.postdatas);

	const isLoading = settingsState?.isPrefetching || false;
	const isPrefetched = settingsState?.isPrefetched || false;
	
	// Check if all required data is available
	const hasAllData = !!(
		settingsState?.settings &&
		terms?.terms &&
		postdatas?.fetchedAll
	);

	return {
		isLoading,
		isPrefetched,
		hasAllData,
		settings: settingsState?.settings || null,
		tracking: settingsState?.tracking || null,
		terms: terms?.terms || null,
		postdatas: postdatas || {},
		autoCreateLinkSettings: settingsState?.autoCreateLinkSettings || null,
	};
};

/**
 * Custom hook to get auto create link settings from Redux store
 * with update function
 * 
 * @returns {Array} - [autoCreateLinkSettings, setAutoCreateLinkSettings]
 */
export const useAutoCreateLinkSettings = () => {
	const autoCreateLinkSettings = useSelector((state) => state.settings?.autoCreateLinkSettings) || {};
	
	return autoCreateLinkSettings;
};
