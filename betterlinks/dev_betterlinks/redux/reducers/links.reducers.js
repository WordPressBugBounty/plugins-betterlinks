import {
	FETCH_WITHOUT_CATEGORY_INITIAL_DATA,
	FETCH_INITIAL_DATA,
	DRAG_AND_DROP,
	ADD_NEW_CAT,
	UPDATE_CAT,
	DELETE_CAT,
	ADD_NEW_LINK,
	ADD_NEW_LINK_FOR_GUTEN_STORE,
	EDIT_LINK,
	EDIT_LINK_FOR_GUTENBERG,
	DELETE_LINK,
	HANDLE_LINK_FAVORITE,
	UPDATE_LINKS_ANALYTICS,
	MERGE_EMPTY_CATEGORIES,
} from 'redux/actions/links.actions';
import { DELETE_GUTENBERG_LINK } from 'redux/actions/actionstrings';

import { move, reorder } from 'utils/helper';
function links(state = {}, action) {
	const payload = action.payload;
	switch (action.type) {
		case FETCH_INITIAL_DATA: {
			const data = payload.data;
			const newLinksData = {};
			for (const key in data) {
				const newLinksListsArr = [];
				for (const item of data[key]?.lists || []) {
					// Skip invalid/placeholder entries (no ID or title). The board only
					// renders valid links, so keeping these here would desync the
					// displayed index from the stored index and break drag reordering.
					if (!item || !item.ID || !item.link_title) continue;
					newLinksListsArr.push({ ...item, favorite: JSON.parse(item.favorite || '{}') });
				}
				newLinksData[key] = {
					...data[key],
					lists: newLinksListsArr,
				};
			}
			delete payload.data;
			return {
				...state,
				links: newLinksData,
			};
		}
		case FETCH_WITHOUT_CATEGORY_INITIAL_DATA: {
			return {
				...state,
				links: Object.values(payload?.data || [])
					.reduce((acc, curr) => [...acc, ...(curr?.lists || [])], [])
					.filter((item) => item.ID && item.short_url)
					.map((item) => ({ ...item, short_url: (item.short_url || '').replace(/\/+$/, '').replace(/^\/+/, '') })),
			};
		}
		case DRAG_AND_DROP:
			const { source, destination } = payload;
			// dropped outside the list
			if (!destination) {
				return {
					...state,
				};
			}

			const sInd = +source.droppableId;
			const dInd = +destination.droppableId;

			if (sInd === dInd) {
				const newLists = reorder(state.links[sInd].lists, source.index, destination.index);

				return {
					...state,
					links: {
						...state.links,
						[sInd]: {
							...state.links[sInd],
							lists: newLists,
						},
					},
				};
			} else {
				const newLists = move(state.links[sInd].lists, state.links[dInd].lists, source, destination);
				return {
					...state,
					links: {
						...state.links,
						[sInd]: {
							...state.links[sInd],
							lists: newLists[sInd],
						},
						[dInd]: {
							...state.links[dInd],
							lists: newLists[dInd],
						},
					},
				};
			}
		case MERGE_EMPTY_CATEGORIES: {
			const { categoryTerms = [] } = payload;
			const links = { ...state.links };
			categoryTerms.forEach((term) => {
				const existing = links[term.ID];
				if (!existing) {
					links[term.ID] = { term_id: term.ID, term_name: term.term_name, term_slug: term.term_slug, lists: [] };
				} else if (!Array.isArray(existing.lists)) {
					links[term.ID] = { ...existing, lists: [] };
				}
			});
			return { ...state, links };
		}
		case ADD_NEW_CAT:
			return {
				...state,
				links: {
					...state.links,
					[payload.data.ID]: {
						...state.links[payload.data.ID],
						...payload.data,
					},
				},
			};
		case UPDATE_CAT:
			return {
				...state,
				links: {
					...state.links,
					[payload.data.ID]: {
						...state.links[payload.data.ID],
						term_name: payload.data.term_name,
						term_slug: payload.data.term_slug,
					},
				},
			};
		case DELETE_CAT:
			let newState = state.links;
			const { cat_id } = payload.data;
			const deletedCatLinks =
				newState[cat_id] && newState[cat_id].lists.length > 0
					? newState[cat_id].lists.reduce((prev, current, index, arr) => {
							current.cat_id = Object.keys(newState)[0];
							arr[index] = current;
							return arr;
					  }, 0)
					: [];

			delete newState[cat_id];
			return {
				...state,
				links: {
					...newState,
					[Object.keys(newState)[0]]: {
						...newState[Object.keys(newState)[0]],
						lists: [...state.links[Object.keys(newState)[0]].lists, ...deletedCatLinks],
					},
				},
			};
		case ADD_NEW_LINK: {
			let newState = state;
			const newPayload = payload?.data;
			if (newPayload?.cat_data?.is_newly_created) {
				newState = {
					...newState,
					links: {
						...newState.links,
						[newPayload.cat_data.term_id]: {
							lists: [],
							term_name: newPayload.cat_data.term_name || newPayload.cat_data.term_slug,
							term_slug: newPayload.cat_data.term_slug,
							term_type: newPayload.cat_data.term_type,
						},
					},
				};
			}
			if (newState.links[newPayload.cat_id] && newState.links[newPayload.cat_id].lists) {
				setTimeout(() => {
					// the 'reorder' is used here cause it sends data using post request to the server & this way the 'position/index/serial' of the link in the category stay saved (in 'DND view') when someone change a link's category using 'edit_link'
					reorder([newPayload, ...newState.links[newPayload.cat_id].lists], 0, 0);
				}, 0);
				return {
					...state,
					links: {
						...newState.links,
						[newPayload.cat_id]: {
							...newState.links[newPayload.cat_id],
							lists: [newPayload, ...newState.links[newPayload.cat_id].lists],
						},
					},
				};
			}
			return {
				...state,
				links: {
					...newState.links,
					[newPayload.cat_id]: {
						term_name: newPayload.cat_slug,
						term_slug: newPayload.cat_slug,
						term_type: 'category',
						lists: [newPayload],
					},
				},
			};
		}
		case ADD_NEW_LINK_FOR_GUTEN_STORE: {
			//👇 trimmed off any forward slashes in the short url
			const newData = { ...payload.data, short_url: payload.data.short_url.replace(/\/+$/, '').replace(/^\/+/, '') };
			return {
				...state,
				links: [...state.links, newData],
			};
		}
		case EDIT_LINK: {
			let newState = state;
			const newPayload = payload;
			if (newPayload?.cat_data?.is_newly_created) {
				newState = {
					...newState,
					links: {
						...newState.links,
						[newPayload.cat_data.term_id]: {
							lists: [],
							term_name: newPayload.cat_data.term_name || newPayload.cat_data.term_slug,
							term_slug: newPayload.cat_data.term_slug,
							term_type: newPayload.cat_data.term_type,
						},
					},
				};
			}
			if (newState.links[newPayload.cat_id] && newState.links[newPayload.cat_id].lists) {
				const linksAtPayloadCat = newState.links[newPayload.cat_id].lists;
				const itemIndexInTheCat = linksAtPayloadCat.findIndex((item) => item.ID == newPayload.ID);
				const isCategoryChanged = itemIndexInTheCat === -1;
				if (isCategoryChanged) {
					const newStateLinks = {
						...newState.links,
					};
					delete newStateLinks[newPayload.cat_id];
					for (const property in newStateLinks) {
						if (newState.links[property] && newState.links[property].lists) {
							const linksOnTheOldCat = newState.links[property].lists;
							const indexInOldCatList = linksOnTheOldCat.findIndex((item) => `${item.ID}` === `${newPayload.ID}`);
							if (indexInOldCatList !== -1) {
								setTimeout(() => {
									// the 'reorder' is used here cause it sends data using post request to the server & this way the 'position/index/serial' of the link in the category stay saved (in 'DND view') when someone change a link's category using 'edit_link'
									reorder([newPayload, ...linksAtPayloadCat], 0, 0);
								}, 0);
								return {
									...state,
									links: {
										...newState.links,
										[property]: {
											...newState.links[property],
											lists: [...linksOnTheOldCat.slice(0, indexInOldCatList), ...linksOnTheOldCat.slice(indexInOldCatList + 1)],
										},
										[newPayload.cat_id]: {
											...newState.links[newPayload.cat_id],
											lists: [newPayload, ...linksAtPayloadCat],
										},
									},
								};
							}
						}
					}
				}
				return {
					...state,
					links: {
						...newState.links,
						[newPayload.cat_id]: {
							...newState.links[newPayload.cat_id],
							lists: [...linksAtPayloadCat.slice(0, itemIndexInTheCat), newPayload, ...linksAtPayloadCat.slice(itemIndexInTheCat + 1)],
						},
					},
				};
			}
			return {
				...state,
				links: {
					...newState.links,
					[newPayload.cat_id]: {
						term_name: newPayload.cat_id,
						term_slug: newPayload.cat_id,
						term_type: 'category',
						lists: [newPayload],
					},
				},
			};
		}

		case EDIT_LINK_FOR_GUTENBERG: {
			const allLinks = state.links;
			const itemIndexInLinks = allLinks.findIndex((item) => item.ID == payload.ID);
			const newData = { ...payload, short_url: payload.short_url.replace(/\/+$/, '').replace(/^\/+/, '') };
			const newLinks = [...allLinks.slice(0, itemIndexInLinks), newData, ...allLinks.slice(itemIndexInLinks + 1)];

			return {
				...state,
				links: newLinks,
			};
		}

		case HANDLE_LINK_FAVORITE: {
			const newLinks = {};
			for (const [key, value] of Object.entries(state.links || {})) {
				const linkLists = (value.lists || []).map((item, index) => {
					if (item.ID == payload.ID) {
						return {
							...item,
							favorite: {
								...item.favorite,
								favForAll: payload.favForAll,
							},
						};
					}
					return item;
				});
				newLinks[`${key}`] = {
					...value,
					lists: linkLists,
				};
			}
			return {
				...state,
				links: {
					...newLinks,
				},
			};
		}
		case DELETE_LINK:
			return {
				...state,
				links: {
					...state.links,
					[payload.data.term_id]: {
						...state.links[payload.data.term_id],
						lists: state.links[payload.data.term_id] ? state.links[payload.data.term_id].lists.filter((item, index) => item.ID != payload.data.ID) : [],
					},
				},
			};
		case DELETE_GUTENBERG_LINK:
			const allLinks = state.links;
			const itemIndexInLinks = allLinks.findIndex((item) => item.ID == payload.ID);
			const newLinks = [...allLinks.slice(0, itemIndexInLinks), ...allLinks.slice(itemIndexInLinks + 1)];

			return {
				...state,
				links: newLinks,
			};
		case UPDATE_LINKS_ANALYTICS: {
			// Update analytic data for links after bulk delete
			const { analytic } = payload;
			if (!state.links || !analytic) {
				return state;
			}

			const updatedLinks = {};
			for (const [catId, category] of Object.entries(state.links)) {
				const updatedLists = (category.lists || []).map((link) => {
					const linkId = link.ID;
					// Update the analytic property if it exists in the new analytic data
					if (analytic.hasOwnProperty(linkId)) {
						return {
							...link,
							analytic: analytic[linkId],
						};
					}
					// If link had analytic but it's now removed (deleted), set to null or empty
					if (link.analytic && !analytic.hasOwnProperty(linkId)) {
						return {
							...link,
							analytic: null,
						};
					}
					return link;
				});
				updatedLinks[catId] = {
					...category,
					lists: updatedLists,
				};
			}

			return {
				...state,
				links: updatedLinks,
			};
		}
		default:
			return state;
	}
}
export default links;
