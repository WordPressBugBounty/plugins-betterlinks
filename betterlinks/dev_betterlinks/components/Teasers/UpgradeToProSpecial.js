import { __ } from '@wordpress/i18n';
import { ReactComponent as Locked } from '../../../assets/images/lock-round.svg';
import { is_pro_enabled, plugin_root_url } from 'utils/helper';

export const UpgradeToProSpecial = ({ title = null, description = '', children }) => {
	if (is_pro_enabled) return null;
	return (
		<div className="btl-analytics-chart-overlay btl-pro-teaser" style={{ zIndex: '10' }}>
			<div className="btl-pro-teaser__card">
				<span className="btl-pro-teaser__pill">
					<Locked />
					{__('PRO Feature', 'betterlinks')}
				</span>

				<h5 className="btl-pro-teaser__title">{title || __('Unlock with BetterLinks PRO', 'betterlinks')}</h5>

				{description && <p className="btl-pro-teaser__desc">{description}</p>}

				{children && <div className="btl-pro-teaser__features">{children}</div>}

				<a
					className="btl-pro-teaser__cta"
					href="https://wpdeveloper.com/in/upgrade-betterlinks"
					target="_blank"
					rel="noopener noreferrer"
				>
					<img src={plugin_root_url + '/assets/images/crown.svg'} alt="" />
					{__('Upgrade To BetterLinks PRO', 'betterlinks')}
				</a>
			</div>
		</div>
	);
};
