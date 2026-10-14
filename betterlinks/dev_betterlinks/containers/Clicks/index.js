import { useEffect, useMemo, useState } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { __, sprintf } from '@wordpress/i18n';
import { subDays } from 'date-fns';
// Internal components
import UpgradeToPro from 'components/Teasers/UpgradeToPro';
import AnalyticsHeader from 'components/Analytics/AnalyticsHeader';
import AnalyticsNav from 'components/Analytics/AnalyticsNav';
import OverviewSection from 'components/Analytics/OverviewSection';
import GeographySection from 'components/Analytics/GeographySection';
import SourcesSection from 'components/Analytics/SourcesSection';
import TechnologySection from 'components/Analytics/TechnologySection';
import TimingSection from 'components/Analytics/TimingSection';
import AttentionSection from 'components/Analytics/AttentionSection';
import LinksSection from 'components/Analytics/LinksSection';
import SectionHead from 'components/Analytics/SectionHead';
import ProSectionsTeaser from 'components/Analytics/ProSectionsTeaser';
import DeleteClicks from 'containers/DeleteClicks';
// Internal helpers
import { useUpgradeProModal } from 'utils/customHooks';
import { is_extra_data_tracking_compatible } from 'utils/helper';
import { delete_links_analytics, fetch_clicks_data, get_audience_data, get_graph_data } from 'redux/actions/clicks.actions';
import {
	QUICK_RANGES,
	FILTER_RANGES,
	deriveOverview,
	exportSeriesCsv,
	fetchPreviousTotals,
	percentChange,
	rangeLength,
	toApiDate,
	toLinkRows,
} from 'components/Analytics/analytics.helper';

const NO_DELTAS = { total: null, unique: null, avgPerDay: null };

/** Highlights a preset button when the active range happens to be that long. */
const matchPreset = (days) => {
	const known = [...QUICK_RANGES, ...FILTER_RANGES].some((preset) => preset.days === days);
	return known ? days : null;
};

/**
 * Analytics — the dashboard view (no `?id=` / `?tag_id=`).
 *
 * Overview and Per-link performance are free. Geography, Sources, Technology,
 * Timing and Movers are BetterLinks Pro sections: Pro renders them through the
 * `betterLinksAnalyticsProSections` filter and fetches their data itself. When
 * nothing answers the filter, a static sample-data preview is shown instead.
 */
const Clicks = (props) => {
	const [loading, setLoading] = useState(false);
	const [graphLoading, setGraphLoading] = useState(false);
	// The graph request is the one section 1 depends on. `graphSettled` records
	// that it has finished (successfully or not) so a failure surfaces as an error
	// state instead of an eternal skeleton.
	const [graphSettled, setGraphSettled] = useState(false);
	// Overview's audience split (human/bot, new/returning).
	const [audienceLoading, setAudienceLoading] = useState(false);
	const [audienceSettled, setAudienceSettled] = useState(false);
	const [activeSection, setActiveSection] = useState('overview');
	const [previous, setPrevious] = useState(null);
	// `previous` can legitimately resolve to null (no comparable window), so a
	// separate flag distinguishes "still fetching" from "resolved, nothing there".
	const [previousSettled, setPreviousSettled] = useState(false);
	// Bumped whenever click data may have changed without the range changing
	// (reset, refresh stats, bulk delete, retry), so extension sections refetch.
	const [refreshToken, setRefreshToken] = useState(0);
	const [isOpenUpgradeToProModal, , closeUpgradeToProModal] = useUpgradeProModal();

	const { customDateFilter, setCustomDateFilter } = props?.propsForAnalytics || {};
	const { clicks, unique_list, unique_count, audience } = props.clicks;
	const { darkMode } = props.activity;

	const startDate = customDateFilter?.[0]?.startDate;
	const endDate = customDateFilter?.[0]?.endDate;
	const from = useMemo(() => toApiDate(startDate), [startDate]);
	const to = useMemo(() => toApiDate(endDate), [endDate]);

	const bumpRefresh = () => setRefreshToken((token) => token + 1);

	// Refetch whenever the applied range changes. (The previous implementation
	// guarded on `if (!clicks)`, which meant a range change never refreshed the
	// charts once any data was in the store.)
	// Each request records that it has finished (successfully or not), so a failure
	// surfaces rather than leaving its section stuck on a skeleton forever.
	const track = (setLoadingFlag, setSettledFlag) => (value) => {
		setLoadingFlag(value);
		if (!value) setSettledFlag(true);
	};

	const refetch = () => {
		if (!from || !to) return;
		setGraphSettled(false);
		props.get_graph_data({ from, to, setLoading: track(setGraphLoading, setGraphSettled) });
		props.fetch_clicks_data({ from, to, setLoading });
		setAudienceSettled(false);
		props.get_audience_data({ from, to, setLoading: track(setAudienceLoading, setAudienceSettled) });
	};

	useEffect(() => {
		refetch();
	}, [from, to]);

	// The "vs previous" deltas. There is no endpoint for a comparison window, so
	// we re-query the existing graph route with the range shifted back by its own
	// length. Deltas stay null (and render as nothing) if that call fails.
	useEffect(() => {
		if (!startDate || !endDate) return undefined;
		let stale = false;
		setPrevious(null);
		setPreviousSettled(false);
		fetchPreviousTotals(startDate, endDate).then((totals) => {
			if (stale) return;
			setPrevious(totals);
			setPreviousSettled(true);
		});
		return () => {
			stale = true;
		};
	}, [from, to]);

	const days = useMemo(() => (startDate && endDate ? rangeLength(startDate, endDate) : 0), [from, to]);
	const activeDays = useMemo(() => matchPreset(days), [days]);

	const overview = useMemo(() => deriveOverview(clicks, unique_count, startDate, endDate), [clicks, unique_count, from, to]);

	const deltas = useMemo(() => {
		if (!previous) return NO_DELTAS;
		return {
			total: percentChange(overview.total, previous.total),
			unique: percentChange(overview.unique, previous.unique),
			avgPerDay: percentChange(overview.avgPerDay, previous.avgPerDay),
		};
	}, [previous, overview]);

	// One row per link for the current period (also what the links table uses).
	const linkRows = useMemo(() => toLinkRows(unique_list), [unique_list]);

	/* translators: %d: number of days in the selected range. */
	const rangeLabel = sprintf(__('last %d days', 'betterlinks'), days);
	/* translators: %d: number of days in the selected range. Reads as "vs previous 30 days". */
	const compareLabel = sprintf(__('%d days', 'betterlinks'), days);

	const selectDays = (count) => {
		setCustomDateFilter([{ startDate: subDays(new Date(), count - 1), endDate: new Date(), key: 'selection' }]);
	};

	const handleExport = () => {
		exportSeriesCsv(overview.series, `betterlinks-analytics-${from}-to-${to}.csv`);
	};

	// Section 1 reads from BOTH requests — the daily series (get_graph_data) and
	// the distinct-visitor scalar (fetch_clicks_data). Gating on the graph alone
	// would clear the skeleton as soon as the chart arrived and show the new
	// chart beside the previous range's stale "Unique visitors" figure.
	const isOverviewLoading = !graphSettled || graphLoading || loading;
	const hasOverviewFailed = graphSettled && !graphLoading && !clicks;
	const isAudienceLoading = !audienceSettled || audienceLoading;
	// The per-link table is built from `unique_list`, which arrives with the
	// clicks request.
	const isLinksLoading = loading || !unique_list;

	// Bulk action on the links table. Scoped to the visible range, matching what
	// the old table did — this clears click data, never the links themselves.
	const deleteAnalytics = (linkIds) => {
		Promise.resolve(props.delete_links_analytics({ link_ids: linkIds, from, to })).then(bumpRefresh);
	};

	const retry = () => {
		refetch();
		bumpRefresh();
	};

	// The lists come back empty both when nothing was recorded and when the site
	// never records this at all, so the sections need to be told which it is.
	const isTracked = !!is_extra_data_tracking_compatible;

	/**
	 * Extension point for the Geography, Sources, Technology, Timing and Movers
	 * sections (implemented in BetterLinks Pro). Return a React node to render
	 * them; returning null keeps the free preview.
	 *
	 * The context carries only data the free plugin already has, plus the
	 * presentational components, so the extension renders identical markup.
	 */
	const proSections = betterLinksHooks.applyFilters('betterLinksAnalyticsProSections', null, {
		view: 'dashboard',
		from,
		to,
		darkMode,
		tracked: isTracked,
		refreshToken,
		uniqueList: unique_list,
		linkRows,
		clicksLoading: loading,
		previous,
		previousSettled,
		SectionHead,
		GeographySection,
		SourcesSection,
		TechnologySection,
		TimingSection,
		AttentionSection,
	});

	const goToSection = (id) => {
		setActiveSection(id);
		document.getElementById(`bl-an-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	};

	return (
		<div className="bl-an">
			<UpgradeToPro isOpenModal={isOpenUpgradeToProModal} closeModal={closeUpgradeToProModal} />

			<AnalyticsHeader
				range={customDateFilter}
				activeDays={activeDays}
				onSelectDays={selectDays}
				onSelectRange={setCustomDateFilter}
				onExport={handleExport}
				actions={<DeleteClicks ui="bl" propsForAnalytics={props.propsForAnalytics} onRefreshed={bumpRefresh} />}
			/>

			<AnalyticsNav active={activeSection} onSelect={goToSection} />

			<section className="bl-an__section" id="bl-an-overview" aria-labelledby="bl-an-overview-title">
				<div className="bl-an__sechead">
					<h2 className="bl-an__sectitle" id="bl-an-overview-title">
						{__('Overview', 'betterlinks')}
					</h2>
					<span className="bl-an__secrule" aria-hidden="true" />
					<span className="bl-an__secmeta">{rangeLabel}</span>
				</div>

				<OverviewSection
					overview={overview}
					audience={audience}
					audienceLoading={isAudienceLoading}
					deltas={deltas}
					rangeLabel={rangeLabel}
					compareLabel={compareLabel}
					darkMode={darkMode}
					loading={isOverviewLoading}
					failed={hasOverviewFailed}
					onRetry={retry}
				/>
			</section>

			{proSections || <ProSectionsTeaser view="dashboard" darkMode={darkMode} />}

			<section className="bl-an__section" id="bl-an-links" aria-labelledby="bl-an-links-title">
				<div className="bl-an__sechead">
					<h2 className="bl-an__sectitle" id="bl-an-links-title">
						{__('Per-link performance', 'betterlinks')}
					</h2>
					<span className="bl-an__secrule" aria-hidden="true" />
					<span className="bl-an__secmeta">{__('search, sort, filter & export', 'betterlinks')}</span>
				</div>

				<LinksSection uniqueList={unique_list} rangeLabel={rangeLabel} loading={isLinksLoading} onDeleteAnalytics={deleteAnalytics} />
			</section>
		</div>
	);
};

const mapStateToProps = (state) => ({
	clicks: state.clicks,
	activity: state.activity,
});
const mapDispatchToProps = (dispatch) => ({
	get_graph_data: bindActionCreators(get_graph_data, dispatch),
	get_audience_data: bindActionCreators(get_audience_data, dispatch),
	fetch_clicks_data: bindActionCreators(fetch_clicks_data, dispatch),
	delete_links_analytics: bindActionCreators(delete_links_analytics, dispatch),
});
export default connect(mapStateToProps, mapDispatchToProps)(Clicks);
