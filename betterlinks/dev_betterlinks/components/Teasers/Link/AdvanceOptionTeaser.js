import { __ } from '@wordpress/i18n';
import { is_pro_enabled } from 'utils/helper';
import LockedPanel, { FauxSelect, FauxToggle } from './LockedPanel';

const ClockIcon = () => (
	<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
		<path d="M12 7.5V12l3 1.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

const KeyIcon = () => (
	<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<rect x="4.5" y="10.5" width="15" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
		<path d="M8 10.5V7.5a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
	</svg>
);

/**
 * Locked preview of the Pro "Advanced" panel (`LinkExtend`): link status,
 * scheduled expiry and password protection.
 */
const AdvanceOptionTeaser = ({ openUpgradeToProModal = () => {} }) => {
	if (is_pro_enabled) return;
	return (
		<LockedPanel onUnlock={openUpgradeToProModal}>
			<FauxSelect label={__('Status', 'betterlinks')} value={__('Active', 'betterlinks')} />
			<FauxToggle label={__('Set expiry date', 'betterlinks')} icon={<ClockIcon />} />
			<FauxToggle label={__('Password Protection', 'betterlinks')} icon={<KeyIcon />} />
		</LockedPanel>
	);
};

export default AdvanceOptionTeaser;
