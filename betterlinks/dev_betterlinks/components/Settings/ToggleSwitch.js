import { __ } from '@wordpress/i18n';

// Reusable on/off switch that replaces the legacy `.btl-checkbox-field` checkboxes
// across the redesigned Settings page.
//
//  - Controlled mode: pass `checked` + `onChange` (mirrors the existing Formik
//    pattern: checked={values.x} onChange={() => setFieldValue('x', !values.x)}).
//  - Locked (Pro) mode: pass `locked` + `onLocked`. The track renders disabled
//    and the whole control routes clicks to `onLocked` (the upgrade modal).
const ToggleSwitch = ({ id, name, checked = false, onChange, disabled = false, locked = false, onLocked, ariaLabel }) => {
	const isOff = locked || disabled;

	const handleClick = () => {
		if (locked) {
			onLocked && onLocked();
			return;
		}
		if (disabled) {
			return;
		}
		onChange && onChange();
	};

	return (
		<button
			type="button"
			id={id}
			role="switch"
			aria-checked={locked ? false : !!checked}
			aria-label={ariaLabel}
			data-name={name}
			className={`bl-toggle${checked && !locked ? ' is-on' : ''}${isOff ? ' is-locked' : ''}`}
			onClick={handleClick}
			title={locked ? __('Available in BetterLinks Pro', 'betterlinks') : undefined}
		>
			<span className="bl-toggle__track">
				<span className="bl-toggle__thumb" />
			</span>
		</button>
	);
};

export default ToggleSwitch;
