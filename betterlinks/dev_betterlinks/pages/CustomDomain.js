import { __ } from '@wordpress/i18n';
import ShortLinkCustomDomain from 'components/Teasers/ShortLinkCustomDomain';
import Topbar from 'containers/TopBar';
import { is_pro_enabled } from 'utils/helper';
const CustomDomain = () => {
	return (
		<>
			{/* <Topbar label={__('BetterLinks Custom Domain', 'betterlinks')} is_pro={!is_pro_enabled} /> */}
			<div className="btl-tab-panel-inner">
				<ShortLinkCustomDomain />
			</div>
		</>
	);
};

export default CustomDomain;
