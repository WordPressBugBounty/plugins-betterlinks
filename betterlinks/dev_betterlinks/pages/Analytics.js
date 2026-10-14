import React, { useState } from 'react';
import queryString from 'query-string';
import { __ } from '@wordpress/i18n';
import Topbar from 'containers/TopBar';
import Clicks from 'containers/Clicks';
import { subDays } from 'date-fns';
import SingleClicks from 'containers/Clicks/SingleClicks';
import Chart from 'react-apexcharts';
import TagClicks from 'containers/TagClicks';

const Analytics = () => {
	const [customDateFilter, setCustomDateFilter] = useState([
		{
			// 29 days back + today = a 30-day window, so the "30 days" preset in the
			// redesigned header is highlighted on first load.
			startDate: betterLinksHooks.applyFilters('betterLinksAnalyticsFilterStartDate', subDays(new Date(), 29)),
			endDate: new Date(),
			key: 'selection',
		},
	]);
	const propsForAnalytics = {
		customDateFilter,
		setCustomDateFilter,
		isResetAnalytics: true,
	};
	const parsed = queryString.parse(location.search);
	const id = betterLinksQuery.get('id');
	const tag_id = betterLinksQuery.get('tag_id');
	// The redesigned dashboard AND single-link views carry their own header (title
	// + range + Reset / Refresh / Export), so the legacy TopBar is only rendered
	// for the tag view, which still uses the old layout.
	const isRedesignedView = !tag_id;
	return (
		<React.Fragment>
			{!isRedesignedView && <Topbar propsForAnalytics={propsForAnalytics} label={__('BetterLinks Analytics', 'betterlinks')} />}
			{tag_id ? (
				<TagClicks propsForAnalytics={propsForAnalytics} tag_id={tag_id} />
			) : (
				betterLinksHooks.applyFilters(
					'analyticsInnerChild',
					id ? <SingleClicks id={id} propsForAnalytics={propsForAnalytics} /> : <Clicks propsForAnalytics={propsForAnalytics} />,
					{ ...parsed, Chart }
				)
			)}
		</React.Fragment>
	);
};
export default Analytics;
