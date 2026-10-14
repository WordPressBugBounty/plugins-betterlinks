import { CHANGE_ACTIVITY, CHANGE_LINKS_VIEW, CHANGE_THEME_MODE } from 'redux/actions/activity.actions';
const linksView = localStorage.getItem('betterLinksView');
// Light mode removes the key rather than storing false, so getItem() answers
// null — which reached the theme toggle as `value={null}` and had React warn
// about a controlled input on every admin page. Keep this a real boolean.
const darkMode = localStorage.getItem('betterLinksIsDarkMode') === 'true';

const initialState = { linksView: linksView ? linksView : 'grid', darkMode, analyticsTab: 0 };
function activity(state = initialState, { type, payload }) {
	switch (type) {
		case CHANGE_LINKS_VIEW:
			return {
				...state,
				linksView: payload,
			};
		case CHANGE_THEME_MODE: {
			return {
				...state,
				darkMode: payload,
			};
		}
		case CHANGE_ACTIVITY: {
			return {
				...state,
				...payload,
			};
		}
		default:
			return state;
	}
}
export default activity;
