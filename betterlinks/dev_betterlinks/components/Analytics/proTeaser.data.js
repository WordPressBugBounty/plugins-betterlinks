/**
 * Sample payloads for the free-plugin Analytics teaser.
 *
 * The locked sections (Geography, Sources, Technology, Timing, Attention) are
 * rendered by their REAL components (see `ProSectionsTeaser`) — these fixtures
 * are passed in place of live data, so the preview is pixel-identical to what
 * Pro shows and can never drift from it.
 *
 * Shapes mirror the Pro REST payloads exactly, because the section components
 * run them through the same `analytics.helper` transforms:
 *   countries `[{ country_code, country_name, clicks, unique_clicks }]`
 *   referer   `[{ domain, clicks }]`
 *   medium    `{ search: {host: clicks}, social: {...}, ecommerce: {...}, others }`
 *   devices   `[{ device, clicks }]`
 *   os        `[{ os, clicks }]`
 *   browser   `[{ browser, browser_version, clicks }]`
 *   timing    `[{ dow, hr, clicks, unique_clicks }]`
 *
 * Figures are deliberately modest and internally consistent (the country total,
 * the referrer total and the timing grid all land near 4.8k clicks) so the
 * preview reads as a plausible small site rather than an inflated brochure.
 */

export const TEASER_COUNTRIES = [
	{ country_code: 'US', country_name: 'United States', clicks: 1482, unique_clicks: 1104 },
	{ country_code: 'GB', country_name: 'United Kingdom', clicks: 726, unique_clicks: 553 },
	{ country_code: 'IN', country_name: 'India', clicks: 611, unique_clicks: 470 },
	{ country_code: 'DE', country_name: 'Germany', clicks: 438, unique_clicks: 331 },
	{ country_code: 'CA', country_name: 'Canada', clicks: 352, unique_clicks: 274 },
	{ country_code: 'AU', country_name: 'Australia', clicks: 289, unique_clicks: 221 },
	{ country_code: 'FR', country_name: 'France', clicks: 233, unique_clicks: 178 },
	{ country_code: 'BR', country_name: 'Brazil', clicks: 197, unique_clicks: 149 },
	{ country_code: 'NL', country_name: 'Netherlands', clicks: 164, unique_clicks: 126 },
	{ country_code: 'JP', country_name: 'Japan', clicks: 138, unique_clicks: 107 },
	{ country_code: 'ES', country_name: 'Spain', clicks: 96, unique_clicks: 74 },
	{ country_code: 'IT', country_name: 'Italy', clicks: 71, unique_clicks: 55 },
];

export const TEASER_REFERER = [
	{ domain: 'google.com', clicks: 1264 },
	{ domain: 'facebook.com', clicks: 742 },
	{ domain: 'youtube.com', clicks: 508 },
	{ domain: 'x.com', clicks: 371 },
	{ domain: 'linkedin.com', clicks: 246 },
	{ domain: 'reddit.com', clicks: 183 },
	{ domain: 'pinterest.com', clicks: 127 },
];

export const TEASER_MEDIUM = {
	search: { 'google.com': 1264, 'bing.com': 208, 'duckduckgo.com': 96 },
	social: { 'facebook.com': 742, 'youtube.com': 508, 'x.com': 371, 'linkedin.com': 246, 'reddit.com': 183, 'pinterest.com': 127 },
	ecommerce: { 'amazon.com': 412, 'etsy.com': 118 },
	// A COUNT OF DOMAINS, not clicks — surfaced as the "other referring domains"
	// footnote, never as a bar. See `otherReferrerCount()`.
	others: 34,
};

export const TEASER_DEVICES = [
	{ device: 'smartphone', clicks: 2684 },
	{ device: 'desktop', clicks: 1737 },
	{ device: 'tablet', clicks: 328 },
];

export const TEASER_OS = [
	{ os: 'Android', clicks: 1521 },
	{ os: 'Windows', clicks: 1236 },
	{ os: 'iOS', clicks: 1104 },
	{ os: 'Mac', clicks: 618 },
	{ os: 'Linux', clicks: 270 },
];

export const TEASER_BROWSER = [
	{ browser: 'Chrome', browser_version: '126.0', clicks: 2418 },
	{ browser: 'Safari', browser_version: '17.5', clicks: 1146 },
	{ browser: 'Edge', browser_version: '126.0', clicks: 587 },
	{ browser: 'Firefox', browser_version: '127.0', clicks: 412 },
	{ browser: 'Opera', browser_version: '110.0', clicks: 186 },
];

/**
 * A believable weekday × hour grid: a working-hours ridge that peaks late
 * morning and again after work, with weekends flatter and shifted later.
 *
 * Generated rather than hand-listed — 168 literal rows would be unreadable and
 * impossible to keep coherent. Purely arithmetic (no randomness), so the
 * preview is identical on every render and between users.
 */
const HOUR_WEIGHT = [3, 2, 1, 1, 1, 2, 5, 11, 19, 27, 34, 38, 35, 31, 30, 33, 39, 44, 41, 34, 26, 18, 11, 6];
const DAY_WEIGHT = [0.55, 1, 1.08, 1.04, 1.12, 0.95, 0.6]; // Sun … Sat
const WEEKEND_SHIFT = 3; // weekend traffic arrives ~3 hours later

export const TEASER_TIMING = Array.from({ length: 7 }, (_, dow) =>
	Array.from({ length: 24 }, (_, hr) => {
		const isWeekend = dow === 0 || dow === 6;
		const source = HOUR_WEIGHT[(hr - (isWeekend ? WEEKEND_SHIFT : 0) + 24) % 24];
		const clicks = Math.round(source * DAY_WEIGHT[dow]);
		return { dow, hr, clicks, unique_clicks: Math.round(clicks * 0.76) };
	})
).flat();

/**
 * Already in the Movers OUTPUT shape (`{ increases, decreases }`) that
 * `AttentionSection` renders — the preview has no data to derive movers from.
 */
export const TEASER_MOVERS = {
	increases: [
		{ link_id: 't1', name: 'Summer Sale — Landing Page', clicks: 486, previous: 214, pct: 127.1 },
		{ link_id: 't2', name: 'Affiliate — Hosting Deal', clicks: 372, previous: 205, pct: 81.5 },
		{ link_id: 't3', name: 'Newsletter Signup', clicks: 259, previous: 168, pct: 54.2 },
		{ link_id: 't4', name: 'YouTube — Review Video', clicks: 198, previous: 141, pct: 40.4 },
		{ link_id: 't5', name: 'Docs — Getting Started', clicks: 164, previous: 128, pct: 28.1 },
	],
	decreases: [
		{ link_id: 't6', name: 'Spring Promo (expired)', clicks: 74, previous: 318, pct: -76.7 },
		{ link_id: 't7', name: 'Webinar — March Session', clicks: 96, previous: 264, pct: -63.6 },
		{ link_id: 't8', name: 'Facebook Ad — Variant B', clicks: 132, previous: 251, pct: -47.4 },
		{ link_id: 't9', name: 'Pricing Page', clicks: 187, previous: 296, pct: -36.8 },
		{ link_id: 't10', name: 'Case Study — Retail', clicks: 118, previous: 163, pct: -27.6 },
	],
};
