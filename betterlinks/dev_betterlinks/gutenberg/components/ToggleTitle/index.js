import { __ } from '@wordpress/i18n';
import { plugin_root_url, is_pro_enabled } from 'utils/helper';
import PropTypes from 'prop-types';

const propTypes = {
	is_pro_feature: PropTypes.bool,
	title: PropTypes.string,
};

const ToggleTitle = ({ is_pro_feature = false, title = '' }) => {
	return (
		<>
			<img width="15" src={plugin_root_url + '/assets/images/logo-large.svg'} style={{ marginRight: '5px' }} />
			{title}
			{is_pro_feature && !is_pro_enabled && <span className="pro-badge">{__('Pro', 'betterlinks')}</span>}
		</>
	);
};

ToggleTitle.propTypes = propTypes;

export default ToggleTitle;
