import { __ } from '@wordpress/i18n';
import { getFlagEmoji } from 'utils/helper';
import WorldMap from './WorldMap';
import { GeographySkeleton } from './Skeletons';
import { GlobeIcon, TrophyIcon, InfoIcon } from './Icons';
import { toCountryRows, formatCompact, formatShare } from './analytics.helper';

const TRACKING_HINT = __('Turn on extra data tracking to record which country each click comes from.', 'betterlinks');

/**
 * Section 4 — Geography.
 *
 * Left: a choropleth world map, hover a country for its clicks. Right: the
 * top countries as a ranked list with flag emoji.
 *
 * Country is recorded only when extra data tracking is on, so `tracked` decides
 * whether an empty result reads as "no clicks yet" or "not recorded at all".
 */
const GeographySection = ({ countries, tracked, loading, darkMode }) => {
	if (loading) return <GeographySkeleton />;

	const { rows, byCode, max } = toCountryRows(countries);
	const hasData = rows.length > 0;

	return (
		<div className="bl-geo">
			<div className="bl-geo__panel">
				<div className="bl-geo__head">
					<span className="bl-geo__icon">
						<GlobeIcon width={16} height={16} />
					</span>
					<h3 className="bl-geo__title">{__('Clicks by country', 'betterlinks')}</h3>
					<span className="bl-geo__subtitle">{__('hover a country for its clicks', 'betterlinks')}</span>
				</div>

				{tracked ? (
					<WorldMap byCode={byCode} max={max} darkMode={darkMode} />
				) : (
					<div className="bl-geo__state">
						<span className="bl-geo__state-badge">
							<GlobeIcon width={20} height={20} />
						</span>
						<p className="bl-geo__state-title">{__('Not tracked', 'betterlinks')}</p>
						<p className="bl-geo__state-text">
							<InfoIcon width={13} height={13} />
							<span>{TRACKING_HINT}</span>
						</p>
					</div>
				)}
			</div>

			<div className="bl-geo__panel bl-geo__panel--list">
				<div className="bl-geo__head">
					<span className="bl-geo__icon">
						<TrophyIcon width={16} height={16} />
					</span>
					<h3 className="bl-geo__title">{__('Top countries', 'betterlinks')}</h3>
					<span className="bl-geo__subtitle">{__('share of clicks', 'betterlinks')}</span>
				</div>

				{!tracked ? (
					<div className="bl-geo__state">
						<span className="bl-geo__state-badge">
							<TrophyIcon width={20} height={20} />
						</span>
						<p className="bl-geo__state-title">{__('Not tracked', 'betterlinks')}</p>
						<p className="bl-geo__state-text">
							<InfoIcon width={13} height={13} />
							<span>{TRACKING_HINT}</span>
						</p>
					</div>
				) : !hasData ? (
					<div className="bl-geo__state">
						<span className="bl-geo__state-badge">
							<TrophyIcon width={20} height={20} />
						</span>
						<p className="bl-geo__state-title">{__('No data yet', 'betterlinks')}</p>
						<p className="bl-geo__state-text bl-geo__state-text--plain">{__('No clicks were attributed to a country in this range.', 'betterlinks')}</p>
					</div>
				) : (
					<ul className="bl-geo__list">
						{rows.map((row, index) => (
							<li className="bl-geo__row" key={row.code}>
								<span className="bl-geo__rank">{index + 1}</span>
								<span className="bl-geo__flag">{getFlagEmoji(row.code)}</span>
								<span className="bl-geo__name" title={row.label}>
									{row.label}
								</span>
								<span className="bl-geo__value">{formatCompact(row.value)}</span>
								<span className="bl-geo__share">{formatShare(row.share)}</span>
								<span className="bl-geo__track" aria-hidden="true">
									<span className="bl-geo__fill" style={{ width: `${Math.max(row.share, 1.5)}%` }} />
								</span>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
};

export default GeographySection;
