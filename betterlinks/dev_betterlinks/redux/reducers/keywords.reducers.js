import { FETCH_ALL_KEYWORDS, ADD_NEW_KEYWORD, UPDATE_KEYWORD, DELETE_KEYWORD, EXPORT_KEYWORDS, IMPORT_KEYWORDS } from 'redux/actions/keywords.actions';
function keywords(state = {}, action) {
	const payload = action.payload;
	switch (action.type) {
		case FETCH_ALL_KEYWORDS:
			return {
				...state,
				data: payload.data.reduce((acc, item) => {
					acc.push(JSON.parse(item));
					return acc;
				}, []),
			};
		case ADD_NEW_KEYWORD:
			return {
				...state,
				data: [payload.data, ...state.data],
			};
		case UPDATE_KEYWORD: {
			const indexOfPayload = state.data.findIndex((item) => item.link_id == payload.data.old_link_id && item.keywords == payload.data.old_keywords);
			return {
				...state,
				data: [...state.data.slice(0, indexOfPayload), payload.data, ...state.data.slice(indexOfPayload + 1)],
			};
		}
		case DELETE_KEYWORD: {
			// Not sure if this is necessary or not, So I kept this as a previous code reference
			// const indexOfPayload = state.data.findIndex((item) => item.link_id == payload.link_id && item.keywords == payload.keywords);
			const filter = state.data.filter((item) => item.keywords !== payload.keywords);

			return {
				...state,
				// data: [...state.data.slice(0, indexOfPayload), ...state.data.slice(indexOfPayload + 1)],
				data: [...filter],
			};
		}
		case EXPORT_KEYWORDS:
			return {
				...state,
				exportStatus: 'success',
				exportMessage: payload.message || 'Export completed successfully',
			};
		case IMPORT_KEYWORDS:
			return {
				...state,
				importStatus: 'success',
				importMessage: payload.message || 'Import completed successfully',
				importDetails: payload.details || {},
			};
		default:
			return state;
	}
}
export default keywords;
