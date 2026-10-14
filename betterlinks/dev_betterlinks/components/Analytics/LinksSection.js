import { useEffect, useMemo, useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import ConfirmDeleteModal from 'components/ConfirmDeleteModal';
import { LinksTableSkeleton } from './Skeletons';
import { TrophyIcon, SearchIcon, EyeIcon, ChainIcon, SortArrowIcon, ChevronLeftIcon, ChevronRightIcon, ChevronsLeftIcon, ChevronsRightIcon } from './Icons';
import { ROWS_PER_PAGE, formatNumber, toLinkRows, filterLinkRows, sortLinkRows } from './analytics.helper';

const COLUMNS = [
	{ key: 'name', label: __('Link name', 'betterlinks'), sortable: true },
	{ key: 'short_url', label: __('Shortened URL', 'betterlinks'), sortable: true },
	{ key: 'target_url', label: __('Target URL', 'betterlinks'), sortable: false },
	{ key: 'total_clicks', label: __('Total clicks', 'betterlinks'), sortable: true, numeric: true },
	{ key: 'unique_clicks', label: __('Unique clicks', 'betterlinks'), sortable: true, numeric: true },
];

/**
 * Section 7 — Per-link performance.
 *
 * Replaces the old react-data-table `AnalyticsList`. Search, sort and pagination
 * all run client-side: `unique_list` already holds every link for the range, so
 * there is nothing to gain from a round trip.
 *
 * The only bulk action available on this view is deleting a link's analytics —
 * `delete_links_analytics`, scoped to the selected date range, same as before.
 */
const LinksSection = ({ uniqueList, rangeLabel, loading, onDeleteAnalytics }) => {
	const [search, setSearch] = useState('');
	const [sort, setSort] = useState({ key: 'total_clicks', direction: 'desc' });
	const [perPage, setPerPage] = useState(10);
	const [page, setPage] = useState(1);
	const [selected, setSelected] = useState([]);
	const [action, setAction] = useState('');
	const [confirming, setConfirming] = useState(false);

	const rows = useMemo(() => toLinkRows(uniqueList), [uniqueList]);
	const filtered = useMemo(() => filterLinkRows(rows, search), [rows, search]);
	const sorted = useMemo(() => sortLinkRows(filtered, sort.key, sort.direction), [filtered, sort]);

	const total = sorted.length;
	const pageCount = Math.max(1, Math.ceil(total / perPage));
	// Deleting or filtering can shrink the list out from under the current page;
	// snapping back keeps the table from rendering a blank page.
	useEffect(() => {
		if (page > pageCount) setPage(pageCount);
	}, [page, pageCount]);

	const start = (page - 1) * perPage;
	const visible = sorted.slice(start, start + perPage);

	const visibleIds = visible.map((row) => row.link_id);
	const allOnPageSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));

	const toggleAll = () => {
		setSelected((current) => (allOnPageSelected ? current.filter((id) => !visibleIds.includes(id)) : [...new Set([...current, ...visibleIds])]));
	};
	const toggleRow = (id) => {
		setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
	};

	const changeSort = (key) => {
		setSort((current) =>
			current.key === key
				? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
				: // Counts are most useful highest-first; names alphabetically.
				  { key, direction: key === 'name' || key === 'short_url' ? 'asc' : 'desc' }
		);
		setPage(1);
	};

	const applyAction = () => {
		if (action === 'delete' && selected.length) setConfirming(true);
	};

	const confirmDelete = () => {
		onDeleteAnalytics(selected);
		setConfirming(false);
		setSelected([]);
		setAction('');
	};

	if (loading) return <LinksTableSkeleton />;

	const from = total ? start + 1 : 0;
	const upto = Math.min(start + perPage, total);

	return (
		<div className="bl-tbl">
			<div className="bl-tbl__head">
				<span className="bl-tbl__head-icon">
					<TrophyIcon width={17} height={17} />
				</span>
				<h3 className="bl-tbl__title">{__('Link performance', 'betterlinks')}</h3>
				<span className="bl-tbl__subtitle">
					{/* translators: %s: the selected range, e.g. "last 30 days". */}
					{sprintf(__('every link · %s', 'betterlinks'), rangeLabel)}
				</span>
			</div>

			<div className="bl-tbl__toolbar">
				<div className="bl-tbl__search">
					<SearchIcon width={16} height={16} />
					<input
						type="search"
						value={search}
						placeholder={__('Search links…', 'betterlinks')}
						aria-label={__('Search links', 'betterlinks')}
						onChange={(event) => {
							setSearch(event.target.value);
							setPage(1);
						}}
					/>
				</div>

				<div className="bl-tbl__bulk">
					<select
						className="bl-tbl__select"
						value={action}
						aria-label={__('Bulk actions', 'betterlinks')}
						onChange={(event) => setAction(event.target.value)}
					>
						<option value="">{__('Bulk actions', 'betterlinks')}</option>
						<option value="delete">{__('Delete analytics', 'betterlinks')}</option>
					</select>
					<button type="button" className="bl-tbl__apply" disabled={!action || !selected.length} onClick={applyAction}>
						{__('Apply', 'betterlinks')}
					</button>
				</div>
			</div>

			{/* The table keeps a min-width and scrolls horizontally inside this box,
			    so narrow screens pan across the columns instead of squeezing them. */}
			<div className="bl-tbl__scroll">
				<table className="bl-tbl__table">
					<thead>
						<tr>
							<th className="bl-tbl__check-col">
								<input
									type="checkbox"
									checked={allOnPageSelected}
									aria-label={__('Select all links on this page', 'betterlinks')}
									onChange={toggleAll}
								/>
							</th>
							{COLUMNS.map((column) => {
								const isSorted = sort.key === column.key;
								return (
									<th key={column.key} className={column.numeric ? 'bl-tbl__num' : undefined} aria-sort={isSorted ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
										{column.sortable ? (
											<button type="button" className={`bl-tbl__sort${isSorted ? ' is-active' : ''}`} onClick={() => changeSort(column.key)}>
												{column.label}
												<SortArrowIcon width={13} height={13} className={isSorted && sort.direction === 'asc' ? 'bl-tbl__sort-asc' : undefined} />
											</button>
										) : (
											column.label
										)}
									</th>
								);
							})}
							<th className="bl-tbl__details-col">{__('Details', 'betterlinks')}</th>
						</tr>
					</thead>

					<tbody>
						{visible.map((row) => (
							<tr key={row.link_id} className={selected.includes(row.link_id) ? 'is-selected' : undefined}>
								<td className="bl-tbl__check-col">
									<input
										type="checkbox"
										checked={selected.includes(row.link_id)}
										aria-label={sprintf(__('Select %s', 'betterlinks'), row.name)}
										onChange={() => toggleRow(row.link_id)}
									/>
								</td>
								<td>
									<span className="bl-tbl__link">
										<span className="bl-tbl__link-icon">
											<ChainIcon width={14} height={14} />
										</span>
										<span className="bl-tbl__link-name" title={row.name}>
											{row.name}
										</span>
									</span>
								</td>
								<td>
									<span className="bl-tbl__slug">{row.short_url}</span>
								</td>
								<td>
									<a className="bl-tbl__target" href={row.target_url} target="_blank" rel="noopener noreferrer" title={row.target_url}>
										{row.target_url}
									</a>
								</td>
								<td className="bl-tbl__num bl-tbl__strong">{formatNumber(row.total_clicks)}</td>
								<td className="bl-tbl__num">{formatNumber(row.unique_clicks)}</td>
								<td className="bl-tbl__details-col">
									<a
										className="bl-tbl__eye"
										href={`admin.php?page=betterlinks-analytics&id=${row.link_id}`}
										aria-label={sprintf(__('View analytics for %s', 'betterlinks'), row.name)}
									>
										<EyeIcon width={16} height={16} />
									</a>
								</td>
							</tr>
						))}

						{!visible.length && (
							<tr className="bl-tbl__empty-row">
								<td colSpan={COLUMNS.length + 2}>
									{search ? __('No links match your search.', 'betterlinks') : __('No link received a click in this range.', 'betterlinks')}
								</td>
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
						onChange={(event) => {
							setPerPage(Number(event.target.value));
							setPage(1);
						}}
					>
						{ROWS_PER_PAGE.map((size) => (
							<option key={size} value={size}>
								{size}
							</option>
						))}
					</select>
				</label>

				<div className="bl-tbl__pager">
					<span className="bl-tbl__count">
						{/* translators: 1: first row on page, 2: last row on page, 3: total rows. */}
						{sprintf(__('%1$s–%2$s of %3$s', 'betterlinks'), formatNumber(from), formatNumber(upto), formatNumber(total))}
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
				title={__('Delete analytics data?', 'betterlinks')}
				description={sprintf(
					/* translators: 1: number of links, 2: the selected range. */
					__('Click data for %1$s selected link(s) will be permanently removed for %2$s. The links themselves are kept.', 'betterlinks'),
					formatNumber(selected.length),
					rangeLabel
				)}
				confirmLabel={__('Delete analytics', 'betterlinks')}
			/>
		</div>
	);
};

export default LinksSection;
