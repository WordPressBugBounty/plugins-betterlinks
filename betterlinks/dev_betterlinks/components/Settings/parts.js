import ToggleSwitch from './ToggleSwitch';

// Small tooltip cluster reused across settings rows (matches the legacy
// `.btl-tooltip` markup so existing tooltip CSS applies).
export const InfoTip = ({ text }) =>
	text ? (
		<span className="btl-tooltip">
			<span className="dashicons dashicons-info-outline" />
			<span className="btl-tooltiptext">{text}</span>
		</span>
	) : null;

// A labelled settings row: label column (left) + field column (right).
export const Row = ({ label, tooltip, badge, desc, children, className = '', onClick, id }) => (
	<div className={`bl-set-row ${className}`} onClick={onClick} id={id}>
		<div className="bl-set-row__label">
			{label}
			<InfoTip text={tooltip} />
			{badge}
		</div>
		<div className="bl-set-row__field">
			{children}
			{desc && <p className="bl-set-row__desc">{desc}</p>}
		</div>
	</div>
);

// A single toggle line: [switch] label + tooltip. Used stand-alone or stacked
// inside a `.bl-set-togglelist`.
export const ToggleLine = ({ label, tooltip, checked, onChange, locked, onLocked, badge, name, id }) => (
	<label className="bl-set-row__switch">
		<ToggleSwitch id={id} name={name} checked={checked} onChange={onChange} locked={locked} onLocked={onLocked} ariaLabel={typeof label === 'string' ? label : name} />
		<span className="text">
			{label}
			<InfoTip text={tooltip} />
			{badge}
		</span>
	</label>
);
