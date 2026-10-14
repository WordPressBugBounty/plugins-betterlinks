import { FETCH_SETTINGS, FETCH_TRACKING_SETTINGS, UPDATE_OPTION } from 'redux/actions/settings.actions';
import {
	SETTINGS_PREFETCH_START,
	SETTINGS_PREFETCH_COMPLETE,
	SETTINGS_PREFETCH_ERROR,
	SET_AUTO_CREATE_LINK_SETTINGS,
} from 'redux/actions/actionstrings';
import { betterlinks_settings } from 'utils/helper';

const initialSettingsState = {
	...(!!Object.keys(betterlinks_settings).length && {
		settings: betterlinks_settings,
	}),
	isPrefetching: false,
	isPrefetched: false,
	prefetchError: null,
	autoCreateLinkSettings: null,
};

function settings(state = initialSettingsState, action) {
	const payload = action.payload;
	switch (action.type) {
		case FETCH_SETTINGS:
			return {
				...state,
				settings: {
					...payload,
				},
			};
		case FETCH_TRACKING_SETTINGS:
			return {
				...state,
				tracking: {
					...payload,
				},
			};
		case UPDATE_OPTION:
			return {
				...state,
				settings: {
					...payload,
				},
			};
		case SETTINGS_PREFETCH_START:
			return {
				...state,
				isPrefetching: true,
				isPrefetched: false,
				prefetchError: null,
			};
		case SETTINGS_PREFETCH_COMPLETE:
			return {
				...state,
				isPrefetching: false,
				isPrefetched: true,
				prefetchError: null,
			};
		case SETTINGS_PREFETCH_ERROR:
			return {
				...state,
				isPrefetching: false,
				isPrefetched: false,
				prefetchError: payload,
			};
		case SET_AUTO_CREATE_LINK_SETTINGS:
			return {
				...state,
				autoCreateLinkSettings: payload,
			};
		default:
			return state;
	}
}
export default settings;
