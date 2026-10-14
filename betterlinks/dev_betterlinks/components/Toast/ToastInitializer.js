import { useEffect } from 'react';
import { useToast } from './ToastContext';
import { initToastService } from './ToastService';

// Component that initializes the toast service with the context
const ToastInitializer = () => {
	const toastContext = useToast();

	useEffect(() => {
		initToastService(toastContext);
	}, [toastContext]);

	return null;
};

export default ToastInitializer;
