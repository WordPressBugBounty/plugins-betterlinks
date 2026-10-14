import { __ } from '@wordpress/i18n';
import { useState, useEffect, useMemo } from 'react';
import TableLoader from 'components/Loader/TableLoader';
import DataTable from 'react-data-table-component';
import FilterComponent from '../FilterComponent';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { fetch_analytics_settings, update_analytics_settings } from 'redux/actions/analytics.actions';
import { betterlinks_nonce, formatDate, paginationPerPageCount, getColumns, getBrowser, getDevice, parseQueryParams } from 'utils/helper';
import { fetch_clicks_data, searchClicksData, delete_clicks, delete_links_analytics, fetch_individual_clicks } from 'redux/actions/clicks.actions';
import { getData } from '../clicks.helper';
import DemoTable from 'components/CustomTable/DemoTable';
import ResizableTable from 'components/CustomTable/ResizableTable';

const DataList = (props) => {
// Helpers for icon rendering in details view
const getBrowserIcon = (browser) => {
	if (!browser) return null;
	// normalize to filename using helper
	const fileName = getBrowser(browser || '');
	const title = typeof browser === 'string' && browser.length ? browser : (fileName || 'Browser');
	// use the same icon suffix as helper.getColumns for consistency
	return <img width="25" src={`${window.betterLinksGlobal.plugin_root_url}assets/images/browser/${fileName}-browser.svg`} alt="icon" title={title} />;
};
const getDeviceIcon = (device) => {
	if (!device) return null;
	const fileName = getDevice(device || '');
	const title = typeof device === 'string' && device.length ? device : (fileName || 'Device');
	return <img width="25" src={`${window.betterLinksGlobal.plugin_root_url}assets/images/devices/${fileName}.svg`} alt="icon" title={title} />;
};

const { columns, data, progressPending, id = null, from = null, customDateFilter } = props;
const [resetPaginationToggle, setResetPaginationToggle] = useState(false);
const [searchStatus, setSearchStatus] = useState(false);
const [isSearching, setSearching] = useState(false);
const [filterText, setFilterText] = useState('');
const [selectedRows, setSelectedRows] = useState([]);
const [bulkAction, setBulkAction] = useState({});
const [toggledClearRows, setToggledClearRows] = useState(false);
const [warning, setWarning] = useState(false);
const { analyticsTab } = props.activity;
const { analytics } = props.analytics;

// Called after country data was fetched by an extension (single cell or bulk
// action) so the table re-reads the clicks. Declared before `getColumns()`
// receives it below.
const handleCountryUpdated = () => {
	if (!id) return;

	const from = (customDateFilter && customDateFilter[0]) ? formatDate(customDateFilter[0].startDate, 'yyyy-mm-dd') : undefined;
	const to = (customDateFilter && customDateFilter[0]) ? formatDate(customDateFilter[0].endDate, 'yyyy-mm-dd') : undefined;
	const currentDate = to || formatDate(new Date(), 'yyyy-mm-dd');
	const pastDate = from || formatDate(new Date(), 'yyyy-mm-dd');

	// Refresh individual clicks for the current link to reflect updated country data
	props.fetch_individual_clicks({ link_id: id, from: pastDate, to: currentDate, setLoading: () => {} });
};

// Dynamic columns and data mapping based on view mode
let adaptedColumns, adaptedData, customCellRender;

if (!id) {
	// Link List View
	adaptedColumns = [
		{ key: 'name', label: __('Link Name', 'betterlinks'), sortable: true },
		{ key: 'short_url', label: __('Shortened URL', 'betterlinks') },
		{ key: 'target_url', label: __('Target URL', 'betterlinks') },
		{ key: 'total_clicks', label: __('Total Clicks', 'betterlinks') },
		{ key: 'unique_clicks', label: __('Unique Clicks', 'betterlinks') },
		{ key: 'action', label: __('Action', 'betterlinks'), sortable: false },
	];
	adaptedData = getData(data, analyticsTab, filterText, id, from).map(row => ({
		...row,
		name: row.link_title || row.name || '',
		action: 'Details',
	}));
		customCellRender = {
			action: (row) => (
				<a
					href={`admin.php?page=betterlinks-analytics&id=${row.link_id}`}
					style={{ color: '#0073aa', textDecoration: 'underline', cursor: 'pointer' }}
				>
					Details
				</a>
			),
			short_url: (row) => (
				<a href={row.short_url.startsWith('http') ? row.short_url : `https://${row.short_url}`} target="_blank" rel="noopener noreferrer">{row.short_url}</a>
			),
			target_url: (row) => (
				<a href={row.target_url} target="_blank" rel="noopener noreferrer">{row.target_url}</a>
			),
		};
} else {
	// Single Link Details View - use helper's getColumns so we don't lose any browser/device icons or
	// other formatting defined there.  We still keep a fallback list in case analytics settings are
	// empty (the helper filters by analytics values).
	const helperCols = getColumns(analytics, analyticsTab, id, handleCountryUpdated) || [];
	// convert helper columns to the shape expected by ResizableTable
	adaptedColumns = helperCols.map(col => ({
		key: col.selector,
		label: col.name,
		sortable: col.sortable !== false,
		width: col.width,
		minWidth: col.minWidth,
		sortFunction: col.sortFunction,
	}));
	// fallback if helper returned nothing (no analytics settings selected)
	if (!adaptedColumns.length) {
		adaptedColumns = [
			{ key: 'browser', label: __('Browser', 'betterlinks'), sortable: false },
			{ key: 'ip', label: __('IP', 'betterlinks') },
			{ key: 'country_name', label: __('Country', 'betterlinks') },
			{ key: 'user_agent', label: __('User-Agent', 'betterlinks') },
			{ key: 'created_at', label: __('Timestamp', 'betterlinks') },
			{ key: 'referer', label: __('Referrer', 'betterlinks') },
			{ key: 'query_params', label: __('Parameters', 'betterlinks') },
			{ key: 'os', label: __('OS', 'betterlinks') },
			{ key: 'device', label: __('Device', 'betterlinks'), sortable: false },
			{ key: 'IPCOUNT', label: __('IP Count', 'betterlinks') },
		];
	}
	adaptedData = getData(data, analyticsTab, filterText, id, from).map(row => ({
		...row,
		ip: row.ip !== undefined && row.ip !== null ? row.ip : '',
		browser: row.browser !== undefined && row.browser !== null ? row.browser : '',
		referer: row.referer !== undefined && row.referer !== null ? row.referer : '',
		os: row.os !== undefined && row.os !== null ? row.os : '',
		device: row.device !== undefined && row.device !== null ? row.device : '',
		query_params: row.query_params !== undefined && row.query_params !== null ? row.query_params : '',
		created_at: row.created_at !== undefined && row.created_at !== null ? row.created_at : '',
		country_name: row.country_name !== undefined && row.country_name !== null ? row.country_name : '',
		country_code: row.country_code !== undefined && row.country_code !== null ? row.country_code : '',
		user_agent: row.user_agent !== undefined && row.user_agent !== null ? row.user_agent : '',
		IPCOUNT: row.IPCOUNT !== undefined && row.IPCOUNT !== null ? row.IPCOUNT : (row.IPCount !== undefined && row.IPCount !== null ? row.IPCount : (row.ipcount !== undefined && row.ipcount !== null ? row.ipcount : '')),
	}));
	// build renderers: prefer helper cell definitions, but keep our manual ones as fallback
	const helperCellRender = {};
	helperCols.forEach(c => {
		if (typeof c.cell === 'function') helperCellRender[c.selector] = c.cell;
	});
	const allCellRender = {
		browser: (row) => getBrowserIcon(row.browser),
		device: (row) => getDeviceIcon(row.device),
		referer: (row) => (
			<a href={row.referer} target="_blank" rel="noopener noreferrer">{row.referer}</a>
		),
		query_params: (row) => {
			// Stored as a JSON object string ({"pf":"…","utm":"…"}) — render readable
			// "Label: value" rows instead of a raw JSON blob.
			const parsed = parseQueryParams(row.query_params);
			if (parsed.text !== undefined) {
				return <span style={{ wordBreak: 'break-all' }}>{parsed.text}</span>;
			}
			if (!parsed.entries.length) return <span>—</span>;
			return (
				<span style={{ display: 'flex', flexDirection: 'column', rowGap: '4px' }}>
					{parsed.entries.map(([label, value]) => (
						<span key={label} style={{ wordBreak: 'break-all' }}>
							<strong>{label}:</strong> {value}
						</span>
					))}
				</span>
			);
		},
		user_agent: (row) => (
			<span style={{ wordBreak: 'break-all' }}>{row.user_agent}</span>
		),
		ip: (row) => (
			<span>{row.ip}{row.IPCOUNT ? `(${row.IPCOUNT})` : ''}</span>
		),
		os: (row) => <span>{row.os}</span>,
		country_name: (row) => {
			// reuse helper's country cell for consistent behaviour if available
			const countryCol = helperCols.find(c => c.selector === 'country_name');
			if (countryCol && typeof countryCol.cell === 'function') {
				return countryCol.cell(row);
			}
			return row.country_name ? <span>{row.country_name}</span> : <div>-</div>;
		},
		created_at: (row) => <span>{row.created_at}</span>,
		IPCOUNT: (row) => <span>{row.IPCOUNT}</span>,
	};
	customCellRender = {};
	adaptedColumns.forEach(col => {
		if (helperCellRender[col.key]) {
			customCellRender[col.key] = helperCellRender[col.key];
		} else if (allCellRender[col.key]) {
			customCellRender[col.key] = allCellRender[col.key];
		}
	});
}
// Debug: log adapted data and columns
// console.log('ResizableTable adaptedColumns:', adaptedColumns);
// console.log('ResizableTable adaptedData:', adaptedData);

	useEffect(() => {
		if (!analytics) props.fetch_analytics_settings();
	}, []);
	const handleRowsSelect = (state) => {
		setSelectedRows(state.selectedRows);
	};

	const rowDeleteHandler = async () => {
		if (bulkAction.value === 'delete') {
			setWarning(false);
			setToggledClearRows(!toggledClearRows);

			// Check if we're in Link List mode (no id prop) or Single Link mode (with id prop)
			if (id) {
				// Single Link Analytics mode - delete individual clicks
				const deleteItemIds = selectedRows.map((item) => item.ID);
				let deleteParams = { click_ids: deleteItemIds, link_id: id };
				if (customDateFilter && customDateFilter[0]) {
					deleteParams.from = formatDate(customDateFilter[0].startDate, 'yyyy-mm-dd');
					deleteParams.to = formatDate(customDateFilter[0].endDate, 'yyyy-mm-dd');
				}
				props.delete_clicks(deleteParams);
			} else {
				// Link List mode - delete analytics for multiple links
				const deleteLinkIds = selectedRows.map((item) => item.link_id);
				let deleteParams = { link_ids: deleteLinkIds };
				if (customDateFilter && customDateFilter[0]) {
					deleteParams.from = formatDate(customDateFilter[0].startDate, 'yyyy-mm-dd');
					deleteParams.to = formatDate(customDateFilter[0].endDate, 'yyyy-mm-dd');
				}
				props.delete_links_analytics(deleteParams);
			}

			setBulkAction({});
			setSelectedRows([]);
			return;
		}

		// Any other action (e.g. `fetch_country`) is performed by an extension.
		// `betterLinksClickLogBulkApply` — (handled, ctx) => boolean; return true
		// when the action was taken and call ctx.refresh() once rows changed.
		if (bulkAction.value && id) {
			const handled = betterLinksHooks.applyFilters('betterLinksClickLogBulkApply', false, {
				table: 'legacy',
				action: bulkAction.value,
				selectedRows,
				linkId: id,
				refresh: handleCountryUpdated,
			});
			if (handled) {
				setWarning(false);
				setBulkAction({});
				setSelectedRows([]);
				setToggledClearRows(!toggledClearRows);
				return;
			}
		}

		setWarning(true);
	};

	const subHeaderComponentMemo = useMemo(() => {
		const handleClear = () => {
			if (filterText) {
				setResetPaginationToggle(!resetPaginationToggle);
				setFilterText('');
			}
		};
		const searchClickHandler = (e) => {
			e.preventDefault();
			if (filterText) {
				setSearchStatus(true);
				props.searchClicksData(betterlinks_nonce, filterText).then(() => {
					setSearchStatus(false);
					setSearching(true);
				});
			}
		};
		const resetSearch = () => {
			setSearching(false);
			setFilterText('');
			if (customDateFilter && customDateFilter[0]) {
				const filterDate = { from: formatDate(customDateFilter[0].startDate, 'yyyy-mm-dd'), to: formatDate(customDateFilter[0].endDate, 'yyyy-mm-dd') };
				props.fetch_clicks_data(filterDate);
			} else {
				props.fetch_clicks_data({});
			}
		};

		return (
			<FilterComponent
				onFilter={(e) => setFilterText(e.target.value)}
				onClear={handleClear}
				filterText={filterText}
				searchClickHandler={searchClickHandler}
				searchStatus={searchStatus}
				isSearching={isSearching}
				resetSearch={resetSearch}
				analytics={analytics}
				update_analytics_settings={props.update_analytics_settings}
				id={id}
				analyticsTab={analyticsTab}
				update_activity={props.update_activity}
				selectedRows={selectedRows}
				bulkAction={bulkAction}
				setBulkAction={setBulkAction}
				rowDeleteHandler={rowDeleteHandler}
				warning={warning}
			/>
		);
	}, [filterText, resetPaginationToggle, searchStatus, isSearching, analytics, analyticsTab, id, selectedRows.length, bulkAction, warning]);

		// Use a unique storageKey for each table type
		const storageKey = id ? 'betterlinks-single-link-table-columns' : 'betterlinks-link-list-table-columns';
		return (
			<div className="btl-table-grouped-container">
				{subHeaderComponentMemo}
				<ResizableTable
					columns={adaptedColumns}
					data={adaptedData}
					loading={progressPending}
					defaultSortKey={adaptedColumns[0]?.key || 'name'}
					defaultSortDirection="asc"
					selectableRows={true}
					onSelectedRowsChange={handleRowsSelect}
					clearSelectedRows={toggledClearRows}
					selectedRowKey={id ? 'ID' : 'link_id'}
					customCellRender={customCellRender}
					storageKey={storageKey}
				/>
			</div>
		);
};
const mapStateToProps = (state) => ({
	analytics: state.analytics,
	activity: state.activity,
});
const mapDispatchToProps = (dispatch) => ({
	searchClicksData: bindActionCreators(searchClicksData, dispatch),
	fetch_clicks_data: bindActionCreators(fetch_clicks_data, dispatch),
	fetch_individual_clicks: bindActionCreators(fetch_individual_clicks, dispatch),
	fetch_analytics_settings: bindActionCreators(fetch_analytics_settings, dispatch),
	update_analytics_settings: bindActionCreators(update_analytics_settings, dispatch),
	delete_clicks: bindActionCreators(delete_clicks, dispatch),
	delete_links_analytics: bindActionCreators(delete_links_analytics, dispatch),
});
export default connect(mapStateToProps, mapDispatchToProps)(DataList);
