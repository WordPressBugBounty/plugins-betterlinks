import { __, sprintf } from '@wordpress/i18n';
import { getFlagEmoji } from 'utils/helper';
import StatCard, { TrendStat } from './StatCard';
import Delta from './Delta';
import ClicksAreaChart from './ClicksAreaChart';
import { SingleOverviewSkeleton } from './Skeletons';
import { CursorIcon, UsersIcon, GlobeIcon, MonitorIcon, SmartphoneIcon, TabletIcon, CpuIcon } from './Icons';
import { formatCompact, formatNumber } from './analytics.helper';

const CLICKS_COLOR = '#2f6bff';

const DEVICE_ICON = (label) => {
	const name = String(label || '').toLowerCase();
	if (name.includes('tablet')) return TabletIcon;
	if (name.includes('phone') || name.includes('mobile')) return SmartphoneIcon;
	return MonitorIcon;
};

/**
 * The single-link overview: four stat tiles then the clicks-over-time chart.
 *
 * Total/Unique are always available (derived from the link's own series and
 * per-click rows). Top country / Top device depend on extra-data tracking, so
 * they show a muted "Not tracked" tile when that data is absent — same rule as
 * the dashboard sections.
 */
const SingleOverview = ({ overview, delta, topCountry, topDevice, rangeLabel, darkMode, loading }) => {
	if (loading) return <SingleOverviewSkeleton />;

	const { series, total, unique } = overview;
	const uniquePct = total ? Math.round((unique / total) * 100) : 0;
	const DeviceIcon = topDevice ? DEVICE_ICON(topDevice.label) : MonitorIcon;
	const devicePct = topDevice && topDevice.share != null ? Math.round(topDevice.share) : null;

	return (
		<div className="bl-sov">
			<div className="bl-sov__stats">
				<TrendStat
					icon={<CursorIcon width={15} height={15} />}
					label={__('Total clicks', 'betterlinks')}
					value={formatNumber(total)}
					series={series.map((row) => row.clicks)}
					color={CLICKS_COLOR}
					filled
					delta={delta}
					deltaCaption={__('vs previous', 'betterlinks')}
				/>

				<StatCard icon={<UsersIcon width={15} height={15} />} label={__('Unique clicks', 'betterlinks')}>
					<div className="bl-stat__body">
						<span className="bl-stat__value">{formatNumber(unique)}</span>
					</div>
					<p className="bl-stat__foot">
						{/* translators: %s: percentage of total clicks that were unique. */}
						{sprintf(__('%s%% of total clicks', 'betterlinks'), uniquePct)}
					</p>
				</StatCard>

				{topCountry ? (
					<StatCard icon={<GlobeIcon width={15} height={15} />} label={__('Top country', 'betterlinks')}>
						<div className="bl-stat__body bl-stat__body--wrap">
							<span className="bl-stat__value bl-stat__value--sm">
								<span className="bl-sov__flag">{getFlagEmoji(topCountry.code)}</span>
								{topCountry.label}
							</span>
						</div>
						<p className="bl-stat__foot">
							{/* translators: 1: clicks from the top country, 2: total clicks. */}
							{sprintf(__('%1$s of %2$s logged', 'betterlinks'), formatNumber(topCountry.value), formatNumber(total))}
						</p>
					</StatCard>
				) : (
					<StatCard
						icon={<GlobeIcon width={15} height={15} />}
						label={__('Top country', 'betterlinks')}
						unavailable
						hint={__('Country is recorded with extra data tracking on.', 'betterlinks')}
					/>
				)}

				{topDevice ? (
					<StatCard icon={<DeviceIcon width={15} height={15} />} label={__('Top device', 'betterlinks')}>
						<div className="bl-stat__body bl-stat__body--wrap">
							<span className="bl-stat__value bl-stat__value--sm">{topDevice.label}</span>
						</div>
						{devicePct != null && (
							<p className="bl-stat__foot">
								{/* translators: %s: percentage of clicks from the top device. */}
								{sprintf(__('%s%% of clicks', 'betterlinks'), devicePct)}
							</p>
						)}
					</StatCard>
				) : (
					<StatCard
						icon={<CpuIcon width={15} height={15} />}
						label={__('Top device', 'betterlinks')}
						unavailable
						hint={__('Device is recorded with extra data tracking on.', 'betterlinks')}
					/>
				)}
			</div>

			<div className="bl-sov__chart">
				<div className="bl-sov__chart-head">
					<span className="bl-sov__chart-title">
						<CursorIcon width={15} height={15} />
						{__('Clicks over time', 'betterlinks')}
					</span>
					<span className="bl-sov__chart-meta">{rangeLabel}</span>
					<span className="bl-sov__chart-legend">
						<span className="bl-hero__key">
							<i className="bl-hero__dot bl-hero__dot--clicks" />
							{__('Clicks', 'betterlinks')}
							<b>{formatNumber(total)}</b>
						</span>
						<span className="bl-hero__key">
							<i className="bl-hero__dot bl-hero__dot--unique" />
							{__('Unique', 'betterlinks')}
							<b>{formatNumber(unique)}</b>
						</span>
					</span>
				</div>
				<div className="bl-sov__canvas">
					<ClicksAreaChart series={series} darkMode={darkMode} height={320} />
				</div>
			</div>
		</div>
	);
};

export default SingleOverview;
