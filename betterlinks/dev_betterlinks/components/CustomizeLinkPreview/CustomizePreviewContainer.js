import { __ } from '@wordpress/i18n';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { Facebook, Linkedin, Twitter } from './SocialPreview';
import { site_url as site_link } from 'utils/helper';

const socialMedia = [__('Facebook', 'betterlinks'), __('X (Twitter)', 'betterlinks'), __('LinkedIn', 'betterlinks')];
const CustomizePreviewContainr = () => {
	const site_url = betterLinksHooks.applyFilters('site_url', site_link);
	return (
		<div className="btl-modal-customize-link-preview-box">
			<h3 className="btl-modal-customize-link-preview__title">{__('Social Link Preview', 'betterlinks')}</h3>
			<Tabs>
				<TabList>
					{socialMedia.map((item, index) => (
						<Tab key={index}>{item}</Tab>
					))}
				</TabList>
				{[<Facebook site_url={site_url} />, <Twitter site_url={site_url} />, <Linkedin site_url={site_url} />].map((item, index) => {
					return <TabPanel key={index}>{item}</TabPanel>;
				})}
			</Tabs>
		</div>
	);
};

export default CustomizePreviewContainr;
