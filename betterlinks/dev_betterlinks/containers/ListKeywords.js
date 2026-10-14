import React, { useMemo, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import AddNewKeywords from './AddNewKeywords';
import ProBadge from 'components/Badge/ProBadge';
import { delete_keyword, update_keyword } from 'redux/actions/keywords.actions';
import { is_pro_enabled, pro_version_check, site_url as site_link } from 'utils/helper';
import { RefreshIcon, SearchIcon, CopyIcon, ExternalIcon } from 'components/Icons';
import { LinkEditIcon, LinkDeleteIcon } from 'components/SvgIcons';
import ConfirmDeleteModal from 'components/ConfirmDeleteModal';

const ROWS_OPTIONS = [10, 25, 50, 100];

// --- inline icons that aren't in the shared Icon set ----------------------
const TypeIcon = ({ size = 16 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<path d="M4 7V5h16v2M9 19h6M12 5v14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);
const ChevronIcon = ({ size = 16 }) => (
	<svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
		<path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);
const FilterIcon = ({ size = 15 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<path d="M3 5h18M6 12h12M10 19h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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

// Normalise a keyword's stored active flag (default: active).
const isKeywordActive = (row) => {
	const v = row?.is_active;
	if (v === undefined || v === null) return true;
	return v === true || v === 1 || v === '1' || v === 'active';
};

// Stored post_type may be an array or a comma/semicolon string.
const asList = (val) => {
	if (Array.isArray(val)) return val.filter((x) => x !== '' && x != null);
	if (typeof val === 'string' && val.trim() !== '') return val.split(/[,;]/).map((x) => x.trim()).filter(Boolean);
	return [];
};

const ListKeywords = ({ keywords, links, linksForUpdateModal, postTypesProps, delete_keyword, update_keyword }) => {
	const [search, setSearch] = useState('');
	const [status, setStatus] = useState('all');
	const [page, setPage] = useState(1);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [selected, setSelected] = useState([]); // array of row references
	const [confirmDelete, setConfirmDelete] = useState(null); // row being confirmed
	const [confirmBulk, setConfirmBulk] = useState(false); // bulk delete confirmation
	const [bulkStatus, setBulkStatus] = useState('');

	const site_url = betterLinksHooks.applyFilters('site_url', site_link);
	const canChangeStatus = is_pro_enabled && pro_version_check('2.6.1');
	const allRows = keywords?.data || [];

	// label lookup helpers
	const postTypeLabel = (val) => {
		const found = (postTypesProps.postTypes || []).find((pt) => `${pt.value}` === `${val}`);
		return found ? found.label : val;
	};
	const linkTitle = (linkId) => (linksForUpdateModal.find((l) => l.value == linkId) || {}).label;
	const linkSlug = (linkId) => (links.find((l) => l.value == linkId) || {}).label;

	// filter + search
	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		return allRows.filter((row) => {
			if (status === 'active' && !isKeywordActive(row)) return false;
			if (status === 'draft' && isKeywordActive(row)) return false;
			if (q && !(row.keywords || '').toLowerCase().includes(q)) return false;
			return true;
		});
	}, [allRows, search, status]);

	const totalRows = filtered.length;
	const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
	const currentPage = Math.min(page, totalPages);
	const start = (currentPage - 1) * rowsPerPage;
	const pageRows = filtered.slice(start, start + rowsPerPage);

	const resetFilters = () => {
		setSearch('');
		setStatus('all');
		setPage(1);
	};

	const isSelected = (row) => selected.includes(row);
	const toggleRow = (row) => setSelected((prev) => (prev.includes(row) ? prev.filter((r) => r !== row) : [...prev, row]));
	const allPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.includes(r));
	const togglePageAll = () => {
		if (allPageSelected) {
			setSelected((prev) => prev.filter((r) => !pageRows.includes(r)));
		} else {
			setSelected((prev) => [...new Set([...prev, ...pageRows])]);
		}
	};

	const handleBulkDelete = () => {
		if (selected.length === 0) return;
		setConfirmBulk(true);
	};
	const doBulkDelete = () => {
		delete_keyword(selected);
		setSelected([]);
		setConfirmBulk(false);
	};

	const handleBulkStatus = () => {
		if (!canChangeStatus || !bulkStatus || selected.length === 0) return;
		selected.forEach((row) => {
			update_keyword({
				...row,
				isActive: bulkStatus === 'active',
				keywordStatus: bulkStatus,
				keywords: row.keywords,
				oldKeywords: row.keywords,
				chooseLink: row.link_id,
				oldChooseLink: row.link_id,
				postType: row.post_type || [],
				category: row.category || [],
				tags: row.tags || [],
				openNewTab: row.open_new_tab || false,
				useNoFollow: row.use_no_follow || false,
				caseSensitive: row.case_sensitive || false,
				keywordBefore: row.keyword_before || '',
				keywordAfter: row.keyword_after || '',
				leftBoundary: row.left_boundary || '',
				rightBoundary: row.right_boundary || '',
				limit: row.limit || 100,
			});
		});
		setSelected([]);
		setBulkStatus('');
	};

	const rangeLabel = totalRows === 0 ? __('0 of 0', 'betterlinks') : `${start + 1}–${Math.min(start + rowsPerPage, totalRows)} ${__('of', 'betterlinks')} ${totalRows}`;

	return (
		<div className="bl-kw__panel">
			{/* Toolbar */}
			<div className="bl-kw__toolbar">
				<div className="bl-kw__search">
					<SearchIcon size={16} />
					<input
						type="search"
						value={search}
						placeholder={__('Search keywords…', 'betterlinks')}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(1);
						}}
					/>
				</div>
				<div className="bl-kw__toolbar-right">
					<div className="bl-kw__filter">
						<span className="bl-kw__filter-icon"><FilterIcon /></span>
						<span className="bl-kw__filter-label">{__('Status:', 'betterlinks')}</span>
						<select
							className="bl-kw__filter-select"
							value={status}
							onChange={(e) => {
								setStatus(e.target.value);
								setPage(1);
							}}
						>
							<option value="all">{__('All', 'betterlinks')}</option>
							<option value="active">{__('Active', 'betterlinks')}</option>
							<option value="draft">{__('Draft', 'betterlinks')}</option>
						</select>
						<span className="bl-kw__filter-caret"><ChevronIcon /></span>
					</div>
					<button type="button" className="bl-kw__reset" onClick={resetFilters}>
						<RefreshIcon size={15} />
						{__('Reset', 'betterlinks')}
					</button>
				</div>
			</div>

			{/* Bulk action bar */}
			{selected.length > 0 && (
				<div className="bl-kw__bulk">
					<span className="bl-kw__bulk-count">{selected.length} {__('selected', 'betterlinks')}</span>
					<div className="bl-kw__bulk-actions">
						<select className="bl-kw__bulk-select" value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} disabled={!canChangeStatus}>
							<option value="">{__('Change status…', 'betterlinks')}</option>
							<option value="active">{__('Active', 'betterlinks')}</option>
							<option value="draft">{__('Draft', 'betterlinks')}</option>
						</select>
						<button type="button" className="bl-kw__bulk-btn" onClick={handleBulkStatus} disabled={!canChangeStatus || !bulkStatus} title={!canChangeStatus ? __('Requires BetterLinks Pro v2.6.1+', 'betterlinks') : ''}>
							{__('Apply', 'betterlinks')}
							{!canChangeStatus && <ProBadge />}
						</button>
						<button type="button" className="bl-kw__bulk-btn bl-kw__bulk-btn--danger" onClick={handleBulkDelete}>
							{__('Delete', 'betterlinks')}
						</button>
					</div>
				</div>
			)}

			{/* Table */}
			<div className="bl-kw__table-wrap">
				<table className="bl-kw__table">
					<thead>
						<tr>
							<th className="bl-kw__cell-check">
								<label className="bl-kw__check">
									<input type="checkbox" checked={allPageSelected} onChange={togglePageAll} />
									<span className="bl-kw__check-box" />
								</label>
							</th>
							<th>{__('Keywords', 'betterlinks')}</th>
							<th className="bl-kw__cell-status">{__('Status', 'betterlinks')}</th>
							<th>{__('Shortened URL', 'betterlinks')}</th>
							<th className="bl-kw__cell-action">{__('Action', 'betterlinks')}</th>
						</tr>
					</thead>
					<tbody>
						{pageRows.length === 0 && (
							<tr className="bl-kw__empty-row">
								<td colSpan={5}>{__('No keywords found.', 'betterlinks')}</td>
							</tr>
						)}
						{pageRows.map((row, i) => {
							const active = isKeywordActive(row);
							const title = linkTitle(row.link_id);
							const slug = linkSlug(row.link_id);
							const types = asList(row.post_type).map(postTypeLabel).filter(Boolean);
							const fullUrl = slug ? `${site_url}/${slug}` : '';
							const keyword = (row.keywords || '').toString();
							return (
								<tr key={`${row.link_id}-${i}-${keyword}`} className={isSelected(row) ? 'is-selected' : ''}>
									<td className="bl-kw__cell-check">
										<label className="bl-kw__check">
											<input type="checkbox" checked={isSelected(row)} onChange={() => toggleRow(row)} />
											<span className="bl-kw__check-box" />
										</label>
									</td>
									<td>
										<div className="bl-kw__kw">
											<span className="bl-kw__kw-badge"><TypeIcon size={17} /></span>
											<div className="bl-kw__kw-text">
												<span className="bl-kw__kw-name" title={keyword}>{keyword}</span>
												<span className="bl-kw__kw-sub">
													{title ? (
														<>
															<span className="bl-kw__kw-arrow">→</span> {title}
															{types.length > 0 && <> · {types.join(', ')}</>}
														</>
													) : (
														<span className="bl-kw__kw-missing">{__('No link selected or link removed', 'betterlinks')}</span>
													)}
												</span>
											</div>
										</div>
									</td>
									<td className="bl-kw__cell-status">
										<span className={`bl-kw__status ${active ? 'is-active' : 'is-draft'}`}>
											<span className="bl-kw__status-dot" />
											{active ? __('Active', 'betterlinks') : __('Draft', 'betterlinks')}
										</span>
									</td>
									<td>
										{slug ? (
											<div className="bl-kw__url">
												<span className="bl-kw__url-text" title={fullUrl}>{fullUrl.replace(/^https?:\/\//, '')}</span>
												<button type="button" className="bl-kw__url-btn" title={__('Copy link', 'betterlinks')} onClick={() => navigator.clipboard && navigator.clipboard.writeText(fullUrl)}>
													<CopyIcon size={15} />
												</button>
												<a className="bl-kw__url-btn" href={fullUrl} target="_blank" rel="noreferrer" title={__('Open link', 'betterlinks')}>
													<ExternalIcon size={15} />
												</a>
											</div>
										) : (
											<span className="bl-kw__url-missing">{__('—', 'betterlinks')}</span>
										)}
									</td>
									<td className="bl-kw__cell-action">
										<div className="bl-kw__row-actions">
											<AddNewKeywords data={row} keywords={keywords} postTypesProps={postTypesProps} linksForUpdateModal={linksForUpdateModal}>
												<LinkEditIcon size={16} />
											</AddNewKeywords>
											<button type="button" className="bl-kw__action-btn bl-kw__action-btn--danger" title={__('Delete', 'betterlinks')} onClick={() => setConfirmDelete(row)}>
												<LinkDeleteIcon size={16} />
											</button>
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{/* Footer / pagination */}
			<div className="bl-kw__foot">
				<div className="bl-kw__rows">
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
				<div className="bl-kw__pager">
					<span className="bl-kw__pager-range">{rangeLabel}</span>
					<div className="bl-kw__pager-btns">
						<button type="button" onClick={() => setPage(1)} disabled={currentPage <= 1} aria-label={__('First page', 'betterlinks')}><ChevronsLeft /></button>
						<button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage <= 1} aria-label={__('Previous page', 'betterlinks')}><ChevronLeft /></button>
						<button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage >= totalPages} aria-label={__('Next page', 'betterlinks')}><span className="bl-kw__flip"><ChevronLeft /></span></button>
						<button type="button" onClick={() => setPage(totalPages)} disabled={currentPage >= totalPages} aria-label={__('Last page', 'betterlinks')}><span className="bl-kw__flip"><ChevronsLeft /></span></button>
					</div>
				</div>
			</div>

			<ConfirmDeleteModal
				isOpen={!!confirmDelete}
				onClose={() => setConfirmDelete(null)}
				onConfirm={() => {
					delete_keyword([confirmDelete]);
					setSelected((prev) => prev.filter((r) => r !== confirmDelete));
					setConfirmDelete(null);
				}}
				title={__('Delete keyword?', 'betterlinks')}
				description={
					<>
						{__('This removes', 'betterlinks')} <strong>{(confirmDelete?.keywords || '').toString()}</strong> {__("from auto-linking. This can't be undone.", 'betterlinks')}
					</>
				}
			/>
			<ConfirmDeleteModal
				isOpen={confirmBulk}
				onClose={() => setConfirmBulk(false)}
				onConfirm={doBulkDelete}
				title={__('Delete selected keywords?', 'betterlinks')}
				description={
					<>
						{__('This removes', 'betterlinks')} <strong>{selected.length}</strong> {__("keywords from auto-linking. This can't be undone.", 'betterlinks')}
					</>
				}
			/>
		</div>
	);
};

const mapDispatchToProps = (dispatch) => ({
	delete_keyword: bindActionCreators(delete_keyword, dispatch),
	update_keyword: bindActionCreators(update_keyword, dispatch),
});

export default connect(null, mapDispatchToProps)(ListKeywords);
