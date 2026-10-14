import { is_pro_enabled } from 'utils/helper';

export { ReactComponent as Link } from '../../../assets/images/icons/link.svg';
export { ReactComponent as Target } from '../../../assets/images/icons/target.svg';
export { ReactComponent as WWW } from '../../../assets/images/icons/www.svg';
export const analyticsData = (data, id) => {
	let results = {
		clicks: {},
		unique_clicks: {},
	};
	
	// Add defensive checks to prevent errors when data or properties are undefined
	if (!data || !data.total_count || !data.unique_count) {
		return results;
	}
	
	data.total_count.forEach((element) => {
		results.clicks[element.c_date] = element.click_count;
	});

	data.unique_count.forEach((element) => {
		results.unique_clicks[element.c_date] = element.uniq_count;
	});
	return results;
};

export const getData = (clicks, analyticsTab, filterText, id = null, from = null) => {
	if (id && !from) {
		return clicks?.filter?.((item) => {
			if (item.link_id != id) return;
			const json = JSON.stringify(item);
			return json.toLowerCase().includes(filterText.toLowerCase());
		});
	}

	let find = [];
	for (let index = 0; index < clicks.length; index++) {
		const element = clicks[index];
		if (!find.find((item) => item.link_id == element.link_id)) {
			if (element.link_title) {
				element.link_title.toLowerCase().includes(filterText?.toLowerCase());
			}
			find.push(element);
		}
	}
	// 1 means performance tab, when performance is selected
	if (1 == analyticsTab) {
		if (!is_pro_enabled && !is_extra_data_tracking_compatible) return [];
		return find
			.sort((a, b) => +a?.total_clicks - +b?.total_clicks)
			.reverse()
			.slice(0, 5);
	}

	return find.filter((item) => {
		const json = JSON.stringify(item);
		return json.toLowerCase().includes(filterText?.toLowerCase());
	});
};
