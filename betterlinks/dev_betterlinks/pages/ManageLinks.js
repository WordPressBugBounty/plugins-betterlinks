import React, { useState, useMemo } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { subDays } from 'date-fns';
import { __ } from '@wordpress/i18n';
import DndCanvas from 'containers/DndCanvas';
import ListCanvas from 'containers/ListCanvas';
import Overview from 'components/Overview';
import LinksToolbar from 'components/LinksToolbar';
import Link from 'containers/Link';
import { add_new_link } from 'redux/actions/links.actions';
import { fetch_links_data } from 'redux/actions/links.actions';
import { linksView } from 'redux/actions/activity.actions';
import { sortFavourite } from 'redux/actions/favouritesort.actions';
import { betterlinks_nonce, get_tags, getFilteredLinksView, insertOverlayElement, withoutHiddenCategories } from 'utils/helper';
import { toastSuccess, toastError } from 'components/Toast';
import axios from 'axios';
import { RefreshIcon, ListViewIcon, BoardViewIcon, DensityIcon } from 'components/Icons';

const sortOptions = [
	{ value: 'mostClicks', label: __('Most clicks', 'betterlinks') },
	{ value: 'leastClicks', label: __('Least clicks', 'betterlinks') },
	{ value: 'mostUniqueClicks', label: __('Most unique clicks', 'betterlinks') },
	{ value: 'leastUniqueClicks', label: __('Least unique clicks', 'betterlinks') },
];

const dateOptions = [
	{ value: 'yesterday', label: __('Yesterday', 'betterlinks') },
	{ value: 'last7', label: __('Last 7 days', 'betterlinks') },
	{ value: 'last30', label: __('Last 30 days', 'betterlinks') },
	{ value: 'last90', label: __('Last 90 days', 'betterlinks') },
	{ value: 'custom', label: __('Custom', 'betterlinks') },
];

const ManageLinks = (props) => {
	const { activity, favouriteSort } = props;
	const { sortByFav } = favouriteSort;
	// Categories a feature keeps off the dashboard are dropped up front so the
	// toolbar's filter options and the overview counts match the board.
	const links = useMemo(() => withoutHiddenCategories(props.links?.links), [props.links?.links]);
	const isBoard = activity.linksView !== 'list';

	const [filterText, setFilterText] = useState('');
	const [selectedCategory, setCategory] = useState(null);
	const [selectedTag, setTag] = useState(null);
	const [selectedSort, setSort] = useState(null);
	const [selectedDate, setDate] = useState(null);
	const [isOpenCustomDateFilter, setIsOpenCustomDateFilter] = useState(false);
	const [customDateFilter, setCustomDateFilter] = useState([{ startDate: subDays(new Date(), 30), endDate: new Date(), key: 'selection' }]);
	const [compact, setCompact] = useState(localStorage.getItem('btlBoardDensity') === 'compact');
	const [refreshing, setRefreshing] = useState(false);

	const filter = { filterText, selectedCategory, selectedTag, selectedSort, selectedDate, customDateFilter, sortByFav };

	// Category options carry a per-category link count; the leading "All"
	// option shows the total and clears the filter when picked.
	const categoryOptions = useMemo(() => {
		if (!links) return [];
		const cats = Object.entries(links).map(([key, item]) => ({
			value: key,
			label: item.term_name,
			count: (item.lists || []).filter((l) => l && l.ID && l.link_title).length,
		}));
		const total = cats.reduce((sum, c) => sum + c.count, 0);
		return [{ value: '__all__', label: __('All categories', 'betterlinks'), count: total }, ...cats];
	}, [links]);

	// Tag options carry a per-tag link count (how many links use that tag).
	const tagOptions = useMemo(() => {
		if (!links) return [];
		const counts = {};
		let total = 0;
		Object.values(links).forEach((cat) =>
			(cat.lists || []).forEach((item) => {
				if (!item || !item.ID || !item.link_title) return;
				total += 1;
				(item.tags_data || []).forEach((t) => {
					if (t && t.term_name) counts[t.term_name] = (counts[t.term_name] || 0) + 1;
				});
			})
		);
		const tags = Object.entries(get_tags(links)).map(([id, name]) => ({ value: id, label: name, count: counts[name] || 0 }));
		return [{ value: '__all__', label: __('All tags', 'betterlinks'), count: total }, ...tags];
	}, [links]);

	const selectCategory = (opt) => setCategory(opt && opt.value === '__all__' ? null : opt);
	const selectTag = (opt) => setTag(opt && opt.value === '__all__' ? null : opt);

	const stats = useMemo(() => (links ? getFilteredLinksView(links, filter).stats : { links: 0, categories: 0, clicks: 0, active: 0, favorites: 0 }), [links, filterText, selectedCategory, selectedTag, selectedSort, selectedDate, customDateFilter, sortByFav]);

	const dateHandler = (type) => {
		setDate(type);
		if (type && type.value === 'custom') {
			insertOverlayElement();
			setIsOpenCustomDateFilter(true);
		} else {
			setIsOpenCustomDateFilter(false);
		}
	};

	const resetFilters = () => {
		setFilterText('');
		setCategory(null);
		setTag(null);
		setSort(null);
		setDate(null);
		setIsOpenCustomDateFilter(false);
		if (sortByFav) props.sortFavourite(false);
	};

	// Same action the Analytics header's "Refresh Stats" button posts to: it runs
	// the analytics cron so the cached click totals are rebuilt, then we re-read
	// the links (the board's click counts come from the links payload).
	const refreshHandler = async () => {
		if (refreshing) return;
		setRefreshing(true);
		try {
			await axios.post(`${ajaxurl}?action=betterlinks/admin/analytics&security=${betterlinks_nonce}`);
			props.fetch_links_data();
			toastSuccess(__('Analytics data has been refreshed successfully', 'betterlinks'), {
				title: __('Stats Refreshed', 'betterlinks'),
			});
		} catch (error) {
			// Still re-read the links so the button isn't a no-op when the cron fails.
			props.fetch_links_data();
			toastError(__('Could not refresh stats. Please try again.', 'betterlinks'));
		} finally {
			setRefreshing(false);
		}
	};

	const toggleDensity = () => {
		const next = !compact;
		setCompact(next);
		localStorage.setItem('btlBoardDensity', next ? 'compact' : 'comfortable');
	};

	return (
		<div className={`bl-manage ${isBoard ? 'is-board' : 'is-list'} ${compact ? 'is-compact' : ''}`}>
			<div className="bl-manage__header">
				<div className="bl-manage__heading">
					<div className="bl-manage__title">{__('Manage Links', 'betterlinks')}</div>
					<p className="bl-manage__subtitle">{__('Create, organize & track every short link in one place.', 'betterlinks')}</p>
				</div>

				<div className="bl-manage__actions">
					<button
						type="button"
						className={`bl-icon-btn ${refreshing ? 'is-spinning' : ''}`}
						onClick={refreshHandler}
						disabled={refreshing}
						title={refreshing ? __('Refreshing…', 'betterlinks') : __('Refresh Stats', 'betterlinks')}
						aria-label={refreshing ? __('Refreshing…', 'betterlinks') : __('Refresh Stats', 'betterlinks')}
					>
						<RefreshIcon size={17} />
					</button>

					<div className="bl-viewseg">
						<button type="button" className={`bl-viewseg__btn ${isBoard ? 'is-active' : ''}`} onClick={() => props.linksView('grid')}>
							<BoardViewIcon size={16} />
							<span>{__('Board', 'betterlinks')}</span>
						</button>
						<button type="button" className={`bl-viewseg__btn ${!isBoard ? 'is-active' : ''}`} onClick={() => props.linksView('list')}>
							<ListViewIcon size={16} />
							<span>{__('List', 'betterlinks')}</span>
						</button>
						{/* Board/List pick the layout; Compact modifies it — the rule keeps
						    that grouping readable inside one segmented control. */}
						<span className="bl-viewseg__sep" aria-hidden="true" />
						{/* Labelled, not icon-only: users reported not finding the compact
						    view at all and asked for the pre-3.0 one-line list back. */}
						<button
							type="button"
							className={`bl-viewseg__btn ${compact ? 'is-active' : ''}`}
							onClick={toggleDensity}
							aria-pressed={compact}
							title={compact ? __('Switch to the roomier view', 'betterlinks') : __('Fit more links on screen', 'betterlinks')}
						>
							<DensityIcon size={16} />
							<span>{__('Compact', 'betterlinks')}</span>
						</button>
					</div>

					{betterLinksHooks.applyFilters('betterLinksIsShowWriteLink', true) && !sortByFav && (
						<div className="bl-create-links">
							<Link isShowIcon={false} plusIcon createLabel={__('New link', 'betterlinks')} aiLabel={__('AI Bulk Generator', 'betterlinks')} submitHandler={props.add_new_link} />
						</div>
					)}
				</div>
			</div>

			<div className="bl-manage__scroll">
				<Overview stats={stats} />
				<LinksToolbar
					filterText={filterText}
					onFilter={(e) => setFilterText(e.target.value)}
					categoryOptions={categoryOptions}
					selectedCategory={selectedCategory}
					onCategory={selectCategory}
					tagOptions={tagOptions}
					selectedTag={selectedTag}
					onTag={selectTag}
					sortOptions={sortOptions}
					selectedSort={selectedSort}
					onSort={setSort}
					dateOptions={dateOptions}
					selectedDate={selectedDate}
					onDate={dateHandler}
					sortByFav={sortByFav}
					onToggleFav={props.sortFavourite}
					onReset={resetFilters}
					customDateFilter={customDateFilter}
					setCustomDateFilter={setCustomDateFilter}
					isOpenCustomDateFilter={isOpenCustomDateFilter}
					setIsOpenCustomDateFilter={setIsOpenCustomDateFilter}
				/>
				{isBoard ? (
					<DndCanvas filter={filter} onResetFilters={resetFilters} />
				) : (
					<ListCanvas filter={filter} selectedSort={selectedSort} onSort={setSort} onResetFilters={resetFilters} />
				)}
			</div>
		</div>
	);
};

const mapStateToProps = (state) => ({
	activity: state.activity,
	favouriteSort: state.favouriteSort,
	links: state.links,
});
const mapDispatchToProps = (dispatch) => ({
	add_new_link: bindActionCreators(add_new_link, dispatch),
	fetch_links_data: bindActionCreators(fetch_links_data, dispatch),
	linksView: bindActionCreators(linksView, dispatch),
	sortFavourite: bindActionCreators(sortFavourite, dispatch),
});
export default connect(mapStateToProps, mapDispatchToProps)(ManageLinks);
