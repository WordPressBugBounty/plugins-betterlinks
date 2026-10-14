import React, { useEffect, useState, useRef } from 'react';
import { useToast } from './ToastContext';

// Icons for different toast types
const ToastIcons = {
	success: () => (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
			<polyline points="22 4 12 14.01 9 11.01" />
		</svg>
	),
	error: () => (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<circle cx="12" cy="12" r="10" />
			<line x1="15" y1="9" x2="9" y2="15" />
			<line x1="9" y1="9" x2="15" y2="15" />
		</svg>
	),
	warning: () => (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
			<line x1="12" y1="9" x2="12" y2="13" />
			<line x1="12" y1="17" x2="12.01" y2="17" />
		</svg>
	),
	info: () => (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<circle cx="12" cy="12" r="10" />
			<line x1="12" y1="16" x2="12" y2="12" />
			<line x1="12" y1="8" x2="12.01" y2="8" />
		</svg>
	),
};

// Close Icon
const CloseIcon = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<line x1="18" y1="6" x2="6" y2="18" />
		<line x1="6" y1="6" x2="18" y2="18" />
	</svg>
);

const ToastItem = ({ toast }) => {
	const { dismissToast, pauseToast, resumeToast } = useToast();
	const [progress, setProgress] = useState(100);
	const progressRef = useRef(null);
	const startTimeRef = useRef(Date.now());
	const pausedTimeRef = useRef(0);

	const {
		id,
		message,
		type,
		title,
		icon,
		closable,
		duration,
		position,
		isPaused,
		isExiting,
	} = toast;

	// Handle progress bar animation
	useEffect(() => {
		if (duration <= 0) return;

		const animate = () => {
			if (isPaused) {
				pausedTimeRef.current = Date.now();
				return;
			}

			const elapsed = Date.now() - startTimeRef.current;
			const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
			setProgress(remaining);

			if (remaining > 0) {
				progressRef.current = requestAnimationFrame(animate);
			}
		};

		// If resuming from pause, adjust start time
		if (!isPaused && pausedTimeRef.current > 0) {
			const pauseDuration = Date.now() - pausedTimeRef.current;
			startTimeRef.current += pauseDuration;
			pausedTimeRef.current = 0;
		}

		progressRef.current = requestAnimationFrame(animate);

		return () => {
			if (progressRef.current) {
				cancelAnimationFrame(progressRef.current);
			}
		};
	}, [duration, isPaused]);

	// Determine slide direction based on position
	const getSlideClass = () => {
		if (position.includes('left')) return 'btl-toast-slide-left';
		if (position.includes('right')) return 'btl-toast-slide-right';
		if (position.includes('top')) return 'btl-toast-slide-top';
		if (position.includes('bottom')) return 'btl-toast-slide-bottom';
		return 'btl-toast-slide-right';
	};

	const handleMouseEnter = () => {
		if (duration > 0) {
			pauseToast(id);
		}
	};

	const handleMouseLeave = () => {
		if (duration > 0) {
			resumeToast(id);
		}
	};

	const handleClose = (e) => {
		e.stopPropagation();
		dismissToast(id);
	};

	const IconComponent = icon || ToastIcons[type] || ToastIcons.info;

	const toastClasses = [
		'btl-toast-item',
		`btl-toast-${type}`,
		getSlideClass(),
		isExiting ? 'btl-toast-exit' : 'btl-toast-enter',
	].filter(Boolean).join(' ');

	return (
		<div
			className={toastClasses}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			role="alert"
			aria-live="polite"
		>
			<div className="btl-toast-icon">
				<IconComponent />
			</div>

			<div className="btl-toast-content">
				{title && <div className="btl-toast-title">{title}</div>}
				<div className="btl-toast-message">{message}</div>
			</div>

			{closable && (
				<button
					className="btl-toast-close"
					onClick={handleClose}
					aria-label="Close notification"
					type="button"
				>
					<CloseIcon />
				</button>
			)}

			{duration > 0 && (
				<div className="btl-toast-progress-bar">
					<div
						className="btl-toast-progress"
						style={{ width: `${progress}%` }}
					/>
				</div>
			)}
		</div>
	);
};

export default ToastItem;
