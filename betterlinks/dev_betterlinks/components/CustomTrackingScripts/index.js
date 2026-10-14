import { __ } from '@wordpress/i18n';
import { is_pro_enabled } from 'utils/helper';
import CustomTrackingScriptTeaser from './Teaser';

const CustomTrackingScripts = ({ openAccordion, openUpgradeToProModal, __handleToggle, props }) => {
	if (is_pro_enabled && !props?.tracking?.is_enable_custom_scripts) return;
	return (
		<>
			<div className={`link-options link-options--advanced link-options--customize-link-preview ${openAccordion ? 'link-options--open' : ''}`}>
				{!is_pro_enabled ? (
					<CustomTrackingScriptTeaser openUpgradeToProModal={openUpgradeToProModal} />
				) : (
					<>
						<button className="link-options__head" type="button" onClick={() => __handleToggle('customTrackingScripts')}>
							<h4 className="link-options__head--title">{__('Custom Tracking Scripts', 'betterlinks')}</h4>
							<i className="btl btl-angle-arrow-down" />
						</button>
						<div className="link-options__body">{betterLinksHooks.applyFilters('linkOptionsCustomTrackingScripts', null, props)}</div>
					</>
				)}
			</div>
		</>
	);
};

export default CustomTrackingScripts;
