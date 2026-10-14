import { __ } from '@wordpress/i18n';
import { subDays } from 'date-fns';
import { API, namespace } from 'utils/helper';

/**
 * The seven sections of the redesigned Analytics page. `ready` flips to true as
 * each section is built; the nav renders every entry either way so the shape of
 * the page is visible from day one.
 *
 * `pro` marks the five sections the free plugin shows as a locked preview —
 * Overview and Links (per-link performance) are the two free ones. The nav uses
 * it for the PRO pill; the container uses the same ids to pick the lock copy.
 */
export const SECTIONS = [
	{ id: 'overview', label: __('Overview', 'betterlinks'), ready: true },
	{ id: 'geography', label: __('Geography', 'betterlinks'), ready: true, pro: true },
	{ id: 'sources', label: __('Sources', 'betterlinks'), ready: true, pro: true },
	{ id: 'technology', label: __('Technology', 'betterlinks'), ready: true, pro: true },
	{ id: 'timing', label: __('Timing', 'betterlinks'), ready: true, pro: true },
	{ id: 'attention', label: __('Attention', 'betterlinks'), ready: true, pro: true },
	{ id: 'links', label: __('Links', 'betterlinks'), ready: true },
];

export const QUICK_RANGES = [
	{ days: 7, label: __('7 days', 'betterlinks') },
	{ days: 30, label: __('30 days', 'betterlinks') },
	{ days: 90, label: __('90 days', 'betterlinks') },
];

export const FILTER_RANGES = [
	{ days: 1, label: __('Today', 'betterlinks') },
	{ days: 7, label: __('Last 7 days', 'betterlinks') },
	{ days: 14, label: __('Last 14 days', 'betterlinks') },
	{ days: 30, label: __('Last 30 days', 'betterlinks') },
	{ days: 90, label: __('Last 90 days', 'betterlinks') },
	{ days: 180, label: __('Last 6 months', 'betterlinks') },
	{ days: 365, label: __('Last 12 months', 'betterlinks') },
];

/**
 * Local date as `YYYY-MM-DD`, zero-padded.
 *
 * Deliberately NOT `utils/helper`'s `formatDate()`, which does not pad and so
 * yields "2026-6-2". The API's `c_date` comes straight from MySQL `DATE()` and
 * is always padded ("2026-06-02"), so an unpadded key would never match a row
 * and every day would read as zero clicks.
 *
 * Built from the local getters rather than `toISOString()`, which would shift
 * the date across the UTC boundary for anyone east or west of GMT.
 */
export const toApiDate = (date) => {
	const value = date instanceof Date ? date : new Date(date);
	if (Number.isNaN(value.getTime())) return '';
	const month = String(value.getMonth() + 1).padStart(2, '0');
	const day = String(value.getDate()).padStart(2, '0');
	return `${value.getFullYear()}-${month}-${day}`;
};

/** Whole days covered by an inclusive range — a same-day range counts as 1. */
export const rangeLength = (startDate, endDate) => {
	const start = new Date(startDate).setHours(0, 0, 0, 0);
	const end = new Date(endDate).setHours(0, 0, 0, 0);
	return Math.max(1, Math.round((end - start) / 86400000) + 1);
};

/** The equally long window sitting immediately before `startDate`. */
export const previousRange = (startDate, endDate) => {
	const days = rangeLength(startDate, endDate);
	const prevEnd = subDays(new Date(startDate), 1);
	return { from: toApiDate(subDays(prevEnd, days - 1)), to: toApiDate(prevEnd) };
};

/**
 * Expands the API's sparse per-day rows into one entry per day in the range, so
 * days with no clicks plot as zero instead of collapsing the x-axis.
 *
 * `clicksSlice` is `state.clicks.clicks` — note the double nesting; the daily
 * arrays are NOT at the root of the clicks store.
 */
export const buildDailySeries = (clicksSlice, startDate, endDate) => {
	const totals = {};
	const uniques = {};
	(clicksSlice?.total_count || []).forEach((row) => {
		totals[row.c_date] = Number(row.click_count) || 0;
	});
	(clicksSlice?.unique_count || []).forEach((row) => {
		uniques[row.c_date] = Number(row.uniq_count) || 0;
	});

	const series = [];
	const cursor = new Date(startDate);
	cursor.setHours(0, 0, 0, 0);
	const last = new Date(endDate);
	last.setHours(0, 0, 0, 0);

	while (cursor <= last) {
		const key = toApiDate(cursor);
		series.push({ date: key, clicks: totals[key] || 0, unique: uniques[key] || 0 });
		cursor.setDate(cursor.getDate() + 1);
	}
	return series;
};

const sum = (rows, key) => rows.reduce((acc, row) => acc + (row[key] || 0), 0);

/**
 * Everything section 1 renders, derived from the two data points the REST layer
 * actually returns: the daily series and the distinct-visitor count.
 *
 * `uniqueCount` is a scalar (COUNT(DISTINCT ip)) for the whole range — it is NOT
 * the sum of the daily unique series, which double-counts a visitor who returns
 * on another day. We keep both: the scalar for the headline, the series for the
 * chart's dashed line.
 */
export const deriveOverview = (clicksSlice, uniqueCount, startDate, endDate) => {
	const series = buildDailySeries(clicksSlice, startDate, endDate);
	const days = series.length;
	const total = sum(series, 'clicks');

	return {
		series,
		days,
		total,
		unique: Number(uniqueCount) || 0,
		avgPerDay: days ? Math.round(total / days) : 0,
	};
};

/**
 * Signed percentage change, or null when there is nothing to compare against.
 *
 * A zero baseline also yields null: "+100%" would read as a doubling, when in
 * truth there is simply no previous activity to measure growth from.
 */
export const percentChange = (current, previous) => {
	if (previous === null || previous === undefined) return null;
	if (!previous) return null;
	return ((current - previous) / previous) * 100;
};

/**
 * Totals for the preceding window, used for the "vs previous" deltas. Reuses
 * existing routes with a shifted range, so the deltas are real data with no
 * backend change. Any field resolves to null if its call fails, and a null delta
 * renders as nothing.
 *
 * Two routes, deliberately:
 *  - `get_graphs` gives the daily series → total clicks and avg/day.
 *  - `clicks` gives `unique_count`, the scalar COUNT(DISTINCT ip) over the whole
 *    window.
 *
 * The unique figure MUST come from that scalar. Summing the daily unique series
 * instead would count a visitor once per day they return, so comparing it to the
 * current range's scalar compares two different quantities — on flat traffic
 * that alone would report a large phantom decline.
 */
export const fetchPreviousTotals = async (startDate, endDate) => {
	const { from, to } = previousRange(startDate, endDate);
	const params = { params: { from, to } };

	const [graphs, clicks] = await Promise.all([
		API.get(`${namespace}clicks/get_graphs`, params).catch(() => null),
		API.get(`${namespace}clicks`, params).catch(() => null),
	]);

	const slice = graphs?.data?.data?.clicks;
	if (!slice) return null;

	const series = buildDailySeries(slice, from, to);
	const total = sum(series, 'clicks');
	const days = series.length;
	const uniqueCount = clicks?.data?.data?.unique_count;

	return {
		total,
		// null (not 0) when the clicks route failed, so the delta is omitted
		// rather than shown as a 100% drop.
		unique: uniqueCount === undefined || uniqueCount === null ? null : Number(uniqueCount) || 0,
		avgPerDay: days ? Math.round(total / days) : 0,
		// Per-link clicks for the previous window, so the Attention section can
		// compute each link's shift without a second request.
		links: parsePreviousLinks(clicks?.data?.data),
	};
};

// ---------------------------------------------------------------------------
// Section 6 — Attention (top movers)
// ---------------------------------------------------------------------------

/**
 * `{ link_id: { name, short_url, clicks } }` for a `clicks/` response. Names come
 * from `unique_list`, counts from `analytic` (link_count) — the same two pieces
 * the reducer stitches together for the current period. Handed to extensions as
 * `previous.links` (the Movers section compares it with the current period).
 */
export const parsePreviousLinks = (data) => {
	if (!data) return {};
	const analytic = data.analytic || {};
	const map = {};
	(data.unique_list || []).forEach((row) => {
		const id = row.link_id;
		if (!id) return;
		map[id] = {
			name: row.link_title || '',
			short_url: row.short_url || '',
			clicks: Number(analytic[id]?.link_count) || 0,
		};
	});
	return map;
};

export const formatNumber = (value) => Number(value || 0).toLocaleString();

/** 5639 -> "5.6K", 1200000 -> "1.2M". Used for the compact stat-card values. */
export const formatCompact = (value) => {
	const num = Number(value) || 0;
	if (num < 1000) return String(num);
	if (num < 1000000) {
		const k = num / 1000;
		return `${k < 10 ? k.toFixed(1) : Math.round(k)}K`;
	}
	const m = num / 1000000;
	return `${m < 10 ? m.toFixed(1) : Math.round(m)}M`;
};

/** "2026-06-02" -> "Jun 2", for the chart axis and the range caption. */
export const formatShortDate = (value) => {
	const date = value instanceof Date ? value : new Date(`${value}T00:00:00`);
	if (Number.isNaN(date.getTime())) return '';
	return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

/** Downloads the daily series as CSV — the Export button's payload. */
export const exportSeriesCsv = (series, filename = 'betterlinks-analytics.csv') => {
	const header = [__('Date', 'betterlinks'), __('Clicks', 'betterlinks'), __('Unique', 'betterlinks')];
	const rows = series.map((row) => [row.date, row.clicks, row.unique]);
	const csv = [header, ...rows].map((row) => row.join(',')).join('\n');

	const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = filename;
	document.body.appendChild(anchor);
	anchor.click();
	document.body.removeChild(anchor);
	URL.revokeObjectURL(url);
};

// ---------------------------------------------------------------------------
// Sections 2 & 3 — Sources / Technology
//
// Every list below is fed by the Pro `clicks/get_charts` / `clicks/get_medium`
// routes, both of which are gated server-side behind
// `betterlinks/is_extra_data_tracking_compatible` and return empty arrays when it
// is off. So "empty" is ambiguous on its own —
// callers must check `is_extra_data_tracking_compatible` to tell "nothing
// arrived from this channel" apart from "we never recorded it".
// ---------------------------------------------------------------------------

/**
 * Collapses rows that share a label and sorts by clicks.
 *
 * The OS and browser endpoints group by name AND version, so "Windows 10" and
 * "Windows 11" come back as separate rows; the design lists one row per OS, so
 * they are summed here rather than shown as versioned duplicates.
 */
const aggregateRows = (rows) => {
	const totals = new Map();
	rows.forEach(({ label, value }) => {
		const key = String(label || '').trim();
		if (!key) return;
		totals.set(key, (totals.get(key) || 0) + (Number(value) || 0));
	});
	return [...totals.entries()]
		.map(([label, value]) => ({ key: label.toLowerCase(), label, value }))
		.filter((row) => row.value > 0)
		.sort((a, b) => b.value - a.value);
};

/** Adds each row's share of the list total, for the percentage + bar width. */
export const withShares = (rows) => {
	const total = rows.reduce((acc, row) => acc + row.value, 0);
	return rows.map((row) => ({ ...row, share: total ? (row.value / total) * 100 : 0 }));
};

// Endpoints are inconsistent: the dashboard chart routes return arrays, but the
// single-link routes hand some dimensions back as objects. Coerce so a `.map`
// can never land on a non-array.
const asArray = (value) => (Array.isArray(value) ? value : []);
export const capitalize = (value) => (value ? String(value).charAt(0).toUpperCase() + String(value).slice(1) : '');

export const toRefererRows = (referer) => withShares(aggregateRows(asArray(referer).map((row) => ({ label: row.domain, value: Number(row.clicks) }))));

/** `medium.social` is a plain `{ host: clicks }` map, not an array. */
export const toSocialRows = (medium) => withShares(aggregateRows(Object.entries(medium?.social || {}).map(([host, clicks]) => ({ label: host, value: Number(clicks) }))));

const sumBucket = (bucket) => Object.values(bucket || {}).reduce((acc, value) => acc + (Number(value) || 0), 0);

/**
 * The channel buckets behind `medium`.
 *
 * NOTE: this is NOT `utm_medium` — nothing in the REST layer aggregates UTM
 * parameters. `get_top_medium()` sorts referring domains into search / social /
 * ecommerce, so that is what this reports.
 *
 * `medium.others` is deliberately excluded: it is a COUNT OF DOMAINS, not a
 * click count (`$others += 1` per referrer row), so putting it in a clicks bar
 * would compare two different quantities. It is surfaced as a footnote instead.
 */
export const toMediumRows = (medium) =>
	withShares(
		aggregateRows([
			{ label: __('Search', 'betterlinks'), value: sumBucket(medium?.search) },
			{ label: __('Social', 'betterlinks'), value: sumBucket(medium?.social) },
			{ label: __('Ecommerce', 'betterlinks'), value: sumBucket(medium?.ecommerce) },
		])
	);

export const otherReferrerCount = (medium) => Number(medium?.others) || 0;

// Device classes are stored lowercase (`desktop`, `mobile`, `tablet`), so they
// need title-casing for display. OS values are NOT capitalized here: they come
// from `OperatingSystem::getOsFamily()` already cased (`iOS`, `GNU/Linux`), and
// `capitalize` would mangle them.
export const toDeviceRows = (devices) =>
	withShares(aggregateRows(asArray(devices).map((row) => ({ label: capitalize(row.device), value: Number(row.clicks) }))));

export const toOsRows = (os) => withShares(aggregateRows(asArray(os).map((row) => ({ label: row.os, value: Number(row.clicks) }))));

/**
 * Two shapes in the wild:
 *  - dashboard: `[{ browser, browser_version, clicks }]`
 *  - single-link: `{ chrome: [{ version, clicks }], others: [...] }` (keyed by
 *    browser name, one entry per version).
 * Both collapse to one row per browser, summing across versions.
 */
export const toBrowserRows = (browser) => {
	const rows = Array.isArray(browser)
		? browser.map((row) => ({ label: row.browser, value: Number(row.clicks) }))
		: Object.entries(browser || {}).map(([name, versions]) => ({
				label: capitalize(name),
				value: asArray(versions).reduce((acc, v) => acc + (Number(v.clicks) || 0), 0),
		  }));
	return withShares(aggregateRows(rows));
};

/** One decimal, but no trailing ".0" — "29.6%" and "6%", never "6.0%". */
export const formatShare = (share) => {
	const rounded = Math.round((Number(share) || 0) * 10) / 10;
	return `${rounded}%`;
};

// ---------------------------------------------------------------------------
// Section 7 — Per-link performance
// ---------------------------------------------------------------------------

export const ROWS_PER_PAGE = [10, 25, 50, 100];

/**
 * One row per link, from `state.clicks.unique_list`.
 *
 * `unique_list` holds MANY rows per link (it is a click list joined to link
 * data), and the reducer grafts the link's `total_clicks` / `unique_clicks`
 * totals onto every one of them. So we keep the first row seen per `link_id`
 * and drop the rest — summing here would multiply each link's totals by its own
 * row count.
 */
export const toLinkRows = (uniqueList) => {
	const byLink = new Map();
	(uniqueList || []).forEach((item) => {
		const id = item?.link_id;
		if (!id || byLink.has(id)) return;
		byLink.set(id, {
			link_id: id,
			name: item.link_title || '',
			short_url: item.short_url || '',
			target_url: item.target_url || '',
			total_clicks: Number(item.total_clicks) || 0,
			unique_clicks: Number(item.unique_clicks) || 0,
		});
	});
	return [...byLink.values()];
};

/** Case-insensitive match across the three text columns. */
export const filterLinkRows = (rows, term) => {
	const needle = String(term || '').trim().toLowerCase();
	if (!needle) return rows;
	return rows.filter((row) => `${row.name} ${row.short_url} ${row.target_url}`.toLowerCase().includes(needle));
};

export const sortLinkRows = (rows, key, direction) => {
	const dir = direction === 'asc' ? 1 : -1;
	return [...rows].sort((a, b) => {
		const left = a[key];
		const right = b[key];
		if (typeof left === 'number' && typeof right === 'number') return (left - right) * dir;
		return String(left).localeCompare(String(right), undefined, { sensitivity: 'base' }) * dir;
	});
};

// ---------------------------------------------------------------------------
// Section 4 — Geography
// ---------------------------------------------------------------------------

/**
 * Normalises the `clicks/get_countries` rows into what the map and list need,
 * plus a lookup keyed by upper-case ISO alpha-2 for the choropleth.
 *
 * Rows arrive ordered by clicks desc from SQL, but we sort defensively so the
 * list never depends on that.
 */
export const toCountryRows = (countries) => {
	const rows = (countries || [])
		.filter((row) => row.country_code)
		.map((row) => ({
			key: String(row.country_code).toUpperCase(),
			code: String(row.country_code).toUpperCase(),
			label: row.country_name || String(row.country_code).toUpperCase(),
			value: Number(row.clicks) || 0,
			unique: Number(row.unique_clicks) || 0,
		}))
		.sort((a, b) => b.value - a.value);

	const total = rows.reduce((acc, row) => acc + row.value, 0);
	const byCode = {};
	rows.forEach((row) => {
		row.share = total ? (row.value / total) * 100 : 0;
		byCode[row.code] = row;
	});

	return { rows, byCode, total, max: rows.length ? rows[0].value : 0 };
};

// The "Fewer → More" ramp. A country with clicks always lands on index 1..4
// (see choroplethStep); index 0 is only a placeholder so the legend and the
// data steps share one array. No-data countries are filled grey by the map, not
// from this ramp.
export const CHOROPLETH_STEPS = ['#c9d6fb', '#a9c1fb', '#7aa0ff', '#4f86ff', '#2f6bff'];

/**
 * Bucket a country's clicks onto 1..4 of the ramp.
 *
 * Uses a log scale against the busiest country: click counts are heavily skewed
 * (one dominant country, a long tail of small ones), so a linear scale would
 * paint everything but the leader the palest shade.
 */
export const choroplethStep = (value, max) => {
	if (!value || value <= 0) return 0;
	if (max <= 0) return 1;
	const ratio = Math.log(value + 1) / Math.log(max + 1);
	return Math.min(CHOROPLETH_STEPS.length - 1, 1 + Math.floor(ratio * (CHOROPLETH_STEPS.length - 1 - 0.0001)));
};

// ---------------------------------------------------------------------------
// Section 5 — Timing (day × hour heatmap)
// ---------------------------------------------------------------------------

export const WEEKDAYS = [
	__('Mon', 'betterlinks'),
	__('Tue', 'betterlinks'),
	__('Wed', 'betterlinks'),
	__('Thu', 'betterlinks'),
	__('Fri', 'betterlinks'),
	__('Sat', 'betterlinks'),
	__('Sun', 'betterlinks'),
];

// Four-step heat ramp for the "Less → More" legend. Index 0 is the empty-cell
// fill (no clicks in that hour); 1..4 scale with volume.
export const HEAT_STEPS = ['#eef1f7', '#c9d6fb', '#7aa0ff', '#2f6bff'];

/**
 * Expands the sparse `{ dow, hr, clicks, unique_clicks }` rows into a full
 * 7×24 grid (Mon..Sun × 00..23), assigns each cell a heat step, and finds the
 * busiest hour for the insight line.
 *
 * `dow` from the API is already 0=Mon..6=Sun (MySQL WEEKDAY), so it indexes the
 * grid rows directly.
 */
export const buildTimingGrid = (timing) => {
	const grid = Array.from({ length: 7 }, (_, day) => Array.from({ length: 24 }, (_, hour) => ({ day, hour, clicks: 0, unique: 0 })));

	let max = 0;
	let peak = null;
	let total = 0;

	(timing || []).forEach((row) => {
		const day = Number(row.dow);
		const hour = Number(row.hr);
		// Guard against non-integers too, so a malformed row can never index the
		// grid with NaN.
		if (!Number.isInteger(day) || !Number.isInteger(hour) || day < 0 || day > 6 || hour < 0 || hour > 23) return;
		const clicks = Number(row.clicks) || 0;
		const cell = grid[day][hour];
		cell.clicks = clicks;
		cell.unique = Number(row.unique_clicks) || 0;
		total += clicks;
		if (clicks > max) {
			max = clicks;
			peak = cell;
		}
	});

	// Assign heat step per cell against the busiest hour, log-scaled so a single
	// dominant hour doesn't flatten everything else to the palest shade.
	const logMax = Math.log(max + 1);
	grid.forEach((rowCells) =>
		rowCells.forEach((cell) => {
			if (!cell.clicks || !logMax) {
				cell.step = 0;
				return;
			}
			const ratio = Math.log(cell.clicks + 1) / logMax;
			cell.step = Math.min(HEAT_STEPS.length - 1, 1 + Math.floor(ratio * (HEAT_STEPS.length - 1 - 0.0001)));
		})
	);

	return { grid, max, peak, total };
};

/** "18:00" from an hour number. */
export const formatHour = (hour) => `${String(hour).padStart(2, '0')}:00`;

/** "18:00–19:00" spanning the given hour. */
export const formatHourRange = (hour) => `${formatHour(hour)}–${formatHour((hour + 1) % 24)}`;

// ---------------------------------------------------------------------------
// Single-link analytics (?id=)
//
// The single-link view reuses the dashboard section components, but its free
// data comes from ONE fetch: `individual_clicks[id]`. The top country / top
// device tiles are aggregated client-side from the per-click `analytics[]` rows.
// ---------------------------------------------------------------------------

/** Per-click rows → the `countries` shape GeographySection expects. */
export const aggregateCountriesFromClicks = (rows) => {
	const map = {};
	(rows || []).forEach((row) => {
		const code = row.country_code;
		if (!code) return;
		if (!map[code]) map[code] = { country_code: code, country_name: row.country_name || code, clicks: 0, ips: new Set() };
		map[code].clicks += 1;
		if (row.ip) map[code].ips.add(row.ip);
	});
	return Object.values(map).map((c) => ({ country_code: c.country_code, country_name: c.country_name, clicks: c.clicks, unique_clicks: c.ips.size }));
};

/** Per-click rows → the `devices` shape (`[{ device, clicks }]`) `toDeviceRows` expects. */
export const aggregateDevicesFromClicks = (rows) => {
	const map = {};
	(rows || []).forEach((row) => {
		if (!row.device) return;
		map[row.device] = (map[row.device] || 0) + 1;
	});
	return Object.entries(map).map(([device, clicks]) => ({ device, clicks }));
};

/** Distinct-IP count across per-click rows — the single-link unique-visitor scalar. */
export const uniqueIpsFromClicks = (rows) => new Set((rows || []).map((row) => row.ip).filter(Boolean)).size;

/**
 * Single-link overview from its `graph_data` ({total_count, unique_count},
 * identical to the dashboard clicks slice) plus its per-click rows for the
 * distinct-visitor scalar.
 */
export const deriveSingleOverview = (graphData, analyticsRows, startDate, endDate) => {
	const series = buildDailySeries(graphData, startDate, endDate);
	const days = series.length;
	const total = sum(series, 'clicks');
	const unique = uniqueIpsFromClicks(analyticsRows);
	return { series, days, total, unique, avgPerDay: days ? Math.round(total / days) : 0 };
};

/**
 * Previous-window totals for ONE link, for the "vs previous" delta. Reuses the
 * individual `clicks/{id}` route with the range shifted back by its own length.
 * Resolves to null on failure so the delta is simply omitted.
 */
export const fetchPreviousLinkTotals = async (id, startDate, endDate) => {
	const { from, to } = previousRange(startDate, endDate);
	try {
		const res = await API.get(`${namespace}clicks/${id}`, { params: { from, to } });
		const data = res?.data?.data;
		if (!data) return null;
		const series = buildDailySeries(data.graph_data, from, to);
		return { total: sum(series, 'clicks'), unique: uniqueIpsFromClicks(data.analytics) };
	} catch (e) {
		return null;
	}
};

/** The busiest row of a `{label,value}` list — for the Top country / Top device tiles. */
export const topRow = (rows) => (rows && rows.length ? rows[0] : null);
