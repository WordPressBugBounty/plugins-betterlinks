import { API, namespace, makeRequest, getJsonString } from 'utils/helper';
import { toastSuccess, toastError, toastWarning, toastInfo } from 'components/Toast';
import { __ } from '@wordpress/i18n';
import { EDIT_GUTENBERG_LINK, EDIT_LINK_EXPIRE_OPTION, ADD_TERM, UPDATE_TERM, DELETE_TERM } from 'redux/actions/actionstrings';
export const DRAG_AND_DROP = 'DRAG_AND_DROP';
export const FETCH_INITIAL_DATA = 'FETCH_INITIAL_DATA';
export const FETCH_WITHOUT_CATEGORY_INITIAL_DATA = 'FETCH_WITHOUT_CATEGORY_INITIAL_DATA';
export const ADD_NEW_CAT = 'ADD_NEW_CAT';
export const UPDATE_CAT = 'UPDATE_CAT';
export const DELETE_CAT = 'DELETE_CAT';
export const ADD_NEW_LINK = 'ADD_NEW_LINK';
export const ADD_NEW_LINK_FOR_GUTEN_STORE = 'ADD_NEW_LINK_FOR_GUTEN_STORE';
export const DELETE_LINK = 'DELETE_LINK';
export const EDIT_LINK = 'EDIT_LINK';
export const EDIT_LINK_FOR_GUTENBERG = 'EDIT_LINK_FOR_GUTENBERG';
export const HANDLE_LINK_FAVORITE = 'HANDLE_LINK_FAVORITE';
export const UPDATE_LINKS_ANALYTICS = 'UPDATE_LINKS_ANALYTICS';
export const MERGE_EMPTY_CATEGORIES = 'MERGE_EMPTY_CATEGORIES';

// Ensure empty categories (which the /links endpoint omits) exist in state so
// their board columns are real drop targets for drag-and-drop.
/**
 * `betterLinksLinkSaved` — fired after a link is created or updated.
 *
 * Payload: `{ link, values, isNew, forGutenbergStore }`, where `link` is the saved
 * row the server returned and `values` the submitted form values (which also
 * carry fields extensions add to the link form). BetterLinks Pro saves its
 * per-link data (password protection, link preview) here.
 */
const fireLinkSaved = (payload) => {
	const hooks = window.betterLinksHooks;
	if (hooks && typeof hooks.doAction === 'function') {
		hooks.doAction('betterLinksLinkSaved', payload);
	}
};

export const merge_empty_categories = (categoryTerms) => (dispatch) => {
	dispatch({
		type: MERGE_EMPTY_CATEGORIES,
		payload: { categoryTerms },
	});
};

export const onDragEnd = (result) => async (dispatch) => {
	var [notUsed, ID] = result.draggableId.split('_');
	if (result.destination) {
		dispatch({
			type: DRAG_AND_DROP,
			payload: result,
		});
		try {
			await API.put(namespace + 'links/' + ID, {
				params: {
					ID: ID,
					cat_id: result.destination.droppableId,
				},
			});
		} catch (e) {
			makeRequest({
				action: 'betterlinks/admin/update_link',
				ID,
				cat_id: result.destination.droppableId,
			}).then((response) => {
				if (response.data) {
					dispatch({
						type: DRAG_AND_DROP,
						payload: result,
					});
				}
			});
		}
	}
};
export const fetch_links_data =
	(forGutenbergStore = false) =>
		async (dispatch) => {
			try {
				const res = await API.get(namespace + 'links', {
					params: {},
				});
				if (!res?.data?.data) {
					throw new Error('rest api not working properly for fetch_links_data');
				}
				// console.warn({ data: res.data.data });
				dispatch({
					type: forGutenbergStore ? FETCH_WITHOUT_CATEGORY_INITIAL_DATA : FETCH_INITIAL_DATA,
					payload: res.data,
				});
			} catch (e) {
				makeRequest({
					action: 'betterlinks/admin/get_all_links',
				}).then((response) => {
					if (response.data) {
						dispatch({
							type: forGutenbergStore ? FETCH_WITHOUT_CATEGORY_INITIAL_DATA : FETCH_INITIAL_DATA,
							payload: response.data.data,
						});
					}
				});
			}
		};

export const dispatch_new_links_data = (payload) => async (dispatch) => {
	dispatch({
		type: FETCH_INITIAL_DATA,
		payload,
	});
};

export const add_new_cat = (data) => async (dispatch) => {
	try {
		const res = await API.post(namespace + 'terms', {
			params: data,
		});
		if (res.data.success) {
			dispatch({
				type: ADD_TERM,
				payload: res.data?.data,
			});
			dispatch({
				type: ADD_NEW_CAT,
				payload: res.data,
			});
			toastSuccess(__('Category has been created successfully.', 'betterlinks'), {
				title: __('Category Created', 'betterlinks'),
				position: 'top-right',
				duration: 3000,
			});
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
					type: ADD_TERM,
					payload: res.data?.data,
				});
				dispatch({
					type: ADD_NEW_CAT,
					payload: res.data,
				});
				toastSuccess(__('Category has been created successfully.', 'betterlinks'), {
					title: __('Category Created', 'betterlinks'),
					position: 'top-right',
					duration: 3000,
				});
			}
		});
	}
};

export const update_cat = (params) => async (dispatch) => {
	try {
		const res = await API.put(namespace + 'terms', {
			params: params,
		});
		dispatch({
			type: UPDATE_CAT,
			payload: res.data,
		});
		dispatch({
			type: UPDATE_TERM,
			payload: res.data?.data,
		});
		toastSuccess(__('Category has been updated successfully.', 'betterlinks'), {
			title: __('Category Updated', 'betterlinks'),
			position: 'top-right',
			duration: 3000,
		});
	} catch (e) {
		makeRequest({
			action: 'betterlinks/admin/update_term',
			ID: params.ID,
			term_name: params.term_name,
			term_slug: params.term_slug,
			term_type: params.term_type,
		}).then((response) => {
			if (response.data) {
				dispatch({
					type: UPDATE_CAT,
					payload: response.data,
				});
				dispatch({
					type: UPDATE_TERM,
					payload: response.data?.data,
				});
				toastSuccess(__('Category has been updated successfully.', 'betterlinks'), {
					title: __('Category Updated', 'betterlinks'),
					position: 'top-right',
					duration: 3000,
				});
			}
		});
	}
};

export const delete_cat = (params) => async (dispatch) => {
	try {
		const res = await API.delete(namespace + 'terms', {
			params: params,
		});

		// Only dispatch success actions if the API response is successful
		if (res.data.success) {
			dispatch({
				type: DELETE_CAT,
				payload: res.data,
			});
			dispatch({
				type: DELETE_TERM,
				payload: res.data?.data,
			});
			toastSuccess(__('Category has been deleted successfully.', 'betterlinks'), {
				title: __('Category Deleted', 'betterlinks'),
				position: 'top-right',
				duration: 3000,
			});
		} else {
			// Handle API error response (e.g., trying to delete default category)
			toastError(res.data.data?.message || __('Failed to delete category.', 'betterlinks'), {
				title: __('Delete Failed', 'betterlinks'),
				position: 'top-right',
				duration: 4000,
			});
		}
	} catch (e) {
		makeRequest({
			action: 'betterlinks/admin/delete_term',
			cat_id: params.cat_id,
		}).then((res) => {
			if (res.data) {
				dispatch({
					type: DELETE_CAT,
					payload: res.data,
				});
				dispatch({
					type: DELETE_TERM,
					payload: res.data?.data,
				});
				toastSuccess(__('Category has been deleted successfully.', 'betterlinks'), {
					title: __('Category Deleted', 'betterlinks'),
					position: 'top-right',
					duration: 3000,
				});
			}
		});
	}
};

export const add_new_link =
	(formData, forGutenbergStore = false, isThisInstantGutenbergRedirectLink = false) =>
		async (dispatch) => {
			try {
				// `instant_redirect_post_id` rides alongside `params`, not inside it:
				// the server strips the payload down to the links schema, and this
				// is request context (which post may be shadowed), not link data.
				const res = await API.post(namespace + 'links', {
					params: formData,
					...(formData?.instant_redirect_post_id ? { instant_redirect_post_id: formData.instant_redirect_post_id } : {}),
					// Same kind of request context: the user confirmed this link may
					// take over WordPress content at its path.
					...(formData?.allow_wp_url_override ? { allow_wp_url_override: true } : {}),
				});
				// A rejected write answers 200 with `success: false` and a reason —
				// a short URL that would shadow existing WordPress content, say.
				// Nothing was stored, so say so instead of falling through to the
				// success path below.
				if (res?.data && res.data.success === false) {
					toastError(res.data.data?.message || __('Failed to create link. Please try again.', 'betterlinks'), {
						title: __('Link Creation Failed', 'betterlinks'),
						position: 'top-right',
						duration: 6000,
					});
					return res;
				}
				const { cat_data, tags_data = [] } = res?.data?.data || {};

				if (res?.data?.data?.ID) {
					fireLinkSaved({ link: res.data.data, values: formData, isNew: true, forGutenbergStore });
				}

				if (cat_data?.is_newly_created) {
					dispatch({
						type: ADD_TERM,
						payload: cat_data,
					});
				}
				for (const tagItem of tags_data) {
					if (tagItem?.is_newly_created) {
						dispatch({
							type: ADD_TERM,
							payload: tagItem,
						});
					}
				}
				if (res.data.success) {
					dispatch({
						type: forGutenbergStore ? ADD_NEW_LINK_FOR_GUTEN_STORE : ADD_NEW_LINK,
						payload: res.data,
					});
					if (isThisInstantGutenbergRedirectLink) {
						const originalResponseData = res.data?.data;
						const clonedResponseData = {
							...(originalResponseData || {}),
						};

						delete clonedResponseData.expire;
						delete clonedResponseData.link_status;
						delete clonedResponseData.dynamic_redirect;

						dispatch({
							type: EDIT_GUTENBERG_LINK,
							payload: clonedResponseData,
						});

						dispatch({
							type: EDIT_LINK_EXPIRE_OPTION,
							payload:
								typeof originalResponseData?.expire === 'object'
									? originalResponseData.expire
									: typeof originalResponseData?.expire === 'string'
										? getJsonString(originalResponseData.expire)
										: {},
						});
					}
					toastSuccess(__('Your link has been created successfully.', 'betterlinks'), {
						title: __('Link Created', 'betterlinks'),
						position: 'top-right',
						duration: 3000,
					});
				}
				return res;
			} catch (e) {
				toastError(__('Failed to create link. Please try again.', 'betterlinks'), {
					title: __('Link Creation Failed', 'betterlinks'),
					position: 'top-right',
					duration: 4000,
				});
				return makeRequest({
					action: 'betterlinks/admin/create_link',
					...formData,
				}).then((res) => {
					// The ajax fallback rejects the same payloads the REST route
					// does, and answers with the reason rather than a link.
					if (res?.data && res.data.success === false) {
						toastError(res.data.data?.message || __('Failed to create link. Please try again.', 'betterlinks'), {
							title: __('Link Creation Failed', 'betterlinks'),
							position: 'top-right',
							duration: 6000,
						});
						return res;
					}
					const { cat_data, tags_data = [] } = res?.data?.data || {};

					if (res?.data?.data?.ID) {
						fireLinkSaved({ link: res.data.data, values: formData, isNew: true, forGutenbergStore });
					}

					if (cat_data?.is_newly_created) {
						dispatch({
							type: ADD_TERM,
							payload: cat_data,
						});
					}
					for (const tagItem of tags_data) {
						if (tagItem?.is_newly_created) {
							dispatch({
								type: ADD_TERM,
								payload: tagItem,
							});
						}
					}
					if (res.data) {
						dispatch({
							type: forGutenbergStore ? ADD_NEW_LINK_FOR_GUTEN_STORE : ADD_NEW_LINK,
							payload: res.data,
						});
						if (isThisInstantGutenbergRedirectLink) {
							const originalResponseData = res.data?.data;
							const clonedResponseData = {
								...(originalResponseData || {}),
							};
							delete clonedResponseData.expire;
							delete clonedResponseData.link_status;
							delete clonedResponseData.dynamic_redirect;

							dispatch({
								type: EDIT_GUTENBERG_LINK,
								payload: clonedResponseData,
							});

							dispatch({
								type: EDIT_LINK_EXPIRE_OPTION,
								payload:
									typeof originalResponseData?.expire === 'object'
										? originalResponseData.expire
										: typeof originalResponseData?.expire === 'string'
											? getJsonString(originalResponseData.expire)
											: {},
							});
						}
					}
				});
			}
		};
export const edit_link =
	(item, forGutenbergStore = false) =>
		async (dispatch) => {
			try {
				const res = await API.put(namespace + 'links/' + item.ID, {
					params: item,
					...(item?.instant_redirect_post_id ? { instant_redirect_post_id: item.instant_redirect_post_id } : {}),
					...(item?.allow_wp_url_override ? { allow_wp_url_override: true } : {}),
				});

				// Same rejection envelope as create. Without this the store would
				// take the error payload as the updated link and the user would be
				// told the edit saved when it did not.
				if (res?.data && res.data.success === false) {
					toastError(res.data.data?.message || __('Failed to update link. Please try again.', 'betterlinks'), {
						title: __('Link Update Failed', 'betterlinks'),
						position: 'top-right',
						duration: 6000,
					});
					return res;
				}

				const { cat_data, tags_data = [] } = res?.data?.data || {};

				fireLinkSaved({ link: { ...(res?.data?.data || {}), ID: res?.data?.data?.ID || item.ID }, values: item, isNew: false, forGutenbergStore });

				if (cat_data?.is_newly_created) {
					dispatch({
						type: ADD_TERM,
						payload: cat_data,
					});
				}
				for (const tagItem of tags_data) {
					if (tagItem?.is_newly_created) {
						dispatch({
							type: ADD_TERM,
							payload: tagItem,
						});
					}
				}
				dispatch({
					type: forGutenbergStore ? EDIT_LINK_FOR_GUTENBERG : EDIT_LINK,
					payload: res?.data?.data,
				});
				toastSuccess(__('Your link has been updated successfully.', 'betterlinks'), {
					title: __('Link Updated', 'betterlinks'),
					position: 'top-right',
					duration: 3000,
				});
				return res;
			} catch (e) {
				toastError(__('Failed to update link. Please try again.', 'betterlinks'), {
					title: __('Link Update Failed', 'betterlinks'),
					position: 'top-right',
					duration: 4000,
				});
				return makeRequest({
					action: 'betterlinks/admin/update_link',
					...item,
				}).then((response) => {
					if (response?.data && response.data.success === false) {
						toastError(response.data.data?.message || __('Failed to update link. Please try again.', 'betterlinks'), {
							title: __('Link Update Failed', 'betterlinks'),
							position: 'top-right',
							duration: 6000,
						});
						return response;
					}
					if (response.data) {
						const { cat_data, tags_data = [] } = response?.data?.data || {};

						fireLinkSaved({ link: { ...(response?.data?.data || {}), ID: response?.data?.data?.ID || item.ID }, values: item, isNew: false, forGutenbergStore });

						if (cat_data?.is_newly_created) {
							dispatch({
								type: ADD_TERM,
								payload: cat_data,
							});
						}
						for (const tagItem of tags_data) {
							if (tagItem?.is_newly_created) {
								dispatch({
									type: ADD_TERM,
									payload: tagItem,
								});
							}
						}
						dispatch({
							type: forGutenbergStore ? EDIT_LINK_FOR_GUTENBERG : EDIT_LINK,
							payload: response.data.data,
						});
						toastSuccess(__('Your link has been updated successfully.', 'betterlinks'), {
							title: __('Link Updated', 'betterlinks'),
							position: 'top-right',
							duration: 3000,
						});
					}
				});
			}
		};
export const handle_link_favorite = (item) => async (dispatch) => {
	try {
		const res = await API.put(namespace + 'links_favorite/' + item.ID, {
			params: item,
		});
		dispatch({
			type: HANDLE_LINK_FAVORITE,
			payload: res?.data?.data || {},
		});
		const isFavorite = res?.data?.data?.is_favorite;
		if (isFavorite === '1' || isFavorite === 1) {
			toastSuccess(__('Link added to favorites.', 'betterlinks'), {
				title: __('Favorite Added', 'betterlinks'),
				position: 'top-right',
				duration: 2000,
			});
		} else {
			toastInfo(__('Link removed from favorites.', 'betterlinks'), {
				title: __('Favorite Removed', 'betterlinks'),
				position: 'top-right',
				duration: 2000,
			});
		}
	} catch (e) {
		makeRequest({
			action: 'betterlinks/admin/handle_favorite',
			...item,
		}).then((res) => {
			dispatch({
				type: HANDLE_LINK_FAVORITE,
				payload: res?.data?.data || {},
			});
			const isFavorite = res?.data?.data?.is_favorite;
			if (isFavorite === '1' || isFavorite === 1) {
				toastSuccess(__('Link added to favorites.', 'betterlinks'), {
					title: __('Favorite Added', 'betterlinks'),
					position: 'top-right',
					duration: 2000,
				});
			} else {
				toastInfo(__('Link removed from favorites.', 'betterlinks'), {
					title: __('Favorite Removed', 'betterlinks'),
					position: 'top-right',
					duration: 2000,
				});
			}
		});
	}
};

export const delete_link = (params) => async (dispatch) => {
	let data = [];
	if (Array.isArray(params)) {
		data = params;
	} else {
		data = [params];
	}
	const linkCount = data.length;
	data.map((item) => {
		const { ID, short_url, term_id } = item;
		makeRequest({
			action: 'betterlinks/admin/delete_link',
			ID,
			short_url,
			term_id,
		}).then((response) => {
			if (response.data) {
				dispatch({
					type: DELETE_LINK,
					payload: response.data,
				});
				toastWarning(
					linkCount > 1
						? __('Short links have been deleted', 'betterlinks')
						: __('Short link has been deleted', 'betterlinks'),
					{
						title: linkCount > 1 ? __('Links Deleted', 'betterlinks') : __('Link Deleted', 'betterlinks'),
					}
				);
			}
		});
	});
};

/**
 * Update fields on several links, then reload the links list.
 *
 * `items` is `[{ ID, ...fields }]`, each sent to the link update endpoint.
 * Resolves once every update has finished; toasts are left to the caller.
 * Handed to extensions as `updateLinks` in the `betterLinksLinksBulkApply` ctx.
 */
export const bulk_update_links = (items) => async (dispatch) => {
	const data = Array.isArray(items) ? items : [items];
	const results = await Promise.all(data.map((item) => makeRequest({ action: 'betterlinks/admin/update_link', ...item })));
	try {
		const res = await API.get(namespace + 'links', { params: {} });
		if (res?.data?.data) {
			dispatch({ type: FETCH_INITIAL_DATA, payload: res.data });
		}
	} catch (e) {
		const response = await makeRequest({ action: 'betterlinks/admin/get_all_links' });
		if (response?.data) {
			dispatch({ type: FETCH_INITIAL_DATA, payload: response.data.data });
		}
	}
	return results;
};

export const bulk_assign_category = (params) => async (dispatch) => {
	let data = [];
	if (Array.isArray(params)) {
		data = params;
	} else {
		data = [params];
	}
	const linkCount = data.length;

	// Update all links
	const updatePromises = data.map((item) => {
		const { ID, cat_id } = item;
		return makeRequest({
			action: 'betterlinks/admin/update_link',
			ID,
			cat_id,
		});
	});

	// Wait for all updates to complete, then fetch fresh data
	Promise.all(updatePromises).then(() => {
		toastSuccess(
			linkCount > 1
				? __('Links have been assigned to category successfully', 'betterlinks')
				: __('Link has been assigned to category successfully', 'betterlinks'),
			{
				title: __('Category Assigned', 'betterlinks'),
			}
		);
		// Fetch fresh links data after all updates are done
		try {
			API.get(namespace + 'links', {
				params: {},
			}).then((res) => {
				if (res?.data?.data) {
					dispatch({
						type: FETCH_INITIAL_DATA,
						payload: res.data,
					});
				}
			});
		} catch (e) {
			makeRequest({
				action: 'betterlinks/admin/get_all_links',
			}).then((response) => {
				if (response.data) {
					dispatch({
						type: FETCH_INITIAL_DATA,
						payload: response.data.data,
					});
				}
			});
		}
	});
};
