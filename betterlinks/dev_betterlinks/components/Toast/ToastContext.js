import React, { createContext, useContext, useReducer, useCallback, useRef } from 'react';

// Toast Context
const ToastContext = createContext(null);

// Action Types
const ACTIONS = {
	ADD_TOAST: 'ADD_TOAST',
	REMOVE_TOAST: 'REMOVE_TOAST',
	UPDATE_TOAST: 'UPDATE_TOAST',
	PAUSE_TOAST: 'PAUSE_TOAST',
	RESUME_TOAST: 'RESUME_TOAST',
};

// Default configuration
const DEFAULT_CONFIG = {
	maxToasts: 5,
	defaultDuration: 4000,
	defaultPosition: 'top-right',
	defaultType: 'info',
};

// Toast Reducer
const toastReducer = (state, action) => {
	switch (action.type) {
		case ACTIONS.ADD_TOAST:
			const newToasts = [...state.toasts, action.payload];
			// Remove oldest toasts if exceeding limit
			if (newToasts.length > state.config.maxToasts) {
				return {
					...state,
					toasts: newToasts.slice(-state.config.maxToasts),
				};
			}
			return {
				...state,
				toasts: newToasts,
			};

		case ACTIONS.REMOVE_TOAST:
			return {
				...state,
				toasts: state.toasts.filter((toast) => toast.id !== action.payload),
			};

		case ACTIONS.UPDATE_TOAST:
			return {
				...state,
				toasts: state.toasts.map((toast) =>
					toast.id === action.payload.id
						? { ...toast, ...action.payload.updates }
						: toast
				),
			};

		case ACTIONS.PAUSE_TOAST:
			return {
				...state,
				toasts: state.toasts.map((toast) =>
					toast.id === action.payload
						? { ...toast, isPaused: true }
						: toast
				),
			};

		case ACTIONS.RESUME_TOAST:
			return {
				...state,
				toasts: state.toasts.map((toast) =>
					toast.id === action.payload
						? { ...toast, isPaused: false }
						: toast
				),
			};

		default:
			return state;
	}
};

// Generate unique ID
const generateId = () => {
	return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Toast Provider Component
export const ToastProvider = ({ children, config = {} }) => {
	const mergedConfig = { ...DEFAULT_CONFIG, ...config };
	
	const [state, dispatch] = useReducer(toastReducer, {
		toasts: [],
		config: mergedConfig,
	});

	const timersRef = useRef({});

	// Show Toast
	const showToast = useCallback((options) => {
		const {
			message,
			type = mergedConfig.defaultType,
			duration = mergedConfig.defaultDuration,
			position = mergedConfig.defaultPosition,
			title = '',
			icon = null,
			closable = true,
			onClose = null,
		} = typeof options === 'string' ? { message: options } : options;

		const id = generateId();

		const toast = {
			id,
			message,
			type,
			duration,
			position,
			title,
			icon,
			closable,
			onClose,
			isPaused: false,
			isExiting: false,
			createdAt: Date.now(),
		};

		dispatch({ type: ACTIONS.ADD_TOAST, payload: toast });

		// Set auto-dismiss timer
		if (duration > 0) {
			timersRef.current[id] = {
				timeoutId: setTimeout(() => {
					dismissToast(id);
				}, duration),
				remainingTime: duration,
				startTime: Date.now(),
			};
		}

		return id;
	}, [mergedConfig]);

	// Dismiss Toast with animation
	const dismissToast = useCallback((id) => {
		// Clear any existing timer
		if (timersRef.current[id]) {
			clearTimeout(timersRef.current[id].timeoutId);
			delete timersRef.current[id];
		}

		// Mark toast as exiting for animation
		dispatch({
			type: ACTIONS.UPDATE_TOAST,
			payload: { id, updates: { isExiting: true } },
		});

		// Remove after animation completes
		setTimeout(() => {
			dispatch({ type: ACTIONS.REMOVE_TOAST, payload: id });
			
			// Find toast and call onClose if exists
			const toast = state.toasts.find(t => t.id === id);
			if (toast && toast.onClose) {
				toast.onClose();
			}
		}, 300); // Match animation duration
	}, [state.toasts]);

	// Pause Toast (on hover)
	const pauseToast = useCallback((id) => {
		const timer = timersRef.current[id];
		if (timer) {
			clearTimeout(timer.timeoutId);
			timer.remainingTime = timer.remainingTime - (Date.now() - timer.startTime);
		}
		dispatch({ type: ACTIONS.PAUSE_TOAST, payload: id });
	}, []);

	// Resume Toast (on mouse leave)
	const resumeToast = useCallback((id) => {
		const timer = timersRef.current[id];
		if (timer && timer.remainingTime > 0) {
			timer.startTime = Date.now();
			timer.timeoutId = setTimeout(() => {
				dismissToast(id);
			}, timer.remainingTime);
		}
		dispatch({ type: ACTIONS.RESUME_TOAST, payload: id });
	}, [dismissToast]);

	// Dismiss all toasts
	const dismissAll = useCallback(() => {
		state.toasts.forEach((toast) => {
			dismissToast(toast.id);
		});
	}, [state.toasts, dismissToast]);

	// Shorthand methods
	const success = useCallback((message, options = {}) => {
		return showToast({ ...options, message, type: 'success' });
	}, [showToast]);

	const error = useCallback((message, options = {}) => {
		return showToast({ ...options, message, type: 'error' });
	}, [showToast]);

	const warning = useCallback((message, options = {}) => {
		return showToast({ ...options, message, type: 'warning' });
	}, [showToast]);

	const info = useCallback((message, options = {}) => {
		return showToast({ ...options, message, type: 'info' });
	}, [showToast]);

	const value = {
		toasts: state.toasts,
		config: state.config,
		showToast,
		dismissToast,
		pauseToast,
		resumeToast,
		dismissAll,
		success,
		error,
		warning,
		info,
	};

	return (
		<ToastContext.Provider value={value}>
			{children}
		</ToastContext.Provider>
	);
};

// Custom Hook
export const useToast = () => {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error('useToast must be used within a ToastProvider');
	}
	return context;
};

export default ToastContext;
