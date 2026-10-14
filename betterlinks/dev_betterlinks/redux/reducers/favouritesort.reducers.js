const { SORT_FAVOURITE } = require('redux/actions/favouritesort.actions');

const sortByFav = localStorage.getItem('betterLinksSortByFav');
function favouriteSort(state = { sortByFav: sortByFav == 'true' }, action) {
	const payload = action.payload;
	switch (action.type) {
		case SORT_FAVOURITE:
			return {
				...state,
				sortByFav: payload,
			};
		default:
			return state;
	}
}
export default favouriteSort;
