import axios from 'axios';
import { API, namespace, betterlinks_nonce, makeRequest } from 'utils/helper';
import { ADD_TERM, DELETE_TERM, FETCH_TAGS, FETCH_CATEGORIES, FETCH_TERMS_DATA, UPDATE_TERM, REORDER_TERMS } from 'redux/actions/actionstrings';
import { toastSuccess, toastError } from 'components/Toast';
import { __ } from '@wordpress/i18n';

// Board view: persist a new category (column) order. Optimistically permute the
// terms in state so the columns move instantly, then save `term_order` server
// side (mirrors the link-reorder AJAX). `order` is an array of category IDs.
export const reorder_terms = (order) => async (dispatch) => {
	dispatch({ type: REORDER_TERMS, payload: { order } });
	try {
		await makeRequest({ action: 'betterlinks/admin/terms_reorder', terms: order.join(',') });
	} catch (e) {
		console.log(e);
	}
};

export const delete_tag = (params) => async (dispatch) => {
	params.map(async (item) => {
		try {
			const res = await API.delete(namespace + 'terms', {
				params: item,
			});

			// Only dispatch success action if the API response is successful
			if (res.data.success) {
				dispatch({
					type: DELETE_TERM,
					payload: res.data?.data,
				});
				toastSuccess(__('Tag has been deleted successfully', 'betterlinks'), {
					title: __('Tag Deleted', 'betterlinks'),
				});
			} else {
				// Handle API error response (e.g., trying to delete default category)
				toastError(res.data.data?.message || __('Failed to delete tag', 'betterlinks'), {
					title: __('Delete Failed', 'betterlinks'),
				});
			}
		} catch (error) {
			console.log('error is: ', error.message);
			toastError(error.message || __('Failed to delete tag', 'betterlinks'), {
				title: __('Delete Failed', 'betterlinks'),
			});
		}
	});
};
export const add_new_tag = (data) => async (dispatch) => {
	// Use the input data.term_type since res.data?.data?.term_type may be undefined on update
	const termType = data.term_type;
	const isTag = termType === 'tags';
	
	try {
		const res = await API.post(namespace + 'terms', {
			params: data,
		});

		if (!res.data.success) return;
		
		if (res.data.success) {
			dispatch({
				type: res.data?.update ? UPDATE_TERM : ADD_TERM,
				payload: res.data?.data,
			});
			
			const isUpdate = res.data?.update;
			let message, title;
			
			if (isUpdate) {
				message = isTag 
					? __('Tag has been updated successfully', 'betterlinks') 
					: __('Category has been updated successfully', 'betterlinks');
				title = isTag 
					? __('Tag Updated', 'betterlinks') 
					: __('Category Updated', 'betterlinks');
			} else {
				message = isTag 
					? __('Tag has been created successfully', 'betterlinks') 
					: __('Category has been created successfully', 'betterlinks');
				title = isTag 
					? __('Tag Created', 'betterlinks') 
					: __('Category Created', 'betterlinks');
			}
			
			toastSuccess(message, { title });
		}
	} catch (e) {
		makeRequest({
			action: 'betterlinks/admin/create_new_term',
			ID: data.ID,
			term_name: data.term_name,
			term_slug: data.term_slug,
			term_type: data.term_type,
		}).then((res) => {
			if (res.data) {
				dispatch({
					type: res.data?.update ? UPDATE_TERM : ADD_TERM,
					payload: res.data?.data,
				});
				
				const isUpdate = res.data?.update;
				let message, title;
				
				if (isUpdate) {
					message = isTag 
						? __('Tag has been updated successfully', 'betterlinks') 
						: __('Category has been updated successfully', 'betterlinks');
					title = isTag 
						? __('Tag Updated', 'betterlinks') 
						: __('Category Updated', 'betterlinks');
				} else {
					message = isTag 
						? __('Tag has been created successfully', 'betterlinks') 
						: __('Category has been created successfully', 'betterlinks');
					title = isTag 
						? __('Tag Created', 'betterlinks') 
						: __('Category Created', 'betterlinks');
				}
				
				toastSuccess(message, { title });
			}
		});
	}
};

export const fetch_all_tags = () => async (dispatch) => {
	try {
		const res = await API.get(namespace + 'terms/tags');

		if (res?.data) {
			dispatch({
				type: FETCH_TAGS,
				payload: res.data,
			});
		}
	} catch (error) {
		console.log({ error: error.message });
	}
};

export const fetch_all_categories = () => async (dispatch) => {
	try {
		const res = await API.get(namespace + 'terms/categories');

		if (res?.data) {
			dispatch({
				type: FETCH_CATEGORIES,
				payload: res.data,
			});
		}
	} catch (error) {
		console.log({ error: error.message });
	}
};

export const fetch_terms_data = (params) => async (dispatch) => {
	try {
		const res = await API.get(namespace + 'terms', {
			params: params,
		});
		if (!Array.isArray(res?.data)) {
			throw new Error('rest api not working properly for fetch_terms_data');
		}
		dispatch({
			type: FETCH_TERMS_DATA,
			payload: res.data,
		});
		return res.data;
	} catch (e) {
		let form_data = new FormData();
		form_data.append('action', 'betterlinks/admin/get_terms');
		form_data.append('security', betterlinks_nonce);
		axios.post(ajaxurl, form_data).then(
			(response) => {
				if (response.data) {
					dispatch({
						type: FETCH_TERMS_DATA,
						payload: response.data,
					});
					return response.data;
				}
			},
			(error) => {
				console.log(error);
			}
		);
	}
};

export const fetch_terms_by_link_id = (ID) => {
	let form_data = new FormData();
	form_data.append('action', 'betterlinks/admin/get_cat_by_link_id');
	form_data.append('security', betterlinks_nonce);
	form_data.append('ID', ID);
	return axios.post(ajaxurl, form_data).then(
		(response) => {
			if (response?.data?.length) {
				return response.data;
			}
		},
		(error) => {
			console.log(error);
		}
	);
};
