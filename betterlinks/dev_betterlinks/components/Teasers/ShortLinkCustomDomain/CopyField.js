import { __ } from '@wordpress/i18n';
import { CopyIcon } from './Icons';

// Teaser variant of the Pro DNS record field: read-only value + copy affordance
// that funnels to the upgrade modal instead of copying.
const CopyField = ({ value = '', placeholder = '', onLocked }) => (
	<div className="bl-cd__copyfield">
		<input type="text" className="bl-cd__copyfield-input" value={value} placeholder={placeholder} readOnly onFocus={(e) => e.target.select()} />
		<button type="button" className="bl-cd__copyfield-btn" onClick={onLocked} aria-label={__('Copy to clipboard', 'betterlinks')}>
			<CopyIcon size={14} />
		</button>
	</div>
);

export default CopyField;
