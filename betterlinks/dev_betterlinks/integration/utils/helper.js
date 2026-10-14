export const { site_url, admin_url, fbs_settings, plugin_root_url, TASKS, betterlinks_nonce } = window.betterLinksFlbIntegration;

// The id of the sidebar card the button is mounted into, and the class of the
// body-level host the popover is portaled to. Shared because three places have
// to agree on them: index.js builds the wrapper, the popover renders into the
// portal, and the outside-click test asks whether a click landed in either.
export const WRAPPER_ID = 'btl-intflboards-btn-wrapper';
export const PORTAL_CLASS = 'btl-fbs-portal';

// Anything matching this belongs to BetterLinks, so a click on it is "inside".
export const OWNED_SELECTOR = `#${WRAPPER_ID}, .${PORTAL_CLASS}`;

export const formatFormData = (form_data, payload) => {
	Object.entries(payload).forEach(([key, value]) => {
		if (typeof value === 'object' && value !== null) {
			form_data.append(key, JSON.stringify(value));
		} else {
			form_data.append(key, value);
		}
	});

	return form_data;
};

export const copyToClipboard = (copyText) => {
	var tempInput = document.createElement('input');
	tempInput.value = copyText;
	document.body.appendChild(tempInput);
	tempInput.select();
	document.execCommand('copy');
	document.body.removeChild(tempInput);
	return true;
};

export const makeShortUrl = (shortUrl) => {
	return shortUrl[0] === '/' ? site_url + shortUrl : site_url + '/' + shortUrl;
};

export const delayStatusChanged = (firstStatus, secondStatus, thirdStatus, setState) => {
	if (firstStatus) {
		setState(firstStatus);
	}
	setTimeout(() => {
		if (secondStatus) {
			setState(secondStatus);
		}
		if (thirdStatus) {
			setTimeout(() => {
				setState(thirdStatus);
			}, 3000);
		}
	}, 1000);
	return true;
};
