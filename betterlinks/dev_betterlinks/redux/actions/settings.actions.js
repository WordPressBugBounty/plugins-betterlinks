import { API, namespace, makeRequest, is_pro_enabled } from 'utils/helper';
import { fetch_terms_data } from './terms.actions';
import { fetch_links_data } from './links.actions';
import { fetch_post_types_data } from './posttypesdata.actions';
import {
	SETTINGS_PREFETCH_START,
	SETTINGS_PREFETCH_COMPLETE,
	SETTINGS_PREFETCH_ERROR,
	SET_AUTO_CREATE_LINK_SETTINGS,
} from './actionstrings';
export const FETCH_SETTINGS = 'FETCH_SETTINGS';
export const FETCH_TRACKING_SETTINGS = 'FETCH_TRACKING_SETTINGS';
export const ADD_OPTION = 'ADD_OPTION';
export const UPDATE_OPTION = 'UPDATE_OPTION';
function isString(x) {
	return Object.prototype.toString.call(x) === '[object String]';
}

// External analytics settings belong to BetterLinks Pro, which answers this
// request; without Pro there is nothing to fetch.
export const fetch_tracking_settings = () => async (dispatch) => {
	if (!is_pro_enabled) return;
	try {
		makeRequest({
			action: 'betterlinks/admin/get_external_analytics',
		}).then((response) => {
			if (response.data) {
				dispatch({
					type: FETCH_TRACKING_SETTINGS,
					payload: { ...response.data?.data },
				});
			}
		});
	} catch (error) {
		console.log(error);
	}
};

export const fetch_settings_data = () => async (dispatch) => {
	try {
		const res = await API.get(namespace + 'settings');
		const payload = JSON.parse(res.data.data);
		// if (!payload?.redirect_type) {
		// 	throw new Error('rest api not working properly for fetch_settings_data');
		// }
		window.betterLinksGlobal.prefix = payload.prefix;
		dispatch({
			type: FETCH_SETTINGS,
			payload: { ...payload },
		});
	} catch (e) {
		return makeRequest({
			action: 'betterlinks/admin/get_settings',
		}).then((response) => {
			if (response.data) {
				const payload = 'object' === typeof response.data.data ? JSON.parse(response.data.data.data) : JSON.parse(response.data.data);
				const autolink_disable_post_types = isString(payload?.autolink_disable_post_types)
					? (payload?.autolink_disable_post_types || '')?.replaceAll('\\', '')
					: payload?.autolink_disable_post_types;
				payload['autolink_disable_post_types'] =
					'undefined' != autolink_disable_post_types && isString(autolink_disable_post_types) ? JSON.parse(autolink_disable_post_types) : autolink_disable_post_types;
				dispatch({
					type: FETCH_SETTINGS,
					payload,
				});
			}
		});
	}
};

// `dashboard_hidden_term_ids` is stamped into betterLinksGlobal at page load and
// consumed by withoutHiddenCategories() on every board/list render. Saving a
// setting that changes it (Show the Link in Bio category, Show the Fluent Boards
// category) must update the live copy too — the links refetch below brings the
// category back into the payload, but the stale hidden list filtered it right
// back out until a hard reload, which read as "bio links never show up".
const applyHiddenTermIds = (ids) => {
	if (Array.isArray(ids) && window.betterLinksGlobal) {
		window.betterLinksGlobal.dashboard_hidden_term_ids = ids.map(Number);
	}
};

export const update_option = (item) => async (dispatch) => {
	try {
		const res = await API.put(namespace + 'settings', item);
		dispatch({
			type: UPDATE_OPTION,
			payload: JSON.parse(res.data.data),
		});
		applyHiddenTermIds(res.data.hidden_term_ids);
		fetch_links_data()(dispatch); // re-read links under the settings just saved
	} catch (e) {
		makeRequest({
			action: 'betterlinks/admin/update_settings',
			...item,
		}).then((response) => {
			if (response.data) {
				// The AJAX handler wraps its payload ({data, hidden_term_ids});
				// older builds returned the settings JSON string directly.
				const raw = response.data.data;
				const payload = JSON.parse((typeof raw === 'object' && raw !== null ? raw.data : raw) || '{}');
				const autolink_disable_post_types = isString(payload?.autolink_disable_post_types)
					? (payload?.autolink_disable_post_types || '')?.replaceAll('\\', '')
					: payload?.autolink_disable_post_types;
				payload['autolink_disable_post_types'] =
					'undefined' != autolink_disable_post_types && isString(autolink_disable_post_types) ? JSON.parse(autolink_disable_post_types) : autolink_disable_post_types;

				dispatch({
					type: UPDATE_OPTION,
					payload,
				});
				if (typeof raw === 'object' && raw !== null) {
					applyHiddenTermIds(raw.hidden_term_ids);
				}
			}
			// Refetch AFTER the save resolves — firing it in parallel raced the
			// write and could cache the pre-save payload.
			fetch_links_data()(dispatch);
		});
	}
};

/**
 * Set auto create link settings in Redux store
 * @param {Object} settings - The auto create link settings
 */
export const setAutoCreateLinkSettings = (settings) => ({
	type: SET_AUTO_CREATE_LINK_SETTINGS,
	payload: settings,
});

/**
 * Prefetch all settings data for the Settings page
 * This fetches all required data in parallel to eliminate loading states when switching tabs
 * @param {Object} options - Options for prefetching
 * @param {boolean} options.force - Force refetch even if data exists
 */
export const prefetchAllSettingsData = (options = {}) => async (dispatch, getState) => {
	const { force = false } = options;
	const state = getState();

	// Check if already prefetching or data is already loaded
	if (state.settings?.isPrefetching) {
		return;
	}

	// Check if all data is already loaded (unless force is true)
	const hasSettings = !!state.settings?.settings;
	const hasTracking = !!state.settings?.tracking;
	const hasTerms = !!state.terms?.terms;
	const hasPostData = !!state.postdatas?.fetchedAll;
	const hasAutoCreateSettings = !!state.settings?.autoCreateLinkSettings;

	if (!force && hasSettings && (hasTracking || !is_pro_enabled) && hasTerms && hasPostData && (hasAutoCreateSettings || !is_pro_enabled)) {
		// All data already loaded, mark as complete
		dispatch({ type: SETTINGS_PREFETCH_COMPLETE });
		return;
	}

	// Start prefetching
	dispatch({ type: SETTINGS_PREFETCH_START });

	try {
		// Create array of promises for all data fetching
		const fetchPromises = [];

		// Fetch settings if not already loaded
		if (force || !hasSettings) {
			fetchPromises.push(fetch_settings_data()(dispatch));
		}

		// Fetch tracking settings if not already loaded
		if (force || !hasTracking) {
			fetchPromises.push(fetch_tracking_settings()(dispatch));
		}

		// Fetch terms data if not already loaded
		if (force || !hasTerms) {
			fetchPromises.push(fetch_terms_data()(dispatch));
		}

		// Fetch post types data if not already loaded
		if (force || !hasPostData) {
			fetchPromises.push(fetch_post_types_data()(dispatch));
		}

		// Fetch auto-create link settings for Pro users
		if (is_pro_enabled && (force || !hasAutoCreateSettings)) {
			const autoCreatePromise = makeRequest({
				action: 'betterlinks/admin/get_auto_create_links_settings',
			}).then((response) => {
				if (response?.data?.data) {
					const settings = response.data.data;
					const processedSettings = {
						enable_auto_link: settings.enable_auto_link,
						post_shortlinks: settings.enable_auto_link && settings.post_shortlinks,
						post_default_cat: settings.enable_auto_link && settings.post_shortlinks && settings.post_default_cat,
						page_shortlinks: settings.enable_auto_link && settings.page_shortlinks,
						page_default_cat: settings.enable_auto_link && settings.page_shortlinks && settings.page_default_cat,
						custom_post_type_shortlinks: settings.enable_auto_link && settings.custom_post_type_shortlinks,
						custom_post_type_default_cat: settings.enable_auto_link && settings.custom_post_type_shortlinks && settings.custom_post_type_default_cat,
						custom_post_types_selection: settings.enable_auto_link && settings.custom_post_type_shortlinks && settings.custom_post_types_selection,
					};
					dispatch(setAutoCreateLinkSettings(processedSettings));
				}
			});
			fetchPromises.push(autoCreatePromise);
		}

		// Wait for all promises to resolve
		await Promise.all(fetchPromises);

		// Mark prefetch as complete
		dispatch({ type: SETTINGS_PREFETCH_COMPLETE });
	} catch (error) {
		console.error('Error prefetching settings data:', error);
		dispatch({ type: SETTINGS_PREFETCH_ERROR, payload: error.message });
	}
};
