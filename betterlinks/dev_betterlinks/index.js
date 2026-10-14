import React, { createContext } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import App from 'App';
import store from 'redux/store';
import { createHooks } from '@wordpress/hooks';
import { ToastProvider, ToastContainer, toastSuccess, toastError, toastWarning, toastInfo } from 'components/Toast';
import ToastInitializer from 'components/Toast/ToastInitializer';
window.betterLinksHooks = createHooks();

// Expose toast functions globally for Pro plugin access
window.betterLinksToast = {
	toastSuccess,
	toastError,
	toastWarning,
	toastInfo
};

export const SetupContext = createContext('quick-setup');

document.addEventListener('DOMContentLoaded', function () {
	const betterlinksbody = document.getElementById('betterlinksbody');
	const root = createRoot(betterlinksbody);

	root.render(
		<Provider store={store}>
			<ToastProvider config={{ maxToasts: 5 }}>
				<ToastInitializer />
				<Router>
					<App />
				</Router>
				<ToastContainer />
			</ToastProvider>
		</Provider>
	);
});
