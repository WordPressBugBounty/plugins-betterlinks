import { __ } from '@wordpress/i18n';
import { formatCompact, formatShare } from './analytics.helper';
import { InfoIcon } from './Icons';

/**
 * The ranked-list card used by both Sources and Technology: a row per item with
 * its click count, its share of the list, and a bar underneath.
 *
 * Three distinct states, and the difference between the last two matters:
 *  - rows            → the list
 *  - `unavailable`   → BetterLinks never recorded this dimension (extra data
 *                      tracking is off), so an empty list would be a lie
 *  - otherwise empty → tracking is on and genuinely nothing arrived in this range
 */
const BarList = ({ icon, title, subtitle, rows = [], rowIcon, unavailable, unavailableHint, emptyTitle, emptyText, footnote }) => {
	const isEmpty = !rows.length;

	return (
		<div className="bl-bars">
			<div className="bl-bars__head">
				<span className="bl-bars__icon">{icon}</span>
				<h3 className="bl-bars__title">{title}</h3>
				{subtitle && <span className="bl-bars__subtitle">{subtitle}</span>}
			</div>

			{unavailable ? (
				<div className="bl-bars__state">
					<span className="bl-bars__state-badge">{icon}</span>
					<p className="bl-bars__state-title">{__('Not tracked', 'betterlinks')}</p>
					{unavailableHint && (
						<p className="bl-bars__state-text">
							<InfoIcon width={13} height={13} />
							<span>{unavailableHint}</span>
						</p>
					)}
				</div>
			) : isEmpty ? (
				<div className="bl-bars__state">
					<span className="bl-bars__state-badge">{icon}</span>
					<p className="bl-bars__state-title">{emptyTitle || __('No data yet', 'betterlinks')}</p>
					{emptyText && <p className="bl-bars__state-text bl-bars__state-text--plain">{emptyText}</p>}
				</div>
			) : (
				<>
					<ul className="bl-bars__list">
						{rows.map((row) => (
							<li className="bl-bars__row" key={row.key}>
								<div className="bl-bars__line">
									<span className="bl-bars__chip">{rowIcon ? rowIcon(row) : null}</span>
									<span className="bl-bars__label" title={row.label}>
										{row.label}
									</span>
									<span className="bl-bars__value">{formatCompact(row.value)}</span>
									<span className="bl-bars__share">{formatShare(row.share)}</span>
								</div>
								<div className="bl-bars__track">
									<span className="bl-bars__fill" style={{ width: `${Math.max(row.share, 1.5)}%` }} />
								</div>
							</li>
						))}
					</ul>
					{footnote && <p className="bl-bars__foot">{footnote}</p>}
				</>
			)}
		</div>
	);
};

export default BarList;
