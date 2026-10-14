import { __ } from '@wordpress/i18n';
import ProBadge from 'components/Badge/ProBadge';

const CustomTrackingScriptTeaser = ({ openUpgradeToProModal }) => {
	return (
		<button className="link-options__head" type="button" onClick={openUpgradeToProModal}>
			<h4 className="link-options__head--title">
				{__('Custom Tracking Scripts', 'betterlinks')} <ProBadge />
			</h4>{' '}
		</button>
	);
};

export default CustomTrackingScriptTeaser;
