import axios from 'axios';
import queryString from 'query-string';
import { API, namespace, betterlinks_nonce } from 'utils/helper';
import { UPDATE_LINKS_ANALYTICS } from './links.actions';
import { toastSuccess, toastError } from 'components/Toast';
import { __ } from '@wordpress/i18n';
export const FETCH_CLICKS_DATA = 'FETCH_CLICKS_DATA';
export const FETCH_INDIVIDUAL_CLICKS = 'FETCH_INDIVIDUAL_CLICKS';
export const FETCH_GRAPH_DATA = 'FETCH_GRAPH_DATA';

export const FETCH_UNIQUE_CLICKS_BY_TAGS = 'FETCH_UNIQUE_CLICKS_BY_TAGS';
export const FETCH_ANALYTICS_GRAPH_BY_TAGS = 'FETCH_ANALYTICS_GRAPH_BY_TAGS';
export const FETCH_AUDIENCE_DATA = 'FETCH_AUDIENCE_DATA';

/**
 * Human-vs-bot and new-vs-returning composition for the range.
 *
 * Backs the two Overview stat cards. The payload carries a `tracked` flag per
 * half so the cards can distinguish "none seen" from "recorded before this was
 * tracked" — clicks stored by older versions have no bot flag or visitor id.
 */
export const get_audience_data = (params) => async (dispatch) => {
	const { from, to, setLoading = () => {} } = params;
	const endPoint = betterLinksHooks.applyFilters('betterLinksFetchClicksData', namespace + 'clicks/get_audience');
	setLoading(true);
	try {
		const res = await API.get(endPoint, {
			params: {
				from,
				to,
			},
		});
		if (!res?.data?.data) {
			throw new Error('rest api not working properly for get_audience_data');
		}
		dispatch({
			type: FETCH_AUDIENCE_DATA,
			payload: res.data.data.audience || null,
		});
	} catch (error) {
		console.log({ error: error.message });
	} finally {
		setLoading(false);
	}
};

export const get_analytics_graph_by_tag = (params) => async (dispatch) => {
	const { tag_id, from, to, setLoading = () => {} } = params;
	const endPoint = `${namespace}clicks/tags/get_graphs/${tag_id}`;
	setLoading(true);

	try {
		const res = await API.get(endPoint, {
			params: {
				from,
				to,
			},
		});
		if (!res?.data) {
			throw new Error('rest api not working properly for fetch_analytics graph by tag id');
		}
		setLoading(false);
		dispatch({
			type: FETCH_ANALYTICS_GRAPH_BY_TAGS,
			payload: {
				data: res.data?.data || [],
				id: tag_id,
			},
		});
	} catch (error) {
		console.log('error is ' + error.message);
	}
};

export const get_analytics_unique_list_by_id = (params) => async (dispatch) => {
	const { tag_id, from, to, setLoading = () => {} } = params;

	const endPoint = namespace + 'clicks/tags/' + tag_id;
	setLoading(true);

	try {
		const res = await API.get(endPoint, {
			params: {
				from,
				to,
			},
		});
		if (!res?.data) {
			throw new Error('rest api not working properly for fetch_individual_clicks_data');
		}
		setLoading(false);
		dispatch({
			type: FETCH_UNIQUE_CLICKS_BY_TAGS,
			payload: {
				data: res.data?.data || [],
				id: tag_id,
			},
		});
	} catch (error) {
		console.log('error is ' + error.message);
	}
};

export const get_graph_data = (params) => async (dispatch) => {
	const { from, to, setLoading = () => {} } = params;
	let endPoint = betterLinksHooks.applyFilters('betterLinksFetchClicksData', namespace + 'clicks/get_graphs');

	setLoading(true);
	try {
		const res = await API.get(endPoint, {
			params: {
				from,
				to,
			},
		});
		if (!res?.data?.data) {
			throw new Error('rest api not working properly for fetch_clicks_data');
		}
		setLoading(false);
		dispatch({
			type: FETCH_GRAPH_DATA,
			payload: res.data,
		});
	} catch (error) {
		setLoading(false);
	}
};

export const fetch_individual_clicks = (params) => async (dispatch) => {
	const { link_id, from, to, setLoading = () => {} } = params;
	let endPoint = betterLinksHooks.applyFilters('betterLinksFetchClicksData', namespace + 'clicks/' + link_id);
	setLoading(true);
	try {
		const res = await API.get(endPoint, {
			params: {
				from,
				to,
			},
		});
		if (!res?.data) {
			throw new Error('rest api not working properly for fetch_individual_clicks_data');
		}
		setLoading(false);
		dispatch({
			type: FETCH_INDIVIDUAL_CLICKS,
			payload: res.data,
		});
	} catch (error) {
		console.log('error is ' + error.message);
		// Must clear the flag on failure too — the single-link view gates its
		// whole layout on it, so a swallowed error would freeze it on skeletons.
		setLoading(false);
	}
};
export const fetch_clicks_data = (params) => async (dispatch) => {
	const { from, to, setLoading = () => {} } = params;
	let endPoint = betterLinksHooks.applyFilters('betterLinksFetchClicksData', namespace + 'clicks');
	setLoading(true);
	try {
		const res = await API.get(endPoint, {
			params: {
				from,
				to,
			},
		});
		if (!res?.data?.data) {
			throw new Error('rest api not working properly for fetch_clicks_data');
		}
		setLoading(false);
		dispatch({
			type: FETCH_CLICKS_DATA,
			payload: res.data,
		});

		// Also update links analytics data for real-time UI update
		if (res.data?.data?.analytic) {
			dispatch({
				type: UPDATE_LINKS_ANALYTICS,
				payload: {
					analytic: res.data.data.analytic,
				},
			});
		}
	} catch (e) {
		console.log({ error: e });
		const parsed = queryString.parse(location.search);
		let form_data = new FormData();
		form_data.append('action', 'betterlinks/admin/fetch_analytics');
		form_data.append('security', betterlinks_nonce);
		if (parsed.id) {
			form_data.append('ID', parsed.id);
		}
		if (params) {
			form_data.append('from', params.from);
			form_data.append('to', params.to);
		}
		setLoading(true);
		await axios.post(ajaxurl, form_data).then(
			(response) => {
				if (response.data) {
					setLoading(false);
					dispatch({
						type: FETCH_CLICKS_DATA,
						payload: response.data,
					});

					// Also update links analytics data for real-time UI update
					if (response.data?.data?.analytic) {
						dispatch({
							type: UPDATE_LINKS_ANALYTICS,
							payload: {
								analytic: response.data.data.analytic,
							},
						});
					}
				}
			},
			(error) => {
				console.log(error);
				// The REST call already failed to get us here; if the ajax fallback
				// fails too, clear the flag so callers don't hang on a spinner.
				setLoading(false);
			}
		);
	}
};
export const searchClicksData = (nonce, filterText) => async (dispatch) => {
	return axios.get(`${ajaxurl}?action=betterlinks/admin/search_clicks_data&security=${nonce}&title=${filterText}`).then(
		(response) => {
			if (response.data) {
				dispatch({
					type: FETCH_CLICKS_DATA,
					payload: response.data,
				});
			}
		},
		(error) => {
			console.log(error);
			dispatch({
				type: FETCH_CLICKS_DATA,
				payload: {},
			});
		}
	);
};
export const fetchCustomClicksData = (data) => (dispatch) => {
	dispatch({
		type: FETCH_CLICKS_DATA,
		payload: data,
	});
};

export const delete_clicks = (params) => async (dispatch) => {
	const { click_ids, link_id, from, to } = params;
	try {
		const deleteParams = {
			click_ids: click_ids.join(','),
			link_id: link_id,
		};

		// Include date range if provided
		if (from) deleteParams.from = from;
		if (to) deleteParams.to = to;

		const res = await API.delete(namespace + 'clicks', {
			params: deleteParams,
		});

		if (res?.data?.success) {
			// Refresh the individual clicks data after deletion
			dispatch({
				type: FETCH_INDIVIDUAL_CLICKS,
				payload: {
					data: res.data?.data || {},
					id: res.data?.id || link_id,
				},
			});

			toastSuccess(
				click_ids.length > 1
					? __('Click records have been deleted successfully', 'betterlinks')
					: __('Click record has been deleted successfully', 'betterlinks'),
				{
					title: click_ids.length > 1 ? __('Clicks Deleted', 'betterlinks') : __('Click Deleted', 'betterlinks'),
				}
			);

			// Also refresh the main analytics graph and data
			if (from && to) {
				dispatch(get_graph_data({ from, to }));
				dispatch(fetch_clicks_data({ from, to }));
			}
		}
	} catch (error) {
		console.log('error deleting clicks: ' + error.message);
		toastError(__('Failed to delete click records', 'betterlinks'), {
			title: __('Delete Failed', 'betterlinks'),
		});
	}
};

export const delete_links_analytics = (params) => async (dispatch) => {
	const { link_ids, from, to } = params;
	try {
		const deleteParams = {
			link_ids: link_ids.join(','),
		};

		// Include date range if provided
		if (from) deleteParams.from = from;
		if (to) deleteParams.to = to;

		const res = await API.delete(namespace + 'clicks/delete_by_links/', {
			params: deleteParams,
		});

		if (res?.data?.success) {
			// Refresh the clicks data after deletion
			dispatch({
				type: FETCH_CLICKS_DATA,
				payload: {
					success: true,
					data: res.data?.data || {},
				},
			});

			// Update links analytics data in real-time
			// The API returns updated analytic data after deletion
			if (res.data?.data?.analytic) {
				dispatch({
					type: UPDATE_LINKS_ANALYTICS,
					payload: {
						analytic: res.data.data.analytic,
					},
				});
			}

			toastSuccess(
				link_ids.length > 1
					? __('Analytics data for selected links has been deleted', 'betterlinks')
					: __('Analytics data for the link has been deleted', 'betterlinks'),
				{
					title: __('Analytics Deleted', 'betterlinks'),
				}
			);

			// Also refresh the main analytics graph and data
			if (from && to) {
				dispatch(get_graph_data({ from, to }));
				dispatch(fetch_clicks_data({ from, to }));
			}
		}
	} catch (error) {
		console.log('error deleting links analytics: ' + error.message);
		toastError(__('Failed to delete analytics data', 'betterlinks'), {
			title: __('Delete Failed', 'betterlinks'),
		});
	}
};
