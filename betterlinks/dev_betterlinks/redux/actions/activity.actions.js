export const CHANGE_LINKS_VIEW = 'CHANGE_LINKS_VIEW';
export const CHANGE_THEME_MODE = 'CHANGE_THEME_MODE';
export const CHANGE_ACTIVITY = 'CHANGE_ACTIVITY';
export const linksView = (data) => (dispatch) => {
	dispatch({
		type: CHANGE_LINKS_VIEW,
		payload: data,
	});
	localStorage.setItem('betterLinksView', data);
};

export const update_theme_mode = (data) => (dispatch) => {
	dispatch({
		type: CHANGE_THEME_MODE,
		payload: data,
	});
	if (data) localStorage.setItem('betterLinksIsDarkMode', data);
	else localStorage.removeItem('betterLinksIsDarkMode');
};

export const update_activity = (data) => (dispatch) => {
	dispatch({
		type: CHANGE_ACTIVITY,
		payload: data,
	});
};
