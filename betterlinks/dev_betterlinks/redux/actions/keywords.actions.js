import { API, namespace, makeRequest } from 'utils/helper';
import { toastSuccess, toastError } from 'components/Toast';
import { __ } from '@wordpress/i18n';
export const FETCH_ALL_KEYWORDS = 'FETCH_ALL_KEYWORDS';
export const GET_KEYWORD = 'GET_KEYWORD';
export const ADD_NEW_KEYWORD = 'ADD_NEW_KEYWORD';
export const UPDATE_KEYWORD = 'UPDATE_KEYWORD';
export const DELETE_KEYWORD = 'DELETE_KEYWORD';
export const EXPORT_KEYWORDS = 'EXPORT_KEYWORDS';
export const IMPORT_KEYWORDS = 'IMPORT_KEYWORDS';

export const fetch_keywords = () => async (dispatch) => {
	try {
		const res = await API.get(namespace + 'keywords', {
			params: {},
		});
		dispatch({
			type: FETCH_ALL_KEYWORDS,
			payload: res.data,
		});
	} catch (e) {
		makeRequest({
			action: 'betterlinks/admin/get_all_keywords',
		}).then((response) => {
			if (response.data) {
				dispatch({
					type: FETCH_ALL_KEYWORDS,
					payload: response.data,
				});
			}
		});
	}
};
export const get_keyword = (item) => async (dispatch) => {
	try {
		const res = await API.put(namespace + 'keywords/' + item.ID, {
			params: item,
		});
		dispatch({
			type: GET_KEYWORD,
			payload: item,
		});
	} catch (e) {
		console.error('error at get_keyword: ', e);
	}
};
export const add_keyword = (formData) => async (dispatch) => {
	try {
		const res = await API.post(namespace + 'keywords', {
			params: formData,
		});
		if (res.data.success) {
			dispatch({
				type: ADD_NEW_KEYWORD,
				payload: res.data,
			});
			toastSuccess(__('Keyword has been created successfully', 'betterlinks'), {
				title: __('Keyword Created', 'betterlinks'),
			});
		}
	} catch (e) {
		makeRequest({
			action: 'betterlinks/admin/create_keyword',
			...formData,
		}).then((response) => {
			if (response.data) {
				dispatch({
					type: ADD_NEW_KEYWORD,
					payload: response.data,
				});
				toastSuccess(__('Keyword has been created successfully', 'betterlinks'), {
					title: __('Keyword Created', 'betterlinks'),
				});
			}
		});
	}
};

export const update_keyword = (formData) => async (dispatch) => {
	try {
		const res = await API.post(namespace + 'keywords/' + formData.chooseLink, {
			params: formData,
		});
		if (res.data.success) {
			dispatch({
				type: UPDATE_KEYWORD,
				payload: res.data,
			});
			toastSuccess(__('Keyword has been updated successfully', 'betterlinks'), {
				title: __('Keyword Updated', 'betterlinks'),
			});
		}
	} catch (e) {
		makeRequest({
			action: 'betterlinks/admin/update_keyword',
			...formData,
		}).then((response) => {
			if (response.data) {
				dispatch({
					type: UPDATE_KEYWORD,
					payload: response.data,
				});
				toastSuccess(__('Keyword has been updated successfully', 'betterlinks'), {
					title: __('Keyword Updated', 'betterlinks'),
				});
			}
		});
	}
};

export const delete_keyword = (params) => (dispatch) => {
	const keywordCount = params.length;
	params.map((item) => {
		const { keywords, link_id } = item;
		makeRequest({
			action: 'betterlinks/admin/delete_keyword',
			id: link_id,
			keywords: keywords,
		}).then((response) => {
			if (response.data.success) {
				dispatch({
					type: DELETE_KEYWORD,
					payload: {
						link_id,
						keywords,
					},
				});
				toastSuccess(
					keywordCount > 1
						? __('Keywords have been deleted successfully', 'betterlinks')
						: __('Keyword has been deleted successfully', 'betterlinks'),
					{
						title: keywordCount > 1 ? __('Keywords Deleted', 'betterlinks') : __('Keyword Deleted', 'betterlinks'),
					}
				);
			}
		});
	});
};

export const export_keywords = () => async (dispatch, getState) => {
	try {
		const res = await API.get(namespace + 'keywords/export', {
			params: {},
		});
		if (res.data.success) {
			// Get links data from state for mapping
			const state = getState();

			// Try different state paths for links data
			let linksData = null;
			if (state.links) {
				linksData = state.links;
			} else if (state.link && state.link.links) {
				linksData = state.link;
			} else if (state.links_reducer) {
				linksData = state.links_reducer;
			}

			// Generate CSV content with link mapping
			const csvContent = generateCSVContent(res.data.data, linksData);
			// Download CSV file
			downloadCSVFile(csvContent, 'betterlinks-keywords-export.csv');
			dispatch({
				type: EXPORT_KEYWORDS,
				payload: res.data,
			});
		}
	} catch (e) {
		makeRequest({
			action: 'betterlinks/admin/export_keywords',
		}).then((response) => {
			if (response.data && response.data.success) {
				// Get links data from state for mapping
				const state = getState();

				// Try different state paths for links data
				let linksData = null;
				if (state.links) {
					linksData = state.links;
				} else if (state.link && state.link.links) {
					linksData = state.link;
				} else if (state.links_reducer) {
					linksData = state.links_reducer;
				}

				const csvContent = generateCSVContent(response.data.data, linksData);
				downloadCSVFile(csvContent, 'betterlinks-keywords-export.csv');
				dispatch({
					type: EXPORT_KEYWORDS,
					payload: response.data,
				});
			}
		});
	}
};

export const import_keywords = (formData, rewriteExisting = false) => async (dispatch) => {
	try {
		const res = await API.post(namespace + 'keywords/import', {
			params: { ...formData, rewrite_existing: rewriteExisting },
		});
		if (res.data.success) {
			dispatch({
				type: IMPORT_KEYWORDS,
				payload: res.data,
			});
			// Refresh keywords list after import
			dispatch(fetch_keywords());
		}
		return res.data;
	} catch (e) {
		const response = await makeRequest({
			action: 'betterlinks/admin/import_keywords',
			...formData,
			rewrite_existing: rewriteExisting,
		});
		if (response.data.success) {
			dispatch({
				type: IMPORT_KEYWORDS,
				payload: response.data,
			});
			// Refresh keywords list after import
			dispatch(fetch_keywords());
		}
		return response.data;
	}
};

// Helper functions for CSV handling
const generateCSVContent = (data, linksData = null) => {
	const headers = [
		'Keyword ID',
		'Keywords',
		'Shortened URL',
		'Post Types',
		'Categories',
		'Tags',
		'Open New Tab',
		'Use No Follow',
		'Case Sensitive',
		'Left Boundary',
		'Right Boundary',
		'Keyword Before',
		'Keyword After',
		'Limit',
		'Status'
	];

	let csvContent = headers.join(',') + '\n';

	// Create a map of link IDs to their details
	const linkMap = {};

	// Handle different possible state structures for links data
	if (linksData) {
		if (linksData.links && typeof linksData.links === 'object') {
			// Handle nested structure like state.links.links
			Object.values(linksData.links).forEach(linkGroup => {
				if (linkGroup && linkGroup.lists) {
					linkGroup.lists.forEach(link => {
						linkMap[link.ID] = {
							short_url: link.short_url,
							link_title: link.link_title
						};
					});
				}
			});
		} else if (Array.isArray(linksData)) {
			// Handle direct array of links
			linksData.forEach(link => {
				linkMap[link.ID] = {
					short_url: link.short_url,
					link_title: link.link_title
				};
			});
		} else if (linksData.lists && Array.isArray(linksData.lists)) {
			// Handle structure with lists property
			linksData.lists.forEach(link => {
				linkMap[link.ID] = {
					short_url: link.short_url,
					link_title: link.link_title
				};
			});
		}
	}

	data.forEach(item => {
		// Handle both old format (plain JSON string) and new format (object with meta_id + meta_value)
		let parsedData;
		let metaId = '';
		if (typeof item === 'object' && item.meta_value !== undefined) {
			metaId = item.meta_id || '';
			parsedData = typeof item.meta_value === 'string' ? JSON.parse(item.meta_value) : item.meta_value;
		} else {
			parsedData = typeof item === 'string' ? JSON.parse(item) : item;
		}
		const linkInfo = linkMap[parsedData.link_id];
		const shortenedUrl = linkInfo ? linkInfo.short_url : `Link ID: ${parsedData.link_id}`;

		const row = [
			metaId,
			`"${parsedData.keywords || ''}"`,
			`"${shortenedUrl}"`,
			`"${Array.isArray(parsedData.post_type) ? parsedData.post_type.join(';') : (parsedData.post_type || '')}"`,
			`"${Array.isArray(parsedData.category) ? parsedData.category.join(';') : (parsedData.category || '')}"`,
			`"${Array.isArray(parsedData.tags) ? parsedData.tags.join(';') : (parsedData.tags || '')}"`,
			parsedData.open_new_tab || 0,
			parsedData.use_no_follow || 0,
			parsedData.case_sensitive || 0,
			`"${parsedData.left_boundary || ''}"`,
			`"${parsedData.right_boundary || ''}"`,
			`"${parsedData.keyword_before || ''}"`,
			`"${parsedData.keyword_after || ''}"`,
			parsedData.limit || 100,
			parsedData.is_active !== undefined ? parsedData.is_active : 1
		];
		csvContent += row.join(',') + '\n';
	});

	return csvContent;
};

const downloadCSVFile = (csvContent, filename) => {
	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
	const link = document.createElement('a');
	const url = URL.createObjectURL(blob);
	link.setAttribute('href', url);
	link.setAttribute('download', filename);
	link.style.visibility = 'hidden';
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
};
