import { FETCH_TERMS_DATA, ADD_TERM, UPDATE_TERM, DELETE_TERM, REORDER_TERMS, FETCH_TAGS, FETCH_CATEGORIES } from 'redux/actions/actionstrings';

function terms(state = {}, action) {
	const payload = action.payload;
	switch (action.type) {
		case FETCH_TERMS_DATA:
			return {
				...state,
				terms: payload.data,
			};
		// Board view column reorder: permute the category terms into `payload.order`
		// (an array of category IDs) *in place* — non-category terms (tags) keep
		// their slots — and stamp the new `term_order`. `getFilteredLinksView`
		// orders the board columns by this array, so the reorder shows immediately.
		case REORDER_TERMS: {
			const order = (payload.order || []).map(String);
			const catInNewOrder = order
				.map((id) => (state.terms || []).find((t) => `${t.ID}` === id && `${t.term_type}` === 'category'))
				.filter(Boolean)
				.map((t, i) => ({ ...t, term_order: `${i}` }));
			let ci = 0;
			const newTerms = (state.terms || []).map((t) => (`${t.term_type}` === 'category' ? catInNewOrder[ci++] || t : t));
			const newCategories = order
				.map((id) => (state.categories || []).find((c) => `${c.ID}` === id || `${c.id}` === id))
				.filter(Boolean);
			return {
				...state,
				terms: newTerms,
				...(Array.isArray(state.categories) && newCategories.length === state.categories.length && { categories: newCategories }),
			};
		}
		case FETCH_TAGS:
			return {
				...state,
				tags: payload.data?.results,
				tag_analytics: payload.data?.analytic,
			};
		case FETCH_CATEGORIES:
			return {
				...state,
				categories: payload.data?.results,
				category_analytics: payload.data?.analytic,
			};
		case ADD_TERM: {
			const newTerm = {
				ID: `${payload?.term_id || payload?.ID}`,
				term_name: payload?.term_name || payload?.term_slug,
				term_slug: payload?.term_slug,
				term_type: payload?.term_type,
				term_order: '0',
			};

			return {
				...state,
				terms: [...(state.terms || []), newTerm],
				...(newTerm.term_type === 'tags' && { tags: [...(state.tags || []), newTerm] }),
				...(newTerm.term_type === 'category' && { categories: [...(state.categories || []), newTerm] }),
			};
		}
		case UPDATE_TERM: {
			const ID = payload.ID;
			const newTerms = state?.terms?.map((item) =>
				`${item.ID}` === `${ID}`
					? {
						...item,
						...payload,
					}
					: item
			);
			const newTags = state?.tags?.map((item) =>
				`${item.ID}` === `${ID}` || `${item.id}` === `${ID}`
					? {
						...item,
						...payload,
					}
					: item
			);
			const newCategories = state?.categories?.map((item) =>
				`${item.ID}` === `${ID}` || `${item.id}` === `${ID}`
					? {
						...item,
						...payload,
					}
					: item
			);
			return {
				...state,
				terms: newTerms,
				tags: newTags,
				categories: newCategories,
			};
		}
		case DELETE_TERM: {
			const ID = payload?.cat_id;
			const newTerms = state?.terms?.filter((item) => `${item.ID}` !== `${ID}`);
			const newTags = state?.tags?.filter((item) => `${item.id}` !== `${ID}` && `${item.ID}` != `${ID}`);
			const newCategories = state?.categories?.filter((item) => `${item.id}` !== `${ID}` && `${item.ID}` != `${ID}`);
			return {
				...state,
				terms: newTerms,
				tags: newTags,
				categories: newCategories,
			};
		}
		default:
			return state;
	}
}
export default terms;
