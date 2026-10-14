(function ($) {
	/**
	 * Longest time (ms) the beacon waits for `betterlinks:beforeBeacon` listeners.
	 * Tracking must never be blocked by an extension.
	 */
	const BEFORE_BEACON_TIMEOUT = 1500;

	/**
	 * Lets extensions add fields to the click beacon before it is sent.
	 *
	 * Contract for `betterlinks:beforeBeacon` (dispatched on `document`, not
	 * cancelable):
	 *   event.detail.formData   FormData that will be POSTed to admin-ajax.php
	 *                           (action `betterlinks__js_analytics_tracking`).
	 *                           Append fields synchronously, or inside a promise
	 *                           passed to waitUntil().
	 *   event.detail.values     Plain object of the values being tracked
	 *                           (`linkId` or `target_url`). Read-only.
	 *   event.detail.waitUntil  function(promise). Asks the beacon to wait for the
	 *                           promise before sending. The wait is capped at
	 *                           BEFORE_BEACON_TIMEOUT and ends early if the page is
	 *                           being hidden or unloaded; rejections are ignored.
	 *                           Anything appended after the beacon is sent is lost.
	 *
	 * With no listener calling waitUntil(), the beacon is sent synchronously,
	 * exactly as before.
	 *
	 * @param {FormData} formData
	 * @param {Object} values
	 * @returns {Promise[]} Promises registered through waitUntil().
	 */
	const collectBeforeBeacon = (formData, values) => {
		const pending = [];
		try {
			document.dispatchEvent(
				new CustomEvent('betterlinks:beforeBeacon', {
					detail: {
						formData,
						values: { ...values },
						waitUntil: (promise) => {
							pending.push(Promise.resolve(promise).catch(() => null));
						},
					},
				})
			);
		} catch (error) {
			// CustomEvent unsupported or a listener threw: send what we have.
		}
		return pending;
	};

	/** Resolves when the pending work settles, the timeout passes or the page goes away. */
	const waitForPending = (pending) =>
		new Promise((resolve) => {
			let done = false;
			const finish = () => {
				if (done) return;
				done = true;
				window.removeEventListener('pagehide', finish);
				document.removeEventListener('visibilitychange', onVisibility);
				resolve();
			};
			const onVisibility = () => {
				if ('hidden' === document.visibilityState) finish();
			};
			window.addEventListener('pagehide', finish);
			document.addEventListener('visibilitychange', onVisibility);
			setTimeout(finish, BEFORE_BEACON_TIMEOUT);
			Promise.all(pending).then(finish, finish);
		});

	const betterlinksTrack = {
		init() {
			this.trackUnCloakedLinksWithLinkID();
			this.trackUnCloakedLinksWithoutLinkID();
		},
		trackUnCloakedLinksWithoutLinkID() {
			const self = this;
			$(document).on('click', 'body a.betterlinks-linked-text:not([data-link-id])', function (e) {
				if (!e.target?.href?.startsWith(betterLinksApp?.site_url)) {
					if (!'sendBeacon' in navigator) {
						e.preventDefault();
						self.redirectToTarget(e.target);
					}
					const values = {
						target_url: e.target.href,
					};
					self.initTracking(values);
				}
			});
		},
		trackUnCloakedLinksWithLinkID() {
			const self = this;
			$(document).on('click', 'body a.betterlinks-linked-text[data-link-id]', function (e) {
				if (!e.target?.href?.startsWith(betterLinksApp?.site_url)) {
					if (!'sendBeacon' in navigator) {
						e.preventDefault();
						self.redirectToTarget(e.target);
					}
					const linkId = e.target.dataset?.linkId;
					const values = {
						linkId,
					};
					self.initTracking(values);
				}
			});
		},
		redirectToTarget(target) {
			if ('' !== target.target) {
				window.open(target.href, target.target);
				return;
			}
			window.location.href = target.href;
		},
		async initTracking(values) {
			const form_data = new FormData();
			form_data.append('action', 'betterlinks__js_analytics_tracking');
			form_data.append('security', betterLinksApp.betterlinks_nonce);

			Object.entries(values).forEach(([key, value]) => {
				form_data.append(key, value);
			});

			form_data.append('location', location.pathname);

			const pending = collectBeforeBeacon(form_data, values);
			if (pending.length) {
				await waitForPending(pending);
			}

			if ('sendBeacon' in navigator) {
				navigator.sendBeacon(betterLinksApp.ajaxurl, form_data);
			} else {
				fetch(betterLinksApp.ajaxurl, {
					method: 'POST',
					body: form_data,
				});
			}
		},
	};

	betterlinksTrack.init();
})(jQuery);
