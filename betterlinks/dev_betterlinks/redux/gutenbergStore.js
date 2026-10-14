import { createStore, applyMiddleware } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import logger from 'redux-logger';
import thunk from 'redux-thunk';

import { gutenbergReducers } from 'redux/reducers/gutenbergreducers';

let middleware = [thunk];
if (process.env.NODE_ENV !== 'production') {
	middleware = [...middleware, logger];
}

export const betterlinksGutenStore = createStore(gutenbergReducers, {}, composeWithDevTools(applyMiddleware(...middleware)));
