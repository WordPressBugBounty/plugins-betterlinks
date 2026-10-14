import React, { useMemo } from 'react';
import { useToast } from './ToastContext';
import ToastItem from './ToastItem';

// Available positions
const POSITIONS = [
	'top-right',
	'top-left',
	'top-center',
	'bottom-right',
	'bottom-left',
	'bottom-center',
];

const ToastContainer = () => {
	const { toasts } = useToast();

	// Group toasts by position
	const groupedToasts = useMemo(() => {
		const groups = {};
		
		POSITIONS.forEach((position) => {
			groups[position] = [];
		});

		toasts.forEach((toast) => {
			const position = toast.position || 'top-right';
			if (groups[position]) {
				groups[position].push(toast);
			}
		});

		return groups;
	}, [toasts]);

	return (
		<div className="btl-toast-wrapper">
			{POSITIONS.map((position) => {
				const positionToasts = groupedToasts[position];
				
				if (positionToasts.length === 0) return null;

				return (
					<div
						key={position}
						className={`btl-toast-container btl-toast-${position}`}
						aria-label={`Notifications ${position}`}
					>
						{positionToasts.map((toast) => (
							<ToastItem key={toast.id} toast={toast} />
						))}
					</div>
				);
			})}
		</div>
	);
};

export default ToastContainer;
