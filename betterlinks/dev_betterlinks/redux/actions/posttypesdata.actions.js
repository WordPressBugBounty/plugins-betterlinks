import { makeRequest } from 'utils/helper';
export const FETCH_POST_TYPES_DATA = 'FETCH_POST_TYPES_DATA';

export const fetch_post_types_data = () => async (dispatch) => {
	// get post type info for adding or updating keywords
	Promise.all([
		makeRequest({
			action: 'betterlinks/admin/get_post_types',
		}),
		makeRequest({
			action: 'betterlinks/admin/get_post_tags',
		}),
		makeRequest({
			action: 'betterlinks/admin/get_post_categories',
		}),
	])
		.then((values) => {
			const newArr = [];
			for (const item of values) {
				if (item.data && item.data.data) {
					const data = Object.entries(item.data.data).reduce((acc, item) => {
						acc.push({ label: item[1], value: item[0] });

						return acc;
					}, []);
					newArr.push(data);
				} else {
					newArr.push([]);
				}
			}
			dispatch({
				type: FETCH_POST_TYPES_DATA,
				payload: {
					postTypes: newArr[0],
					postTags: newArr[1],
					postCategories: newArr[2],
					fetchedAll: true,
				},
			});
		})
		.catch((error) => {
			console.error('error fetching posttypesdata', error.message);
		});
};
