import { FETCH_POST_TYPES_DATA } from 'redux/actions/posttypesdata.actions';
function postTypesData(state = {}, action) {
	const payload = action.payload;
	switch (action.type) {
		case FETCH_POST_TYPES_DATA: {
			return {
				...state,
				...payload,
			};
		}
		default:
			return state;
	}
}
export default postTypesData;
