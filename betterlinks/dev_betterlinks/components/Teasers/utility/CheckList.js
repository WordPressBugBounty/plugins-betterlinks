import { __ } from '@wordpress/i18n';
import ProBadge from 'components/Badge/ProBadge';
import PropTypes from 'prop-types';

const propTypes = {
	title: PropTypes.string,
};

export default function CheckList({ title = '', is_pro = false, ...props }) {
	return (
		<div className="btl-role-item btl-form-group" {...props}>
			<label className="btl-form-label">
				{title}
				{is_pro && <ProBadge />}
			</label>
			<div className="link-options__body">
				<label className="btl-checkbox-field">
					<input type="checkbox" className="btl-check" disabled />
					<span className="text" />
				</label>
			</div>
		</div>
	);
}

CheckList.propTypes = propTypes;
