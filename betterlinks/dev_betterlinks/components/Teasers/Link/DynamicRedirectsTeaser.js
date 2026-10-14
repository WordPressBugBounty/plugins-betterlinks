import { __ } from '@wordpress/i18n';
import { is_pro_enabled } from 'utils/helper';
import LockedPanel, { FauxToggle } from './LockedPanel';

const RotationIcon = () => (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<path d="M4 12a8 8 0 0113.7-5.7L20 8.5M20 12a8 8 0 01-13.7 5.7L4 15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
		<path d="M20 4.5v4h-4M4 19.5v-4h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

const GeographyIcon = () => (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
		<path d="M3.5 12h17M12 3.5a13 13 0 010 17 13 13 0 010-17Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
	</svg>
);

const DeviceIcon = () => (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<rect x="2.5" y="4.5" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
		<rect x="15.5" y="9.5" width="6" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
		<path d="M6 18h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
	</svg>
);

const TimeIcon = () => (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<rect x="3.5" y="5.5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" />
		<path d="M3.5 10h17M8 3.5v4M16 3.5v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
	</svg>
);

// Mirrors REDIRECT_TYPES in the Pro DynamicRedirect component.
const TYPES = [
	{ label: __('Rotation', 'betterlinks'), icon: <RotationIcon /> },
	{ label: __('Geography', 'betterlinks'), icon: <GeographyIcon /> },
	{ label: __('Device', 'betterlinks'), icon: <DeviceIcon /> },
	{ label: __('Time', 'betterlinks'), icon: <TimeIcon /> },
];

/**
 * Locked preview of the Pro "Dynamic Redirects" panel: the enable switch plus
 * the four redirect types the real editor offers.
 */
const DynamicRedirectsTeaser = ({ openUpgradeToProModal = () => {} }) => {
	if (is_pro_enabled) return;
	return (
		<LockedPanel onUnlock={openUpgradeToProModal}>
			<FauxToggle label={__('Enable Dynamic Redirect', 'betterlinks')} />
			<div className="bl-lt__types">
				{TYPES.map((type, i) => (
					<div className={`bl-lt__type${i === 0 ? ' is-active' : ''}`} key={type.label}>
						{type.icon}
						{type.label}
					</div>
				))}
			</div>
		</LockedPanel>
	);
};

export default DynamicRedirectsTeaser;
