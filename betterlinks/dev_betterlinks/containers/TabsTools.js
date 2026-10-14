import axios from 'axios';
import React, { useState, useEffect, useRef } from 'react';
import Modal from 'react-modal';
import { __, sprintf } from '@wordpress/i18n';
import { nonce, betterlinks_nonce, migratable_plugins, plugin_root_url, ajaxurl } from 'utils/helper';
import { toastSuccess, toastError, toastWarning } from 'components/Toast';

const EXPORT_OPTIONS = [
	{ value: 'links', label: __('Links', 'betterlinks'), description: __('All shortlinks, redirects & tags', 'betterlinks') },
	{ value: 'clicks', label: __('Analytics', 'betterlinks'), description: __('Click data, locations & referrers', 'betterlinks') },
	{ value: 'simplecsvfile', label: __('Sample CSV File', 'betterlinks'), description: __('Use as a template for new imports', 'betterlinks') },
];

const IMPORT_OPTIONS = [
	{ value: 'default', label: __('BetterLinks', 'betterlinks'), description: __('Restore from a BetterLinks export', 'betterlinks') },
	{ value: 'prettylinks', label: __('Pretty Links', 'betterlinks'), description: __('Migrate from Pretty Links plugin', 'betterlinks') },
	{ value: 'simple301redirects', label: __('Simple 301 Redirects', 'betterlinks'), description: __('Import existing 301 rules', 'betterlinks') },
	{ value: 'thirstyaffiliates', label: __('ThirstyAffiliates', 'betterlinks'), description: __('Import affiliate cloaked links', 'betterlinks') },
];

// Canonical 27-column shape the default BetterLinks importer expects per row.
// BLImportCSV gates link imports on `in_array( count($item), [24,25,26,27] )`,
// so any rewritten CSV must emit every column (in this order) with empty
// strings for cells the user didn't map.
const BL_LINK_COLUMNS = [
	'ID',
	'link_author',
	'link_date',
	'link_date_gmt',
	'link_title',
	'link_slug',
	'link_note',
	'link_status',
	'nofollow',
	'sponsored',
	'track_me',
	'param_forwarding',
	'param_struct',
	'redirect_type',
	'target_url',
	'short_url',
	'link_order',
	'link_modified',
	'link_modified_gmt',
	'wildcards',
	'expire',
	'dynamic_redirect',
	'favorite',
	'uncloaked',
	'tags',
	'category',
	'auto_link_keywords',
];

// Expected CSV column schema per importer mode. `key` is the exact header name
// the PHP importer expects. `positional: true` means the importer reads by
// column index and skips header validation entirely (no mapping needed).
// `rebuildRow: true` means we re-emit each row in a canonical column order
// (required for the default BL importer which enforces a strict column count).
const FIELD_SCHEMA = {
	default: {
		positional: false,
		rebuildRow: true,
		canonicalColumns: BL_LINK_COLUMNS,
		fields: [
			{ key: 'link_title', label: __('Link Title', 'betterlinks'), required: true, tooltip: __('A friendly name to identify this link in your BetterLinks dashboard.', 'betterlinks') },
			{ key: 'short_url', label: __('Short URL Slug', 'betterlinks'), required: true, expectedType: 'slug', tooltip: __('The short path visitors will use, e.g. "go/my-link". Just the path — no domain.', 'betterlinks') },
			{ key: 'target_url', label: __('Target URL', 'betterlinks'), required: true, expectedType: 'url', tooltip: __('Where visitors land when they click the short link. Paste a complete web address, e.g. https://example.com/your-page.', 'betterlinks') },
			{ key: 'link_slug', label: __('Link Slug (WP slug)', 'betterlinks'), required: false, tooltip: __('Optional WordPress slug used internally. Leave on Default to auto-generate from the short URL.', 'betterlinks'), defaultValue: '', defaultLabel: __('auto-generate', 'betterlinks') },
			{ key: 'redirect_type', label: __('Redirect Type', 'betterlinks'), required: false, tooltip: __('How the redirect is sent: 301, 302, or 307. Leave on Default to use your site setting.', 'betterlinks'), defaultValue: '301', defaultLabel: '301' },
			{ key: 'nofollow', label: __('No Follow', 'betterlinks'), required: false, tooltip: __('Adds rel="nofollow" so search engines don\'t pass link credit. Use 1 / 0 or yes / no.', 'betterlinks'), defaultValue: '0', defaultLabel: __('No', 'betterlinks') },
			{ key: 'sponsored', label: __('Sponsored', 'betterlinks'), required: false, tooltip: __('Adds rel="sponsored" for paid or affiliate links. Use 1 / 0 or yes / no.', 'betterlinks'), defaultValue: '0', defaultLabel: __('No', 'betterlinks') },
			{ key: 'track_me', label: __('Track Clicks', 'betterlinks'), required: false, tooltip: __('Record clicks for analytics. Use 1 / 0 or yes / no.', 'betterlinks'), defaultValue: '1', defaultLabel: __('Yes', 'betterlinks') },
			{ key: 'param_forwarding', label: __('Parameter Forwarding', 'betterlinks'), required: false, tooltip: __('Passes URL query parameters through to the target URL. Use 1 / 0 or yes / no.', 'betterlinks'), defaultValue: '0', defaultLabel: __('No', 'betterlinks') },
			{ key: 'tags', label: __('Tags', 'betterlinks'), required: false, tooltip: __('Comma-separated tags to organize links, e.g. "affiliate, summer-sale".', 'betterlinks'), defaultValue: '', defaultLabel: __('None', 'betterlinks') },
			{ key: 'category', label: __('Categories', 'betterlinks'), required: false, tooltip: __('Comma-separated categories to group links, e.g. "Marketing, Products".', 'betterlinks'), defaultValue: '', defaultLabel: __('None', 'betterlinks') },
			{ key: 'expire', label: __('Expiry', 'betterlinks'), required: false, tooltip: __('Optional date when the link should stop working. Format: YYYY-MM-DD HH:MM:SS.', 'betterlinks'), defaultValue: '', defaultLabel: __('Never', 'betterlinks') },
			{ key: 'link_note', label: __('Notes', 'betterlinks'), required: false, tooltip: __('Private notes about this link, visible only inside BetterLinks.', 'betterlinks'), defaultValue: '', defaultLabel: __('None', 'betterlinks') },
			{ key: 'link_date', label: __('Created Date', 'betterlinks'), required: false, tooltip: __('When the link was first created. Format: YYYY-MM-DD HH:MM:SS. Leave on Default to use today.', 'betterlinks'), defaultValue: '', defaultLabel: __('Today', 'betterlinks') },
			{ key: 'link_modified', label: __('Modified Date', 'betterlinks'), required: false, tooltip: __('When the link was last updated. Format: YYYY-MM-DD HH:MM:SS. Leave on Default to use today.', 'betterlinks'), defaultValue: '', defaultLabel: __('Today', 'betterlinks') },
		],
	},
	prettylinks: {
		positional: false,
		fields: [
			{ key: 'name', label: __('Name', 'betterlinks'), required: true, tooltip: __('A friendly name to identify this link.', 'betterlinks') },
			{ key: 'slug', label: __('Slug', 'betterlinks'), required: true, expectedType: 'slug', tooltip: __('The short path used in the URL, e.g. "deal". No domain — just the path.', 'betterlinks') },
			{ key: 'url', label: __('Target URL', 'betterlinks'), required: true, expectedType: 'url', tooltip: __('Select the destination URL for this link — e.g. https://example.com/page', 'betterlinks') },
			{ key: 'nofollow', label: __('No Follow', 'betterlinks'), required: false, tooltip: __('Adds rel="nofollow". Use 1 / 0 or yes / no.', 'betterlinks'), defaultValue: '0', defaultLabel: __('No', 'betterlinks') },
			{ key: 'sponsored', label: __('Sponsored', 'betterlinks'), required: false, tooltip: __('Adds rel="sponsored" for paid or affiliate links.', 'betterlinks'), defaultValue: '0', defaultLabel: __('No', 'betterlinks') },
			{ key: 'track_me', label: __('Track Me', 'betterlinks'), required: false, tooltip: __('Record clicks for analytics. Use 1 / 0 or yes / no.', 'betterlinks'), defaultValue: '1', defaultLabel: __('Yes', 'betterlinks') },
			{ key: 'param_forwarding', label: __('Parameter Forwarding', 'betterlinks'), required: false, tooltip: __('Pass URL query parameters through to the target. Use 1 / 0 or yes / no.', 'betterlinks'), defaultValue: '0', defaultLabel: __('No', 'betterlinks') },
			{ key: 'redirect_type', label: __('Redirect Type', 'betterlinks'), required: false, tooltip: __('How the redirect is sent: 301, 302, or 307.', 'betterlinks'), defaultValue: '301', defaultLabel: '301' },
			{ key: 'link_categories', label: __('Categories', 'betterlinks'), required: false, tooltip: __('Comma-separated categories to group links.', 'betterlinks'), defaultValue: '', defaultLabel: __('None', 'betterlinks') },
			{ key: 'keywords', label: __('Keywords', 'betterlinks'), required: false, tooltip: __('Keywords used by Pretty Links for auto-linking.', 'betterlinks'), defaultValue: '', defaultLabel: __('None', 'betterlinks') },
		],
	},
	simple301redirects: {
		positional: false,
		fields: [
			{ key: 'request', label: __('Source URL', 'betterlinks'), required: true, expectedType: 'slug', tooltip: __('The path on your site to redirect from, e.g. "/old-page". No domain needed.', 'betterlinks') },
			{ key: 'destination', label: __('Destination URL', 'betterlinks'), required: true, expectedType: 'url', tooltip: __('Select the destination URL for this link - e.g. https://example.com/page', 'betterlinks') },
		],
	},
	thirstyaffiliates: {
		positional: true,
		fields: [],
	},
};

const importModalStyles = {
	overlay: {
		background: 'rgba(35, 40, 45, 0.62)',
		zIndex: '99999',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
	},
	content: {
		position: 'relative',
		top: 'auto',
		left: 'auto',
		right: 'auto',
		bottom: 'auto',
		maxWidth: '720px',
		width: '90%',
		margin: '0',
		padding: '0',
		border: 'none',
		borderRadius: '12px',
		boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
		transform: 'none',
		maxHeight: '90vh',
		overflow: 'hidden',
	},
};

const fetchImportInfo = () =>
	axios.post(`${ajaxurl}?action=betterlinks/tools/get_import_info&security=${nonce}`).then(
		(response) => {
			try {
				return JSON.parse(response.data.data);
			} catch (e) {
				return {};
			}
		},
		() => ({})
	);

// Parse a single CSV line respecting quoted fields with escaped quotes.
const parseCSVLine = (line) => {
	const result = [];
	let current = '';
	let inQuotes = false;
	for (let i = 0; i < line.length; i++) {
		const char = line[i];
		const next = line[i + 1];
		if (char === '"') {
			if (inQuotes && next === '"') {
				current += '"';
				i++;
			} else {
				inQuotes = !inQuotes;
			}
		} else if (char === ',' && !inQuotes) {
			result.push(current);
			current = '';
		} else {
			current += char;
		}
	}
	result.push(current);
	return result.map((v) => v.replace(/^"(.*)"$/, '$1').trim());
};

// Read enough of a CSV file to extract its header row plus a handful of data
// rows used to infer per-column types (slug vs URL) for mapping warnings.
const parseCsvPreview = (file, maxSampleRows = 5) =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			const text = String(e.target?.result || '');
			const lines = text.split(/\r?\n/).filter((l) => l && l.trim() !== '');
			const headers = parseCSVLine(lines[0] || '');
			const sampleRows = lines.slice(1, 1 + maxSampleRows).map(parseCSVLine);
			resolve({ headers, sampleRows });
		};
		reader.onerror = () => reject(new Error('Failed to read file'));
		reader.readAsText(file.slice(0, 64 * 1024));
	});

// Validation Target URl's
const isValidUrlValue = (input) => {
	const v = String(input == null ? '' : input).trim();

	if (!v) return false;
	if (v.includes(' ')) return false;

	// Ignore query string and fragment
	const cleanUrl = v.split('?')[0].split('#')[0];

	const pattern =
		'^(https?:\\/\\/)?' +
		'((([a-zA-Z\\d]([a-zA-Z\\d-]{0,61}[a-zA-Z\\d])*\\.)+' +
		'[a-zA-Z]{2,13})' +
		'|((\\d{1,3}\\.){3}\\d{1,3})' +
		'|localhost)' +
		'(\\:\\d{1,5})?' +
		'(\\/[a-zA-Z\\&\\d%_.~+\\-:@]*)*$';

	return new RegExp(pattern).test(cleanUrl);
};

//A "slug" is a short path-shaped token with no spaces, no protocol, and no
// domain. We deliberately allow forward-slashes so things like "go/my-link"
// pass. Anything that already looks like a full URL (has protocol, "://",
// or a TLD) is rejected — those belong in Target URL, not Short URL Slug.
const URL_PROTOCOL_PATTERN = /^(https?:)?\/\//i;
const TLD_PATTERN = /\b[a-z0-9-]+\.(com|org|net|io|co|uk|gov|edu|info|biz|dev|app|me|us|ca|au|de|fr|jp|in|cn|ai|xyz|tech|store|online|site|shop|page|blog|news)\b/i;

const isValidSlugValue = (input) => {
	const v = String(input == null ? '' : input).trim();
	if (!v) return false;
	if (v.includes(' ')) return false;
	if (v.length > 120) return false;
	if (URL_PROTOCOL_PATTERN.test(v) || v.includes('://')) return false;
	if (TLD_PATTERN.test(v)) return false;
	return /^[a-z0-9][a-z0-9._\-/]*$/i.test(v);
};

// Classify a single non-empty cell against the expected type for a field.
// Returns 'match' (value is valid for expectedType), 'wrong-shape' (clearly
// wrong — e.g. free text in a URL column, or a URL in a slug column), or
// 'empty' (skip from tallying).
const classifyCellForExpected = (raw, expectedType) => {
	const v = String(raw == null ? '' : raw).trim();
	if (!v) return 'empty';
	if (expectedType === 'url') {
		return isValidUrlValue(v) ? 'match' : 'wrong-shape';
	}
	if (expectedType === 'slug') {
		return isValidSlugValue(v) ? 'match' : 'wrong-shape';
	}
	return 'match';
};

// Tally the sample rows for one CSV column against the expected type for the
// BetterLinks field it was mapped to. Returns counts plus whether the sample
// gives us enough confidence to warn.
const analyzeColumnForExpected = (sampleRows, columnIndex, expectedType) => {
	const result = { match: 0, wrongShape: 0, nonEmpty: 0, hasSpace: false, looksLikeUrl: false };
	if (!Array.isArray(sampleRows) || columnIndex < 0 || !expectedType) return result;
	sampleRows.forEach((row) => {
		const raw = row?.[columnIndex];
		const v = String(raw == null ? '' : raw).trim();
		if (!v) return;
		result.nonEmpty++;
		if (v.includes(' ')) result.hasSpace = true;
		if (URL_PROTOCOL_PATTERN.test(v) || v.includes('://') || TLD_PATTERN.test(v)) {
			result.looksLikeUrl = true;
		}
		const c = classifyCellForExpected(raw, expectedType);
		if (c === 'match') result.match++;
		else if (c === 'wrong-shape') result.wrongShape++;
	});
	return result;
};

// Check whether a CSV's headers satisfy the schema for the selected mode.
const validateHeaders = (mode, headers) => {
	const schema = FIELD_SCHEMA[mode];
	if (!schema || schema.positional) {
		return { needsMapping: false, missingRequired: [], headers };
	}
	if (!headers || headers.length === 0) {
		return { needsMapping: true, missingRequired: schema.fields.filter((f) => f.required).map((f) => f.key), headers: [] };
	}

	const normalize = (s) => String(s || '').toLowerCase().trim().replace(/\s+/g, '_');
	const normalizedHeaders = headers.map(normalize);

	const missingRequired = schema.fields
		.filter((f) => f.required)
		.filter((f) => !normalizedHeaders.includes(normalize(f.key)))
		.map((f) => f.key);

	return { needsMapping: missingRequired.length > 0, missingRequired, headers };
};

// Rebuild the entire CSV based on the schema for the selected mode:
//   - If the schema declares `rebuildRow`, emit a full canonical-shape row
//     per record (every column the importer expects, in order, with empty
//     strings for unmapped cells). This is required for the default BL
//     importer which enforces a strict 24–27 column count per row.
//   - Otherwise just rename the header row so mapped columns get the
//     expected key names; data rows are passed through untouched.
const rewriteCsvWithMapping = (file, mapping, mode) =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const text = String(e.target?.result || '');
				const lines = text.split(/\r?\n/);
				const originalHeaders = parseCSVLine(lines[0] || '');
				const schema = FIELD_SCHEMA[mode] || {};
				const escape = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;

				// Build a `key -> default value` map for unmapped optional fields
				// so the rewritten CSV emits sensible defaults (e.g. "301" for
				// redirect_type, "0" for nofollow) instead of empty cells.
				const defaultsByKey = {};
				(schema.fields || []).forEach((f) => {
					if (f.required) return;
					if (mapping[f.key]) return;
					if (f.defaultValue !== undefined && f.defaultValue !== '') {
						defaultsByKey[f.key] = f.defaultValue;
					}
				});

				if (schema.rebuildRow && Array.isArray(schema.canonicalColumns)) {
					// Build a lookup: canonical column key → original column index
					// (only populated for columns the user actually mapped).
					const canonicalToIndex = {};
					Object.entries(mapping).forEach(([expectedKey, csvColumn]) => {
						if (!csvColumn) return;
						const idx = originalHeaders.findIndex((h) => h === csvColumn);
						if (idx !== -1) canonicalToIndex[expectedKey] = idx;
					});

					const headerLine = schema.canonicalColumns.map(escape).join(',');
					const dataLines = [];
					for (let i = 1; i < lines.length; i++) {
						const line = lines[i];
						if (!line || !line.trim()) continue;
						const cells = parseCSVLine(line);
						const newRow = schema.canonicalColumns.map((canonicalKey) => {
							const srcIdx = canonicalToIndex[canonicalKey];
							if (srcIdx !== undefined) {
								return cells[srcIdx] != null ? cells[srcIdx] : '';
							}
							// Column wasn't mapped — fill with schema default if defined.
							if (Object.prototype.hasOwnProperty.call(defaultsByKey, canonicalKey)) {
								return defaultsByKey[canonicalKey];
							}
							return '';
						});
						dataLines.push(newRow.map(escape).join(','));
					}

					const blob = new Blob([[headerLine, ...dataLines].join('\n')], { type: 'text/csv' });
					resolve(new File([blob], file.name, { type: 'text/csv' }));
					return;
				}

				// Default path: rename header cells, then append synthetic
				// columns carrying default values for unmapped optional fields
				// so the downstream importer sees consistent data.
				const indexToNewKey = {};
				Object.entries(mapping).forEach(([expectedKey, csvColumn]) => {
					if (!csvColumn) return;
					const idx = originalHeaders.findIndex((h) => h === csvColumn);
					if (idx !== -1) indexToNewKey[idx] = expectedKey;
				});

				const newHeaders = originalHeaders.map((h, i) =>
					Object.prototype.hasOwnProperty.call(indexToNewKey, i) ? indexToNewKey[i] : h
				);

				const defaultKeys = Object.keys(defaultsByKey);
				const finalHeaders = newHeaders.concat(defaultKeys);
				const defaultSuffixRaw = defaultKeys.map((k) => defaultsByKey[k]);
				const defaultSuffix = defaultSuffixRaw.length > 0
					? ',' + defaultSuffixRaw.map(escape).join(',')
					: '';

				const newHeaderLine = finalHeaders.map(escape).join(',');
				const rewrittenDataLines = lines.slice(1).map((line) => {
					if (!line || !line.trim()) return line;
					return line + defaultSuffix;
				});
				const newContent = [newHeaderLine, ...rewrittenDataLines].join('\n');

				const blob = new Blob([newContent], { type: 'text/csv' });
				resolve(new File([blob], file.name, { type: 'text/csv' }));
			} catch (err) {
				reject(err);
			}
		};
		reader.onerror = () => reject(new Error('Failed to read file'));
		reader.readAsText(file);
	});

// Read a (possibly rewritten) CSV File into its header line plus the list of
// non-empty data lines. Every BetterLinks importer (default, prettylinks,
// simple301redirects, thirstyaffiliates) skips the first CSV row as a header,
// so re-prepending this header to each chunk yields a self-contained CSV the
// importer can process on its own. (Line splitting matches the rest of this
// file, which assumes cells contain no embedded newlines.)
const readCsvLines = (file) =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			const text = String(e.target?.result || '');
			const lines = text.split(/\r?\n/);
			const headerLine = lines.length ? lines[0] : '';
			const dataLines = lines.slice(1).filter((l) => l && l.trim() !== '');
			resolve({ headerLine, dataLines });
		};
		reader.onerror = () => reject(new Error('Failed to read file'));
		reader.readAsText(file);
	});

// Merge one batch's import-info payload (buckets of log-line strings, e.g.
// { links: [...], clicks: [...] }) into a running accumulator so the final
// summary reflects every chunk, not just the last one.
const mergeImportDetails = (acc, batch) => {
	if (!batch || typeof batch !== 'object') return acc;
	Object.entries(batch).forEach(([bucket, value]) => {
		if (Array.isArray(value)) {
			acc[bucket] = (acc[bucket] || []).concat(value);
		} else if (value != null && value !== '') {
			acc[bucket] = (acc[bucket] || []).concat([value]);
		}
	});
	return acc;
};

// Number of CSV rows sent per request. Kept small so each request stays well
// under PHP's max_execution_time (the old single-shot upload could time out on
// large files) and so the progress bar advances in real, frequent steps. For
// very large files the chunk grows to keep the total request count bounded.
const IMPORT_MIN_BATCH_ROWS = 200;
const IMPORT_MAX_REQUESTS = 80;

const TabsTools = ({ query }) => {
	const [importerMode, setImporterMode] = useState('default');
	const [taPrefix, setTaPrefix] = useState('');
	const [exportMode, setExportMode] = useState('links');

	const [importModalOpen, setImportModalOpen] = useState(false);
	const [csvFile, setCsvFile] = useState(null);
	const [csvHeaders, setCsvHeaders] = useState([]);
	const [csvSampleRows, setCsvSampleRows] = useState([]);
	const [fileError, setFileError] = useState(null);
	const [isDragOver, setIsDragOver] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);

	const [importStep, setImportStep] = useState('upload'); // upload | mapping | progress | success | error
	const [importProgress, setImportProgress] = useState(0);
	const [importResult, setImportResult] = useState(null);

	const [fieldMapping, setFieldMapping] = useState({});
	// Snapshot of the auto-suggested mapping captured when entering the mapping
	// step. Lets each row show "Auto-matched" vs "Mapped to <column>" and powers
	// the "N auto-matched" badge on the Optional section.
	const [autoMapping, setAutoMapping] = useState({});
	const [missingRequired, setMissingRequired] = useState([]);
	const [mappingBlockers, setMappingBlockers] = useState([]);

	const [logExpanded, setLogExpanded] = useState(false);
	const LOG_PREVIEW_COUNT = 3;

	const [optionalFieldsExpanded, setOptionalFieldsExpanded] = useState(false);

	// Flipped true when the user closes/cancels mid-import so the batched upload
	// loop bails out instead of resuming progress on a dismissed modal.
	const importCancelRef = useRef(false);

	useEffect(() => {
		if (query.get('import')) {
			fetchImportInfo().then((data) => {
				if (data && Object.keys(data).length > 0) {
					setImportResult({ success: true, details: data });
					setImportStep('success');
					setImportModalOpen(true);
				}
			});
		}
	}, []);

	const importerModeHandler = (e) => setImporterMode(e.target.value);
	const exportModeHandler = (e) => setExportMode(e.target.value);

	const currentImportOption = IMPORT_OPTIONS.find((o) => o.value === importerMode);

	const resetModalState = () => {
		setCsvFile(null);
		setCsvHeaders([]);
		setCsvSampleRows([]);
		setFileError(null);
		setIsDragOver(false);
		setIsUploading(false);
		setUploadProgress(0);
		setImportStep('upload');
		setImportProgress(0);
		setImportResult(null);
		setFieldMapping({});
		setAutoMapping({});
		setMissingRequired([]);
		setMappingBlockers([]);
		setLogExpanded(false);
		setOptionalFieldsExpanded(false);
		const fileInput = document.getElementById('btl-tools-file-input');
		if (fileInput) fileInput.value = '';
	};

	const closeImportModal = () => {
		// Signal any in-flight batched import to stop before tearing down state.
		importCancelRef.current = true;
		setImportModalOpen(false);
		resetModalState();
	};

	// Fired from the "Finish" button on the success/error step. Surfaces a toast
	// summarizing the import outcome, then closes the modal.
	const handleFinishImport = () => {
		const details = importResult?.details;
		const counts = details
			? buildLogEntries(details).reduce(
				(acc, e) => ({ ...acc, [e.status]: (acc[e.status] || 0) + 1 }),
				{}
			)
			: {};
		const imported = counts.imported || 0;
		const updated = counts.updated || 0;
		const skipped = counts.skipped || 0;
		const failed = counts.failed || 0;

		const parts = [];
		if (imported) parts.push(sprintf(__('%d imported', 'betterlinks'), imported));
		if (updated) parts.push(sprintf(__('%d updated', 'betterlinks'), updated));
		if (skipped) parts.push(sprintf(__('%d skipped', 'betterlinks'), skipped));
		if (failed) parts.push(sprintf(__('%d failed', 'betterlinks'), failed));
		const summary = parts.join(', ');

		const toastOptions = { position: 'top-right', duration: 4000 };

		if (importStep === 'error') {
			toastError(
				importResult?.message || __('Import failed. Please review the file and try again.', 'betterlinks'),
				{ ...toastOptions, title: __('Import Failed', 'betterlinks') }
			);
		} else if (failed && (imported || updated)) {
			toastWarning(
				summary || __('Import completed with some errors.', 'betterlinks'),
				{ ...toastOptions, title: __('Import Completed with Warnings', 'betterlinks') }
			);
		} else {
			toastSuccess(
				summary || __('Your links have been imported successfully.', 'betterlinks'),
				{ ...toastOptions, title: __('Import Completed', 'betterlinks') }
			);
		}

		closeImportModal();
	};

	const openImportModal = () => {
		resetModalState();
		setImportModalOpen(true);
	};

	const processFile = (file) => {
		setFileError(null);
		if (!file) return;

		const maxSize = 5 * 1024 * 1024;
		if (file.size > maxSize) {
			setFileError(__('Error: File exceeds the 5MB size limit.', 'betterlinks'));
			setCsvFile(null);
			return;
		}

		const isCsv = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');
		if (!isCsv) {
			setFileError(__('Error: Only CSV files are supported.', 'betterlinks'));
			setCsvFile(null);
			return;
		}

		setCsvFile(file);
		setIsUploading(true);
		setUploadProgress(0);

		// Read the header line + a few data rows for column type inference,
		// in parallel with the upload progress simulation.
		parseCsvPreview(file)
			.then(({ headers, sampleRows }) => {
				setCsvHeaders(headers);
				setCsvSampleRows(sampleRows);
			})
			.catch(() => {
				setCsvHeaders([]);
				setCsvSampleRows([]);
			});

		const duration = 1500;
		const tick = 50;
		const steps = duration / tick;
		let current = 0;
		const interval = setInterval(() => {
			current++;
			const next = Math.min((current / steps) * 100, 100);
			setUploadProgress(next);
			if (next >= 100) {
				clearInterval(interval);
				setTimeout(() => setIsUploading(false), 200);
			}
		}, tick);
	};

	const handleFileSelect = (e) => processFile(e.target.files[0]);

	const handleDragEnter = (e) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(true);
	};
	const handleDragLeave = (e) => {
		e.preventDefault();
		e.stopPropagation();
		if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOver(false);
	};
	const handleDragOver = (e) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(true);
	};
	const handleDrop = (e) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(false);
		const file = e.dataTransfer.files?.[0];
		if (file) {
			processFile(file);
			const fileInput = document.getElementById('btl-tools-file-input');
			if (fileInput) {
				const dt = new DataTransfer();
				dt.items.add(file);
				fileInput.files = dt.files;
			}
		}
	};

	const handleSampleDownload = () => {
		const url = `admin.php?page=${query.get('page')}&export=true&nonce=${betterlinks_nonce}`;
		const form = document.createElement('form');
		form.method = 'POST';
		form.action = url;
		const input = document.createElement('input');
		input.type = 'hidden';
		input.name = 'content';
		input.value = 'simplecsvfile';
		form.appendChild(input);
		document.body.appendChild(form);
		form.submit();
		document.body.removeChild(form);
	};

	// Suggest a sensible default mapping by exact-matching schema keys/labels to
	// CSV columns. Both required and optional fields get auto-suggested, but ONLY
	// on an exact (normalized) match — so a CSV column named "redirect_type" binds
	// to the `redirect_type` field automatically, while anything without a precise
	// match is left on "Default". We deliberately avoid loose/contains matching so
	// fields aren't silently bound to the wrong column (e.g. "link_note" grabbing a
	// "Notes" column, or "link_date" picking up "Created Date" / "Modified Date").
	const buildSuggestedMapping = (headers) => {
		const schema = FIELD_SCHEMA[importerMode];
		if (!schema) return {};
		const normalize = (s) =>
			String(s || '')
				.toLowerCase()
				.replace(/[\s_\-]+/g, '');

		const headerByNorm = {};
		headers.forEach((h) => {
			headerByNorm[normalize(h)] = h;
		});

		const mapping = {};
		schema.fields.forEach((field) => {
			// Exact key match takes top priority (e.g. CSV "redirect_type" → field
			// "redirect_type"), then fall back to an exact label match.
			const direct = headerByNorm[normalize(field.key)];
			if (direct) {
				mapping[field.key] = direct;
				return;
			}
			const labelMatch = headerByNorm[normalize(field.label)];
			if (labelMatch) {
				mapping[field.key] = labelMatch;
				return;
			}
			// No exact match — leave on Default (optional) / unmapped (required).
		});
		return mapping;
	};

	// POST a single CSV chunk (header + a slice of rows) to the import endpoint.
	const postImportBatch = (batchFile) => {
		const formData = new FormData();
		formData.append('mode', importerMode);
		formData.append('upload_file', batchFile);
		if (importerMode === 'thirstyaffiliates' && taPrefix) {
			formData.append('ta_prefix', taPrefix);
		}
		return axios.post(
			`admin.php?page=${query.get('page')}&import=true&nonce=${betterlinks_nonce}`,
			formData,
			{ headers: { 'Content-Type': 'multipart/form-data' } }
		);
	};

	// Decide success vs. "nothing imported" from the accumulated per-row results
	// and move to the matching final step.
	const finalizeImport = (details) => {
		// Count actual imported items across all result buckets so we can
		// distinguish "ran successfully" from "0 rows accepted by the importer".
		const totalImported = details
			? Object.values(details).reduce((sum, v) => sum + (Array.isArray(v) ? v.length : v ? 1 : 0), 0)
			: 0;

		setTimeout(() => {
			if (details && totalImported > 0) {
				setImportResult({ success: true, details });
				setImportStep('success');
			} else {
				setImportResult({
					success: false,
					message: __(
						'No rows were imported. Your CSV reached the importer, but every row was skipped — usually because required columns are missing or values are empty. Re-check your field mapping and ensure required fields (like Short URL Slug and Link Title) are filled in.',
						'betterlinks'
					),
				});
				setImportStep('error');
			}
		}, 400);
	};

	// Submit a (possibly rewritten) CSV file in sequential chunks so the progress
	// bar reflects rows actually processed rather than a fixed simulation. Each
	// chunk carries the original header row, gets imported on its own request,
	// and its per-row log is merged into a running summary. Splitting the work
	// also keeps every request short enough to avoid PHP timeouts on big files.
	const submitImportFile = async (fileToSubmit) => {
		importCancelRef.current = false;
		setImportStep('progress');
		setImportProgress(1);

		try {
			const { headerLine, dataLines } = await readCsvLines(fileToSubmit);
			const totalRows = dataLines.length;

			// Nothing to chunk (no header parsed, or a single data row) — fall back
			// to a one-shot upload of the original file, but still report real 100%.
			if (totalRows <= 1) {
				await postImportBatch(fileToSubmit);
				if (importCancelRef.current) return;
				setImportProgress(95);
				const details = await fetchImportInfo();
				if (importCancelRef.current) return;
				setImportProgress(100);
				finalizeImport(details);
				return;
			}

			// Grow the chunk for very large files so the number of round-trips
			// stays bounded; otherwise send small, fast batches.
			const batchSize = Math.max(
				IMPORT_MIN_BATCH_ROWS,
				Math.ceil(totalRows / IMPORT_MAX_REQUESTS)
			);

			const accumulated = {};
			let rowsDone = 0;

			for (let start = 0; start < totalRows; start += batchSize) {
				if (importCancelRef.current) return;

				const slice = dataLines.slice(start, start + batchSize);
				const batchText = [headerLine, ...slice].join('\n');
				const batchFile = new File([batchText], fileToSubmit.name, { type: 'text/csv' });

				const startPct = Math.round((rowsDone / totalRows) * 100);
				const endPct = Math.round(((rowsDone + slice.length) / totalRows) * 100);

				// While this chunk is in flight, ease the bar forward but hold it
				// just short of the chunk's true checkpoint until the server
				// confirms — so it always moves yet never overstates progress.
				let eased = startPct;
				const ceiling = Math.max(startPct, endPct - 1);
				const easeTimer = setInterval(() => {
					eased = Math.min(eased + 1, ceiling);
					setImportProgress((p) => Math.max(p, eased));
				}, 250);

				try {
					await postImportBatch(batchFile);
					const batchInfo = await fetchImportInfo();
					mergeImportDetails(accumulated, batchInfo);
				} finally {
					clearInterval(easeTimer);
				}

				if (importCancelRef.current) return;

				rowsDone += slice.length;
				setImportProgress(endPct);
			}

			setImportProgress(100);
			finalizeImport(accumulated);
		} catch (err) {
			if (importCancelRef.current) return;
			setImportResult({
				success: false,
				message: err?.message || __('An error occurred while importing the file.', 'betterlinks'),
				errorDetails: err?.stack || String(err),
			});
			setImportStep('error');
		}
	};

	// Click handler for the primary "Import File" button on the upload step.
	// Decides between direct import and routing through the mapping step.
	const handleImportClick = async () => {
		if (!csvFile) return;

		const validation = validateHeaders(importerMode, csvHeaders);
		if (!validation.needsMapping) {
			submitImportFile(csvFile);
			return;
		}

		const suggested = buildSuggestedMapping(csvHeaders);
		setMissingRequired(validation.missingRequired);
		setFieldMapping(suggested);
		setAutoMapping(suggested);
		setImportStep('mapping');
	};

	const handleMappingChange = (expectedKey, csvColumn) => {
		setFieldMapping((prev) => ({ ...prev, [expectedKey]: csvColumn || '' }));
		// Any edit clears the global "fix these before continuing" banner;
		// per-row inline warnings re-evaluate from the new mapping on render.
		setMappingBlockers([]);
	};

	// Validate that the CSV column the user picked actually contains the right
	// shape of value for the BetterLinks field. We sample the first few data
	// rows and run them through the same URL validator the Dynamic Redirect
	// feature uses — so any non-URL value (a title, a note, free text,
	// anything with spaces, missing TLD, etc.) is flagged for `target_url`,
	// and any URL-shaped value is flagged for `short_url`-style slug fields.
	// Returns a friendly warning string, or null when the pick is fine.
	const detectMappingTypeWarning = (field, csvColumn) => {
		if (!csvColumn || !field.expectedType || csvSampleRows.length === 0) return null;
		// Only required fields are gating — optional fields trust whatever the
		// user picked; if they don't pick anything we just fill the column with
		// the schema default value.
		if (!field.required) return null;
		const colIdx = csvHeaders.findIndex((h) => h === csvColumn);
		if (colIdx === -1) return null;

		const stats = analyzeColumnForExpected(csvSampleRows, colIdx, field.expectedType);
		// All sample rows were empty for this column — can't judge.
		if (stats.nonEmpty === 0) return null;
		// Majority of sampled values fit the expected shape — accept it.
		if (stats.match >= stats.wrongShape) return null;

		if (field.expectedType === 'url') {
			// Distinguish "looks like a path/slug" from "looks like free text"
			// so the message is specific and actionable.
			if (!stats.looksLikeUrl && stats.hasSpace) {
				return __('These values look like plain text, not URLs. Target URL needs a full link like https://example.com/page.', 'betterlinks');
			}
			if (!stats.looksLikeUrl) {
				return __('Select the destination URL for this link — e.g. https://example.com/page', 'betterlinks');
			}
			return __('These values don\'t look like valid URLs. Make sure each row has a full link (e.g. https://example.com).', 'betterlinks');
		}

		if (field.expectedType === 'slug') {
			if (stats.looksLikeUrl) {
				return __('Looks like a full URL. Pick a column with just the path (e.g. "go/my-link").', 'betterlinks');
			}
			if (stats.hasSpace) {
				return __('Slugs can\'t contain spaces. Pick a column with short path values like "go/my-link".', 'betterlinks');
			}
			return __('These values don\'t look like short URL slugs (letters, numbers, dashes, no spaces).', 'betterlinks');
		}

		return null;
	};

	const handleMappingConfirm = async () => {
		const schema = FIELD_SCHEMA[importerMode];

		const unmappedRequired = schema.fields
			.filter((f) => f.required && !fieldMapping[f.key])
			.map((f) => f.label);

		const typeMismatches = schema.fields
			.map((f) => ({ label: f.label, warning: detectMappingTypeWarning(f, fieldMapping[f.key]) }))
			.filter((x) => x.warning);

		if (unmappedRequired.length > 0 || typeMismatches.length > 0) {
			// Stay on the mapping step so the user can fix things in place.
			const blockers = [];
			if (unmappedRequired.length > 0) {
				blockers.push({
					kind: 'missing',
					message:
						__('Please map these required fields: ', 'betterlinks') +
						unmappedRequired.join(', '),
				});
			}
			typeMismatches.forEach((m) => {
				blockers.push({ kind: 'type', field: m.label, message: m.warning });
			});
			setMappingBlockers(blockers);
			return;
		}

		setMappingBlockers([]);
		try {
			const rewritten = await rewriteCsvWithMapping(csvFile, fieldMapping, importerMode);
			submitImportFile(rewritten);
		} catch (err) {
			setImportResult({
				success: false,
				message: err?.message || __('Failed to apply field mapping.', 'betterlinks'),
				errorDetails: err?.stack || String(err),
			});
			setImportStep('error');
		}
	};

	const runMigration = async () => {
		if (importerMode === 'default') return;
		setImportStep('progress');
		setImportProgress(20);

		const formData = new FormData();
		if (importerMode === 'prettylinks') {
			formData.append('action', 'betterlinks/admin/run_prettylinks_migration');
			formData.append('re_run', true);
		} else if (importerMode === 'simple301redirects') {
			formData.append('action', 'betterlinks/admin/run_simple301redirects_migration');
		} else if (importerMode === 'thirstyaffiliates') {
			formData.append('action', 'betterlinks/admin/run_thirstyaffiliates_migration');
		}
		formData.append('security', betterlinks_nonce);
		formData.append('type', 'links');

		const progressTimer = setInterval(() => {
			setImportProgress((p) => Math.min(p + 8, 85));
		}, 400);

		try {
			const res = await axios.post(ajaxurl, formData);
			clearInterval(progressTimer);
			setImportProgress(100);

			const data = res.data?.data;
			setTimeout(() => {
				if (data?.['btl_prettylinks_migration_running_in_background']) {
					setImportResult({
						success: true,
						details: { message: __('PrettyLinks migration running in background.', 'betterlinks') },
					});
				} else {
					setImportResult({ success: true, details: data || {} });
				}
				setImportStep('success');
			}, 400);
		} catch (err) {
			clearInterval(progressTimer);
			setImportResult({
				success: false,
				message: err?.message || __('Migration failed.', 'betterlinks'),
				errorDetails: err?.stack || String(err),
			});
			setImportStep('error');
		}
	};

	// Classify a raw PHP importer log line into a status + identifier + suffix.
	// Importer strings we expect:
	//   'Imported Successfully "<slug>"'
	//   'import failed "<slug>" already exists'
	//   'Imported Failed "<slug>" already exists.'  (S30R)
	//   plus free-form strings (migration status, errors)
	const parseLogEntry = (raw) => {
		const text = String(raw == null ? '' : raw).trim();
		const lower = text.toLowerCase();

		const quoted = text.match(/"([^"]+)"/);
		const target = quoted ? quoted[1] : '';

		const reasonAfter = () => {
			if (!quoted) return '';
			const tail = text.slice(text.indexOf(quoted[0]) + quoted[0].length).trim();
			return tail.replace(/^[—\-–:.\s]+/, '').replace(/\.\s*$/, '');
		};

		// Order matters: "Updated existing" must win before generic "imported"
		// (it contains neither word but starts with "Updated"), and "Skipped"
		// must win before any "Imported Successfully" check.
		if (/^updated\b/i.test(text) || lower.includes('updated existing')) {
			return {
				status: 'updated',
				statusLabel: __('Updated', 'betterlinks'),
				target,
				suffix: __('already existed — overwritten', 'betterlinks'),
			};
		}

		if (/^skipped\b/i.test(text) || lower.includes('already exists') || lower.includes('duplicate')) {
			return {
				status: 'skipped',
				statusLabel: __('Skipped', 'betterlinks'),
				target,
				suffix: __('duplicate slug', 'betterlinks'),
			};
		}

		if (/(^|\s)(imported failed|import failed|failed|error)/i.test(lower)) {
			const reason = reasonAfter();
			return {
				status: 'failed',
				statusLabel: __('Failed', 'betterlinks'),
				target,
				suffix: reason || __('see log', 'betterlinks'),
			};
		}

		if (/(^|\s)(imported successfully|imported|migrated|created)/i.test(lower)) {
			return {
				status: 'imported',
				statusLabel: __('Imported', 'betterlinks'),
				target,
				suffix: '',
			};
		}

		if (lower.includes('skip')) {
			return {
				status: 'skipped',
				statusLabel: __('Skipped', 'betterlinks'),
				target,
				suffix: reasonAfter(),
			};
		}

		return { status: 'info', statusLabel: __('Logged', 'betterlinks'), target: '', suffix: text };
	};

	const buildLogEntries = (details) => {
		if (!details) return [];
		const collected = [];
		Object.entries(details).forEach(([bucket, value]) => {
			if (Array.isArray(value)) {
				value.forEach((line) => collected.push({ bucket, raw: line }));
			} else if (typeof value === 'object' && value !== null) {
				collected.push({ bucket, raw: JSON.stringify(value) });
			} else if (value != null && value !== '') {
				collected.push({ bucket, raw: String(value) });
			}
		});

		const now = new Date();
		const hh = String(now.getHours()).padStart(2, '0');
		const mm = String(now.getMinutes()).padStart(2, '0');
		const ss = String(now.getSeconds()).padStart(2, '0');
		const time = `${hh}:${mm}:${ss}`;

		return collected.map((e, i) => ({ ...parseLogEntry(e.raw), bucket: e.bucket, time, idx: i }));
	};

	const renderSummary = () => {
		const details = importResult?.details;
		if (!details) return null;

		const entries = buildLogEntries(details);
		if (entries.length === 0) return null;

		const counts = entries.reduce(
			(acc, e) => ({ ...acc, [e.status]: (acc[e.status] || 0) + 1 }),
			{}
		);

		const hasOverflow = entries.length > LOG_PREVIEW_COUNT;
		const visibleEntries = logExpanded || !hasOverflow ? entries : entries.slice(0, LOG_PREVIEW_COUNT);

		return (
			<div className="btl-import-log">
				<div className="btl-import-log__header">
					<div className="btl-import-log__title">{__('Import log', 'betterlinks')}</div>
					<div className="btl-import-log__meta">
						{counts.imported > 0 && (
							<span className="btl-import-log__chip btl-import-log__chip--imported">
								{counts.imported} {__('imported', 'betterlinks')}
							</span>
						)}
						{counts.updated > 0 && (
							<span className="btl-import-log__chip btl-import-log__chip--updated">
								{counts.updated} {__('updated', 'betterlinks')}
							</span>
						)}
						{counts.skipped > 0 && (
							<span className="btl-import-log__chip btl-import-log__chip--skipped">
								{counts.skipped} {__('skipped', 'betterlinks')}
							</span>
						)}
						{counts.failed > 0 && (
							<span className="btl-import-log__chip btl-import-log__chip--failed">
								{counts.failed} {__('failed', 'betterlinks')}
							</span>
						)}
						<span className="btl-import-log__count">
							{entries.length} {entries.length === 1 ? __('entry', 'betterlinks') : __('entries', 'betterlinks')}
						</span>
					</div>
				</div>
				<div className={`btl-import-log__body ${logExpanded ? 'is-expanded' : ''}`}>
					{visibleEntries.map((entry) => (
						<div key={entry.idx} className={`btl-import-log__row btl-import-log__row--${entry.status}`}>
							<span className="btl-import-log__time">{entry.time}</span>
							<span className={`btl-import-log__status btl-import-log__status--${entry.status}`}>
								{entry.statusLabel}
							</span>
							<span className="btl-import-log__target">"{entry.target}"</span>
						</div>
					))}
				</div>
				{hasOverflow && (
					<div className="btl-import-log__footer">
						<button
							type="button"
							className="btl-import-log__toggle"
							onClick={() => setLogExpanded((v) => !v)}
							aria-expanded={logExpanded}
						>
							<span>
								{logExpanded
									? __('See less', 'betterlinks')
									: `${__('See more', 'betterlinks')} (${entries.length - LOG_PREVIEW_COUNT})`}
							</span>
							<svg
								width="12"
								height="12"
								viewBox="0 0 12 12"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								style={{ transform: logExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}
								aria-hidden="true"
							>
								<path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
						</button>
					</div>
				)}
			</div>
		);
	};

	const schemaFields = FIELD_SCHEMA[importerMode]?.fields || [];

	// Live recomputation of which required fields still don't have a CSV column
	// mapped. We derive this from `fieldMapping` (which updates on every change)
	// instead of using the `missingRequired` snapshot captured at modal entry —
	// so chips disappear as the user resolves them.
	const liveMissingRequired = schemaFields
		.filter((f) => f.required && !fieldMapping[f.key])
		.map((f) => f.key);

	const requiredFields = schemaFields.filter((f) => f.required);
	const optionalFields = schemaFields.filter((f) => !f.required);

	// Progress band: how many of the required fields currently have a column.
	const mappedRequiredCount = requiredFields.filter((f) => fieldMapping[f.key]).length;
	const requiredProgressPercent = requiredFields.length
		? Math.round((mappedRequiredCount / requiredFields.length) * 100)
		: 0;

	// How many optional fields are still sitting on their auto-suggested column —
	// drives the "N auto-matched" badge on the Optional section header.
	const autoMatchedOptionalCount = optionalFields.filter(
		(f) => autoMapping[f.key] && autoMapping[f.key] === fieldMapping[f.key]
	).length;

	// Keep optional fields revealed when one of them has a type warning, so the
	// user can actually see and fix it instead of it staying hidden behind the toggle.
	const optionalHasWarning = optionalFields.some((f) =>
		detectMappingTypeWarning(f, fieldMapping[f.key] || '')
	);
	const showOptionalFields = optionalFieldsExpanded || optionalHasWarning;

	// Status line rendered beneath each dropdown. Mirrors the four states in the
	// design: error (required + empty), warning (wrong-shape values), ok
	// (auto-matched / manually mapped), and hint (optional left on its default).
	const getRowStatus = (field, selected) => {
		if (field.required && !selected) {
			return { kind: 'error', text: __('Required — please choose a column', 'betterlinks') };
		}
		const typeWarning = detectMappingTypeWarning(field, selected);
		if (typeWarning) return { kind: 'warning', text: typeWarning };
		if (selected) {
			const isAuto = autoMapping[field.key] && autoMapping[field.key] === selected;
			return {
				kind: 'ok',
				text: isAuto
					? __('Auto-matched', 'betterlinks')
					: sprintf(__('Mapped to %s', 'betterlinks'), selected),
			};
		}
		// Optional field left on "Default".
		if (field.defaultLabel === __('auto-generate', 'betterlinks')) {
			return { kind: 'hint', text: __('Will be generated automatically', 'betterlinks') };
		}
		if (field.defaultLabel) {
			return { kind: 'hint', text: sprintf(__('Uses default (%s)', 'betterlinks'), field.defaultLabel) };
		}
		return null;
	};
	
	const renderMappingRow = (field) => {
		const selected = fieldMapping[field.key] || '';
		const status = getRowStatus(field, selected);
		const isError = status?.kind === 'error';
		const isWarning = status?.kind === 'warning';

		return (
			<div
				key={field.key}
				className={`btl-csvmap-row ${isError ? 'is-error' : ''} ${isWarning ? 'is-warning' : ''}`}
			>
				<div className="btl-csvmap-row__field">
					<div className="btl-csvmap-row__label-line">
						<span className="btl-csvmap-row__label">{field.label}</span>
						{field.required && (
							<span className="btl-csvmap-row__req" aria-label={__('Required', 'betterlinks')}>*</span>
						)}
						{field.tooltip && (
							<span
								className="btl-tooltip btl-csvmap-row__info"
								tabIndex="0"
								aria-label={field.tooltip}
							>
								<span className="dashicons dashicons-info-outline" aria-hidden="true" />
								<span className="btl-tooltiptext" style={{ height: 'fit-content' }}>{field.tooltip}</span>
							</span>
						)}
					</div>
					<code className="btl-csvmap-row__key">{field.key}</code>
				</div>
				<div className="btl-csvmap-row__control">
					<div className={`btl-csvmap-select ${isError ? 'is-error' : ''}`}>
						<select
							value={selected}
							onChange={(e) => handleMappingChange(field.key, e.target.value)}
						>
							<option value="">
								{field.required
									? __('Choose a column from your CSV…', 'betterlinks')
									: field.defaultLabel
										? sprintf(__('Use default (%s)', 'betterlinks'), field.defaultLabel)
										: __('Use default', 'betterlinks')}
							</option>
							{csvHeaders.map((col, idx) => (
								<option key={`${col}-${idx}`} value={col}>
									{col || __('(empty)', 'betterlinks')}
								</option>
							))}
						</select>
					</div>
					{status && (
						<div className={`btl-csvmap-status btl-csvmap-status--${status.kind}`} role={isError || isWarning ? 'alert' : undefined}>
							{status.kind === 'ok' && (
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
									<path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
							)}
							{status.kind === 'error' && (
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
									<circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
									<path d="M12 7.5v5M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
								</svg>
							)}
							{status.kind === 'warning' && (
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
									<path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
							)}
							<span>{status.text}</span>
						</div>
					)}
				</div>
			</div>
		);
	};

	return (
		<React.Fragment>
			<div className="btl-tools-grid">
				{/* Export Card */}
				<div className="btl-tools-card">
					<div className="btl-tools-card__header">
						<div className="btl-tools-card__icon btl-tools-card__icon--export">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M12 3V15M12 15L7 10M12 15L17 10M5 21H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
						</div>
						<div className="btl-tools-card__text">
							<h3 className="btl-tools-card__title">{__('Export Data', 'betterlinks')}</h3>
							<p className="btl-tools-card__description">
								{__('Download your links, analytics, or a sample CSV to back up data or another site.', 'betterlinks')}
							</p>
						</div>
					</div>

					<form
						action={'admin.php?page=' + query.get('page') + '&export=true&nonce=' + betterlinks_nonce}
						method="POST"
						className="btl-tools-card__form"
					>
						<div className="btl-tools-option-list" role="group" aria-labelledby="btl-export-options">
							{/* `betterLinksExportOptions` — (options) => options. Extensions add
							    export types; the chosen `value` is posted as `content` and
							    answered by the `betterlinks/tools/export_content` PHP filter. */}
							{(() => {
								const filtered = betterLinksHooks.applyFilters('betterLinksExportOptions', EXPORT_OPTIONS);
								return Array.isArray(filtered) ? filtered : EXPORT_OPTIONS;
							})().map((option) => (
								<label
									key={option.value}
									className={`btl-tools-option ${exportMode === option.value ? 'is-selected' : ''}`}
								>
									<input
										type="radio"
										name="content"
										value={option.value}
										checked={exportMode === option.value}
										onChange={exportModeHandler}
									/>
									<span className="btl-tools-option__radio" aria-hidden="true" />
									<span className="btl-tools-option__content">
										<span className="btl-tools-option__label">{option.label}</span>
										<span className="btl-tools-option__description">{option.description}</span>
									</span>
								</label>
							))}
						</div>

						<button type="submit" className="btl-tools-action-button">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M12 3V15M12 15L7 10M12 15L17 10M5 21H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
							{__('Export File', 'betterlinks')}
						</button>
					</form>
				</div>

				{/* Import Card */}
				<div className="btl-tools-card">
					<div className="btl-tools-card__header">
						<div className="btl-tools-card__icon btl-tools-card__icon--import">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M12 21V9M12 9L7 14M12 9L17 14M5 3H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
						</div>
						<div className="btl-tools-card__text">
							<h3 className="btl-tools-card__title">{__('Import Data', 'betterlinks')}</h3>
							<p className="btl-tools-card__description">
								{__('Bring in links from another plugin or restore from a previous BetterLinks export.', 'betterlinks')}
							</p>
						</div>
					</div>

					<div className="btl-tools-card__form">
						<div className="btl-tools-option-list" role="group" aria-labelledby="btl-import-options">
							{IMPORT_OPTIONS.map((option) => (
								<label
									key={option.value}
									className={`btl-tools-option ${importerMode === option.value ? 'is-selected' : ''}`}
								>
									<input
										type="radio"
										name="mode"
										value={option.value}
										checked={importerMode === option.value}
										onChange={importerModeHandler}
									/>
									<span className="btl-tools-option__radio" aria-hidden="true" />
									<span className="btl-tools-option__content">
										<span className="btl-tools-option__label">{option.label}</span>
										<span className="btl-tools-option__description">{option.description}</span>
									</span>
								</label>
							))}
						</div>

						<button type="button" className="btl-tools-action-button" onClick={openImportModal}>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M12 3V15M12 15L7 10M12 15L17 10M5 21H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
							{__('Choose File to Import', 'betterlinks')}
						</button>
					</div>
				</div>
			</div>

			<Modal
				isOpen={importModalOpen}
				onRequestClose={closeImportModal}
				style={importModalStyles}
				ariaHideApp={false}
				overlayClassName="btl-import-modal-overlay"
				className="btl-import-modal-content"
			>
				<div className="btl-import-modal-wrapper">
					<div className={`btl-import-modal-header ${importStep === 'mapping' ? 'btl-import-modal-header--map' : ''}`}>
						<div className="btl-import-modal-heading">
							<div className="btl-import-modal-title">
								{importStep === 'mapping'
									? __('Map your CSV columns', 'betterlinks')
									: importerMode === 'default'
										? __('Import Data', 'betterlinks')
										: `${__('Import from', 'betterlinks')} ${currentImportOption?.label || ''}`}
							</div>
							{importStep === 'mapping' && (
								<div className="btl-import-modal-subtitle">
									{__('Match your CSV columns to BetterLinks fields. Pick the right column for each field.', 'betterlinks')}
								</div>
							)}
						</div>
						<button className="btl-close-modal" onClick={closeImportModal} aria-label={__('Close', 'betterlinks')}>
							<i className="btl btl-cancel" />
						</button>
					</div>

					{importStep === 'mapping' && (
						<div className={`btl-csvmap-progress ${liveMissingRequired.length === 0 ? 'is-complete' : ''}`}>
							<span className="btl-csvmap-progress__pill">
								{sprintf(__('%1$d of %2$d', 'betterlinks'), mappedRequiredCount, requiredFields.length)}
							</span>
							<span className="btl-csvmap-progress__label">{__('required fields mapped', 'betterlinks')}</span>
							<span className="btl-csvmap-progress__bar">
								<span
									className="btl-csvmap-progress__fill"
									style={{ width: `${requiredProgressPercent}%` }}
								/>
							</span>
						</div>
					)}

					<div className="btl-import-modal-body">
						{importStep === 'upload' && (
							<>
								<div className="btl-file-note">
									{__('Make sure the CSV file follows the proper format before uploading. ', 'betterlinks')}
									<a target="_blank" rel="noreferrer" href="https://betterlinks.io/docs/">
										{__('Learn More.', 'betterlinks')}
									</a>
								</div>

								<div className="btl-import-upload-step">
									<div
										className={`btl-file-drop-zone ${isDragOver ? 'btl-drag-over' : ''} ${fileError ? 'btl-error-state' : ''}`}
										onDragEnter={handleDragEnter}
										onDragLeave={handleDragLeave}
										onDragOver={handleDragOver}
										onDrop={handleDrop}
									>
										<input
											id="btl-tools-file-input"
											type="file"
											accept=".csv"
											onChange={handleFileSelect}
											className="btl-file-input"
											style={{ display: 'none' }}
										/>
										<label htmlFor="btl-tools-file-input" className="btl-file-drop-label">
											{!isUploading && (
												<div className="btl-file-icon">
													<img src={plugin_root_url + 'assets/images/tabler-icon-file-upload.svg'} alt="" />
												</div>
											)}
											{csvFile ? (
												<div className="btl-file-selected">
													<span className="btl-file-name">{csvFile.name}</span>
													{fileError ? (
														<div className="btl-file-error-inline">
															<span className="btl-error-text">{fileError}</span>
														</div>
													) : null}
													{isUploading ? (
														<div className="btl-upload-progress-inline">
															<div className="btl-upload-message">
																{__('Please wait as the file is processed.', 'betterlinks')}
															</div>
															<div className="btl-upload-progress-container">
																<div className="btl-upload-progress-bar">
																	<div
																		className="btl-upload-progress-fill"
																		style={{ width: `${uploadProgress}%` }}
																	></div>
																</div>
																<div className="btl-upload-progress-percentage">{Math.round(uploadProgress)}%</div>
															</div>
														</div>
													) : (
														<button
															type="button"
															className="btl-change-file"
															onClick={(e) => {
																e.preventDefault();
																setCsvFile(null);
																setCsvHeaders([]);
																setCsvSampleRows([]);
																setFileError(null);
																const fileInput = document.getElementById('btl-tools-file-input');
																if (fileInput) fileInput.value = '';
															}}
														>
															{__('Remove File', 'betterlinks')}
														</button>
													)}
												</div>
											) : (
												<>
													<div className="btl-file-placeholder">
														<span className="btl-file-text">
															{isDragOver ? (
																__('Drop CSV file here', 'betterlinks')
															) : (
																<>
																	{__('Drag & Drop or ', 'betterlinks')}
																	<span className="btl-file-c-text">{__('Click to Upload File', 'betterlinks')}</span>
																</>
															)}
														</span>
													</div>
													<div className="btl-file-info">
														<span>{__('Supported file format: CSV (Max file size: 5 MB)', 'betterlinks')}</span>
													</div>
												</>
											)}
										</label>
									</div>

									{importerMode === 'thirstyaffiliates' && (
										<div className="btl-tools-ta-prefix">
											<label htmlFor="ta_prefix">{__('Link Prefix', 'betterlinks')}</label>
											<input
												name="ta_prefix"
												id="ta_prefix"
												type="text"
												placeholder={__('e.g. recommends', 'betterlinks')}
												value={taPrefix}
												onChange={(e) => setTaPrefix(e.target.value)}
											/>
										</div>
									)}

									{importerMode === 'default' && (
										<div className="btl-sample-format">
											<div className="btl-sample-icon">
												<img src={plugin_root_url + 'assets/images/sample-csv.svg'} alt="" />
											</div>
											<div className="btl-sample-content">
												<h4>{__('Sample CSV', 'betterlinks')}</h4>
												<p>{__('Download this CSV file to ensure proper formatting.', 'betterlinks')}</p>
											</div>
											<button type="button" className="btl-sample-download" onClick={handleSampleDownload}>
												<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
													<path d="M12 3V15M12 15L7 10M12 15L17 10M5 21H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
												</svg>
											</button>
										</div>
									)}
								</div>
							</>
						)}

						{importStep === 'mapping' && (
							<div className="btl-csvmap">
								{/* Required fields */}
								<div className="btl-csvmap-section">
									<div className="btl-csvmap-section__head">
										<span className="btl-csvmap-section__title">{__('Required', 'betterlinks')}</span>
										<span className="btl-csvmap-section__badge">{requiredFields.length}</span>
									</div>
									<div className="btl-csvmap-card">
										{requiredFields.map((field) => renderMappingRow(field))}
									</div>
								</div>

								{/* Optional fields (collapsible) */}
								{optionalFields.length > 0 && (
									<div className={`btl-csvmap-section btl-csvmap-section--optional ${showOptionalFields ? 'is-open' : ''}`}>
										<button
											type="button"
											className="btl-csvmap-section__head btl-csvmap-section__head--toggle"
											aria-expanded={showOptionalFields}
											disabled={optionalHasWarning}
											onClick={() => setOptionalFieldsExpanded((prev) => !prev)}
										>
											<span className="btl-csvmap-section__title">{__('Optional', 'betterlinks')}</span>
											<span className="btl-csvmap-section__badge">{optionalFields.length}</span>
											{autoMatchedOptionalCount > 0 && (
												<span className="btl-csvmap-section__automatch">
													<svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
														<path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
													</svg>
													{sprintf(__('%d auto-matched', 'betterlinks'), autoMatchedOptionalCount)}
												</span>
											)}
											<svg
												className="btl-csvmap-section__chevron"
												width="18"
												height="18"
												viewBox="0 0 24 24"
												fill="none"
												xmlns="http://www.w3.org/2000/svg"
												aria-hidden="true"
											>
												<path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
											</svg>
										</button>
										{showOptionalFields && (
											<div className="btl-csvmap-card">
												{optionalFields.map((field) => renderMappingRow(field))}
											</div>
										)}
									</div>
								)}
							</div>
						)}

						{importStep === 'progress' && (
							<>
								<div className="btl-file-note">
									{__('Your file import is in progress... Please wait.', 'betterlinks')}
								</div>
								<div className="btl-import-progress-step">
									<div className="btl-progress-arc-container">
										<svg className="btl-progress-arc" width="100" height="60" viewBox="0 0 160 80">
											<path
												className="btl-progress-arc-background"
												d="M 10 70 A 70 70 0 0 1 150 70"
												stroke="#e5e7eb"
												strokeWidth="12"
												fill="transparent"
											/>
											<path
												className="btl-progress-arc-progress"
												d="M 10 70 A 70 70 0 0 1 150 70"
												stroke="#3b82f6"
												strokeWidth="12"
												fill="transparent"
												strokeDasharray="219.91"
												strokeDashoffset={`${219.91 * (1 - importProgress / 100)}`}
												strokeLinecap="round"
											/>
										</svg>
										<div className="btl-progress-percentage">{Math.round(importProgress)}%</div>
									</div>
									<div className="btl-ie-progress-message">
										<span>{__('Importing CSV...', 'betterlinks')}</span>
									</div>
									<div className="btl-ie-progress-warning">{__('Do not close this window.', 'betterlinks')}</div>
								</div>
							</>
						)}

						{importStep === 'success' && importResult && (
							<div className="btl-import-success-step" style={{padding : '0px 12px 24px'}}>
								<div className="btl-success-icon">
									<img src={plugin_root_url + 'assets/images/success-blue.svg'} alt="" />
								</div>
								<div className="btl-success-content">
									<div className="btl-success-title">{__('Import Completed Successfully', 'betterlinks')}</div>
									<div className="btl-success-sub-title">
										{__('Processing finished. Here’s the summary:', 'betterlinks')}
									</div>
									{renderSummary()}
								</div>
							</div>
						)}

						{importStep === 'error' && importResult && (
							<div className="btl-import-error-step">
								<div className="btl-error-file-display">
									<div className="btl-error-file-info">
										<div className="btl-error-message">
											{importResult.message || __('Error: Upload failed due to incorrect format/size, etc.', 'betterlinks')}
										</div>
									</div>
								</div>
								{importResult.errorDetails && (
									<details className="btl-error-details">
										<summary className="btl-error-details-toggle">{__('Show Error Details', 'betterlinks')}</summary>
										<pre className="btl-error-log">
											{typeof importResult.errorDetails === 'string'
												? importResult.errorDetails
												: JSON.stringify(importResult.errorDetails, null, 2)}
										</pre>
									</details>
								)}
							</div>
						)}
					</div>

					<div className={`btl-import-modal-footer ${importStep === 'mapping' ? 'btl-import-modal-footer--map' : ''}`}>
						{importStep === 'upload' && (
							<>
								<button className="btl-btn btl-btn-secondary" onClick={closeImportModal}>
									{__('Cancel', 'betterlinks')}
								</button>
								{'default' !== importerMode && migratable_plugins?.[importerMode] && (
									<button className="btl-btn btl-btn-secondary" onClick={runMigration}>
										{__('Migrate from Database', 'betterlinks')}
									</button>
								)}
								<button
									className="btl-btn btl-btn-primary"
									onClick={handleImportClick}
									disabled={!csvFile || isUploading}
								>
									{isUploading ? __('Uploading...', 'betterlinks') : __('Import File', 'betterlinks')}
								</button>
							</>
						)}

						{importStep === 'mapping' && (
							<>
								<div className="btl-csvmap-note">
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
										<circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
										<path d="M12 11v5M12 8h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
									</svg>
									<span>
										{__('Matching fields are auto-mapped from your CSV. Unmatched fields use default values.', 'betterlinks')}
									</span>
								</div>
								<div className="btl-csvmap-footer-row">
									<div className={`btl-csvmap-footer-status ${liveMissingRequired.length === 0 ? 'is-complete' : ''}`}>
										<span className="btl-csvmap-footer-status__dot" aria-hidden="true" />
										{liveMissingRequired.length === 0
											? __('All required fields mapped', 'betterlinks')
											: sprintf(
												liveMissingRequired.length === 1
													? __('%d required field still needs mapping', 'betterlinks')
													: __('%d required fields still need mapping', 'betterlinks'),
												liveMissingRequired.length
											)}
									</div>
									<div className="btl-csvmap-footer-actions">
										<button
											className="btl-btn btl-btn-secondary"
											onClick={() => {
												setImportStep('upload');
											}}
										>
											{__('Back', 'betterlinks')}
										</button>
										<button
											className="btl-btn btl-btn-primary"
											onClick={handleMappingConfirm}
											disabled={liveMissingRequired.length > 0}
										>
											{__('Continue Import', 'betterlinks')}
											<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
												<path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
											</svg>
										</button>
									</div>
								</div>
							</>
						)}

						{importStep === 'progress' && (
							<button className="btl-btn btl-btn-secondary" onClick={closeImportModal}>
								{__('Cancel', 'betterlinks')}
							</button>
						)}

						{(importStep === 'success' || importStep === 'error') && (
							<>
								{importStep === 'error' && (
									<button
										className="btl-btn btl-btn-secondary"
										onClick={() => {
											setImportStep(csvHeaders.length > 0 && missingRequired.length > 0 ? 'mapping' : 'upload');
											setImportResult(null);
										}}
									>
										{__('Try Again', 'betterlinks')}
									</button>
								)}
								<button className="btl-btn btl-btn-primary" onClick={handleFinishImport}>
									{__('Finish', 'betterlinks')}
								</button>
							</>
						)}
					</div>
				</div>
			</Modal>
		</React.Fragment>
	);
};
export default TabsTools;
