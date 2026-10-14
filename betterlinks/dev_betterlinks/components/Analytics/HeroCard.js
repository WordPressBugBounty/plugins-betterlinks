import { useMemo } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import Chart from 'react-apexcharts';
import Delta from './Delta';
import { CursorIcon, UsersIcon, PulseIcon, HumanIcon, InfoIcon } from './Icons';
import { formatNumber, formatShortDate } from './analytics.helper';

const CLICKS_COLOR = '#2f6bff';
const UNIQUE_COLOR = '#a9bffb';

/**
 * The overview hero: the headline total on a rail to the left, the daily click
 * curve to the right.
 *
 * The chart is deliberately chrome-free (no Apex toolbar, no built-in legend) —
 * the legend above it is our own markup so it can carry the series totals, and
 * export lives in the page header instead of Apex's hamburger.
 */
const HeroCard = ({ overview, delta, rangeLabel, compareLabel, darkMode, audience, audienceLoading }) => {
	const { series, total, unique, avgPerDay } = overview;

	// Human clicks come from the same `clicks/get_audience` route as the "Human
	// vs Bot" card: `bot.human` counts rows explicitly flagged non-bot. It reads
	// as tracked only once the range has at least one classified click; clicks
	// recorded before bot tracking existed carry no flag and are left out.
	const bot = audience?.bot;
	const humanTracked = !!bot?.tracked;

	const chart = useMemo(() => {
		const grid = darkMode ? 'rgba(255,255,255,0.08)' : '#eef0f5';
		const axisText = darkMode ? '#8b93a7' : '#9aa1b1';

		return {
			options: {
				chart: {
					type: 'area',
					toolbar: { show: false },
					zoom: { enabled: false },
					animations: { enabled: false },
					fontFamily: 'inherit',
					parentHeightOffset: 0,
					background: 'transparent',
				},
				colors: [CLICKS_COLOR, UNIQUE_COLOR],
				stroke: { curve: 'straight', width: [2.4, 1.8], dashArray: [0, 5] },
				fill: {
					type: 'gradient',
					gradient: {
						shadeIntensity: 0,
						// Only the Clicks series carries a fill; Unique stays a bare dashed line.
						opacityFrom: [0.22, 0],
						opacityTo: [0.02, 0],
						stops: [0, 100],
					},
				},
				dataLabels: { enabled: false },
				markers: { size: 0, hover: { size: 4 } },
				legend: { show: false },
				grid: {
					borderColor: grid,
					strokeDashArray: 0,
					xaxis: { lines: { show: false } },
					yaxis: { lines: { show: true } },
					padding: { left: 4, right: 8, top: 0, bottom: 0 },
				},
				xaxis: {
					categories: series.map((row) => row.date),
					tickAmount: Math.min(6, Math.max(1, series.length - 1)),
					axisBorder: { show: false },
					axisTicks: { show: false },
					tooltip: { enabled: false },
					labels: {
						rotate: 0,
						hideOverlappingLabels: true,
						style: { colors: axisText, fontSize: '12px' },
						formatter: (value) => formatShortDate(value),
					},
				},
				yaxis: {
					tickAmount: 4,
					min: 0,
					labels: {
						style: { colors: axisText, fontSize: '12px' },
						formatter: (value) => Math.round(value),
					},
				},
				tooltip: {
					theme: darkMode ? 'dark' : 'light',
					shared: true,
					intersect: false,
					x: { formatter: (_v, { dataPointIndex }) => formatShortDate(series[dataPointIndex]?.date) },
				},
			},
			series: [
				{ name: __('Clicks', 'betterlinks'), data: series.map((row) => row.clicks) },
				{ name: __('Unique', 'betterlinks'), data: series.map((row) => row.unique) },
			],
		};
	}, [series, darkMode]);

	return (
		<div className="bl-hero">
			<div className="bl-hero__rail">
				<p className="bl-hero__label">
					<CursorIcon width={15} height={15} />
					<span>
						{/* translators: %s: the selected range, e.g. "last 30 days". */}
						{sprintf(__('Total clicks · %s', 'betterlinks'), rangeLabel)}
					</span>
				</p>

				<p className="bl-hero__value">{formatNumber(total)}</p>
				{/* translators: %s: the range length, e.g. "30 days". */}
				<Delta value={delta} caption={sprintf(__('vs previous %s', 'betterlinks'), compareLabel)} />

				<dl className="bl-hero__facts">
					<div className="bl-hero__fact">
						<dt>
							<UsersIcon width={15} height={15} />
							<span>{__('Unique visitors', 'betterlinks')}</span>
						</dt>
						<dd>{formatNumber(unique)}</dd>
					</div>
					<div className="bl-hero__fact">
						<dt>
							<PulseIcon width={15} height={15} />
							<span>{__('Avg / day', 'betterlinks')}</span>
						</dt>
						<dd>{formatNumber(avgPerDay)}</dd>
					</div>
					<div className={`bl-hero__fact${humanTracked ? '' : ' bl-hero__fact--na'}`}>
						<dt>
							<HumanIcon width={15} height={15} />
							<span>{__('Human clicks', 'betterlinks')}</span>
						</dt>
						{humanTracked ? (
							<dd title={__('Clicks not flagged as bot traffic. Clicks recorded before bot tracking are excluded.', 'betterlinks')}>
								{formatNumber(bot.human)}
							</dd>
						) : (
							<dd title={__('Clicks are not stored with a bot flag, so human traffic cannot be separated out.', 'betterlinks')}>
								<span className="bl-hero__na">
									<InfoIcon width={13} height={13} />
									{audienceLoading ? __('Loading…', 'betterlinks') : __('Not tracked', 'betterlinks')}
								</span>
							</dd>
						)}
					</div>
				</dl>
			</div>

			<div className="bl-hero__chart">
				<div className="bl-hero__legend">
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
				</div>

				<div className="bl-hero__canvas">
					<Chart options={chart.options} series={chart.series} type="area" height={310} />
				</div>
			</div>
		</div>
	);
};

export default HeroCard;
