import { __ } from '@wordpress/i18n';

/**
 * Shared chrome for the locked Pro panels in the link drawer's right sidebar.
 *
 * `children` is an inert replica of the real Pro panel — built from divs rather
 * than form elements, so nothing inside can be focused, submitted or read back.
 * The wrapper owns the click; the unlock row is the visible affordance.
 */

export const LockIcon = ({ size = 14 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<rect x="4.5" y="10.5" width="15" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
		<path d="M8 10.5V7.5a4 4 0 018 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
	</svg>
);

export const ChevronDown = ({ size = 14 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

const ArrowRight = () => (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<path d="M5 12h13M12.5 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

/** A faux <select> — renders the chosen value with a chevron, but holds no state. */
export const FauxSelect = ({ label, value }) => (
	<div className="bl-lt__field">
		<span className="bl-lt__label">{label}</span>
		<div className="bl-lt__select">
			<span>{value}</span>
			<ChevronDown />
		</div>
	</div>
);

/** A labelled switch, always drawn in the off position. */
export const FauxToggle = ({ label, icon }) => (
	<div className="bl-lt__toggle-row">
		<span className="bl-lt__toggle-label">
			{icon}
			{label}
		</span>
		<span className="bl-lt__switch" />
	</div>
);

const LockedPanel = ({ children, onUnlock }) => (
	<div className="bl-lt" onClick={onUnlock}>
		<div className="bl-lt__fields">{children}</div>
		<button type="button" className="bl-lt__unlock" onClick={onUnlock}>
			<LockIcon />
			<span className="bl-lt__unlock-text">{__('Unlock with BetterLinks Pro', 'betterlinks')}</span>
			<ArrowRight />
		</button>
	</div>
);

export default LockedPanel;
