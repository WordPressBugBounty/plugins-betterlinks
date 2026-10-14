import { __ } from '@wordpress/i18n';
import Sparkline from './Sparkline';
import Delta from './Delta';
import { InfoIcon } from './Icons';

/**
 * One cell of the overview stat row.
 *
 * Two shapes, both driven from the same card chrome:
 *  - `trend`  — a big value plus a sparkline (Unique visitors, Avg clicks/day)
 *  - `ratio`  — a split bar between two named halves (New vs Returning)
 *
 * A card whose metric BetterLinks cannot currently measure passes
 * `unavailable`, and renders a muted explanation instead of a number. We do not
 * substitute a zero or a placeholder figure — see the `hint` copy for why each
 * one is unavailable. `naTitle` overrides the default "Not tracked" heading for
 * cases that are a deliberate setting rather than missing data.
 */
const StatCard = ({ icon, label, unavailable, naTitle, hint, children }) => (
	<div className={`bl-stat${unavailable ? ' bl-stat--na' : ''}`}>
		<div className="bl-stat__head">
			<span className="bl-stat__icon">{icon}</span>
			<span className="bl-stat__label">{label}</span>
		</div>

		{unavailable ? (
			<div className="bl-stat__na-body">
				<p className="bl-stat__na-title">{naTitle || __('Not tracked', 'betterlinks')}</p>
				{hint && (
					<p className="bl-stat__na-hint">
						<InfoIcon width={13} height={13} />
						<span>{hint}</span>
					</p>
				)}
			</div>
		) : (
			children
		)}
	</div>
);

export const TrendStat = ({ icon, label, value, series, color, filled, delta, deltaCaption, footnote }) => (
	<StatCard icon={icon} label={label}>
		<div className="bl-stat__body">
			<span className="bl-stat__value">{value}</span>
			<span className="bl-stat__spark">
				<Sparkline data={series} color={color} filled={filled} />
			</span>
		</div>
		{delta !== undefined && delta !== null ? <Delta value={delta} caption={deltaCaption} /> : footnote ? <p className="bl-stat__foot">{footnote}</p> : null}
	</StatCard>
);

export const RatioStat = ({ icon, label, primaryPct, primaryLabel, secondaryLabel }) => (
	<StatCard icon={icon} label={label}>
		<div className="bl-stat__body bl-stat__body--ratio">
			<span className="bl-stat__value">
				{primaryPct}%<span className="bl-stat__value-suffix">{primaryLabel}</span>
			</span>
		</div>
		<div className="bl-stat__bar" role="presentation">
			<span className="bl-stat__bar-fill" style={{ width: `${primaryPct}%` }} />
		</div>
		<p className="bl-stat__legend">
			<span>
				{primaryPct}% {primaryLabel}
			</span>
			<span>
				{100 - primaryPct}% {secondaryLabel}
			</span>
		</p>
	</StatCard>
);

export default StatCard;
