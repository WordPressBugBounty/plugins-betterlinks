import { __ } from '@wordpress/i18n';
import { FlameIcon, TrendUpIcon, TrendDownIcon } from './Icons';
import { formatNumber } from './analytics.helper';

/**
 * A two-point spark (previous → current) coloured by direction. There is no
 * per-link daily series to draw a full trend, so this honestly shows just the
 * shift the row is ranked by — up-right for a rise, down-right for a drop.
 */
const MoverSpark = ({ up }) => (
	<svg className="bl-mv__spark" viewBox="0 0 32 16" fill="none" aria-hidden="true">
		<polyline
			points={up ? '2,14 12,9 22,6 30,2' : '2,2 12,6 22,9 30,14'}
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

/**
 * One "Top movers" card — either the risers or the fallers. Both share this
 * chrome; `direction` picks the colour, icon and copy.
 */
const MoverCard = ({ direction, rows }) => {
	const up = direction === 'up';

	return (
		<div className={`bl-mv bl-mv--${direction}`}>
			<div className="bl-mv__head">
				<span className="bl-mv__icon">
					<FlameIcon width={16} height={16} />
				</span>
				<h3 className="bl-mv__title">{up ? __('Top increases', 'betterlinks') : __('Top decreases', 'betterlinks')}</h3>
				<span className="bl-mv__subtitle">{__('biggest shifts', 'betterlinks')}</span>
			</div>

			{rows.length ? (
				<ul className="bl-mv__list">
					{rows.map((row, index) => (
						<li className="bl-mv__row" key={row.link_id}>
							<span className="bl-mv__rank">{index + 1}</span>
							<span className="bl-mv__meta">
								<span className="bl-mv__name" title={row.name}>
									{row.name || __('(untitled link)', 'betterlinks')}
								</span>
								<span className="bl-mv__clicks">
									{/* translators: %s: number of clicks. */}
									{formatNumber(row.clicks)} {__('clicks', 'betterlinks')}
								</span>
							</span>
							<span className="bl-mv__trend">
								<MoverSpark up={up} />
								<span className="bl-mv__pct">
									{up ? <TrendUpIcon width={14} height={14} /> : <TrendDownIcon width={14} height={14} />}
									{Math.round(Math.abs(row.pct) * 10) / 10}%
								</span>
							</span>
						</li>
					))}
				</ul>
			) : (
				<div className="bl-mv__empty">
					{up ? __('No links grew versus the previous period.', 'betterlinks') : __('No links fell versus the previous period.', 'betterlinks')}
				</div>
			)}
		</div>
	);
};

export default MoverCard;
