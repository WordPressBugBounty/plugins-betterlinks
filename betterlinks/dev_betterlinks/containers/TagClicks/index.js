import AnalyticsList from 'containers/Clicks/AnalyticsList';
import { analyticsData } from 'containers/Clicks/clicks.helper';
import Graph from 'containers/Graph';
import { subDays } from 'date-fns';
import { useEffect, useState, useCallback } from 'react';
import ContentLoader from 'react-content-loader';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { get_analytics_graph_by_tag, get_analytics_unique_list_by_id } from 'redux/actions/clicks.actions';
import { fetch_all_tags } from 'redux/actions/terms.actions';
import { formatDate } from 'utils/helper';
import { TotalClick, UniqueClick, Tag } from './icons';

const TagClicks = (props) => {
	const [loading, setLoading] = useState(false);
	const { tag_id } = props;
	const { tag_clicks, tag_graphs } = props.clicks;
	const { tags, tag_analytics } = props.terms;
	const { customDateFilter, setCustomDateFilter } = props?.propsForAnalytics || {};
	useEffect(() => {
		const from = formatDate(customDateFilter[0].startDate, 'yyyy-mm-dd');
		const to = formatDate(customDateFilter[0].endDate, 'yyyy-mm-dd');
		const currentDate = to || formatDate(new Date(), 'yyyy-mm-dd');
		let pastDate = subDays(new Date(), 30);
		pastDate = from || formatDate(pastDate, 'yyyy-mm-dd');

		if (!tag_clicks?.[tag_id]) {
			props.get_analytics_unique_list_by_id({ from: pastDate, to: currentDate, tag_id, setLoading });
		}
		if (!tag_graphs?.[tag_id]) {
			props.get_analytics_graph_by_tag({ from: pastDate, to: currentDate, tag_id, setLoading });
		}
		if (!tags) props.fetch_all_tags();
	}, [tag_id]);

	const tagDetails = useCallback(() => {
		return {
			tagName: tags?.find((item) => item.id === tag_id)?.['term_name'],
			totalClicks: tag_analytics?.total_clicks[tag_id] || 0,
			uniqueClicks: tag_analytics?.unique_clicks[tag_id] || 0,
		};
	}, [tags])();

	// Calculate unique IP count from tag clicks data
	const uniqueIpCount = useCallback(() => {
		if (!tag_clicks?.[tag_id]) return 0;
		const uniqueIps = [...new Set(tag_clicks[tag_id].map((item) => item.ip))];
		return uniqueIps.length;
	}, [tag_clicks, tag_id])();

	const StringLoader = () => (
		<ContentLoader speed={2} width={'100%'} height={10} viewBox="0 0 300 10" backgroundColor="#f3f3f3" foregroundColor="#ecebeb">
			<rect x="1" y="2" rx="3" ry="3" width="196" height="13" />
		</ContentLoader>
	);

	return (
		<div className="btl-analytic">
			<Graph
				data={analyticsData(tag_graphs?.[tag_id] || { total_count: [], unique_count: [] })}
				customDateFilter={customDateFilter}
				setCustomDateFilter={setCustomDateFilter}
				loading={loading}
				setLoading={setLoading}
				uniqueIpCount={uniqueIpCount}
			/>
			{tagDetails?.tagName && (
				<div className="btl-single-click-info-header">
					<div className="btl-single-click-tag-info">
						<div className="btl-single-info--name">
							<span className="btl-single-info-svg-icon">
								<Tag />
							</span>
							<span className="btl-column-name" style={{ marginRight: '5px' }}>
								Tag Name:
							</span>
							<span className="btl-link-name" title={tagDetails?.tagName}>
								{tagDetails?.tagName || <StringLoader />}
							</span>
						</div>
						<div className="btl-single-info--name">
							<span className="btl-single-info-svg-icon">
								<TotalClick />
							</span>
							<span className="btl-column-name" style={{ marginRight: '5px' }}>
								Total Clicks:
							</span>
							<span className="btl-link-name" title={`${tagDetails?.totalClicks} Clicks`}>
								{tagDetails?.totalClicks || <StringLoader />}
							</span>
						</div>
						<div className="btl-single-info--name" style={{ marginRight: '15px' }}>
							<span className="btl-single-info-svg-icon">
								<UniqueClick />
							</span>
							<span className="btl-column-name" style={{ marginRight: '5px' }}>
								Unique Clicks:
							</span>
							<span className="btl-link-name" title={`${tagDetails?.uniqueClicks} Clicks`}>
								{tagDetails?.uniqueClicks || <StringLoader />}
							</span>
						</div>
					</div>
				</div>
			)}
			<div className="btl-analytic-table-wrapper btl-analytic-table-wrapper-manage-tags">
				<AnalyticsList analyticsTab={null} unique_list={tag_clicks?.[tag_id]} loading={loading} id={tag_id} from="manage_tags" />
			</div>
		</div>
	);
};

const mapStateToProps = (state) => ({
	clicks: state.clicks,
	terms: state.terms,
});
const mapDispatchToProps = (dispatch) => ({
	get_analytics_unique_list_by_id: bindActionCreators(get_analytics_unique_list_by_id, dispatch),
	get_analytics_graph_by_tag: bindActionCreators(get_analytics_graph_by_tag, dispatch),
	fetch_all_tags: bindActionCreators(fetch_all_tags, dispatch),
});
export default connect(mapStateToProps, mapDispatchToProps)(TagClicks);
