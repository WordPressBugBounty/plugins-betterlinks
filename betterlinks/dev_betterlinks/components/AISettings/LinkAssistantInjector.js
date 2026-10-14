import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { pro_version_check } from 'utils/helper';
import LinkAssistantTeaser from './LinkAssistantTeaser';

// EXISTING Pro users on a build older than v2.8.0 already have the whole AI settings
// form (incl. the "Save Settings" button) rendered by their installed — and outdated —
// Pro bundle. That old bundle has no filter slot for us to fill, so the free plugin
// can't inject through React. Instead we locate the Pro-rendered save button by its
// class (`.btl-ai-settings__button`) and portal the teaser in just before it.
//
// Pro >= 2.8.0 ships the real assistant UI, so we render nothing there.
const MARKER_CLASS = 'btl-ai-link-assistant-inject';

const LinkAssistantInjector = () => {
	const [mountNode, setMountNode] = useState(null);

	useEffect(() => {
		// Native assistant UI exists on Pro 2.8.0+ — don't double up.
		if (pro_version_check('2.8.0')) return;

		let injected = null;
		let cancelled = false;

		const inject = () => {
			if (cancelled) return true;
			const saveBtn = document.querySelector('.btl-ai-settings .btl-ai-settings__button');
			if (!saveBtn || !saveBtn.parentNode) return false;

			// Already injected (e.g. tab re-render) — reuse, don't duplicate.
			const prev = saveBtn.previousElementSibling;
			if (prev && prev.classList && prev.classList.contains(MARKER_CLASS)) {
				injected = prev;
				setMountNode(prev);
				return true;
			}

			injected = document.createElement('div');
			injected.className = MARKER_CLASS;
			saveBtn.parentNode.insertBefore(injected, saveBtn);
			setMountNode(injected);
			return true;
		};

		// The Pro form may mount a tick after us; observe until the button appears.
		let observer = null;
		if (!inject()) {
			observer = new MutationObserver(() => {
				if (inject() && observer) {
					observer.disconnect();
					observer = null;
				}
			});
			observer.observe(document.body, { childList: true, subtree: true });
		}

		return () => {
			cancelled = true;
			if (observer) observer.disconnect();
			if (injected && injected.parentNode) injected.parentNode.removeChild(injected);
		};
	}, []);

	if (!mountNode) return null;
	return createPortal(<LinkAssistantTeaser />, mountNode);
};

export default LinkAssistantInjector;
