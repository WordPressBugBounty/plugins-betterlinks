import { __ } from '@wordpress/i18n';
import TabsBrokenLinkChecker from 'containers/TabsBrokenLinkChecker';
import TopBar from 'containers/TopBar';

const LinkScanner = () => {
	return (
		<>
			{/* <TopBar label={__('Link Scanner', 'betterlinks')} /> */}
			<TabsBrokenLinkChecker />
		</>
	);
};

export default LinkScanner;
