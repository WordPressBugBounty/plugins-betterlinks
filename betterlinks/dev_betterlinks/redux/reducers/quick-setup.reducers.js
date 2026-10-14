const initialState = {
	isCreated: false,
	createdLink: null,
	ta: {
		links: true,
		clicks: true,
	},
	pl: {
		links: true,
	},
	s3r: {
		links: true,
	},
	results: {
		ta: null,
		pl: null,
		s3r: null,
	},
};
// const initialState = {};

function quickSetup(state = initialState, { type, payload }) {
	switch (type) {
		case 'GET_OPTIONS': {
			return state;
		}
		case 'UPDATE_OPTIONS': {
			return {
				...state,
				...payload,
			};
		}
		case 'UPDATE_RESULTS': {
			return {
				...state,
				results: {
					...state.results,
					...payload,
				},
			};
		}
		default:
			return state;
	}
}

export default quickSetup;
