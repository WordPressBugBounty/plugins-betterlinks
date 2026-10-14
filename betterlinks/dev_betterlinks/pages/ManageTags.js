import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { __ } from '@wordpress/i18n';
import { delete_tag, fetch_all_tags, fetch_all_categories, fetch_terms_data } from 'redux/actions/terms.actions';
import TermModal from 'containers/TermModal';
import PermissionModal from 'components/PermissionModal';
import ConfirmDeleteModal from 'components/ConfirmDeleteModal';
import { sortByClicksTag, sortByClicksCategory, isProtectedTermId } from 'utils/helper';
import { RefreshIcon, SearchIcon, SortIcon, TagIcon, FolderIcon, LinkIcon, ChartIcon } from 'components/Icons';
import { LinkEditIcon, LinkDeleteIcon } from 'components/SvgIcons';

const ROWS_OPTIONS = [10, 25, 50, 100];

// --- inline icons ---------------------------------------------------------
const DownloadIcon = ({ size = 16 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<path d="M12 3v11m0 0l-4-4m4 4l4-4M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);
const ChevronIcon = ({ size = 16 }) => (
	<svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
		<path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);
const ChevronsLeft = () => (
	<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
		<path d="M8.5 4L4.5 8l4 4M12 4L8 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);
const ChevronLeft = () => (
	<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
		<path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

const clicksFor = (analytics, id) => ({
	total: +(analytics?.total_clicks?.[id] ?? analytics?.total_clicks?.[String(id)] ?? 0),
	unique: +(analytics?.unique_clicks?.[id] ?? analytics?.unique_clicks?.[String(id)] ?? 0),
});

const hasTermPermission = () => {
	if (window.betterLinksProGlobal && typeof window.betterLinksProGlobal.user_can_manage_tags_categories !== 'undefined') {
		return window.betterLinksProGlobal.user_can_manage_tags_categories || window.betterLinksProGlobal.user_can_manage_options;
	}
	return window.betterLinksGlobal && window.betterLinksGlobal.user_can_manage_options;
};

// ==========================================================================
// Table panel (one per active tab; remounted on tab change via `key`)
// ==========================================================================
const TermsTable = ({ tab, setTab, tagsCount, catsCount, items, analytics, delete_tag }) => {
	const isTags = tab === 'tags';
	const [search, setSearch] = useState('');
	const [sort, setSort] = useState('total_clicks-desc');
	const [page, setPage] = useState(1);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [selected, setSelected] = useState([]);
	const [confirmDelete, setConfirmDelete] = useState(null);
	const [confirmBulk, setConfirmBulk] = useState(false);
	const [showPerm, setShowPerm] = useState(false);

	const isProtected = (row) => !isTags && isProtectedTermId(row.id ?? row.ID);
	const sortFn = isTags ? sortByClicksTag : sortByClicksCategory;
	const rowId = (row) => row.id ?? row.ID;

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		let list = items.filter((i) => !q || (i.term_name || '').toLowerCase().includes(q) || (i.term_slug || '').toLowerCase().includes(q));
		if (sort && analytics) {
			try {
				const sorted = sortFn(sort, list, analytics);
				if (Array.isArray(sorted)) list = sorted;
			} catch (e) {
				/* analytics not ready — leave unsorted */
			}
		}
		return list;
	}, [items, search, sort, analytics]);

	const totalRows = filtered.length;
	const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
	const currentPage = Math.min(page, totalPages);
	const start = (currentPage - 1) * rowsPerPage;
	const pageRows = filtered.slice(start, start + rowsPerPage);

	const selectableRows = pageRows.filter((r) => !isProtected(r));
	const allPageSelected = selectableRows.length > 0 && selectableRows.every((r) => selected.includes(r));
	const togglePageAll = () => {
		if (allPageSelected) setSelected((prev) => prev.filter((r) => !selectableRows.includes(r)));
		else setSelected((prev) => [...new Set([...prev, ...selectableRows])]);
	};
	const toggleRow = (row) => setSelected((prev) => (prev.includes(row) ? prev.filter((r) => r !== row) : [...prev, row]));

	const doDelete = (rows) => {
		if (!hasTermPermission()) {
			setShowPerm(true);
			return;
		}
		delete_tag(rows.map((r) => ({ tag_id: rowId(r) })));
	};
	const handleBulkDelete = () => {
		if (selected.length === 0) return;
		if (!hasTermPermission()) {
			setShowPerm(true);
			return;
		}
		setConfirmBulk(true);
	};
	const doBulkDelete = () => {
		doDelete(selected);
		setSelected([]);
		setConfirmBulk(false);
	};

	const rangeLabel = totalRows === 0 ? __('0 of 0', 'betterlinks') : `${start + 1}–${Math.min(start + rowsPerPage, totalRows)} ${__('of', 'betterlinks')} ${totalRows}`;

	return (
		<div className="bl-tc__panel">
			{/* Toolbar: tabs + search + sort */}
			<div className="bl-tc__toolbar">
				<div className="bl-tc__tabs">
					<button type="button" className={`bl-tc__tab ${isTags ? 'is-active' : ''}`} onClick={() => setTab('tags')}>
						<TagIcon size={15} />
						{__('Tags', 'betterlinks')}
						<span className="bl-tc__tab-count">{tagsCount}</span>
					</button>
					<button type="button" className={`bl-tc__tab ${!isTags ? 'is-active' : ''}`} onClick={() => setTab('categories')}>
						<FolderIcon size={15} />
						{__('Categories', 'betterlinks')}
						<span className="bl-tc__tab-count">{catsCount}</span>
					</button>
				</div>

				<div className="bl-tc__search">
					<SearchIcon size={16} />
					<input
						type="search"
						value={search}
						placeholder={isTags ? __('Search tags…', 'betterlinks') : __('Search categories…', 'betterlinks')}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(1);
						}}
					/>
				</div>

				<div className="bl-tc__sort">
					<span className="bl-tc__sort-icon"><SortIcon size={15} /></span>
					<span className="bl-tc__sort-label">{__('Sort:', 'betterlinks')}</span>
					<select className="bl-tc__sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
						<option value="total_clicks-desc">{__('Most clicks', 'betterlinks')}</option>
						<option value="total_clicks-asc">{__('Least clicks', 'betterlinks')}</option>
						<option value="unique_clicks-desc">{__('Most unique', 'betterlinks')}</option>
						<option value="unique_clicks-asc">{__('Least unique', 'betterlinks')}</option>
					</select>
					<span className="bl-tc__sort-caret"><ChevronIcon /></span>
				</div>
			</div>

			{/* Bulk bar */}
			{selected.length > 0 && (
				<div className="bl-tc__bulk">
					<span className="bl-tc__bulk-count">{selected.length} {__('selected', 'betterlinks')}</span>
					<button type="button" className="bl-tc__bulk-btn bl-tc__bulk-btn--danger" onClick={handleBulkDelete}>
						{__('Delete', 'betterlinks')}
					</button>
				</div>
			)}

			{/* Table */}
			<div className="bl-tc__table-wrap">
				<table className="bl-tc__table">
					<thead>
						<tr>
							<th className="bl-tc__cell-check">
								<label className="bl-tc__check">
									<input type="checkbox" checked={allPageSelected} onChange={togglePageAll} disabled={selectableRows.length === 0} />
									<span className="bl-tc__check-box" />
								</label>
							</th>
							<th>{isTags ? __('Tag', 'betterlinks') : __('Category', 'betterlinks')}</th>
							<th className="bl-tc__cell-links">{__('Links', 'betterlinks')}</th>
							<th className="bl-tc__cell-clicks">{__('Clicks', 'betterlinks')}</th>
							<th className="bl-tc__cell-action">{__('Action', 'betterlinks')}</th>
						</tr>
					</thead>
					<tbody>
						{pageRows.length === 0 && (
							<tr className="bl-tc__empty-row">
								<td colSpan={5}>{isTags ? __('No tags found.', 'betterlinks') : __('No categories found.', 'betterlinks')}</td>
							</tr>
						)}
						{pageRows.map((row) => {
							const id = rowId(row);
							const { total, unique } = clicksFor(analytics, id);
							const protectedRow = isProtected(row);
							return (
								<tr key={id} className={selected.includes(row) ? 'is-selected' : ''}>
									<td className="bl-tc__cell-check">
										<label className="bl-tc__check">
											<input type="checkbox" checked={selected.includes(row)} onChange={() => toggleRow(row)} disabled={protectedRow} />
											<span className="bl-tc__check-box" />
										</label>
									</td>
									<td>
										<div className="bl-tc__name">
											<span className="bl-tc__name-badge">{isTags ? <TagIcon size={17} /> : <FolderIcon size={17} />}</span>
											<span className="bl-tc__name-text" title={row.term_name}>{row.term_name}</span>
										</div>
									</td>
									<td className="bl-tc__cell-links">
										<span className="bl-tc__links">
											<LinkIcon size={13} />
											{+(row.link_count || 0)}
										</span>
									</td>
									<td className="bl-tc__cell-clicks">
										<span className="bl-tc__clicks">
											<strong>{total.toLocaleString()}</strong>
											<em>/ {unique.toLocaleString()}</em>
										</span>
									</td>
									<td className="bl-tc__cell-action">
										<div className="bl-tc__row-actions">
											<TermModal mode="edit" type={isTags ? 'tag' : 'category'} row={row} tags={isTags ? items : []} categories={isTags ? [] : items}>
												<LinkEditIcon size={16} />
											</TermModal>
											{!protectedRow && (
												<button type="button" className="bl-tc__action-btn bl-tc__action-btn--danger" title={__('Delete', 'betterlinks')} onClick={() => setConfirmDelete(row)}>
													<LinkDeleteIcon size={16} />
												</button>
											)}
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{/* Footer */}
			<div className="bl-tc__foot">
				<div className="bl-tc__rows">
					<span>{__('Rows:', 'betterlinks')}</span>
					<select
						value={rowsPerPage}
						onChange={(e) => {
							setRowsPerPage(Number(e.target.value));
							setPage(1);
						}}
					>
						{ROWS_OPTIONS.map((n) => (
							<option key={n} value={n}>{n}</option>
						))}
					</select>
				</div>
				<div className="bl-tc__pager">
					<span className="bl-tc__pager-range">{rangeLabel}</span>
					<div className="bl-tc__pager-btns">
						<button type="button" onClick={() => setPage(1)} disabled={currentPage <= 1} aria-label={__('First page', 'betterlinks')}><ChevronsLeft /></button>
						<button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage <= 1} aria-label={__('Previous page', 'betterlinks')}><ChevronLeft /></button>
						<button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage >= totalPages} aria-label={__('Next page', 'betterlinks')}><span className="bl-tc__flip"><ChevronLeft /></span></button>
						<button type="button" onClick={() => setPage(totalPages)} disabled={currentPage >= totalPages} aria-label={__('Last page', 'betterlinks')}><span className="bl-tc__flip"><ChevronsLeft /></span></button>
					</div>
				</div>
			</div>

			<ConfirmDeleteModal
				isOpen={!!confirmDelete}
				onClose={() => setConfirmDelete(null)}
				onConfirm={() => {
					doDelete([confirmDelete]);
					setSelected((prev) => prev.filter((r) => r !== confirmDelete));
					setConfirmDelete(null);
				}}
				title={isTags ? __('Delete tag?', 'betterlinks') : __('Delete category?', 'betterlinks')}
				description={
					<>
						{__('This permanently deletes', 'betterlinks')} <strong>{confirmDelete?.term_name}</strong>. {__("This can't be undone.", 'betterlinks')}
					</>
				}
			/>
			<ConfirmDeleteModal
				isOpen={confirmBulk}
				onClose={() => setConfirmBulk(false)}
				onConfirm={doBulkDelete}
				title={isTags ? __('Delete selected tags?', 'betterlinks') : __('Delete selected categories?', 'betterlinks')}
				description={
					<>
						{__('This permanently deletes', 'betterlinks')} <strong>{selected.length}</strong> {isTags ? __("tags. This can't be undone.", 'betterlinks') : __("categories. This can't be undone.", 'betterlinks')}
					</>
				}
			/>

			<PermissionModal isOpen={showPerm} onClose={() => setShowPerm(false)} title={__('Delete Permission Required', 'betterlinks')} />
		</div>
	);
};

const TermsSkeleton = ({ rows = 6 }) => (
	<div className="bl-tc-skel">
		<div className="bl-tc__stats">
			{Array.from({ length: 4 }).map((_, i) => (
				<div className="bl-tc__stat" key={i}>
					<span className="bl-tc-skel__label" />
					<span className="bl-tc-skel__value" />
				</div>
			))}
		</div>
		<div className="bl-tc__toolbar">
			<span className="bl-tc-skel__tabs" />
			<span className="bl-tc-skel__search" />
			<span className="bl-tc-skel__sort" />
		</div>
		<div className="bl-tc__table-wrap">
			{Array.from({ length: rows }).map((_, i) => (
				<div className="bl-tc-skel__row" key={i}>
					<span className="bl-tc-skel__check" />
					<div className="bl-tc-skel__name">
						<span className="bl-tc-skel__badge" />
						<span className="bl-tc-skel__bar" />
					</div>
					<span className="bl-tc-skel__pill" />
					<span className="bl-tc-skel__bar bl-tc-skel__bar--sm" />
					<div className="bl-tc-skel__actions">
						<span className="bl-tc-skel__icon" />
						<span className="bl-tc-skel__icon" />
						<span className="bl-tc-skel__icon" />
					</div>
				</div>
			))}
		</div>
	</div>
);

// ==========================================================================
// Page
// ==========================================================================
const ManageTags = (props) => {
	const { tags, tag_analytics, categories, category_analytics } = props.terms;
	const [tab, setTab] = useState('tags');
	const [refreshing, setRefreshing] = useState(false);

	useEffect(() => {
		props.fetch_all_tags();
		props.fetch_terms_data();
		props.fetch_all_categories();
	}, []);

	const isTags = tab === 'tags';
	const items = (isTags ? tags : categories) || [];
	const analytics = isTags ? tag_analytics : category_analytics;
	const loaded = tags && categories;

	const tagsCount = (tags || []).length;
	const catsCount = (categories || []).length;

	const linkSum = items.reduce((a, i) => a + +(i.link_count || 0), 0);
	const clickSum = items.reduce(
		(acc, i) => {
			const c = clicksFor(analytics, i.id ?? i.ID);
			acc.total += c.total;
			acc.unique += c.unique;
			return acc;
		},
		{ total: 0, unique: 0 }
	);

	const refresh = () => {
		setRefreshing(true);
		props.fetch_all_tags();
		props.fetch_all_categories();
		props.fetch_terms_data();
		window.setTimeout(() => setRefreshing(false), 700);
	};

	const exportCsv = () => {
		const header = [isTags ? __('Tag', 'betterlinks') : __('Category', 'betterlinks'), __('Slug', 'betterlinks'), __('Links', 'betterlinks'), __('Total Clicks', 'betterlinks'), __('Unique Clicks', 'betterlinks')];
		const body = items.map((i) => {
			const c = clicksFor(analytics, i.id ?? i.ID);
			return [i.term_name, i.term_slug, +(i.link_count || 0), c.total, c.unique];
		});
		const csv = [header, ...body].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
		const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
		const a = document.createElement('a');
		a.href = url;
		a.download = `betterlinks-${tab}.csv`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const stats = [
		{ key: 'tags', label: __('Tags', 'betterlinks'), value: tagsCount, icon: <TagIcon /> },
		{ key: 'cats', label: __('Categories', 'betterlinks'), value: catsCount, icon: <FolderIcon /> },
		{ key: 'links', label: isTags ? __('Links in Tags', 'betterlinks') : __('Links in Categories', 'betterlinks'), value: linkSum, icon: <LinkIcon /> },
		{ key: 'clicks', label: __('Total Clicks', 'betterlinks'), value: clickSum.total.toLocaleString(), sub: `· ${clickSum.unique.toLocaleString()} ${__('unique', 'betterlinks')}`, icon: <ChartIcon /> },
	];

	return (
		<div className="bl-tc">
			<div className="bl-tc__header">
				<div className="bl-tc__heading">
					<h1 className="bl-tc__title">{__('Tags & Categories', 'betterlinks')}</h1>
					<p className="bl-tc__subtitle">{__('Organize your links into taxonomies and see how each one performs.', 'betterlinks')}</p>
				</div>
				<div className="bl-tc__actions">
					{/* <button type="button" className={`bl-tc__icon-btn ${refreshing ? 'is-spinning' : ''}`} onClick={refresh} title={__('Refresh', 'betterlinks')}>
						<RefreshIcon size={17} />
					</button> */}
					<button type="button" className="bl-tc__btn-ghost" onClick={exportCsv} disabled={!loaded}>
						<DownloadIcon />
						{__('Export', 'betterlinks')}
					</button>
					<TermModal mode="add" defaultType={isTags ? 'tag' : 'category'} tags={tags || []} categories={categories || []} />
				</div>
			</div>

			{loaded ? (
				<React.Fragment>
					<div className="bl-tc__stats">
						{stats.map((card) => (
							<div className="bl-tc__stat" key={card.key}>
								<div className="bl-tc__stat-head">
									<span className="bl-tc__stat-icon">{card.icon}</span>
									<span className="bl-tc__stat-label">{card.label}</span>
								</div>
								<div className="bl-tc__stat-value">
									{card.value}
									{card.sub && <span className="bl-tc__stat-sub">{card.sub}</span>}
								</div>
							</div>
						))}
					</div>

					<TermsTable
						key={tab}
						tab={tab}
						setTab={setTab}
						tagsCount={tagsCount}
						catsCount={catsCount}
						items={items}
						analytics={analytics}
						delete_tag={props.delete_tag}
					/>
				</React.Fragment>
			) : (
				<TermsSkeleton />
			)}
		</div>
	);
};

const mapStateToProps = (state) => ({
	terms: state.terms,
});
const mapDispatchToProps = (dispatch) => ({
	fetch_all_tags: bindActionCreators(fetch_all_tags, dispatch),
	fetch_all_categories: bindActionCreators(fetch_all_categories, dispatch),
	fetch_terms_data: bindActionCreators(fetch_terms_data, dispatch),
	delete_tag: bindActionCreators(delete_tag, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(ManageTags);
