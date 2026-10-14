import { useEffect, useMemo, useRef, useState } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { __, sprintf } from '@wordpress/i18n';
import ConfirmDeleteModal from 'components/ConfirmDeleteModal';
import { ClickLogSkeleton } from './Skeletons';
import { SearchIcon, SortArrowIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronsLeftIcon, ChevronsRightIcon, GlobeIcon, AppleIcon, AndroidIcon, CpuIcon, TerminalIcon, LockIcon } from './Icons';
import { ROWS_PER_PAGE, formatNumber, capitalize } from './analytics.helper';
import { getBrowser, getDevice, getFlagEmoji, plugin_root_url, parseQueryParams } from 'utils/helper';
import { delete_clicks, fetch_individual_clicks } from 'redux/actions/clicks.actions';

const OS_ICONS = { mac: AppleIcon, ios: AppleIcon, android: AndroidIcon, windows: CpuIcon, linux: TerminalIcon, ubuntu: TerminalIcon, gnu: TerminalIcon };
const osIcon = (os) => {
	const name = String(os || '').toLowerCase();
	const key = Object.keys(OS_ICONS).find((k) => name.includes(k));
	return key ? OS_ICONS[key] : GlobeIcon;
};

// timestamp is always shown; the rest are toggleable from the Columns menu.
// `pro: true` marks a column the free plugin only shows as a locked preview
// (Pro badge + lock icon in each cell). BetterLinks Pro unlocks them through
// `betterLinksClickLogColumns` and renders their cells through
// `betterLinksClickLogCell`.
const FREE_COLUMNS = [
	{ key: 'browser', label: __('Browser', 'betterlinks'), sortable: true },
	{ key: 'ip', label: __('IP', 'betterlinks'), sortable: true },
	{ key: 'country', label: __('Country', 'betterlinks'), sortable: true, sortField: 'country_name', pro: true },
	{ key: 'user_agent', label: __('User agent', 'betterlinks'), wide: true, expandable: true, pro: true },
	{ key: 'created_at', label: __('Timestamp', 'betterlinks'), sortable: true },
	{ key: 'referer', label: __('Referrer', 'betterlinks'), sortable: true },
	{ key: 'query_params', label: __('Parameters', 'betterlinks'), wide: true, expandable: true, pro: true },
	{ key: 'os', label: __('OS', 'betterlinks'), sortable: true },
	{ key: 'device', label: __('Device', 'betterlinks'), sortable: true },
];

// Bulk actions. `disabled` + `pro` is a locked preview; BetterLinks Pro enables
// `fetch_country` through `betterLinksClickLogBulkActions` and performs it
// through `betterLinksClickLogBulkApply`.
const FREE_BULK_ACTIONS = [
	{ value: 'delete', label: __('Delete', 'betterlinks') },
	{ value: 'fetch_country', label: __('Fetch country', 'betterlinks'), pro: true, disabled: true },
];

/** A column shown only as a locked Pro preview. */
const isLockedColumn = (col) => !!col.pro;

/** Compact "Pro" pill for column headers and the Columns menu. */
const ProPill = () => <span className="bl-tbl__pro">{__('Pro', 'betterlinks')}</span>;

const useDismiss = (ref, close, active) => {
	useEffect(() => {
		if (!active) return undefined;
		const handler = (e) => {
			if (ref.current && !ref.current.contains(e.target)) close();
		};
		document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	}, [ref, close, active]);
};

/**
 * The per-click "Click log" for the single-link view — a hand-rolled table that
 * replaces the old react-data-table. Search / sort / pagination / column
 * visibility all run client-side over the already-fetched `analytics[]` rows.
 *
 * Long values (User agent, Parameters, Referrer) are truncated in the cell but
 * fully visible two ways: a native tooltip on hover, and a click-to-expand
 * detail row that lays every field out in full — the responsive-friendly way to
 * read a 200-character user agent on a narrow screen.
 *
 * `onChanged` (optional) is called after rows were deleted, so the host view can
 * tell extension sections to refetch.
 */
const ClickLogTable = (props) => {
	const { rows = [], loading, linkId, from, to, hideIp, darkMode, onChanged } = props;

	const [search, setSearch] = useState('');
	const [sort, setSort] = useState({ key: 'created_at', dir: 'desc' });
	const [perPage, setPerPage] = useState(10);
	const [page, setPage] = useState(1);
	const [selected, setSelected] = useState([]);
	// Rows whose long free-text cells (user agent, parameters) are shown in full
	// inline — clicking such a cell grows that row rather than opening a panel.
	const [expandedRows, setExpandedRows] = useState([]);
	const [action, setAction] = useState('');
	const [confirming, setConfirming] = useState(false);
	const [colsOpen, setColsOpen] = useState(false);
	const [hidden, setHidden] = useState(() => (hideIp ? { ip: true } : {}));
	const colsRef = useRef(null);
	useDismiss(colsRef, () => setColsOpen(false), colsOpen);

	const refresh = () => props.fetch_individual_clicks({ link_id: linkId, from, to, setLoading: () => {} });

	// Shared context for the click log extension points.
	const hookCtx = {
		table: 'clicklog',
		linkId,
		from,
		to,
		refresh,
		enableUserAgentTracking: !!window.betterLinksGlobal?.betterlinks_settings?.enable_user_agent_tracking,
	};

	/**
	 * `betterLinksClickLogColumns` — (columns, ctx) => columns.
	 * Column: { key, label, sortable?, sortField?, wide?, expandable?, pro? }.
	 */
	const allColumns = useMemo(() => {
		const filtered = betterLinksHooks.applyFilters('betterLinksClickLogColumns', FREE_COLUMNS, hookCtx);
		return Array.isArray(filtered) ? filtered : FREE_COLUMNS;
	}, [linkId]);

	/**
	 * `betterLinksClickLogBulkActions` — (actions, ctx) => actions.
	 * Action: { value, label, disabled?, pro? }.
	 */
	const bulkActionsFiltered = betterLinksHooks.applyFilters('betterLinksClickLogBulkActions', FREE_BULK_ACTIONS, hookCtx);
	const bulkActions = Array.isArray(bulkActionsFiltered) ? bulkActionsFiltered : FREE_BULK_ACTIONS;
	const currentAction = bulkActions.find((item) => item.value === action);

	const columns = useMemo(() => allColumns.filter((c) => !(c.key === 'ip' && hideIp) && !hidden[c.key]), [allColumns, hidden, hideIp]);

	const filtered = useMemo(() => {
		const needle = search.trim().toLowerCase();
		if (!needle) return rows;
		return rows.filter((row) =>
			`${row.ip || ''} ${row.country_name || ''} ${row.browser || ''} ${row.referer || ''} ${row.os || ''} ${row.user_agent || ''} ${row.query_params || ''}`.toLowerCase().includes(needle)
		);
	}, [rows, search]);

	const sorted = useMemo(() => {
		const col = allColumns.find((c) => c.key === sort.key);
		const field = col?.sortField || sort.key;
		const dir = sort.dir === 'asc' ? 1 : -1;
		return [...filtered].sort((a, b) => String(a[field] ?? '').localeCompare(String(b[field] ?? ''), undefined, { numeric: true, sensitivity: 'base' }) * dir);
	}, [filtered, sort, allColumns]);

	const total = sorted.length;
	const pageCount = Math.max(1, Math.ceil(total / perPage));
	useEffect(() => {
		if (page > pageCount) setPage(pageCount);
	}, [page, pageCount]);

	const start = (page - 1) * perPage;
	const visible = sorted.slice(start, start + perPage);
	const visibleIds = visible.map((r) => r.ID);
	const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));

	const toggleAll = () => setSelected((cur) => (allSelected ? cur.filter((id) => !visibleIds.includes(id)) : [...new Set([...cur, ...visibleIds])]));
	const toggleRow = (id) => setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

	const changeSort = (key) => {
		setSort((cur) => (cur.key === key ? { key, dir: cur.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'created_at' ? 'desc' : 'asc' }));
		setPage(1);
	};

	const applyAction = () => {
		if (!selected.length || !currentAction || currentAction.disabled) return;
		if (action === 'delete') {
			setConfirming(true);
			return;
		}
		/**
		 * `betterLinksClickLogBulkApply` — (handled, ctx) => boolean.
		 * ctx adds { action, selectedRows }. Return true when the action was taken;
		 * call ctx.refresh() once the rows changed.
		 */
		const handled = betterLinksHooks.applyFilters('betterLinksClickLogBulkApply', false, {
			...hookCtx,
			action,
			selectedRows: rows.filter((r) => selected.includes(r.ID)),
		});
		if (handled) {
			setSelected([]);
			setAction('');
		}
	};

	const confirmDelete = () => {
		Promise.resolve(props.delete_clicks({ click_ids: selected, link_id: linkId, from, to })).then(() => {
			if (typeof onChanged === 'function') onChanged();
		});
		setConfirming(false);
		setSelected([]);
		setAction('');
	};

	if (loading) return <ClickLogSkeleton />;

	const from0 = total ? start + 1 : 0;
	const upto = Math.min(start + perPage, total);
	const colSpan = columns.length + 1;

	const toggleExpand = (id) => setExpandedRows((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

	// A long free-text value: truncated by default, but click it and the row
	// grows to show the whole thing wrapped in place.
	const expandable = (row, value) => {
		if (!value) return <span className="bl-clog__muted">—</span>;
		return (
			<button type="button" className="bl-clog__expandable bl-clog__mono" title={value} onClick={() => toggleExpand(row.ID)}>
				{value}
			</button>
		);
	};

	const renderCell = (row, key) => {
		const column = allColumns.find((c) => c.key === key);
		if (column && isLockedColumn(column)) {
			return (
				<span className="bl-clog__locked" title={__('Available in BetterLinks Pro', 'betterlinks')}>
					<LockIcon width={12} height={12} />
				</span>
			);
		}
		switch (key) {
			case 'browser':
				return (
					<span className="bl-clog__ib">
						<img className="bl-clog__bicon" width="20" height="20" src={`${plugin_root_url}assets/images/browser/${getBrowser(row.browser)}-browser.svg`} alt="" />
						{row.browser || '—'}
					</span>
				);
			case 'ip':
				return <span className="bl-clog__mono">{row.ip ? `${row.ip}${row.IPCOUNT ? `(${row.IPCOUNT})` : ''}` : '—'}</span>;
			case 'created_at':
				return <span className="bl-clog__mono bl-clog__nowrap">{row.created_at || '—'}</span>;
			case 'referer':
				return row.referer ? (
					<a className="bl-clog__ref" href={row.referer} target="_blank" rel="noopener noreferrer" title={row.referer}>
						{row.referer}
					</a>
				) : (
					<span className="bl-clog__muted">—</span>
				);
			case 'os': {
				const OsIcon = osIcon(row.os);
				return row.os ? (
					<span className="bl-clog__ib">
						<OsIcon width={16} height={16} />
						{row.os}
					</span>
				) : (
					<span className="bl-clog__muted">—</span>
				);
			}
			case 'device':
				return row.device ? (
					<span className="bl-clog__ib">
						<img className="bl-clog__bicon" width="18" height="18" src={`${plugin_root_url}assets/images/devices/${getDevice(row.device)}.svg`} alt="" />
						{capitalize(row.device)}
					</span>
				) : (
					<span className="bl-clog__muted">—</span>
				);
			default: {
				/**
				 * `betterLinksClickLogCell` — (node, ctx) => node.
				 * ctx adds { row, key, column, expandable(value), getFlagEmoji, parseQueryParams }.
				 * Return null to fall back to an empty cell.
				 */
				const cell = betterLinksHooks.applyFilters('betterLinksClickLogCell', null, {
					...hookCtx,
					row,
					key,
					column,
					expandable: (value) => expandable(row, value),
					getFlagEmoji,
					parseQueryParams,
				});
				return cell === null || cell === undefined ? <span className="bl-clog__muted">—</span> : cell;
			}
		}
	};

	return (
		<div className="bl-tbl bl-clog">
			<div className="bl-tbl__toolbar">
				<div className="bl-tbl__search">
					<SearchIcon width={16} height={16} />
					<input
						type="search"
						value={search}
						placeholder={__('Search IP, country, browser, referrer…', 'betterlinks')}
						aria-label={__('Search clicks', 'betterlinks')}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(1);
						}}
					/>
				</div>

				<div className="bl-clog__tools">
					<div className="bl-tbl__bulk">
						<select className="bl-tbl__select" value={action} aria-label={__('Bulk actions', 'betterlinks')} onChange={(e) => setAction(e.target.value)}>
							<option value="">{__('Bulk actions', 'betterlinks')}</option>
							{bulkActions.map((item) => (
								<option key={item.value} value={item.value} disabled={!!item.disabled}>
									{/* translators: %s: bulk action name. */}
									{item.pro && item.disabled ? sprintf(__('%s (Pro)', 'betterlinks'), item.label) : item.label}
								</option>
							))}
						</select>
						<button type="button" className="bl-tbl__apply" disabled={!action || !selected.length || !currentAction || !!currentAction.disabled} onClick={applyAction}>
							{__('Apply', 'betterlinks')}
						</button>
					</div>

					<div className="bl-clog__cols" ref={colsRef}>
						<button type="button" className={`bl-tbl__apply bl-clog__cols-btn${colsOpen ? ' is-active' : ''}`} aria-haspopup="menu" aria-expanded={colsOpen} onClick={() => setColsOpen((o) => !o)}>
							{__('Columns', 'betterlinks')}
							<ChevronDownIcon width={15} height={15} />
						</button>
						{colsOpen && (
							<div className="bl-an__pop bl-an__pop--menu bl-clog__cols-menu" role="menu">
								{allColumns.filter((c) => !(c.key === 'ip' && hideIp)).map((c) => (
									<label key={c.key} className={`bl-clog__cols-item${c.fixed ? ' is-fixed' : ''}`}>
										<input
											type="checkbox"
											checked={!hidden[c.key]}
											disabled={c.fixed}
											onChange={() => setHidden((h) => ({ ...h, [c.key]: !h[c.key] }))}
										/>
										<span className="bl-clog__cols-label">{c.label}</span>
										{isLockedColumn(c) && <ProPill />}
									</label>
								))}
							</div>
						)}
					</div>
				</div>
			</div>

			<div className="bl-tbl__scroll">
				<table className="bl-tbl__table bl-clog__table">
					<thead>
						<tr>
							<th className="bl-tbl__check-col">
								<input type="checkbox" checked={allSelected} aria-label={__('Select all', 'betterlinks')} onChange={toggleAll} />
							</th>
							{columns.map((col) => {
								const isSorted = sort.key === col.key;
								const locked = isLockedColumn(col);
								return (
									<th key={col.key} aria-sort={isSorted ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
										{col.sortable && !locked ? (
											<button type="button" className={`bl-tbl__sort${isSorted ? ' is-active' : ''}`} onClick={() => changeSort(col.key)}>
												{col.label}
												<SortArrowIcon width={13} height={13} className={isSorted && sort.dir === 'asc' ? 'bl-tbl__sort-asc' : undefined} />
											</button>
										) : (
											<span className="bl-tbl__th-label">
												{col.label}
												{locked && <ProPill />}
											</span>
										)}
									</th>
								);
							})}
						</tr>
					</thead>

					<tbody>
						{visible.map((row) => {
							const isExpanded = expandedRows.includes(row.ID);
							return (
								<tr key={row.ID} className={`${selected.includes(row.ID) ? 'is-selected' : ''}${isExpanded ? ' is-expanded' : ''}`}>
									<td className="bl-tbl__check-col">
										<input type="checkbox" checked={selected.includes(row.ID)} aria-label={__('Select row', 'betterlinks')} onChange={() => toggleRow(row.ID)} />
									</td>
									{columns.map((col) => (
										<td key={col.key} className={col.wide ? 'bl-clog__wide' : undefined}>
											{renderCell(row, col.key)}
										</td>
									))}
								</tr>
							);
						})}

						{!visible.length && (
							<tr className="bl-tbl__empty-row">
								<td colSpan={colSpan}>{search ? __('No clicks match your search.', 'betterlinks') : __('No clicks recorded in this range.', 'betterlinks')}</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			<div className="bl-tbl__foot">
				<label className="bl-tbl__rows">
					{__('Rows:', 'betterlinks')}
					<select
						className="bl-tbl__select"
						value={perPage}
						onChange={(e) => {
							setPerPage(Number(e.target.value));
							setPage(1);
						}}
					>
						{ROWS_PER_PAGE.map((n) => (
							<option key={n} value={n}>
								{n}
							</option>
						))}
					</select>
				</label>

				<div className="bl-tbl__pager">
					<span className="bl-tbl__count">
						{/* translators: 1: first row, 2: last row, 3: total. */}
						{sprintf(__('%1$s–%2$s of %3$s', 'betterlinks'), formatNumber(from0), formatNumber(upto), formatNumber(total))}
					</span>
					<button type="button" className="bl-tbl__page" disabled={page <= 1} onClick={() => setPage(1)} aria-label={__('First page', 'betterlinks')}>
						<ChevronsLeftIcon width={15} height={15} />
					</button>
					<button type="button" className="bl-tbl__page" disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label={__('Previous page', 'betterlinks')}>
						<ChevronLeftIcon width={15} height={15} />
					</button>
					<button type="button" className="bl-tbl__page" disabled={page >= pageCount} onClick={() => setPage(page + 1)} aria-label={__('Next page', 'betterlinks')}>
						<ChevronRightIcon width={15} height={15} />
					</button>
					<button type="button" className="bl-tbl__page" disabled={page >= pageCount} onClick={() => setPage(pageCount)} aria-label={__('Last page', 'betterlinks')}>
						<ChevronsRightIcon width={15} height={15} />
					</button>
				</div>
			</div>

			<ConfirmDeleteModal
				isOpen={confirming}
				onClose={() => setConfirming(false)}
				onConfirm={confirmDelete}
				title={__('Delete click records?', 'betterlinks')}
				description={sprintf(
					/* translators: %s: number of selected click records. */
					__('%s selected click record(s) will be permanently removed.', 'betterlinks'),
					formatNumber(selected.length)
				)}
				confirmLabel={__('Delete', 'betterlinks')}
			/>
		</div>
	);
};

const mapDispatchToProps = (dispatch) => ({
	delete_clicks: bindActionCreators(delete_clicks, dispatch),
	fetch_individual_clicks: bindActionCreators(fetch_individual_clicks, dispatch),
});
export default connect(null, mapDispatchToProps)(ClickLogTable);
