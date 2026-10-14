import { __ } from '@wordpress/i18n';
import { useEffect, useRef } from 'react';
import { pro_version_check } from 'utils/helper';
import { toastWarning } from 'components/Toast';

const CompatibilityNotice = ({ mode = '#f2f2f2', noticeType = 'warning', compatibleProVersion, notice }) => {
	const isProUpdated = pro_version_check(compatibleProVersion);
	const hasShownToast = useRef(false);
	
	useEffect(() => {
		// Show toast warning only once when Pro version is outdated
		if (!isProUpdated && !hasShownToast.current) {
			hasShownToast.current = true;
			toastWarning(notice, {
				title: __('Update Required', 'betterlinks'),
				duration: 6000,
			});
		}
	}, [isProUpdated, notice]);
	
	// Don't render anything - just show toast
	return null;
};

export default CompatibilityNotice;
