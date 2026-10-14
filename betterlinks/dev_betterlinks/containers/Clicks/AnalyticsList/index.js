import { __ } from '@wordpress/i18n';
import { useEffect, useCallback } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
// internal helpers
import { getColumns } from 'utils/helper';
import { fetch_settings_data } from 'redux/actions/settings.actions';
import { fetch_analytics_settings } from 'redux/actions/analytics.actions';
import DataList from './DataList';

const AnalyticsList = (props) => {
	const { analyticsTab, unique_list, id = null, from = null, customDateFilter } = props;
	const { settings } = props.settings;
	const { analytics } = props.analytics;

	useEffect(() => {
		if (!settings) props.fetch_settings_data();
		if (!analytics) props.fetch_analytics_settings();
	}, []);

	const columns = useCallback(getColumns(analytics, analyticsTab), [analytics, analyticsTab]);
	const newColumns = settings?.is_disable_analytics_ip ? columns.filter((item) => item.selector !== 'ip') : columns;

	return <DataList columns={newColumns} data={unique_list || []} progressPending={unique_list ? false : true} id={id} from={from} customDateFilter={customDateFilter} />;
};

const mapStateToProps = (state) => {
	// Get unique_list from Redux state if available, otherwise use prop
	const reduxUniqueList = state.clicks?.unique_list;

	return {
		settings: state.settings,
		analytics: state.analytics,
		clicks: state.clicks,
		// Pass unique_list from Redux so component re-renders when it updates
		unique_list: reduxUniqueList,
	};
};
const mapDispatchToProps = (dispatch) => ({
	fetch_settings_data: bindActionCreators(fetch_settings_data, dispatch),
	fetch_analytics_settings: bindActionCreators(fetch_analytics_settings, dispatch),
});
export default connect(mapStateToProps, mapDispatchToProps)(AnalyticsList);
