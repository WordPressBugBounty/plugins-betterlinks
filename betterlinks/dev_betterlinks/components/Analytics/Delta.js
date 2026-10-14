import { __, sprintf } from '@wordpress/i18n';
import { TrendUpIcon, TrendDownIcon } from './Icons';

/**
 * "↗ 14.8% vs previous 30 days".
 *
 * Renders nothing when `value` is null — that is the signal that there was no
 * comparable previous period (or the comparison fetch failed), and an absent
 * delta is honest where a "0%" would not be.
 */
const Delta = ({ value, caption }) => {
	if (value === null || value === undefined) return null;

	const rounded = Math.round(Math.abs(value) * 10) / 10;
	const isFlat = rounded === 0;
	const isUp = value > 0;
	const tone = isFlat ? 'flat' : isUp ? 'up' : 'down';

	return (
		<p className={`bl-delta bl-delta--${tone}`}>
			{!isFlat && <span className="bl-delta__icon">{isUp ? <TrendUpIcon width={14} height={14} /> : <TrendDownIcon width={14} height={14} />}</span>}
			<span className="bl-delta__value">
				{isFlat
					? __('No change', 'betterlinks')
					: /* translators: %s: percentage change, e.g. "14.8". */
					  sprintf(__('%s%%', 'betterlinks'), rounded.toLocaleString())}
			</span>
			{caption && <span className="bl-delta__caption">{caption}</span>}
		</p>
	);
};

export default Delta;
