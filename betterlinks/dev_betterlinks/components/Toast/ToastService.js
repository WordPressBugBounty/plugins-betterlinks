// Toast Service - Global toast notification manager
// This allows showing toasts from anywhere including Redux actions and utility functions

let toastInstance = null;

// Initialize the toast service with the toast context
export const initToastService = (toastContext) => {
	toastInstance = toastContext;
};

// Get the toast instance
export const getToastInstance = () => toastInstance;

// Toast methods
export const showToast = (options) => {
	if (toastInstance) {
		return toastInstance.showToast(options);
	}
	console.warn('Toast service not initialized');
	return null;
};

export const toastSuccess = (message, options = {}) => {
	if (toastInstance) {
		return toastInstance.success(message, options);
	}
	console.warn('Toast service not initialized');
	return null;
};

export const toastError = (message, options = {}) => {
	if (toastInstance) {
		return toastInstance.error(message, options);
	}
	console.warn('Toast service not initialized');
	return null;
};

export const toastWarning = (message, options = {}) => {
	if (toastInstance) {
		return toastInstance.warning(message, options);
	}
	console.warn('Toast service not initialized');
	return null;
};

export const toastInfo = (message, options = {}) => {
	if (toastInstance) {
		return toastInstance.info(message, options);
	}
	console.warn('Toast service not initialized');
	return null;
};

export const dismissToast = (id) => {
	if (toastInstance) {
		return toastInstance.dismissToast(id);
	}
	return null;
};

export const dismissAllToasts = () => {
	if (toastInstance) {
		return toastInstance.dismissAll();
	}
	return null;
};

export default {
	init: initToastService,
	show: showToast,
	success: toastSuccess,
	error: toastError,
	warning: toastWarning,
	info: toastInfo,
	dismiss: dismissToast,
	dismissAll: dismissAllToasts,
};
