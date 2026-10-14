import React, { useEffect, useMemo, useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Select from 'react-select';
import { dateI18n } from '@wordpress/date';
import Loader from 'components/Loader';
import ViewLink from 'components/ViewLink';
import FavoriteIcon from 'components/FavoriteIcon';
import LinkQuickAction from 'components/LinkQuickAction';
import { EmptyState, ListSkeleton } from 'components/States';
import { CopyIcon, ExternalIcon } from 'components/Icons';
import UpgradeToPro from 'components/Teasers/UpgradeToPro';
import { toastWarning } from 'components/Toast';
import { useUpgradeProModal } from 'utils/customHooks';
import { linksFilterData, betterlinks_date_format, copyShortUrl, site_url as site_link, is_pro_enabled, pro_needs_update, min_pro_version, plugin_root_url, route_path, withoutHiddenCategories } from 'utils/helper';
import { Link } from 'react-router-dom/cjs/react-router-dom.min';
import { fetch_links_data, add_new_link, edit_link, delete_link, bulk_assign_category, bulk_update_links } from 'redux/actions/links.actions';
import { fetch_settings_data, fetch_tracking_settings } from 'redux/actions/settings.actions';
import { fetch_terms_data } from 'redux/actions/terms.actions';

// Extra bulk actions. "Change status" is a BetterLinks Pro action: this entry is a
// locked preview, which Pro unlocks through `betterLinksLinksBulkActions` and
// performs through `betterLinksLinksBulkApply`.
//
// Action: `{ value, label, pro?, disabled?, options?: [{ value, label }], placeholder? }`.
// An action with `options` gets a select next to its Apply button.
const FREE_BULK_ACTIONS = [{ value: 'change_status', label: __('Change Status', 'betterlinks'), pro: true, disabled: true }];

const getClicks = (analytic) => {
	if (!analytic) return { total: 0, unique: 0 };
	const total = parseInt(analytic.link_count) || 0;
	const unique = Array.isArray(analytic.ip) ? analytic.ip.length : parseInt(analytic.ip) || 0;
	return { total, unique };
};

const Row = ({ item, catName, is_allow_qr, selected, onToggle, edit_link, delete_link, add_new_link }) => {
	const [copied, setCopied] = useState(false);
	const { total, unique } = getClicks(item.analytic);
	const status = item.link_status === 'broken' ? 'broken' : item.link_status || 'publish';
	const tags = Array.isArray(item.tags_data) ? item.tags_data : [];
	const shortLink = `${betterLinksHooks.applyFilters('site_url', site_link)}/${item.short_url}`;

	const copyHandler = () => {
		copyShortUrl(item.short_url);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 2000);
	};

	return (
		<tr className="bl-row">
			<td className="bl-list__c-check">
				<input type="checkbox" checked={selected} onChange={() => onToggle(item)} />
			</td>
			<td className="bl-list__c-title">
				<div className="bl-row__title-wrap">
					<FavoriteIcon data={item} />
					<span className={`bl-row__dot bl-row__dot--${status}`} />
					<div className="bl-row__titles">
						<ViewLink item={item} catName={catName} is_allow_qr={is_allow_qr} edit_link={edit_link} delete_link={delete_link} add_new_link={add_new_link}>
							<span className="bl-row__title">{item.link_title}</span>
						</ViewLink>
						<div className="bl-row__meta">
							{catName && <span className="bl-row__cat">{catName}</span>}
							{tags.map((tag, i) => (
								<span className="bl-row__tag" key={`${item.ID}-t-${i}`}>
									#{tag.term_name}
								</span>
							))}
						</div>
					</div>
				</div>
			</td>
			<td className="bl-list__c-short">
				<div className="bl-row__inline">
					<span className="bl-row__slug" title={shortLink}>
						{shortLink}
					</span>
					<button type="button" className={`bl-row__icon-btn ${copied ? 'is-copied' : ''}`} onClick={copyHandler} title={__('Copy link', 'betterlinks')} aria-label={__('Copy link', 'betterlinks')}>
						<CopyIcon size={15} />
					</button>
					<a className="bl-row__icon-btn" href={shortLink} target="_blank" rel="noreferrer" title={__('Visit link', 'betterlinks')} aria-label={__('Visit link', 'betterlinks')}>
						<ExternalIcon size={15} />
					</a>
				</div>
			</td>
			<td className="bl-list__c-target">
				<div className="bl-row__inline">
					<span className="bl-row__target" title={item.target_url}>
						{item.target_url}
					</span>
					<a className="bl-row__icon-btn" href={item.target_url} target="_blank" rel="noreferrer" title={__('Open target', 'betterlinks')} aria-label={__('Open target', 'betterlinks')}>
						<ExternalIcon size={15} />
					</a>
				</div>
			</td>
			<td className="bl-list__c-type">
				<span className="bl-row__type">{item.redirect_type}</span>
			</td>
			<td className="bl-list__c-clicks">
				<Link
					className="bl-row__clicks bl-row__clicks--link btl-white"
					to={route_path + 'admin.php?page=betterlinks-analytics&id=' + item.ID}
					title={__('View this link’s analytics', 'betterlinks')}
				>
					{total.toLocaleString()} <em>/ {unique.toLocaleString()}</em>
				</Link>
			</td>
			<td className="bl-list__c-date">{item.link_date ? dateI18n(betterlinks_date_format || 'M j, Y', new Date(item.link_date)) : '—'}</td>
			<td className="bl-list__c-actions">
				<div className="bl-row__actions">
					<LinkQuickAction
						isAlowQr={is_allow_qr}
						isShowAnalytics={false}
						isShowVisitLink={true}
						isShowCopyLink={false}
						isShowQuickView={true}
						catId={parseInt(item.cat_id)}
						catName={catName}
						submitLinkHandler={edit_link}
						deleteLinkHandler={delete_link}
						addNewLink={add_new_link}
						data={item}
						isShowEditLink={betterLinksHooks.applyFilters('betterLinksIsShowViewLink', true)}
						isShowDeleteLink={betterLinksHooks.applyFilters('betterLinksIsShowDeleteLink', true)}
					/>
				</div>
			</td>
		</tr>
	);
};

const ListCanvas = (props) => {
	// Same exclusion the board applies — a category kept off the dashboard must
	// not surface as rows, as a "move to category" target, or in the counts.
	const links = withoutHiddenCategories(props.links?.links);
	const { settings } = props.settings;
	const { terms } = props.terms;
	const { sortByFav } = props.favouriteSort;
	const filter = props.filter || {};
	const [selected, setSelected] = useState({});
	const [bulkCat, setBulkCat] = useState(null);
	const [bulkOptions, setBulkOptions] = useState({});
	const [isOpenUpgradeToProModal, openUpgradeToProModal, closeUpgradeToProModal] = useUpgradeProModal();
	const [perPage, setPerPage] = useState(() => parseInt(localStorage.getItem('btlRowsPerPage')) || 10);
	const [page, setPage] = useState(1);

	useEffect(() => {
		if (!settings) {
			props.fetch_settings_data();
			props.fetch_tracking_settings();
		}
		if (!links) props.fetch_links_data();
		if (!terms) props.fetch_terms_data();
	}, []);

	// Reset to the first page whenever the filters or page size change.
	useEffect(() => {
		setPage(1);
	}, [filter.filterText, filter.selectedCategory, filter.selectedTag, filter.selectedSort, filter.selectedDate, sortByFav, perPage]);

	const catName = (catId) => links?.[catId]?.term_name || '';
	const categoryOptions = useMemo(
		() =>
			links
				? Object.entries(links)
						.filter(([, cat]) => cat.term_slug !== 'uncategorized')
						.map(([key, cat]) => ({ value: key, label: cat.term_name }))
				: [],
		[links]
	);

	if (!(links && settings && terms)) return <ListSkeleton />;

	const stored = Object.values(links).reduce((total, cat) => [...total, ...(cat.lists || []).filter((l) => l && l.ID && l.link_title)], []);
	const rows = linksFilterData(stored, filter.filterText || '', filter.selectedCategory, filter.selectedSort, filter.selectedDate, filter.customDateFilter || [], sortByFav, filter.selectedTag);

	// Pagination
	const total = rows.length;
	const totalPages = Math.max(1, Math.ceil(total / perPage));
	const currentPage = Math.min(page, totalPages);
	const startIdx = (currentPage - 1) * perPage;
	const pageRows = rows.slice(startIdx, startIdx + perPage);
	const rangeStart = total === 0 ? 0 : startIdx + 1;
	const rangeEnd = Math.min(startIdx + perPage, total);

	const selectedIds = Object.keys(selected).filter((id) => selected[id]);
	const allChecked = pageRows.length > 0 && pageRows.every((r) => selected[r.ID]);

	const toggleRow = (item) => setSelected((prev) => ({ ...prev, [item.ID]: !prev[item.ID] }));
	const toggleAll = () => {
		const check = pageRows.some((r) => !selected[r.ID]);
		setSelected((prev) => {
			const next = { ...prev };
			pageRows.forEach((r) => (next[r.ID] = check));
			return next;
		});
	};
	const clearSelection = () => setSelected({});
	const changePerPage = (e) => {
		const val = parseInt(e.target.value) || 10;
		setPerPage(val);
		localStorage.setItem('btlRowsPerPage', val);
		setPage(1);
	};

	const bulkDelete = () => {
		const list = rows.filter((r) => selected[r.ID]).map((r) => ({ ID: r.ID, term_id: r.cat_id, short_url: r.short_url }));
		props.delete_link(list);
		clearSelection();
	};
	const bulkAssign = () => {
		if (!bulkCat) return;
		const list = rows.filter((r) => selected[r.ID]).map((r) => ({ ID: r.ID, cat_id: bulkCat.value }));
		props.bulk_assign_category(list);
		setBulkCat(null);
		clearSelection();
	};
	/**
	 * `betterLinksLinksBulkActions` — (actions, ctx) => actions. See FREE_BULK_ACTIONS.
	 * ctx: `{ view: 'list', selectedLinks, updateLinks(items) => Promise, refreshLinks(), clearSelection() }`.
	 */
	const bulkCtx = {
		view: 'list',
		selectedLinks: rows.filter((r) => selected[r.ID]),
		updateLinks: props.bulk_update_links,
		refreshLinks: props.fetch_links_data,
		clearSelection,
	};
	const bulkActionsFiltered = betterLinksHooks.applyFilters('betterLinksLinksBulkActions', FREE_BULK_ACTIONS, bulkCtx);
	const bulkActions = Array.isArray(bulkActionsFiltered) ? bulkActionsFiltered : FREE_BULK_ACTIONS;

	/**
	 * `betterLinksLinksBulkApply` — (handled, ctx) => boolean. ctx adds
	 * `{ action, option }` (option is the chosen `options` value, if any). Return
	 * true when the action was taken; `ctx.updateLinks([{ ID, ...fields }])` saves
	 * and reloads the list.
	 */
	const bulkApply = (action) => {
		const option = bulkOptions[action.value];
		if (action.options && !option) return;
		const handled = betterLinksHooks.applyFilters('betterLinksLinksBulkApply', false, { ...bulkCtx, action: action.value, option: option?.value });
		if (handled) {
			setBulkOptions((prev) => ({ ...prev, [action.value]: null }));
			clearSelection();
		}
	};

	// Locked action: the upgrade modal without Pro; an update note for an older Pro.
	const bulkUpsell = (action) => {
		if (!is_pro_enabled) {
			openUpgradeToProModal();
			return;
		}
		if (pro_needs_update) {
			toastWarning(
				/* translators: %s: required BetterLinks Pro version, e.g. "3.0.4" */
				sprintf(__('Please update BetterLinks Pro to v%s or later to ensure compatibility with the current version of BetterLinks.', 'betterlinks'), min_pro_version),
				{ title: __('BetterLinks Pro needs an update', 'betterlinks'), position: 'top-right', duration: 4000 }
			);
		}
	};

	// CLICKS header sorts by clicks (toggles most / least).
	const currentSort = filter.selectedSort?.value;
	const toggleClicksSort = () => {
		if (!props.onSort) return;
		if (currentSort === 'mostClicks') props.onSort({ value: 'leastClicks', label: __('Least clicks', 'betterlinks') });
		else if (currentSort === 'leastClicks') props.onSort(null);
		else props.onSort({ value: 'mostClicks', label: __('Most clicks', 'betterlinks') });
	};
	const clicksCaret = currentSort === 'mostClicks' ? '▼' : currentSort === 'leastClicks' ? '▲' : '';

	if (rows.length === 0) {
		const filtersActive = !!(filter.filterText || filter.selectedCategory?.value || filter.selectedTag?.value || filter.selectedSort?.value || filter.selectedDate?.value || sortByFav);
		return <EmptyState filtered={filtersActive} onReset={props.onResetFilters} />;
	}

	return (
		<div className="bl-listview">
			<UpgradeToPro isOpenModal={isOpenUpgradeToProModal} closeModal={closeUpgradeToProModal} />
			<div className="bl-list">
			{selectedIds.length > 0 && (
				<div className="bl-list__bulk">
					<span className="bl-list__bulk-count">{selectedIds.length} {__('selected', 'betterlinks')}</span>
					<Select
						className="bl-list__bulk-select"
						classNamePrefix="bl-rs"
						placeholder={__('Assign category…', 'betterlinks')}
						value={bulkCat}
						options={categoryOptions}
						onChange={setBulkCat}
					/>
					<button type="button" className="bl-list__bulk-btn" onClick={bulkAssign} disabled={!bulkCat}>
						{__('Assign', 'betterlinks')}
					</button>
					{bulkActions.map((action) =>
						action.pro || action.disabled ? (
							<button type="button" className="bl-list__bulk-btn is-pro" key={action.value} onClick={() => bulkUpsell(action)}>
								{action.label}
								<img height={16} width={16} src={`${plugin_root_url}assets/images/crown1.png`} alt={__('Pro Feature', 'betterlinks')} />
							</button>
						) : (
							<React.Fragment key={action.value}>
								{Array.isArray(action.options) && (
									<Select
										className="bl-list__bulk-select"
										classNamePrefix="bl-rs"
										placeholder={action.placeholder || action.label}
										value={bulkOptions[action.value] || null}
										options={action.options}
										onChange={(option) => setBulkOptions((prev) => ({ ...prev, [action.value]: option }))}
									/>
								)}
								<button type="button" className="bl-list__bulk-btn" onClick={() => bulkApply(action)} disabled={Array.isArray(action.options) && !bulkOptions[action.value]}>
									{Array.isArray(action.options) ? __('Apply', 'betterlinks') : action.label}
								</button>
							</React.Fragment>
						)
					)}
					<button type="button" className="bl-list__bulk-btn is-danger" onClick={bulkDelete}>
						{__('Delete', 'betterlinks')}
					</button>
					<button type="button" className="bl-list__bulk-clear" onClick={clearSelection}>
						{__('Clear', 'betterlinks')}
					</button>
				</div>
			)}
			<div className="bl-list__scroll">
				<table className="bl-list__table">
					<thead>
						<tr>
							<th className="bl-list__c-check">
								<input type="checkbox" checked={allChecked} onChange={toggleAll} />
							</th>
							<th className="bl-list__c-title">{__('Title', 'betterlinks')}</th>
							<th className="bl-list__c-short">{__('Short URL', 'betterlinks')}</th>
							<th className="bl-list__c-target">{__('Target', 'betterlinks')}</th>
							<th className="bl-list__c-type">{__('Type', 'betterlinks')}</th>
							<th className="bl-list__c-clicks bl-list__sortable" onClick={toggleClicksSort}>
								{__('Clicks', 'betterlinks')} <span className="bl-list__caret">{clicksCaret}</span>
							</th>
							<th className="bl-list__c-date">{__('Date', 'betterlinks')}</th>
							<th className="bl-list__c-actions">{__('Actions', 'betterlinks')}</th>
						</tr>
					</thead>
					<tbody>
						{pageRows.map((item) => (
							<Row
								key={item.ID}
								item={item}
								catName={catName(item.cat_id)}
								is_allow_qr={settings?.is_allow_qr}
								selected={!!selected[item.ID]}
								onToggle={toggleRow}
								edit_link={props.edit_link}
								delete_link={props.delete_link}
								add_new_link={props.add_new_link}
							/>
						))}
					</tbody>
				</table>
			</div>
			</div>

			<div className="bl-pagination">
				<div className="bl-pagination__rows">
					<span>{__('Rows:', 'betterlinks')}</span>
					<select value={perPage} onChange={changePerPage}>
						{[10, 25, 50, 100].map((n) => (
							<option key={n} value={n}>
								{n}
							</option>
						))}
					</select>
				</div>
				<div className="bl-pagination__nav">
					<span className="bl-pagination__info">
						{rangeStart}–{rangeEnd} {__('of', 'betterlinks')} {total}
					</span>
					<div className="bl-pagination__btns">
						<button type="button" onClick={() => setPage(1)} disabled={currentPage === 1} title={__('First page', 'betterlinks')}>
							&laquo;
						</button>
						<button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1} title={__('Previous page', 'betterlinks')}>
							&lsaquo;
						</button>
						<button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage === totalPages} title={__('Next page', 'betterlinks')}>
							&rsaquo;
						</button>
						<button type="button" onClick={() => setPage(totalPages)} disabled={currentPage === totalPages} title={__('Last page', 'betterlinks')}>
							&raquo;
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

const mapStateToProps = (state) => ({
	links: state.links,
	settings: state.settings,
	terms: state.terms,
	favouriteSort: state.favouriteSort,
});

const mapDispatchToProps = (dispatch) => ({
	fetch_links_data: bindActionCreators(fetch_links_data, dispatch),
	fetch_settings_data: bindActionCreators(fetch_settings_data, dispatch),
	fetch_tracking_settings: bindActionCreators(fetch_tracking_settings, dispatch),
	add_new_link: bindActionCreators(add_new_link, dispatch),
	edit_link: bindActionCreators(edit_link, dispatch),
	delete_link: bindActionCreators(delete_link, dispatch),
	bulk_assign_category: bindActionCreators(bulk_assign_category, dispatch),
	bulk_update_links: bindActionCreators(bulk_update_links, dispatch),
	fetch_terms_data: bindActionCreators(fetch_terms_data, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(ListCanvas);
