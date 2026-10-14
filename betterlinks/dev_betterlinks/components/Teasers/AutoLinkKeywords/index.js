import { __ } from '@wordpress/i18n';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { update_option } from 'redux/actions/settings.actions';
import { useUpgradeProModal } from 'utils/customHooks';
import { is_pro_enabled, pro_version_check, saveSettingsHandler } from 'utils/helper';
import UpgradeToPro from '../UpgradeToPro';
import CheckList from '../utility/CheckList';
import SelectTeaser from '../utility/SelectTeaser';
import InputTeaser from '../utility/InputTeaser';
import CompatibilityNotice from '../CompatibilityNotice';

const AutoLinkKeywords = ({ settings, postdatas, update_option }) => {
	return betterLinksHooks.applyFilters('BetterLinksAutoLinkKeywords', <Teaser />, { settings, postdatas, update_option, saveSettingsHandler });
};

const mapDispatchToProps = (dispatch) => {
	return {
		update_option: bindActionCreators(update_option, dispatch),
	};
};
export default connect(null, mapDispatchToProps)(AutoLinkKeywords);

const Teaser = () => {
	const [isOpenUpgradeToProModal, openUpgradeToProModal, closeUpgradeToProModal] = useUpgradeProModal();
	return (
		<>
			<UpgradeToPro isOpenModal={isOpenUpgradeToProModal} closeModal={closeUpgradeToProModal} />
			<CompatibilityNotice
				notice={__('To Utilize the Auto-Link Keywords Feature, kindly ensure that you have at least BetterLinks Pro v2.0.2 installed & activated', 'betterlinks')}
				compatibleProVersion="2.0.2"
			/>
			{/* Note for presets  */}
			<div className="btl-form-group">
				<div className="btl-form-field">
					<div className="short-description">
						<b style={{ fontWeight: 700 }}>{__('Note: ', 'betterlinks-pro')}</b>
						<span>{__('The following settings will work as a preset for your new keyword added afterward', 'betterlinks-pro')}</span>
					</div>
				</div>
			</div>
			<span className="btl-form-group btl-form-group--teaser btl-form-group-autolink-keyword-icon">
				<label className="btl-form-label">{__('Disable Auto-Link Keywords', 'betterlinks')}</label>
				<div className="link-options__body">
					<label className="btl-checkbox-field block" onClick={openUpgradeToProModal}>
						<input className="btl-check" name="disable_autolink" type="checkbox" disabled={true} />
						<span className="text" />
					</label>
				</div>
			</span>
			<span className="btl-form-group">
				<label className="btl-form-label">{__('HTML Options', 'betterlinks')}</label>
				<div className="link-options__body">
					<label className="btl-checkbox-field block" onClick={openUpgradeToProModal}>
						<input type="checkbox" disabled className="btl-check" />
						<span className="text">{__('Open New Tab', 'betterlinks')}</span>
					</label>
					<label className="btl-checkbox-field block" onClick={openUpgradeToProModal}>
						<input type="checkbox" disabled className="btl-check" />
						<span className="text">{__('No Follow', 'betterlinks')}</span>
					</label>
					<label className="btl-checkbox-field block" onClick={openUpgradeToProModal}>
						<input type="checkbox" disabled className="btl-check" />
						<span className="text">{__('Case Sensitive', 'betterlinks')}</span>
					</label>
					<label className="btl-checkbox-field block" onClick={openUpgradeToProModal}>
						<input type="checkbox" disabled className="btl-check" />
						<span className="text">{__('Activate', 'betterlinks')}</span>
					</label>
				</div>
			</span>
			<SelectTeaser title={__('Left Boundary', 'betterlinks')} onClick={openUpgradeToProModal} defaultValue={{ value: '', label: __('None', 'betterlinks') }} />
			<InputTeaser title={__('Keyword Before', 'betterlinks')} onClick={openUpgradeToProModal} />
			<SelectTeaser title={__('Right Boundary', 'betterlinks')} onClick={openUpgradeToProModal} defaultValue={{ value: '', label: __('None', 'betterlinks') }} />
			<InputTeaser title={__('Keyword After', 'betterlinks')} onClick={openUpgradeToProModal} />
			<InputTeaser title={__('Limit', 'betterlinks')} onClick={openUpgradeToProModal} />
			<SelectTeaser
				title={__('Default Post Types', 'betterlinks')}
				onClick={openUpgradeToProModal}
				isMulti={true}
				defaultValue={[{ value: '', label: __('Post', 'betterlinks') }]}
			/>
			<SelectTeaser
				title={__('Post Category', 'betterlinks')}
				onClick={openUpgradeToProModal}
				isMulti={true}
				defaultValue={[{ value: '', label: __('Uncategorized', 'betterlinks') }]}
			/>
			<SelectTeaser title={__('Post Tags', 'betterlinks')} onClick={openUpgradeToProModal} />
			<hr className="btl-settings-devider" style={{ marginTop: '20px' }} />
			<span className="btl-form-group btl-form-group--teaser btl-form-group-autolink-keyword-icon">
				<label className="btl-form-label">{__('Auto-Linked Keywords Icon', 'betterlinks')}</label>
				<div className="link-options__body">
					<label className="btl-checkbox-field block" onClick={openUpgradeToProModal}>
						<input className="btl-check" name="is_autolink_icon" type="checkbox" disabled={true} />
						<span className="text" />
					</label>
				</div>
			</span>

			<span className="btl-form-group btl-form-group--teaser btl-form-group-autolink-keyword-icon">
				<label className="btl-form-label">
					{__('Auto-Link Keywords inside', 'betterlinks-pro')}
					<span style={{ display: 'block' }}>{__('Headings', 'betterlinks-pro')}</span>
				</label>
				<div className="link-options__body">
					<label className="btl-checkbox-field block" onClick={openUpgradeToProModal}>
						<input className="btl-check" name="is_autolink_headings" type="checkbox" disabled={true} />
						<span className="text" />
					</label>
				</div>
			</span>
			<SelectTeaser
				title={
					<>
						{__('Disable Auto-link keywords', 'betterlinks')}
						<span style={{ display: 'block' }}>{__('for Post Types', 'betterlinks')}</span>
					</>
				}
				onClick={openUpgradeToProModal}
				isMulti={true}
				defaultValue={[{ value: '', label: __('Page', 'betterlinks') }]}
			/>
		</>
	);
};
