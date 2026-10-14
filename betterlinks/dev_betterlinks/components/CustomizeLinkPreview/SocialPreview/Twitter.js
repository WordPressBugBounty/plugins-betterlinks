import { __ } from '@wordpress/i18n';
import { plugin_root_url } from 'utils/helper';
import { teaserDescription, teaserTitle } from '../data';

const Twitter = ({ site_url }) => {
	return (
		<div className="btl-customized-link-preview-facebook btl-customized-link-preview-twitter">
			<div className="btl-customized-link-preview-image-container">
				<img src={plugin_root_url + 'assets/images/teasers/customize-link-preview-image.png'} alt="" />
			</div>
			<div className="btl-customized-link-preview-content-container">
				<span className="btl-link-preview-title">{teaserTitle}</span>
				<span className="btl-link-preview-description">{teaserDescription}</span>
				<span className="btl-link-preview-site-url">{site_url}</span>
			</div>
		</div>
	);
};

export default Twitter;
