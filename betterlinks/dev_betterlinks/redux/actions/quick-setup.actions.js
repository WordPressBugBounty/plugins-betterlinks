// Quick Setup Settings
export const QUICK_SETUP = 'QUICK_SETUP';

export const update_quick_setup = (data) => (dispatch) => {
	dispatch({
		type: 'UPDATE_OPTIONS',
		payload: data,
	});
};
export const update_migration_result = (data) => (dispatch) => {
	dispatch({
		type: 'UPDATE_RESULTS',
		payload: data,
	});
};
