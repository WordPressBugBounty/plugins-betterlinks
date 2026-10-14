import { __ } from '@wordpress/i18n';

const InputTeaser = ({ title = '', onClick = () => {}, placeholder = '' }) => {
	return (
		<div className="btl-role-item btl-form-group" onClick={onClick}>
			<label className="btl-form-label">{title}</label>
			<div className="link-options__body link-options__body_tracking">
				<input type="text" className="btl-text-field" disabled onClick={onClick} placeholder={placeholder} />
				<span className="text" />
			</div>
		</div>
	);
};

export default InputTeaser;
