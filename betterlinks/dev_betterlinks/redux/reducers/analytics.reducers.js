import { FETCH_ANALYTICS_SETTINGS } from 'redux/actions/actionstrings';

const analytics = (state = {}, { payload, type }) => {
	switch (type) {
		case FETCH_ANALYTICS_SETTINGS: {
			return {
				...state,
				// store payload as-is (keep array form) so UI components receive an array
				analytics: payload,
			};
		}
		default:
			return state;
	}
};
export default analytics;
