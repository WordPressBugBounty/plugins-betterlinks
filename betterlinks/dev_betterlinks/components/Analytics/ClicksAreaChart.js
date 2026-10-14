import { useMemo } from 'react';
import { __ } from '@wordpress/i18n';
import Chart from 'react-apexcharts';
import { formatShortDate } from './analytics.helper';

const CLICKS_COLOR = '#2f6bff';
const UNIQUE_COLOR = '#a9bffb';

/**
 * The clicks-over-time area chart: solid Clicks line with a soft fill, dashed
 * Unique line. Shared by the dashboard hero and the single-link view so both
 * read identically. Chrome-free (no Apex toolbar/legend) — callers supply their
 * own legend and export.
 */
const ClicksAreaChart = ({ series, darkMode, height = 310 }) => {
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

	return <Chart options={chart.options} series={chart.series} type="area" height={height} />;
};

export default ClicksAreaChart;
