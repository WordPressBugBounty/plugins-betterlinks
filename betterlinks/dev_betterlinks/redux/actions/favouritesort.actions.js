export const SORT_FAVOURITE = 'SORT_FAVOURITE';
export const sortFavourite = (data) => (dispatch) => {
	dispatch({
		type: SORT_FAVOURITE,
		payload: data,
	});
	localStorage.setItem('betterLinksSortByFav', data);
};
