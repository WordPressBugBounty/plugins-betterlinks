import { __ } from '@wordpress/i18n';
import axios from 'axios';
import { Link } from 'react-router-dom/cjs/react-router-dom.min';
import _, { unset } from 'lodash';
import clipboardCopy from 'clipboard-copy';
import ProBadge from 'components/Badge/ProBadge';
import { Badge } from '@material-ui/core';
import { toastSuccess, toastError, toastWarning, toastInfo } from 'components/Toast';

export const {
	betterlinks_nonce,
	nonce,
	rest_url,
	ajaxurl,
	namespace,
	plugin_root_url,
	plugin_root_path,
	site_url,
	actual_site_url,
	route_path,
	exists_links_json,
	exists_clicks_json,
	page,
	is_pro_enabled,
	pro_needs_update,
	min_pro_version,
	post_type,
	// betterlinks_links_option,
	betterlinkspro_version,
	is_extra_data_tracking_compatible,
	menu_notice,
	betterlinks_auth,
	betterlinks_cle_endpoint,
	betterlinks_date_format,
	betterlinks_custom_domain_menu,
	betterlinks_settings,
	is_fbs_enabled,
	prefix,
	betterlinks_quick_setup_step = false,
	migratable_plugins = {
		simple301redirects: false,
		thirstyaffliates: false,
		prettylinks: false,
	},
} = window.betterLinksGlobal || {};

export const API = axios.create({
	baseURL: rest_url,
	headers: {
		'content-type': 'application/json',
		'X-WP-Nonce': nonce,
	},
});
export const reorder = (list, startIndex, endIndex) => {
	let result = [];
	if (startIndex == endIndex) {
		result = list;
	} else {
		result = Array.from(list);
		const [removed] = result.splice(startIndex, 1);
		result.splice(endIndex, 0, removed);
	}

	let form_data = new FormData();
	form_data.append('action', 'betterlinks/admin/links_reorder');
	form_data.append('security', betterlinks_nonce);
	form_data.append(
		'links',
		result.reduce(function (pV, cV, cI) {
			if (cV.ID) {
				pV.push(cV.ID);
			}
			return pV;
		}, [])
	);
	axios.post(ajaxurl, form_data).then(
		(response) => { },
		(error) => {
			console.log(error);
		}
	);

	return result;
};
export const deleteClicks = (daysOlderThan = false, from = formatDate(subDays(new Date(), 30), 'yyyy-mm-dd'), to = formatDate(new Date(), 'yyyy-mm-dd'), linkId = null) => {
	const form_data = new FormData();
	form_data.append('action', 'betterlinks/admin/reset_analytics');
	form_data.append('security', betterlinks_nonce);
	if (daysOlderThan !== false) {
		form_data.append('days_older_than', daysOlderThan);
	}
	form_data.append('from', from);
	form_data.append('to', to);
	if (linkId !== null) {
		form_data.append('link_id', linkId);
	}
	return axios.post(ajaxurl, form_data).then(
		(response) => {
			return response;
		},
		(error) => {
			console.log(error);
			return error;
		}
	);
};
export const move = (source, destination, droppableSource, droppableDestination) => {
	const sourceClone = Array.from(source);
	const destClone = Array.from(destination);
	const [removed] = sourceClone.splice(droppableSource.index, 1);

	const newItemForDest = {
		...removed,
		cat_id: `${droppableDestination.droppableId}`,
	};

	destClone.splice(droppableDestination.index, 0, newItemForDest);

	const result = {};
	result[droppableSource.droppableId] = sourceClone;
	result[droppableDestination.droppableId] = destClone;

	let form_data = new FormData();
	form_data.append('action', 'betterlinks/admin/links_move_reorder');
	form_data.append('security', betterlinks_nonce);
	form_data.append(
		'source',
		sourceClone.reduce(function (pV, cV, cI) {
			if (cV.ID) {
				pV.push(cV.ID);
			}
			return pV;
		}, [])
	);
	form_data.append(
		'destination',
		destClone.reduce(function (pV, cV, cI) {
			if (cV.ID) {
				pV.push(cV.ID);
			}
			return pV;
		}, [])
	);
	axios.post(ajaxurl, form_data).then(
		(response) => { },
		(error) => {
			console.log(error);
		}
	);

	return result;
};

export const generateSlug = (value) => {
	return value
		.trim()
		.toLowerCase()
		.replace(/-+/g, '')
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9-]/g, '');
};

export const generateTitleToSlug = (value) => {
	return value
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9-/-]/g, '');
};

export const generateShortURL = (settings, title, targetUrl, isInitialGeneration = false) => {
	if (settings) {
		let shortURL = settings.prefix && settings.prefix.length > 0 ? settings.prefix + '/' : '';

		// Handle new URL generation types
		if (settings.url_slug_generation_type) {
			switch (settings.url_slug_generation_type) {
				case 'random_string':
					// Only generate random slug on initial generation, not on title/url changes
					return isInitialGeneration ? shortURL + generateRandomString() : null;
				case 'random_number':
					// Only generate random slug on initial generation, not on title/url changes
					return isInitialGeneration ? shortURL + generateRandomNumber() : null;
				case 'random_mixed':
					// Only generate random slug on initial generation, not on title/url changes
					return isInitialGeneration ? shortURL + generateRandomMixed() : null;
				case 'from_title':
					// Return empty slug for initial generation, generate from title when title is provided
					if (isInitialGeneration) return shortURL;
					return title ? shortURL + generateFromTitle(title) : null;
				case 'from_url':
					// Return empty slug for initial generation, generate from URL when URL is provided
					if (isInitialGeneration) return shortURL;
					return targetUrl ? shortURL + generateFromUrl(targetUrl) : null;
				default:
					return isInitialGeneration ? shortURL + generateRandomMixed() : null;
			}
		}

		// Legacy support for old is_random_string setting
		// This ensures backward compatibility for existing users
		if (settings.hasOwnProperty('is_random_string')) {
			if (settings.is_random_string) {
				// Old behavior: random_string now maps to random_number
				return isInitialGeneration ? shortURL + generateRandomNumber() : null;
			}
			if (!settings.is_random_string) {
				// Old behavior: not random_string now maps to from_title
				if (isInitialGeneration) return shortURL;
				return title ? shortURL + generateTitleToSlug(title) : null;
			}
		}

		// Default fallback
		return isInitialGeneration ? shortURL + generateRandomMixed() : null;
	}
	return '';
};

export const generateRandomSlug = (length = 3) => {
	return Math.random().toString(20).substr(2, length) + new Date().getMilliseconds();
};

// New URL generation functions
export const generateRandomString = (length = Math.floor(Math.random() * 5) + 6) => {
	const chars = 'abcdefghijklmnopqrstuvwxyz';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
};

export const generateRandomNumber = (length = Math.floor(Math.random() * 5) + 6) => {
	const chars = '0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
};

export const generateRandomMixed = (length = Math.floor(Math.random() * 5) + 6) => {
	const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
};

export const generateFromTitle = (title) => {
	if (!title) return generateRandomMixed();

	// Clean and process the title to create a user-friendly slug
	let slug = title
		.trim()
		.toLowerCase()
		// Remove common stop words for better readability
		.replace(/\b(the|a|an|and|or|but|in|on|at|to|for|of|with|by|from|up|about|into|through|during|before|after|above|below|between|among|against|across|toward|towards|under|over)\b/gi, '')
		.replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
		.replace(/\s+/g, '-') // Replace spaces with hyphens
		.replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
		.replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

	// Split into words and keep the most meaningful ones
	let words = slug.split('-').filter(word => word.length > 0);

	// Allow 3-4 meaningful words for better readability
	if (words.length > 4) {
		// Keep first 4 words, but prefer longer/more meaningful words
		words = words
			.sort((a, b) => b.length - a.length) // Sort by length (longer words first)
			.slice(0, 4) // Take top 4 words
			.sort((a, b) => title.toLowerCase().indexOf(a) - title.toLowerCase().indexOf(b)); // Restore original order
	}

	slug = words.join('-');

	// If still too long (over 25 chars), intelligently truncate
	if (slug.length > 25) {
		// Try to keep first 3 words
		if (words.length > 3) {
			words = words.slice(0, 3);
			slug = words.join('-');
		}

		// If still too long, truncate but try to end at a word boundary
		if (slug.length > 20) {
			let truncated = slug.substring(0, 18);
			let lastDash = truncated.lastIndexOf('-');
			if (lastDash > 8) {
				slug = truncated.substring(0, lastDash);
			} else {
				slug = truncated;
			}
		}
	}

	// Ensure minimum length of 3 characters for readability
	if (slug.length < 3) {
		// Use first few characters of original title if slug is too short
		let fallback = title
			.toLowerCase()
			.replace(/[^a-z0-9]/g, '')
			.substring(0, 8);
		slug = fallback || generateRandomMixed(6);
	}

	return slug || generateRandomMixed();
};

export const generateFromUrl = (targetUrl) => {
	if (!targetUrl) return generateRandomMixed();

	try {
		const url = new URL(targetUrl);
		let pathParts = url.pathname.split('/').filter(part => part.length > 0);

		let slug = '';

		if (pathParts.length > 0) {
			// Get multiple relevant path segments for better context
			let relevantParts = [];

			// Start from the end and work backwards, skipping pure numbers and very short segments
			for (let i = pathParts.length - 1; i >= 0 && relevantParts.length < 3; i--) {
				let part = pathParts[i];

				// Clean the part first
				let cleanPart = part
					.toLowerCase()
					// Remove common file extensions
					.replace(/\.(html|htm|php|aspx|jsp|cfm|pdf|doc|docx)$/i, '')
					// Remove URL parameters and fragments
					.split('?')[0].split('#')[0]
					// Clean up the slug
					.replace(/[^a-z0-9\s-]/g, '') // Remove special characters
					.replace(/\s+/g, '-') // Replace spaces with hyphens
					.replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
					.replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

				// Include this part if it's meaningful (not just numbers and longer than 2 chars)
				if (cleanPart.length > 2 && !cleanPart.match(/^\d+$/)) {
					relevantParts.unshift(cleanPart); // Add to beginning to maintain order
				}
			}

			// Join the relevant parts
			if (relevantParts.length > 0) {
				slug = relevantParts.join('-');
			}

			// If no meaningful parts found, use the last segment anyway
			if (!slug && pathParts.length > 0) {
				slug = pathParts[pathParts.length - 1]
					.toLowerCase()
					.replace(/\.(html|htm|php|aspx|jsp|cfm)$/i, '')
					.split('?')[0].split('#')[0]
					.replace(/[^a-z0-9\s-]/g, '')
					.replace(/\s+/g, '-')
					.replace(/-+/g, '-')
					.replace(/^-|-$/g, '');
			}
		} else {
			// If no meaningful path, generate from domain name
			let domainParts = url.hostname
				.replace(/^www\./, '') // Remove www prefix
				.split('.');

			// Use the main domain part (usually the first part before TLD)
			slug = domainParts[0]
				.toLowerCase()
				.replace(/[^a-z0-9-]/g, '') // Remove special characters except hyphens
				.replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
				.replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
		}

		// Remove common stop words for better readability
		slug = slug.replace(/\b(page|post|article|blog|news|category|tag|product|item|detail|view|show|index|home|main|default)\b/gi, '')
			.replace(/-+/g, '-') // Clean up multiple hyphens
			.replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

		// Intelligent truncation for better readability - allow up to 25 characters
		if (slug.length > 25) {
			// Split by hyphens and try to keep meaningful parts
			let parts = slug.split('-').filter(part => part.length > 0);
			if (parts.length > 3) {
				// Keep first 3 parts
				parts = parts.slice(0, 3);
				slug = parts.join('-');
			} else if (slug.length > 20) {
				// Truncate but try to end at a word boundary
				let truncated = slug.substring(0, 18);
				let lastDash = truncated.lastIndexOf('-');
				if (lastDash > 8) {
					slug = truncated.substring(0, lastDash);
				} else {
					slug = truncated;
				}
			}
		}

		// Ensure minimum length for readability
		if (slug.length < 3) {
			// Fallback to a portion of the domain name
			let fallback = url.hostname
				.replace(/^www\./, '')
				.replace(/\./g, '')
				.toLowerCase()
				.replace(/[^a-z0-9]/g, '')
				.substring(0, 10);
			slug = fallback || generateRandomMixed();
		}

		return slug || generateRandomMixed();
	} catch (error) {
		// If URL parsing fails, return random mixed
		return generateRandomMixed();
	}
};

export const modalCustomStyles = {
	overlay: {
		background: 'rgba(35, 40, 45, 0.62)',
	},
	content: {
		top: '50%',
		left: '50%',
		right: 'auto',
		bottom: 'auto',
		maxWidth: '800px',
		marginRight: '-50%',
		transform: 'translate(-50%, -43%)',
		position: 'absolute',
		background: '#ffffff',
		borderRadius: '8px',
	},
};

export const modalCustomSmallStyles = {
	overlay: {
		background: 'rgba(35, 40, 45, 0.62)',
		zIndex: '999999',
	},
	content: {
		top: '50%',
		left: '50%',
		right: 'auto',
		bottom: 'auto',
		maxWidth: '600px',
		marginRight: '-50%',
		transform: 'translate(-50%, -50%)',
	},
};

export const copyToClipboard = (copyText) => {
	clipboardCopy(copyText);
	toastSuccess(__('Copied to clipboard!', 'betterlinks'), {
		title: __('Link Copied', 'betterlinks'),
		position: 'top-right',
		duration: 2000,
	});
	return;
};

export const copyShortUrl = (shortUrl) => {
	const URL = makeShortUrl(shortUrl);
	clipboardCopy(URL);
	toastSuccess(__('Short link copied to clipboard!', 'betterlinks'), {
		title: __('Link Copied', 'betterlinks'),
		position: 'top-right',
		duration: 2000,
	});
	return URL;
};

export const makeShortUrl = (shortUrl) => {
	const site_link = window?.betterlinksHooks?.applyFilters('site_url', site_url) || localStorage.getItem('btl_custom_domain') || site_url;
	return shortUrl[0] === '/' ? site_link + shortUrl : site_link + '/' + shortUrl;
};

export const getBrowser = (agent) => {
	var browser = '';
	if (/Opera[\/\s](\d+\.\d+)/.test(agent) || 'Opera' == agent) {
		browser = 'opera';
	} else if (/IE (\d+\.\d+);/.test(agent) || 'IE' == agent) {
		browser = 'internet-explorer';
	} else if (/Navigator[\/\s](\d+\.\d+)/.test(agent) || 'Navigator' == agent) {
		browser = 'netscape';
	} else if (/Chrome[\/\s](\d+\.\d+)/.test(agent) || 'Chrome' == agent) {
		browser = 'chrome';
	} else if (/Safari[\/\s](\d+\.\d+)/.test(agent) || 'Safari' == agent) {
		browser = 'safari';
	} else if (/Firefox[\/\s](\d+\.\d+)/.test(agent) || 'Firefox' == agent) {
		browser = 'firefox';
	} else if (/Yandex[\/\s](\d+\.\d+)/.test(agent) || 'Yandex' == agent) {
		browser = 'yandex';
	} else if (/Facebook[\/\s](\d+\.\d+)/.test(agent) || 'Facebook' == agent) {
		browser = 'facebook';
	} else {
		browser = 'web';
	}
	return browser;
};

export const getFlagEmoji = (countryCode) => {
	if (!countryCode || countryCode.length !== 2) return '🌍';

	const codePoints = countryCode
		.toUpperCase()
		.split('')
		.map(char => 127397 + char.charCodeAt());

	return String.fromCodePoint(...codePoints);
};

export const formatDate = (date = new Date(), format) => {
	const map = {
		mm: date.getMonth() + 1,
		dd: date.getDate(),
		yyyy: date.getFullYear(),
		h: date.getHours(),
		m: date.getMinutes(),
		s: date.getSeconds(),
	};
	return format.replace(/mm|dd|yyyy|h|m|s/gi, (matched) => map[matched]);
};

/**
 * Category IDs that must not be renamed or deleted from the UI.
 *
 * Mirrors the server's `betterlinks/protected_term_ids` filter, localized as
 * `betterLinksGlobal.protected_term_ids` — Uncategorized (ID 1) by default,
 * plus any category an extension claims (Pro's "Link in Bio" registers its own
 * via `LinkInBio\Manager::protect_category`). Always go through this rather
 * than testing for the `uncategorized` slug: a slug test silently misses every
 * extension-owned category, which then offers Edit/Delete that the REST
 * controller answers with a 403.
 */
export const getProtectedTermIds = () => (window.betterLinksGlobal?.protected_term_ids || [1]).map(Number);

export const isProtectedTermId = (id) => getProtectedTermIds().includes(Number(id));

/**
 * Categories a feature owns but keeps off Manage Links — currently the bio
 * pages' "Link in Bio" category, opt-in via Settings → Feature Modules → Bio
 * Links → Configure.
 *
 * `get_prepare_all_links()` already excludes these server-side, so they never
 * arrive in the links payload. The board still needs the list because it
 * re-adds *empty* categories from the separate `/terms` payload (so a category
 * with no links is still a drop target) — without this the hidden category
 * comes straight back as an empty column.
 */
export const getHiddenDashboardTermIds = () => (window.betterLinksGlobal?.dashboard_hidden_term_ids || []).map(Number);

/** `links` (the redux category → lists map) minus the hidden categories. */
export const withoutHiddenCategories = (links) => {
	const hidden = getHiddenDashboardTermIds();
	// Pass a falsy `links` straight through — callers use it to tell "not loaded
	// yet" apart from "loaded and empty".
	if (!links || !hidden.length) return links;
	return Object.fromEntries(Object.entries(links).filter(([catId]) => !hidden.includes(Number(catId))));
};

/**
 * Timestamp for a link's `link_date`, in local time.
 *
 * `link_date` reaches the app in two shapes: MySQL's "2026-08-09 13:41:04" and,
 * for links written by the admin UI, the unpadded "2026-8-9 13:41:4" that
 * `formatDate()` above emits. `new Date(string)` only accepts the
 * space-separated form as a V8 extension — Safari (and older Firefox) return
 * Invalid Date, which turns every date-range comparison into `false` and
 * silently empties the board. Splitting the parts by hand and building a
 * local-time Date makes both shapes parse the same way in every browser.
 *
 * Returns NaN for anything unparseable so callers can drop the row explicitly
 * instead of comparing against NaN.
 */
export const parseLinkDate = (value) => {
	if (value instanceof Date) return value.getTime();
	if (!value) return NaN;
	const parts = String(value).match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
	if (!parts) return new Date(value).getTime();
	return new Date(+parts[1], +parts[2] - 1, +parts[3], +(parts[4] || 0), +(parts[5] || 0), +(parts[6] || 0)).getTime();
};

// Local midnight `offset` days from today. Built by shifting the day component
// rather than adding 86_400_000ms so the boundaries stay on midnight across a
// DST change.
const startOfDayFromToday = (offset = 0) => {
	const now = new Date();
	return new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset).getTime();
};

export const linksFilterData = (stored, filterText, selectedCategory, selectedClicksType, selectedDateType, customDateFilter, sortByFav, selectedTag) => {
	let results = stored;
	results = stored.filter((item) => {
		const newFilterText = filterText
			.replace(/https?\:\/\//gi, '')
			.replace(/^[\/\\]+|[\/\\]+$/gi, '')
			.toLowerCase();
		const linkTitle = (item?.link_title || '').toLowerCase();
		const linkNote = (item?.link_note || '').toLowerCase();
		const targetUrl = (item?.target_url || '').replace(/https?\:\/\//gi, '').toLowerCase();
		const shortUrl = `${site_url}/${item?.short_url || ''}`.replace(/https?\:\/\//gi, '').toLowerCase();
		const tags_data = item.tags_data || [];
		return [linkTitle, linkNote, shortUrl, targetUrl, tags_data].some((item) => {
			if (Array.isArray(item)) {
				return item.some((tag) => tag?.term_name?.includes(newFilterText));
			}
			return item.includes(newFilterText);
		});
	});
	results = results.sort((a, b) => parseLinkDate(b.link_date) - parseLinkDate(a.link_date));
	if (selectedCategory && selectedCategory.value) {
		results = results.filter((item) => item.cat_id == selectedCategory.value);
	}
	if (selectedTag && selectedTag.value) {
		let total = [];
		for (let index = 0; index < results.length; index++) {
			const item = results[index];

			for (let jIndex = 0; jIndex < item?.tags_data?.length; jIndex++) {
				const element = item?.tags_data?.[jIndex];

				if (element.term_name === selectedTag.label) {
					total = [...total, item];
				}
			}
		}
		results = total;
	}
	if (selectedClicksType) {
		if (selectedClicksType.value == 'mostClicks') {
			results = results.filter((item) => item.analytic != undefined);
			results = results.sort((a, b) => (parseInt(a.analytic.link_count) < parseInt(b.analytic.link_count) ? 1 : -1));
		}
		if (selectedClicksType.value == 'leastClicks') {
			results = results.filter((item) => item.analytic != undefined);
			results = results.sort((a, b) => (parseInt(a.analytic.link_count) > parseInt(b.analytic.link_count) ? 1 : -1));
		}
		if (selectedClicksType.value == 'mostUniqueClicks') {
			results = results.filter((item) => item.analytic != undefined);
			results = results.sort((a, b) => (a.analytic.ip.length < b.analytic.ip.length ? 1 : -1));
		}
		if (selectedClicksType.value == 'leastUniqueClicks') {
			results = results.filter((item) => item.analytic != undefined);
			results = results.sort((a, b) => (a.analytic.ip.length > b.analytic.ip.length ? 1 : -1));
		}
	}

	if (selectedDateType) {
		if (selectedDateType.value == 'mostRecent') {
			results = results.sort((a, b) => parseLinkDate(b.link_date) - parseLinkDate(a.link_date));
		}
		if (selectedDateType.value == 'leastRecent') {
			results = results.sort((a, b) => parseLinkDate(a.link_date) - parseLinkDate(b.link_date));
		}

		// Every range below is a whole-day, inclusive window [start, end], so the
		// filter is decided by the calendar day a link was created on and never by
		// the time of day the filter happens to be applied.
		let start = null;
		let end = null;

		if (selectedDateType.value == 'custom') {
			// react-date-range hands back both ends at local midnight, so comparing
			// straight against `endDate` cut off the whole final day — picking a
			// single day matched nothing at all. Widen the end to that day's last ms.
			const range = customDateFilter && customDateFilter[0];
			if (range && range.startDate && range.endDate) {
				const from = new Date(range.startDate);
				const to = new Date(range.endDate);
				from.setHours(0, 0, 0, 0);
				to.setHours(23, 59, 59, 999);
				start = from.getTime();
				end = to.getTime();
			}
		}

		// Relative ranges (Yesterday / Last 7 / 30 / 90 days). "Last 7 days" means
		// the last 7 calendar days ending with today, matching the Analytics
		// ranges. The old code used a rolling `now - N*24h` window capped at `now`,
		// which both clipped the oldest day in half and dropped any link stamped
		// slightly ahead of the browser clock — i.e. everything created today
		// whenever the site's timezone runs ahead of the viewer's.
		const spans = { yesterday: 1, last7: 7, last30: 30, last90: 90 };
		if (spans[selectedDateType.value]) {
			const isYesterday = selectedDateType.value == 'yesterday';
			const days = spans[selectedDateType.value];
			start = isYesterday ? startOfDayFromToday(-1) : startOfDayFromToday(-(days - 1));
			end = (isYesterday ? startOfDayFromToday(0) : startOfDayFromToday(1)) - 1;
		}

		if (start !== null && end !== null) {
			results = results.filter((item) => {
				const linkDate = parseLinkDate(item.link_date);
				return !Number.isNaN(linkDate) && linkDate >= start && linkDate <= end;
			});
		}
	}
	if (sortByFav) {
		results = results.filter((item) => item.favorite?.favForAll);
	}
	results = results.filter((item) => item.ID);
	return results;
};

/**
 * Build the Manage Links board view: apply the active toolbar filters to each
 * category and derive the overview stats from the same filtered set, so the
 * board columns and the summary numbers always stay in sync.
 */
export const getFilteredLinksView = (links, filter = {}, categoryTerms = []) => {
	const { filterText = '', selectedCategory = null, selectedTag = null, selectedSort = null, selectedDate = null, customDateFilter = [], sortByFav = false } = filter;

	const filtersActive = !!(filterText || selectedCategory?.value || selectedTag?.value || selectedSort?.value || selectedDate?.value || sortByFav);

	// The /links endpoint only returns categories that currently have links, so
	// empty categories (which live in `terms`) would disappear after a refresh.
	// Merge them back in with empty lists so every category keeps its column.
	const hiddenTermIds = getHiddenDashboardTermIds();
	const linkEntries = Object.entries(links || {}).filter(([key]) => !hiddenTermIds.includes(Number(key)));
	const existingKeys = new Set(linkEntries.map(([key]) => `${key}`));
	const emptyCategoryEntries = (categoryTerms || [])
		.filter((term) => term && `${term.term_type}` === 'category' && !existingKeys.has(`${term.ID}`) && !hiddenTermIds.includes(Number(term.ID)))
		.map((term) => [`${term.ID}`, { term_name: term.term_name, term_slug: term.term_slug, lists: [] }]);
	const allEntries = [...linkEntries, ...emptyCategoryEntries];

	const groups = [];
	let flat = [];
	allEntries.forEach(([catId, cat]) => {
		const source = (cat.lists || []).filter((item) => item && item.ID && item.link_title);
		// Pristine view keeps the stored order so drag-and-drop indices stay valid;
		// only run the filter/sort pipeline once a filter is actually active.
		const lists = filtersActive ? linksFilterData(source, filterText, selectedCategory, selectedSort, selectedDate, customDateFilter, sortByFav, selectedTag) : source;
		const clicks = lists.reduce((sum, item) => sum + (parseInt(item?.analytic?.link_count) || 0), 0);
		groups.push([catId, { term_name: cat.term_name, term_slug: cat.term_slug, lists, clicks }]);
		flat = flat.concat(lists);
	});

	// Which columns to show: the pristine view keeps every category, empty ones
	// included, so each stays a drop target and can be added to — "Uncategorized"
	// is no exception, it is where a link with no category lands. Once any filter
	// is active, only show columns that still have matches.
	const visibleGroups = groups.filter(([, cat]) => (filtersActive ? cat.lists.length > 0 : true));

	// Order the board columns by the categories' saved `term_order`. `categoryTerms`
	// already arrives sorted by `term_order ASC` from the API, so mirror that order
	// here — otherwise columns fall back to numeric-cat-id order (JS object keys),
	// which ignores any manual reordering. Unknown categories sort to the end.
	const catOrderIndex = new Map((categoryTerms || []).map((term, i) => [`${term.ID}`, i]));
	visibleGroups.sort((a, b) => {
		const ai = catOrderIndex.has(`${a[0]}`) ? catOrderIndex.get(`${a[0]}`) : Number.MAX_SAFE_INTEGER;
		const bi = catOrderIndex.has(`${b[0]}`) ? catOrderIndex.get(`${b[0]}`) : Number.MAX_SAFE_INTEGER;
		return ai - bi;
	});

	const stats = {
		links: flat.length,
		categories: groups.filter(([, cat]) => cat.lists.length > 0).length,
		clicks: flat.reduce((sum, item) => sum + (parseInt(item?.analytic?.link_count) || 0), 0),
		active: flat.filter((item) => !item.link_status || item.link_status === 'publish').length,
		favorites: flat.filter((item) => item?.favorite?.favForAll).length,
	};

	return { groups: visibleGroups, stats, filtersActive };
};

export const insertOverlayElement = () => {
	var newNode = document.createElement('div');
	newNode.className = 'btl-overlay';
	document.body.appendChild(newNode);
};

export const removeOverlayElement = () => {
	var elem = document.querySelector('.btl-overlay');
	elem.parentNode.removeChild(elem);
};

export const delayStatusChanged = (firstStatus, secondStatus, thirdStatus, setState) => {
	if (firstStatus) {
		setState(firstStatus);
	}
	setTimeout(() => {
		if (secondStatus) {
			setState(secondStatus);
		}
		if (thirdStatus) {
			setTimeout(() => {
				setState(thirdStatus);
			}, 3000);
		}
	}, 1000);
};

export const getJsonString = (str) => {
	if (Array.isArray(str) || typeof str == 'object') return str;
	try {
		return JSON.parse(str);
	} catch (e) {
		return {};
	}
};

export const makeRequest = async (payload = {}) => {
	let form_data = new FormData();
	form_data.append('security', betterlinks_nonce);
	Object.entries(payload).forEach(([key, value]) => {
		if (typeof value === 'object' && value !== null) {
			form_data.append(key, JSON.stringify(value));
		} else {
			form_data.append(key, value);
		}
	});
	return await axios.post(ajaxurl, form_data).then(
		(response) => {
			return response;
		},
		(error) => {
			console.log(error);
		}
	);
};

export const getAutoLinksInitialValues = (data, autoLinkKeywordSettings) => {
	// Check if pro version is 2.6.1 or higher
	const canChangeStatus = is_pro_enabled && pro_version_check('2.6.1');
	
	if (Object.keys(data).length) {
		// Convert is_active (boolean/int) to keywordStatus (string)
		let keywordStatus = 'active';
		if (data.is_active !== undefined) {
			keywordStatus = (data.is_active == true || data.is_active == 1 || data.is_active == '1') ? 'active' : 'draft';
		}
		
		// Force active status if pro version requirement is not met
		if (!canChangeStatus) {
			keywordStatus = 'active';
		}
		
		return {
			keywords: data.keywords,
			oldKeywords: data.keywords,
			chooseLink: data.link_id,
			oldChooseLink: data.link_id,
			postType: data.post_type,
			category: data.category,
			tags: data.tags,
			openNewTab: data.open_new_tab,
			useNoFollow: data.use_no_follow,
			caseSensitive: data.case_sensitive,
			keywordBefore: data.keyword_before,
			keywordAfter: data.keyword_after,
			leftBoundary: data.left_boundary,
			rightBoundary: data.right_boundary,
			limit: data.limit,
			keywordStatus: keywordStatus,
		};
	}
	
	// Convert isActive setting to keywordStatus
	let defaultKeywordStatus = 'active';
	if (autoLinkKeywordSettings?.isActive !== undefined && canChangeStatus) {
		defaultKeywordStatus = autoLinkKeywordSettings.isActive ? 'active' : 'draft';
	}
	
	return {
		keywords: '',
		chooseLink: '',
		postType: autoLinkKeywordSettings?.postType || '',
		category: autoLinkKeywordSettings?.category || '',
		tags: autoLinkKeywordSettings?.tags || '',
		openNewTab: autoLinkKeywordSettings?.openNewTab || '',
		useNoFollow: autoLinkKeywordSettings?.useNoFollow || '',
		caseSensitive: autoLinkKeywordSettings?.caseSensitive || '',
		keywordBefore: autoLinkKeywordSettings?.keywordBefore || '',
		keywordAfter: autoLinkKeywordSettings?.keywordAfter || '',
		leftBoundary: autoLinkKeywordSettings?.leftBoundary || '',
		rightBoundary: autoLinkKeywordSettings?.rightBoundary || '',
		limit: autoLinkKeywordSettings?.limit || 100,
		keywordStatus: defaultKeywordStatus,
	};
};

export const trimmed = (str) => (typeof str === 'string' ? str : '').trim();

export const parseLinksForKeywordsListing = (data) =>
	data?.links
		? Object.values(data.links)
			.reduce((acc, curr) => [...acc, ...curr.lists], [])
			.map((item) => ({ value: item.ID, label: item.short_url }))
		: [];

export const parseLinksForUpdateModal = (data) =>
	data.links
		? Object.values(data.links)
			.reduce((acc, curr) => [...acc, ...curr.lists], [])
			.map((item) => ({ value: item.ID, label: item.link_title }))
		: [];

export const makeAllLinksArr = (store) =>
	store?.getState()?.links?.links
		? Object.values(store?.getState()?.links?.links).reduce((acc, curr) => [...acc, ...(curr?.lists || [])], [])
		: // if all links are not fetched properly then return false
		false;

export const makeLinkFormat = ({ url, linkNewTab, sponsored, noFollow, linkId }) => {
	const attributes = { url };
	let rel = '';

	if (linkNewTab) {
		attributes.target = '_blank';
		rel = 'noopener ';
	}

	if (sponsored) {
		rel += 'sponsored ';
	}

	if (noFollow) {
		rel += 'nofollow noindex ';
	}

	if (rel) {
		attributes.rel = rel;
	}

	if (linkId) {
		attributes['data-link-id'] = linkId;
	}

	const result = {
		type: 'betterlinks/link-format',
		attributes,
	};
	return result;
};

export const permalinkToShortUrl = (permalink) => {
	if (!permalink) return permalink;
	const short_url = permalink.replace((actual_site_url || site_url) + '/', '');
	return short_url.substring(0, short_url.length - +(short_url.lastIndexOf('/') == short_url.length - 1));
};

export const getLinkDataFromSettings = ({ settings, currentPost, short_url }) => {
	const currentDate = formatDate(new Date(), 'yyyy-mm-dd h:m:s');
	const params = {
		ID: '',
		cat_id: '',
		target_url: '',
		link_title: currentPost.title,
		link_slug: currentPost.slug,
		link_modified: currentDate,
		link_modified_gmt: currentDate,
		short_url: short_url,
		redirect_type: settings.redirect_type,
		nofollow: !!settings.nofollow,
		param_forwarding: !!settings.param_forwarding,
		sponsored: !!settings.sponsored,
		track_me: !!settings.track_me,
	};
	if (is_pro_enabled) {
		params.link_status = 'publish';
		params.expire = {
			status: false,
		};
	}
	return params;
};

export const add_top_loader = (document) => {
	document?.body?.classList?.add('betterlinks-loading-spinner-mounted');
	const loader = document?.createElement('div');
	loader.classList.add('betterlinks-top-loader-wrap');
	loader.innerHTML = `
		<div class="betterlinks-submitted-link-for-gutenberg">
			<div class="betterlinks-round-loader"></div>
		</div>
	`;
	document?.body?.prepend(loader);
};
export const remove_top_loader = (document) => {
	document?.body?.classList?.remove('betterlinks-loading-spinner-mounted');
	document?.querySelectorAll('.betterlinks-top-loader-wrap')?.forEach((item) => {
		item?.remove();
	});
};

/**
 * The slug checker used to answer with a bare boolean. It now reports *why* a
 * slug is unavailable — it is either taken by another link or it would shadow a
 * URL WordPress already serves — so normalise both shapes here and let callers
 * keep treating the resolved value as a boolean.
 */
const normalizeSlugCheck = (payload) => {
	if (payload && typeof payload === 'object') {
		return {
			exists: !!payload.exists,
			message: payload.message || __('Already Exists', 'betterlinks'),
			// The slug shadows WordPress content (not another link, not a system
			// path) and the user is allowed to confirm keeping it.
			overridable: !!payload.overridable,
		};
	}
	return {
		exists: !!payload,
		message: payload ? __('Already Exists', 'betterlinks') : '',
		overridable: false,
	};
};

/**
 * `allowWpUrlOverride` is the link form's "Redirect this path anyway" box: when
 * it is ticked, a collision the user may override no longer counts as a
 * duplicate, and the save carries `allow_wp_url_override` for the server.
 */
export const shortURLUniqueCheck = (slug, ID, setSlugIsExists, allowWpUrlOverride = false) => {
	if (!ajaxurl) {
		console.error('ajaxurl is not defined');
		return Promise.resolve(false);
	}
	let form_data = new FormData();
	form_data.append('action', 'betterlinks/admin/short_url_unique_checker');
	form_data.append('security', betterlinks_nonce);
	form_data.append('ID', ID);
	form_data.append('slug', slug);
	return axios.post(ajaxurl, form_data).then(
		(response) => {
			if (response.data) {
				const result = normalizeSlugCheck(response.data.data);
				setSlugIsExists(result.exists ? result : false);
				return result.exists && !(allowWpUrlOverride && result.overridable);
			}
		},
		(error) => {
			console.log(error);
		}
	);
};

export const shortURLUniqueCheckGutenberg = (slug, ID) => {
	if (!ajaxurl) {
		console.error('ajaxurl is not defined');
		return Promise.resolve(false);
	}
	let form_data = new FormData();
	form_data.append('action', 'betterlinks/admin/short_url_unique_checker');
	form_data.append('security', betterlinks_nonce);
	form_data.append('ID', ID);
	form_data.append('slug', slug);
	return axios.post(ajaxurl, form_data).then(
		(response) => {
			if (response.data) {
				return normalizeSlugCheck(response.data.data).exists;
			}
		},
		(error) => {
			console.log(error);
		}
	);
};

export const debounce = (func, delay) => {
	let timerId;

	return function (...args) {
		clearTimeout(timerId);

		timerId = setTimeout(() => {
			func.apply(this, args);
		}, delay);
	};
};
export const isListEmpty = (lists, sortByFav) => {
	return sortByFav ? !lists.filter((list) => list?.favorite?.favForAll).length : !lists.length;
};

export const getFavoriteLinkCount = (links) => {
	return (
		links &&
		Object.values(links).reduce((total, item) => {
			const count = item.lists.filter((list) => !!list?.favorite?.favForAll).length;
			return (total += count);
		}, 0)
	);
};

export const analytic = (analytic, ID) => {
	return <Link to={route_path + 'admin.php?page=betterlinks-analytics&id=' + ID}>{+analytic.link_count + '/' + +analytic.ip}</Link>;
};

export const saveSettingsHandler = (values, update_option, setFormSubmitText) => {
	const uncloakedCatOnSubmit = values?.uncloaked_categories;
	if (Array.isArray(uncloakedCatOnSubmit)) {
		values.uncloaked_categories = JSON.stringify(uncloakedCatOnSubmit?.map?.((item) => parseInt(item)));
	}
	const affiliatePosition = values?.affiliate_link_position;
	if (is_pro_enabled && !affiliatePosition) {
		values.affiliate_link_position = 'top';
	}
	if (is_pro_enabled && values?.affiliate_disclosure_text) {
		values.affiliate_disclosure_text = values.affiliate_disclosure_text.replace(/<span class="ql-cursor">(.*?)<\/span>/g, '');
	}
	if (is_pro_enabled && values?.password?.allow_contact_text) {
		values.password.allow_contact_text = values.password?.password?.allow_contact_text.replace(/<span class="ql-cursor">(.*?)<\/span>/g, '');
	}

	// immediately show saving state
	if (setFormSubmitText) setFormSubmitText(__('Saving...', 'betterlinks'));

	// call the action which returns a promise
	const promise = update_option(values);
	if (promise && promise.then) {
		promise
			.then(() => {
				// once the API returns successfully, update button text and show toast
				if (setFormSubmitText) {
					setFormSubmitText(__('Saved!', 'betterlinks'));
					// revert to default after a short delay
					setTimeout(() => {
						setFormSubmitText(__('Save Settings', 'betterlinks'));
					}, 3000);
				}
				toastSuccess(__('Your settings have been saved successfully.', 'betterlinks'), {
					title: __('Settings Saved', 'betterlinks'),
					position: 'top-right',
					duration: 3000,
				});
			})
			.catch(() => {
				// optionally handle error state here
				toastError(__('Failed to save settings', 'betterlinks'));
			});
	} else {
		// fallback if update_option isn't a promise
		if (setFormSubmitText) {
			// revert after old delay logic
			delayStatusChanged(__('Saving...', 'betterlinks'), __('Saved!', 'betterlinks'), __('Save Settings', 'betterlinks'), setFormSubmitText);
		}
		// still show toast
		toastSuccess(__('Your settings have been saved successfully.', 'betterlinks'), {
			title: __('Settings Saved', 'betterlinks'),
			position: 'top-right',
			duration: 3000,
		});
	}
};

export const getDataset = (data, uniqueIpCount) => {
	const clicks = Object.values(data.clicks || {});
	const clicksCount = clicks.reduce((acc, cur) => acc + +cur, 0);
	const uniqueClicks = Object.values(data?.unique_clicks || { unique_clicks: {} })?.reverse?.();

	const dataset = [
		{
			name: __('Clicks', 'betterlinks') + `<span> - ${clicksCount || ''}</span>`,
			data: clicks?.reverse?.(),
		},
		{
			name: __('Unique Clicks', 'betterlinks') + `<span> - ${uniqueIpCount || ''}</span>`,
			data: uniqueClicks,
		},
	];
	return dataset;
};

export const sortFunction = (title) => (rowA, rowB) => {
	if (['total_clicks', 'unique_clicks'].includes(title)) {
		if (+rowA[title] > +rowB[title]) return 1;
		else if (+rowB[title] > +rowA[title]) return -1;
		return 0;
	}
	const a = rowA[title]?.toLowerCase() || '';
	const b = rowB[title]?.toLowerCase() || '';
	if (a > b) return 1;
	else if (b > a) return -1;
	return 0;
};

/**
 * Human-readable labels for the keys stored inside a click's `query_params`
 * JSON object.
 */
export const QUERY_PARAM_LABELS = {
	pf: __('Forwarded', 'betterlinks'),
	target_url: __('Target URL', 'betterlinks'),
	utm: __('UTM', 'betterlinks'),
};

/**
 * A click's `query_params` column is stored as a JSON object string, e.g.
 * `{"pf":"a=1","utm":"utm_source=x"}`. Parse it into readable, labelled rows so
 * the analytics tables render "Forwarded: a=1" instead of a raw `{"pf":"…"}` blob.
 *
 * @param {string|Object} raw The stored value.
 * @return {{entries: Array<[string,string]>}|{text: string}} Labelled entries for
 *   a JSON object (empty values dropped), or `{ text }` when the value isn't a
 *   JSON object (a legacy/plain string) so callers can render it verbatim.
 */
export const parseQueryParams = (raw) => {
	if (raw === null || raw === undefined || raw === '') return { entries: [] };
	let obj = raw;
	if (typeof raw === 'string') {
		const trimmed = raw.trim();
		if (trimmed === '') return { entries: [] };
		try {
			obj = JSON.parse(trimmed);
		} catch (e) {
			return { text: raw };
		}
	}
	if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
		return { text: String(raw) };
	}
	const entries = Object.keys(obj)
		.filter((key) => obj[key] !== '' && obj[key] !== null && obj[key] !== undefined)
		.map((key) => [QUERY_PARAM_LABELS[key] || key, String(obj[key])]);
	return { entries };
};

export const getColumns = (analytics, analyticsTab, id = null, onCountryUpdated = null) => {
	if (!!id) {
		const singleColumn = [
			{
				name: __('Browser', 'betterlinks'),
				selector: 'browser',
				sortable: true,
				width: '100px',
				cell: (row) => {
					const browser = getBrowser(row.browser);
					const title = (browser?.charAt(0) || '')?.toUpperCase() + browser?.slice(1);
					return (
						<div>
							<img width="25" src={`${plugin_root_url}assets/images/browser/${browser}-browser.svg`} alt="icon" title={title} />
						</div>
					);
				},
			},
			{
				name: __('IP', 'betterlinks'),
				selector: 'ip',
				sortable: true,
				// sort by IPCOUNT rather than the string representation of IP
				sortFunction: (rowA, rowB) => {
					const a = +rowA.IPCOUNT || 0;
					const b = +rowB.IPCOUNT || 0;
					return a - b;
				},
				cell: (row) => <div>{row.ip + '(' + row.IPCOUNT + ')'}</div>,
			},
			{
				name: (
					<>
						{__('User Agent', 'betterlinks')}
						<ProBadge />
					</>
				),
				selector: 'user_agent',
				width: '300px',
				sortable: false,
				// Locked preview; implemented in BetterLinks Pro via `betterLinksAnalyticsColumns`.
				pro: true,
				cell: () => null,
			},
			{
				name: (
					<>
						{__('Country', 'betterlinks')}
						<ProBadge />
					</>
				),
				selector: 'country_name',
				width: '180px',
				sortable: false,
				// Locked preview; implemented in BetterLinks Pro via `betterLinksAnalyticsColumns`.
				pro: true,
				cell: () => null,
			},
			{
				name: __('Timestamp', 'betterlinks'),
				selector: 'created_at',
				sortable: true,
			},
			{
				name: __('Referrer', 'betterlinks'),
				selector: 'referer',
				width: '300px',
				sortable: true,
				cell: (row) => (
					<div>
						<div style={{ fontWeight: 700 }}>
							<a href={row.referer} target="_blank">
								{row.referer}
							</a>
						</div>
					</div>
				),
			},
			{
				name: (
					<>
						{__('Parameters', 'betterlinks')}
						<ProBadge />
					</>
				),
				selector: 'query_params',
				width: '350px',
				sortable: false,
				// Locked preview; implemented in BetterLinks Pro via `betterLinksAnalyticsColumns`.
				pro: true,
				cell: () => null,
			},
			{
				name: (
					<>
						{__('OS', 'betterlinks')}
						{!is_pro_enabled && <ProBadge />}
					</>
				),
				selector: 'os',
				width: '100px',
				cell: (row) => {
					if (!is_pro_enabled) {
						return;
					}
					return <div>{row.os}</div>;
				},
				sortable: true,
			},
			{
				name: (
					<>
						{__('Device', 'betterlinks')}
						{!is_pro_enabled && <ProBadge />}
					</>
				),
				selector: 'device',
				width: '80px',
				cell: (row) => {
					if (!is_pro_enabled) {
						return;
					}
					const title = row.device === 'desktop' ? 'Computer' : row.device?.charAt(0).toUpperCase() + row.device?.slice(1);
					return <div>{row.device && <img width="25" src={`${plugin_root_url}assets/images/devices/${getDevice(row.device)}.svg`} alt="icon" title={title} />}</div>;
				},
				sortable: false,
			},
		];

		const analyticsArr = [...Object.values(analytics || {}).map((item) => item.value)];
		// Extension point: BetterLinks Pro replaces the locked `user_agent`,
		// `country_name` and `query_params` columns with working ones.
		const extendedColumns = betterLinksHooks.applyFilters('betterLinksAnalyticsColumns', singleColumn, {
			linkId: id,
			onCountryUpdated,
			analytics,
			enableUserAgentTracking: !!(betterlinks_settings?.enable_user_agent_tracking || window.betterLinksGlobal?.betterlinks_settings?.enable_user_agent_tracking),
		});
		return (Array.isArray(extendedColumns) ? extendedColumns : singleColumn).filter((item) => analyticsArr.includes(item.selector));
	}
	const columns = [
		{
			name: __('Link Name', 'betterlinks'),
			selector: 'name',
			id: 'name',
			sortable: true,
			cell: (row) => <div>{row.link_title}</div>,
		},
		{
			name: __('Shortened URL', 'betterlinks'),
			selector: 'short_url',
			sortable: false,
			cell: (row) => (
				<div>
					<div style={{ fontWeight: 700 }}>
						<a href={site_url + '/' + row.short_url} target="_blank">
							{site_url + '/' + row.short_url}
						</a>
					</div>
				</div>
			),
		},
		{
			name: __('Target URL', 'betterlinks'),
			selector: 'target_url',
			cell: (row) => (
				<div>
					<div style={{ fontWeight: 700 }}>
						<a href={row.target_url} target="_blank">
							{row.target_url}
						</a>
					</div>
				</div>
			),
			sortable: false,
		},
		{
			name: __('Total Clicks', 'betterlinks'),
			selector: 'total_clicks',
			width: '150px',
			...(is_extra_data_tracking_compatible && { sortFunction: sortFunction('total_clicks') }),
			cell: (row) => <div>{row?.total_clicks || 0}</div>,
		},
		{
			name: __('Unique Clicks', 'betterlinks'),
			selector: 'unique_clicks',
			width: '150px',
			...(is_extra_data_tracking_compatible && { sortFunction: sortFunction('unique_clicks') }),
			cell: (row) => <div>{row?.unique_clicks || 0}</div>,
		},
		{
			name: __('Action', 'betterlinks'),
			selector: 'action',
			sortable: false,
			width: '100px',
			cell: (row) => {
				return <Link to={`${route_path}admin.php?page=betterlinks-analytics&id=${row.link_id}`}>Details</Link>;
			},
		},
	];
	return columns;
};

export const analyticsColumnData = [
	{
		name: __('BrowseKK', 'betterlinks'),
		selector: 'browser',
	},
	{
		name: __('Link Name jm', 'betterlinks'),
		selector: 'name',
	},
	{
		name: __('IP', 'betterlinks'),
		selector: 'ip',
	},
	{
		name: __('Country', 'betterlinks'),
		selector: 'country_name',
	},
	{
		name: __('User Agent', 'betterlinks'),
		selector: 'user_agent',
	},
	{
		name: __('Timestamp', 'betterlinks'),
		selector: 'created_at',
	},
	{
		name: __('Shortened URL', 'betterlinks'),
		selector: 'short_url',
	},
	{
		name: __('Referer', 'betterlinks'),
		selector: 'referer',
	},
	{
		name: __('Target URL', 'betterlinks'),
		selector: 'target_url',
	},
];

export const get_labels = (clicks) => {
	const labels = Object.keys(clicks)
		?.reverse?.()
		?.map?.((item) => {
			const splitted = item.split('-');
			return `${splitted[1]}-${splitted[2]}-${splitted[0]}`;
		});
	return labels;
};

export const pro_version_check = (version, compare = '>=') => {
	if (!betterlinkspro_version) return true;
	if (!version) return false;

	const pro_v_arr = betterlinkspro_version.split('.');
	const v_arr = version.split('.');

	if (+pro_v_arr[0] > +v_arr[0]) {
		return true;
	}

	const lastPartofProPlugin = parseFloat(betterlinkspro_version?.slice(2));
	const lastPartofCheckVersion = parseFloat(version?.slice(2));

	return eval(lastPartofProPlugin + compare + lastPartofCheckVersion);

	// return betterlinkspro_version ? parseFloat(betterlinkspro_version?.slice(2)) : null;
};

/**
 * Strict "installed Pro is at least `version`" check.
 *
 * Unlike `pro_version_check` — which returns true when Pro is absent and, because
 * it compares only `slice(2)` after the major digit, mis-handles major-version
 * bumps (e.g. it reports 2.8.0 as >= 3.0.0) — this returns false when Pro is not
 * installed and compares every version part numerically, so it is safe across the
 * 2.x → 3.x jump. Use it for features that require a specific new Pro release.
 *
 * @param {string} version Minimum required Pro version, e.g. '3.0.0'.
 * @returns {boolean}
 */
export const is_pro_version_atleast = (version) => {
	if (!is_pro_enabled || !betterlinkspro_version || !version) return false;

	const installed = String(betterlinkspro_version).split('.').map((n) => parseInt(n, 10) || 0);
	const required = String(version).split('.').map((n) => parseInt(n, 10) || 0);

	for (let i = 0; i < Math.max(installed.length, required.length); i++) {
		const a = installed[i] || 0;
		const b = required[i] || 0;
		if (a > b) return true;
		if (a < b) return false;
	}
	return true; // equal
};

export const get_tags = (links) => {
	const tags = {};
	links &&
		Object.values(links)
			.map((item) => item.lists)
			.flat()
			.filter((item) => item.tags_data?.length)
			.map((item) => item.tags_data)
			.flat()
			.map((item) => {
				if (!tags?.[item.term_id]) {
					tags[item.term_id] = item.term_slug;
				}
			});

	return tags;
};

export const sortByClicksTag = (type = '', tags, tag_analytics) => {
	const [analyticsType, sortType] = type.split('-');
	if (!analyticsType || !sortType) return tags;

	let sortedTags = _.orderBy(tags, (item) => {
		// Handle both item.id and item.ID cases
		const itemId = item.id || item.ID;
		return +tag_analytics[analyticsType][itemId] || +tag_analytics[analyticsType][String(itemId)] || 0;
	});

	if ('desc' === sortType) {
		sortedTags = _.reverse(sortedTags);
	}
	return sortedTags;
};

export const sortByClicksCategory = (type = '', categories, category_analytics) => {
	const [analyticsType, sortType] = type.split('-');
	if (!analyticsType || !sortType) return categories;

	let sortedCategories = _.orderBy(categories, (item) => {
		// Handle both item.id and item.ID cases
		const itemId = item.id || item.ID;
		return +category_analytics[analyticsType][itemId] || +category_analytics[analyticsType][String(itemId)] || 0;
	});

	if ('desc' === sortType) {
		sortedCategories = _.reverse(sortedCategories);
	}
	return sortedCategories;
};

export const paginationPerPageCount = [10, 30, 50, 100, 200, 500];

export const getDevice = (device) => {
	if (['smartphone', 'phablet', 'feature phone'].includes(device)) return 'mobile';
	return device;
};
