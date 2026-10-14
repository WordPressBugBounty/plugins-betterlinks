import { __ } from '@wordpress/i18n';
import UpgradeToPro from 'components/Teasers/UpgradeToPro';
import { is_pro_enabled, pro_needs_update } from 'utils/helper';
import { useUpgradeProModal } from 'utils/customHooks';
import { bindActionCreators } from 'redux';
import { fetch_tracking_settings } from 'redux/actions/settings.actions';
import { connect } from 'react-redux';
import InputTeaser from './utility/InputTeaser';
import ProUpdateRequired from './ProUpdateRequired';

/**
 * Settings → External Analytics. Implemented in BetterLinks Pro through
 * `BetterLinksTrackingPro` — `(null, ctx) => node`, ctx being the stored tracking
 * settings plus `refreshTrackingSettings()`. Pro saves the settings itself.
 */
const ExternalAnalytics = ({ trackingSettings, fetch_tracking_settings }) => {
	const [isOpenUpgradeToProModal, openUpgradeToProModal, closeUpgradeToProModal] = useUpgradeProModal();
	if (is_pro_enabled && pro_needs_update) {
		// Older Pro expects this plugin to save the form for it.
		return <ProUpdateRequired feature={__('External Analytics', 'betterlinks')} />;
	}
	if (is_pro_enabled) {
		return betterLinksHooks.applyFilters('BetterLinksTrackingPro', null, { ...trackingSettings, refreshTrackingSettings: fetch_tracking_settings });
	}
	return (
		<>
			<UpgradeToPro isOpenModal={isOpenUpgradeToProModal} closeModal={closeUpgradeToProModal} />
			<div className="btl-tab-inner-divider">
				<div className="btl-tracking-settings">
					<div className="btl-external-analytics-container btl-googleanalytics-container teaser">
						<form
							className="form"
							id="googleAnalytics"
							onSubmit={(e) => {
								e.preventDefault();
								openUpgradeToProModal();
							}}
							action="#"
						>
							<div className="btl-role-item btl-form-group" onClick={() => openUpgradeToProModal()}>
								<label className="btl-form-label">{__('Enable Google Analytics', 'betterlinks')}</label>
								<div className="link-options__body">
									<label className="btl-checkbox-field">
										<input type="checkbox" className="btl-check" name="is_enable_ga" disabled />
										<span className="text" />
									</label>
								</div>
							</div>
						</form>
					</div>

					<div className="btl-external-analytics-container btl-fb-pixel-container teaser">
						<form
							className="form"
							id="fbPixel"
							onSubmit={(e) => {
								e.preventDefault();
								openUpgradeToProModal();
							}}
							action="#"
						>
							<div className="btl-role-item btl-form-group" onClick={() => openUpgradeToProModal()}>
								<label className="btl-form-label">{__('Enable Facebook Pixel Tracking', 'betterlinks')}</label>
								<div className="link-options__body">
									<label className="btl-checkbox-field">
										<input type="checkbox" className="btl-check" name="is_enable_pixel" disabled />
										<span className="text" />
									</label>
								</div>
							</div>
						</form>
					</div>
					<InputTeaser title={__('Custom Scripts', 'betterlinks')} onClick={openUpgradeToProModal} />
					<span className="btl-form-group btl-multi-checkbox" style={{ alignItems: 'baseline' }}>
						<label className="btl-form-label">{__('Parameter Tracking', 'betterlinks')}</label>
						<div className="link-options__body" onClick={openUpgradeToProModal}>
							<label className="btl-checkbox-field block">
								<input className="btl-check" type="checkbox" disabled />
								<span className="text">{__('Forwarded Parameters', 'betterlinks')}</span>
							</label>
							<label className="btl-checkbox-field block">
								<input className="btl-check" type="checkbox" disabled />
								<span className="text">{__('Target URL Parameters', 'betterlinks')}</span>
							</label>
							<label className="btl-checkbox-field block">
								<input className="btl-check" type="checkbox" disabled />
								<span className="text">{__('UTM Parameters', 'betterlinks')}</span>
							</label>
						</div>
					</span>
				</div>
			</div>
		</>
	);
};

const mapDispatchToProps = (dispatch) => {
	return {
		fetch_tracking_settings: bindActionCreators(fetch_tracking_settings, dispatch),
	};
};

export default connect(null, mapDispatchToProps)(ExternalAnalytics);
