import { useEffect, useMemo, useState } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { subDays } from 'date-fns';
import { __, sprintf } from '@wordpress/i18n';
// Internal components (shared with the dashboard analytics view)
import UpgradeToPro from 'components/Teasers/UpgradeToPro';
import AnalyticsHeader from 'components/Analytics/AnalyticsHeader';
import SingleLinkCard from 'components/Analytics/SingleLinkCard';
import SingleOverview from 'components/Analytics/SingleOverview';
import GeographySection from 'components/Analytics/GeographySection';
import SourcesSection from 'components/Analytics/SourcesSection';
import TechnologySection from 'components/Analytics/TechnologySection';
import TimingSection from 'components/Analytics/TimingSection';
import AttentionSection from 'components/Analytics/AttentionSection';
import SectionHead from 'components/Analytics/SectionHead';
import ProSectionsTeaser from 'components/Analytics/ProSectionsTeaser';
import { SingleLinkCardSkeleton } from 'components/Analytics/Skeletons';
import { ChevronLeftIcon } from 'components/Analytics/Icons';
import ClickLogTable from 'components/Analytics/ClickLogTable';
import DeleteClicks from 'containers/DeleteClicks';
// Helpers
import { useUpgradeProModal } from 'utils/customHooks';
import { is_extra_data_tracking_compatible } from 'utils/helper';
import { fetch_clicks_data, fetch_individual_clicks } from 'redux/actions/clicks.actions';
import { fetch_settings_data } from 'redux/actions/settings.actions';
import { fetch_analytics_settings, update_analytics_settings } from 'redux/actions/analytics.actions';
import {
	deriveSingleOverview,
	aggregateCountriesFromClicks,
	aggregateDevicesFromClicks,
	fetchPreviousLinkTotals,
	toApiDate,
	rangeLength,
	percentChange,
	toCountryRows,
	toDeviceRows,
	topRow,
	exportSeriesCsv,
} from 'components/Analytics/analytics.helper';

const KNOWN_RANGES = [1, 7, 14, 30, 90, 180, 365];

/**
 * Single-link analytics (`?id=`), rebuilt to reuse the dashboard sections.
 *
 * Everything the free plugin shows comes from ONE fetch
 * (`fetch_individual_clicks`). Geography, Sources, Technology and Timing are
 * BetterLinks Pro sections rendered through `betterLinksAnalyticsProSections`
 * (with `view: 'single'`); without Pro a static sample-data preview is shown.
 */
const SingleClicks = (props) => {
	const [isOpenUpgradeToProModal, , closeUpgradeToProModal] = useUpgradeProModal();
	const { customDateFilter, setCustomDateFilter } = props?.propsForAnalytics || {};
	const { individual_clicks } = props.clicks;
	const { darkMode } = props.activity;
	const { settings } = props.settings;
	const { analytics } = props.analytics;

	const id = betterLinksQuery.get('id');

	const [baseLoading, setBaseLoading] = useState(false);
	const [baseSettled, setBaseSettled] = useState(false);
	const [previous, setPrevious] = useState(null);
	// Bumped whenever this link's clicks may have changed without the range
	// changing (reset, refresh stats, deleted rows), so extension sections refetch.
	const [refreshToken, setRefreshToken] = useState(0);
	const bumpRefresh = () => setRefreshToken((token) => token + 1);

	const startDate = customDateFilter?.[0]?.startDate;
	const endDate = customDateFilter?.[0]?.endDate;
	const from = useMemo(() => toApiDate(startDate), [startDate]);
	const to = useMemo(() => toApiDate(endDate), [endDate]);

	const track = (setLoadingFlag, setSettledFlag) => (value) => {
		setLoadingFlag(value);
		if (!value) setSettledFlag(true);
	};

	useEffect(() => {
		if (!settings) props.fetch_settings_data();
		if (!analytics) props.fetch_analytics_settings();
	}, []);

	useEffect(() => {
		if (!id || !from || !to) return;
		setBaseSettled(false);
		props.fetch_individual_clicks({ link_id: id, from, to, setLoading: track(setBaseLoading, setBaseSettled) });
	}, [id, from, to]);

	// Previous-window total for the "vs previous" delta on this link.
	useEffect(() => {
		if (!id || !startDate || !endDate) return undefined;
		let stale = false;
		setPrevious(null);
		fetchPreviousLinkTotals(id, startDate, endDate).then((totals) => {
			if (!stale) setPrevious(totals);
		});
		return () => {
			stale = true;
		};
	}, [id, from, to]);

	const data = individual_clicks?.[id] || {};
	const analyticsRows = data.analytics || [];

	const days = useMemo(() => (startDate && endDate ? rangeLength(startDate, endDate) : 0), [from, to]);
	const activeDays = KNOWN_RANGES.includes(days) ? days : null;
	/* translators: %d: number of days in the selected range. */
	const rangeLabel = sprintf(__('last %d days', 'betterlinks'), days);

	const overview = useMemo(
		() => deriveSingleOverview(data.graph_data, analyticsRows, startDate, endDate),
		[data.graph_data, analyticsRows, from, to]
	);
	const delta = previous ? percentChange(overview.total, previous.total) : null;

	// Top country / top device tiles, from the per-click rows. A row only carries
	// a country when an extension records one, so the tile reads "Not tracked"
	// otherwise.
	const topCountry = useMemo(() => topRow(toCountryRows(aggregateCountriesFromClicks(analyticsRows)).rows), [analyticsRows]);
	const topDevice = useMemo(() => topRow(toDeviceRows(aggregateDevicesFromClicks(analyticsRows))), [analyticsRows]);

	const clicksLogged = overview.total || analyticsRows.length;
	const tracked = !!is_extra_data_tracking_compatible;

	const selectDays = (count) => {
		setCustomDateFilter([{ startDate: subDays(new Date(), count - 1), endDate: new Date(), key: 'selection' }]);
	};
	const handleExport = () => {
		exportSeriesCsv(overview.series, `betterlinks-link-${id}-${from}-to-${to}.csv`);
	};

	const isBaseLoading = !baseSettled || baseLoading;

	/**
	 * Extension point for this link's Geography, Sources, Technology and Timing
	 * sections (implemented in BetterLinks Pro). Return a React node to render
	 * them; returning null keeps the free preview. Same contract as the dashboard,
	 * with `view: 'single'`, `linkId` and the link's per-click `rows`.
	 */
	const proSections = betterLinksHooks.applyFilters('betterLinksAnalyticsProSections', null, {
		view: 'single',
		linkId: id,
		from,
		to,
		darkMode,
		tracked,
		refreshToken,
		rows: analyticsRows,
		rowsLoading: isBaseLoading,
		SectionHead,
		GeographySection,
		SourcesSection,
		TechnologySection,
		TimingSection,
		AttentionSection,
	});

	return (
		<div className="bl-an bl-an--single">
			<UpgradeToPro isOpenModal={isOpenUpgradeToProModal} closeModal={closeUpgradeToProModal} />

			<AnalyticsHeader
				range={customDateFilter}
				activeDays={activeDays}
				onSelectDays={selectDays}
				onSelectRange={setCustomDateFilter}
				onExport={handleExport}
				actions={<DeleteClicks ui="bl" propsForAnalytics={props.propsForAnalytics} onRefreshed={bumpRefresh} />}
				lead={
					<a className="bl-an__back" href="admin.php?page=betterlinks-analytics">
						<ChevronLeftIcon width={16} height={16} />
						{__('Back to analytics', 'betterlinks')}
					</a>
				}
			/>

			{isBaseLoading ? <SingleLinkCardSkeleton /> : <SingleLinkCard details={data.link_details} clicksLogged={clicksLogged} rangeLabel={rangeLabel} />}

			<SingleOverview
				overview={overview}
				delta={delta}
				topCountry={topCountry}
				topDevice={topDevice}
				rangeLabel={rangeLabel}
				darkMode={darkMode}
				loading={isBaseLoading}
			/>

			{proSections || <ProSectionsTeaser view="single" darkMode={darkMode} />}

			<section className="bl-an__section" aria-label={__('Click log', 'betterlinks')}>
				<div className="bl-an__sechead">
					<h2 className="bl-an__sectitle">{__('Click log', 'betterlinks')}</h2>
					<span className="bl-an__secrule" aria-hidden="true" />
					<span className="bl-an__secmeta">{__('every recorded hit', 'betterlinks')}</span>
				</div>
				<ClickLogTable
					rows={analyticsRows}
					loading={isBaseLoading}
					linkId={id}
					from={from}
					to={to}
					hideIp={!!settings?.is_disable_analytics_ip}
					darkMode={darkMode}
					onChanged={bumpRefresh}
				/>
			</section>
		</div>
	);
};

const mapStateToProps = (state) => ({
	clicks: state.clicks,
	activity: state.activity,
	settings: state.settings,
	analytics: state.analytics,
});
const mapDispatchToProps = (dispatch) => ({
	fetch_clicks_data: bindActionCreators(fetch_clicks_data, dispatch),
	fetch_individual_clicks: bindActionCreators(fetch_individual_clicks, dispatch),
	fetch_settings_data: bindActionCreators(fetch_settings_data, dispatch),
	fetch_analytics_settings: bindActionCreators(fetch_analytics_settings, dispatch),
	update_analytics_settings: bindActionCreators(update_analytics_settings, dispatch),
});
export default connect(mapStateToProps, mapDispatchToProps)(SingleClicks);
