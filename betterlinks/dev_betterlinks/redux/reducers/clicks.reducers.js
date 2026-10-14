import {
	FETCH_ANALYTICS_GRAPH_BY_TAGS,
	FETCH_CLICKS_DATA,
	FETCH_GRAPH_DATA,
	FETCH_INDIVIDUAL_CLICKS,
	FETCH_UNIQUE_CLICKS_BY_TAGS,
	FETCH_AUDIENCE_DATA,
} from 'redux/actions/clicks.actions';

// `analytic[link_id].ip` is the link's distinct-IP count. Older analytics
// payloads stored the IPs themselves (an array, or an ip => count map), so
// normalise both shapes to a number rather than rendering "[object Object]".
function get_unique_count(ip) {
	if (Array.isArray(ip)) return ip.length;
	if (ip && typeof ip === 'object') return Object.keys(ip).length;
	return parseInt(ip) || 0;
}

function get_parsed_clicks_list(unique_list, type = 'all', analytic = null) {
	const formattedData = {};
	const newClicksData = [];
	for (const item of unique_list) {
		const linkId = `id_${item.link_id || ''}`;
		const itemIp = `ip_${item.ip || ''}`.replaceAll(':', '_colon_').replaceAll('.', '_dot_');
		if (formattedData[linkId]) {
			formattedData[linkId].count = (formattedData[linkId].count || 0) + 1;
		} else {
			formattedData[linkId] = {
				count: 1,
			};
		}
		formattedData[linkId][itemIp] = (formattedData[linkId][itemIp] || 0) + 1;
	}
	for (const item of unique_list) {
		const linkId = `id_${item.link_id || ''}`;
		const itemIp = `ip_${item.ip || ''}`.replaceAll(':', '_colon_').replaceAll('.', '_dot_');

		if ('individual' === type) {
			newClicksData.push({
				...item,
				IPCOUNT: formattedData[linkId][itemIp],
			});
		} else if ('all' === type) {
			newClicksData.push({
				...item,
				...(analytic?.hasOwnProperty(item.link_id) && {
					total_clicks: parseInt(analytic[item.link_id]?.link_count) || 0,
					unique_clicks: get_unique_count(analytic[item.link_id]?.ip),
				}),
			});
		}
	}
	return newClicksData;
}
function clicks(state = { individual_clicks: {} }, action) {
	const payload = action.payload;
	switch (action.type) {
		case FETCH_GRAPH_DATA: {
			const { clicks } = payload.data;
			return {
				...state,
				clicks,
			};
		}
		case FETCH_AUDIENCE_DATA: {
			return {
				...state,
				audience: payload,
			};
		}
		case FETCH_CLICKS_DATA: {
			const { unique_list, unique_count, analytic } = payload.data;
			const newClicksData = get_parsed_clicks_list(unique_list || [], 'all', analytic || null);

			return {
				...state,
				unique_list: newClicksData,
				unique_count: unique_count,
			};
		}
		case FETCH_INDIVIDUAL_CLICKS: {
			const { data, id } = payload;

			const newClicksData = get_parsed_clicks_list(data.analytics || [], 'individual');

			const individual_clicks = state?.individual_clicks || {};
			// Merge with existing data for this link.
			individual_clicks[id] = { 
				...individual_clicks[id], 
				...data, 
				analytics: newClicksData 
			};
			return {
				...state,
				individual_clicks,
			};
		}
		case FETCH_UNIQUE_CLICKS_BY_TAGS: {
			const { data, id } = payload;

			const tag_clicks = state?.tag_clicks || {};
			const newClicksData = get_parsed_clicks_list(data.list, 'all', data.analytic);
			tag_clicks[id] = newClicksData;

			return {
				...state,
				tag_clicks: tag_clicks,
			};
		}
		case FETCH_ANALYTICS_GRAPH_BY_TAGS: {
			const { data, id } = payload;
			const tag_graphs = state?.tag_graphs || {};
			tag_graphs[id] = data;

			return {
				...state,
				tag_graphs: tag_graphs,
			};
		}
		default:
			return state;
	}
}
export default clicks;
