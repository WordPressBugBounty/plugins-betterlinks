import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { __ } from '@wordpress/i18n';
import ClipLoader from 'react-spinners/ClipLoader';
import axios from 'axios';
import { admin_url, copyToClipboard, delayStatusChanged, formatFormData, OWNED_SELECTOR, plugin_root_url, PORTAL_CLASS, TASKS, betterlinks_nonce, site_url } from './utils/helper';
import QRScanner from './components/QRScanner';

/**
 * Normalize an admin-ajax reply into a shape that is always safe to read.
 *
 * axios rejects on any non-2xx — the PHP handlers answer 403 on a permission
 * failure — and a PHP notice or fatal can return a body that is not JSON at
 * all. Both cases left `response.data` undefined, and the callers used to
 * destructure `response.data?.data` directly, so the whole handler threw before
 * it could clear its loading flag. That is what made the Share Task button go
 * permanently dead after a single failed request.
 */
const unwrapResponse = (response) => {
	const body = response?.data;

	if (!body || typeof body !== 'object') {
		return {
			ok: false,
			data: {},
			message: __('Could not reach BetterLinks. Please try again.', 'betterlinks'),
		};
	}

	const data = body.data && typeof body.data === 'object' ? body.data : {};

	return { ok: !!body.success, data, message: data.message || '' };
};

/**
 * Derive the FluentBoards task from the current hash route
 * (`.../boards/:id/tasks/:taskId-:slug`).
 */
const readTaskFromUrl = () => {
	const urlParts = window.location.href.split(TASKS);

	const boardUrl = urlParts?.[0] || '';
	const taskName = urlParts?.[1] || '';
	const taskId = taskName.split('-')?.[0] || '';

	return { boardUrl, taskName, taskId };
};

/**
 * Append the task slug to the route when it is missing.
 *
 * FluentBoards 1.x routed tasks as `tasks/:id`, so the integration appended the
 * slug to reach the canonical url. 2.0 routes them as `tasks/:id-:slug`, where
 * appending unconditionally turned `tasks/5-fix-login` into
 * `tasks/5-fix-login-fix-login` on every re-open of a task that already had a
 * short link.
 */
const ensureTaskSlugInUrl = (slug) => {
	if (!slug) return;

	const { taskName, taskId } = readTaskFromUrl();

	// Nothing to complete (the task closed mid-request), or the slug is already
	// part of the route.
	if (!taskName || taskName !== taskId) return;

	location.href += `-${slug}`;
};

/**
 * Track the task the user is currently looking at.
 *
 * The button is mounted inside FluentBoards' task sidebar, and that sidebar is
 * reused as-is when the modal's next/previous arrows move between tasks — the
 * component is not remounted, so reading the url once at mount time left the
 * popover advertising the previous task's short link.
 */
const useCurrentTaskId = () => {
	const [taskId, setTaskId] = useState(() => readTaskFromUrl().taskId);

	useEffect(() => {
		const read = () => {
			const next = readTaskFromUrl().taskId;
			setTaskId((prev) => (prev === next ? prev : next));
		};

		window.addEventListener('hashchange', read);
		window.addEventListener('popstate', read);

		// vue-router navigates with `history.pushState`, which fires neither of
		// the events above, so keep a cheap backstop poll.
		const interval = setInterval(read, 400);

		return () => {
			window.removeEventListener('hashchange', read);
			window.removeEventListener('popstate', read);
			clearInterval(interval);
		};
	}, []);

	return taskId;
};

const POPOVER_WIDTH = 350;
const VIEWPORT_MARGIN = 12;
const ANCHOR_GAP = 8;

/**
 * Host the popover on `document.body`.
 *
 * The button is mounted inside FluentBoards' task sidebar, which sets
 * `max-height` + `overflow-y: auto`. That clips any absolutely positioned
 * child, so the popover only became reachable by scrolling the sidebar down
 * and across. `position: fixed` alone does not escape it either: the enclosing
 * `.fbs-task-details-wrap` declares `container-type: inline-size`, which
 * implies `contain: layout` and therefore acts as the containing block for
 * fixed descendants. Rendering outside both is the only reliable way out.
 */
const usePortalContainer = () => {
	const [container] = useState(() => {
		const el = document.createElement('div');
		el.className = PORTAL_CLASS;
		return el;
	});

	useLayoutEffect(() => {
		document.body.appendChild(container);
		return () => container.remove();
	}, [container]);

	return container;
};

/**
 * Pin the popover under the button, kept inside the viewport and above the
 * task modal.
 */
const useAnchoredPosition = (anchorRef, popoverRef) => {
	const [style, setStyle] = useState({ visibility: 'hidden' });

	useLayoutEffect(() => {
		const reposition = () => {
			const anchor = anchorRef?.current;
			if (!anchor) return;

			const rect = anchor.getBoundingClientRect();
			const height = popoverRef?.current?.offsetHeight || 0;

			// Centre on the button, then pull back inside the viewport.
			const maxLeft = Math.max(VIEWPORT_MARGIN, window.innerWidth - POPOVER_WIDTH - VIEWPORT_MARGIN);
			const left = Math.min(Math.max(rect.left + rect.width / 2 - POPOVER_WIDTH / 2, VIEWPORT_MARGIN), maxLeft);

			// Prefer below the button; flip above when there is not enough room
			// there but there is above (the sidebar sits low on short screens).
			const roomBelow = window.innerHeight - rect.bottom - ANCHOR_GAP - VIEWPORT_MARGIN;
			const roomAbove = rect.top - ANCHOR_GAP - VIEWPORT_MARGIN;
			const placeAbove = height > 0 && height > roomBelow && roomAbove > roomBelow;

			const top = placeAbove ? Math.max(VIEWPORT_MARGIN, rect.top - height - ANCHOR_GAP) : rect.bottom + ANCHOR_GAP;

			// Clamping `left` moves the box away from the button, so nudge the
			// notch back over the button instead of leaving it stranded.
			const arrowLeft = Math.min(Math.max(rect.left + rect.width / 2 - left, 16), POPOVER_WIDTH - 16);

			setStyle({
				top: `${Math.round(top)}px`,
				left: `${Math.round(left)}px`,
				maxHeight: `${Math.round(Math.max(placeAbove ? roomAbove : roomBelow, 200))}px`,
				visibility: 'visible',
				// No `zIndex` here on purpose — the stylesheet owns it. This
				// used to be computed as "one above the highest layer on body
				// right now", which is only true for the instant it is read:
				// Element Plus hands out z-indexes from a counter that every
				// dialog, dropdown and hover tooltip advances, so any layer
				// shown afterwards outranks a number we captured at open time
				// and nothing recomputes ours. The popover then sits *under*
				// the task modal — present, visible, but taking none of the
				// clicks aimed at it. Sitting permanently above the whole
				// Element Plus range is both simpler and safe now that a click
				// anywhere outside dismisses the popover, so it can no longer
				// strand itself on top of anything.
				'--btl-arrow-left': `${Math.round(arrowLeft)}px`,
			});
		};

		reposition();

		// Capture phase so the task sidebar's own scrolling counts, not just
		// the window's.
		window.addEventListener('scroll', reposition, true);
		window.addEventListener('resize', reposition);

		return () => {
			window.removeEventListener('scroll', reposition, true);
			window.removeEventListener('resize', reposition);
		};
	}, [anchorRef, popoverRef]);

	return style;
};

/**
 * Close the popover when the pointer goes down anywhere else.
 *
 * "Elsewhere" is decided by walking up from the pressed node and asking whether
 * it lands in anything BetterLinks owns — the portal the popover renders into,
 * or the sidebar card holding the button — rather than by comparing against the
 * popover element this particular render captured in a ref.
 *
 * This replaced a check that compared the pressed node against the popover
 * element captured in a ref, which reported clicks landing *inside* the visible
 * popover as outside on every open after the first — dismissing it, and taking
 * the copy button's click with it. Hit-testing ruled out anything covering the
 * popover, so the ref was resolving to some element other than the popover on
 * screen; which one was never pinned down, and neither a plain re-open cycle
 * nor a root torn down and re-created mid-open reproduces it outside the real
 * page. Ref identity is the fragile part regardless: this component is mounted
 * by index.js into a subtree Vue owns and rebuilt whenever FluentBoards
 * rebuilds it, so how many copies are live and which one a given listener
 * belongs to is not something this file controls. Asking "does this node
 * belong to us?" holds no matter which instance is asking.
 *
 * The button is deliberately treated as inside: its own handler toggles the
 * popover on `click`, so dismissing here on the preceding `mousedown` would
 * leave that click to reopen what it just closed, and the button that opens
 * the popover could never close it again.
 *
 * `mousedown` rather than `click` because a `click` is reported against the
 * common ancestor of press and release, so dragging out of the popover — which
 * the short-url input invites, and the site-url pill is explicitly scrollable
 * for — would register as a click outside and dismiss mid-selection. Capture
 * phase so the check runs while the pressed node is still in the tree, before
 * any FluentBoards handler can detach it.
 */
const useDismissOnOutsideClick = (close) => {
	useEffect(() => {
		const onPointerDown = (event) => {
			const { target } = event;

			// Guard the `closest` call: a press can be reported against a
			// non-element node, and there is nothing to walk up from there.
			if (!(target instanceof Element) || target.closest(OWNED_SELECTOR)) {
				return;
			}

			close();
		};

		document.addEventListener('mousedown', onPointerDown, true);

		return () => document.removeEventListener('mousedown', onPointerDown, true);
	}, [close]);
};

const App = () => {
	const [task, setTask] = useState(() => readTaskFromUrl());
	const [openModal, setOpenModal] = useState(false);
	const [loading, setLoading] = useState(true);
	const buttonRef = useRef(null);
	const [updateText, setUpdateText] = useState(__('Update', 'betterlinks'));
	// The task a request was fired for, so a reply that lands after the user has
	// moved on is dropped instead of overwriting the new task's state.
	const activeTaskRef = useRef(null);
	const messageTimerRef = useRef(null);

	const taskId = useCurrentTaskId();

	useEffect(() => {
		activeTaskRef.current = taskId;

		const { boardUrl, taskName } = readTaskFromUrl();

		// Everything held for the previous task — its id, its short url, an open
		// popover — is wrong the moment the route points somewhere else.
		setOpenModal(false);
		setUpdateText(__('Update', 'betterlinks'));
		setTask({ boardUrl, taskName, taskId });
		clearTimeout(messageTimerRef.current);

		if (!taskId) {
			// No task id in the route means there is nothing to look up, but the
			// button still has to become clickable — `loading` starts true and
			// nothing else would ever clear it.
			setLoading(false);
			return;
		}

		setLoading(true);

		// FluentBoards renders the sidebar before its own task request resolves;
		// a short delay keeps the lookup from racing that bootstrap, and
		// coalesces the rapid route changes the next/previous arrows produce.
		const timer = setTimeout(() => {
			checkFbsLink({ boardUrl, taskName, taskId });
		}, 300);

		return () => clearTimeout(timer);
	}, [taskId]);

	useEffect(() => () => clearTimeout(messageTimerRef.current), []);

	const checkFbsLink = async (task) => {
		const { taskId, taskName, boardUrl } = task;
		setLoading(true);
		let form_data = new FormData();
		form_data.append('security', betterlinks_nonce);
		form_data = formatFormData(form_data, {
			action: 'betterlinks__check_fbs_link',
			taskId,
			boardUrl,
		});
		try {
			const response = await axios
				.post(ajaxurl, form_data)
				.then((res) => res)
				.catch((err) => err);

			// The user closed this task, or paged to the next one, while the
			// request was in flight — its answer is no longer about the task on
			// screen.
			if (activeTaskRef.current !== taskId) return;

			const { data: body, message } = unwrapResponse(response);
			const { result: data, is_exists } = body;

			if (is_exists) {
				ensureTaskSlugInUrl(data?.task_slug);
				setTask((prev) => ({
					...prev,
					...data,
					old_short_url: data?.short_url,
				}));
				return;
			}

			// Always record the task coordinates, even when the lookup came back
			// empty. They previously stayed blank on that path, so a later
			// "Share Task" click POSTed an empty taskId and the server rejected
			// it with a bare `result: false` and no explanation.
			setTask((prev) => ({
				...prev,
				...(data || {}),
				old_short_url: data?.short_url,
				taskId,
				taskName,
				boardUrl,
				updateMessage: data ? prev?.updateMessage : message,
			}));
		} finally {
			if (activeTaskRef.current === taskId) {
				setLoading(false);
			}
		}
	};

	const __handleClickShareButton = () => {
		if (loading) return;

		if (hasErrors(task)) {
			return;
		}

		if (task?.short_url) {
			setOpenModal(!openModal);
			setTask((prev) => ({
				...prev,
				status: null,
				updateMessage: null,
			}));
			return;
		}
		__createBetterLinks();
	};

	const __updateBetterLinks = async (task) => {
		let form_data = new FormData();
		form_data.append('security', betterlinks_nonce);
		form_data = formatFormData(form_data, {
			action: 'betterlinks__update_fbs_link',
			...task,
		});
		setUpdateText(__('Updating...', 'betterlinks'));

		try {
			const response = await axios
				.post(ajaxurl, form_data)
				.then((res) => res)
				.catch((err) => err);

			const { data: body, message } = unwrapResponse(response);
			const { result } = body;

			setTask((prev) => ({
				...prev,
				short_url: result?.short_url || prev?.short_url,
				old_short_url: result?.short_url || prev?.old_short_url,
				updateMessage: !result && (message || __('Could not update the short link.', 'betterlinks')),
				status: !!result,
			}));

			if (result) delayStatusChanged(null, __('Updated!', 'betterlinks'), __('Update', 'betterlinks'), setUpdateText);
			else setUpdateText(__('Update', 'betterlinks'));
		} finally {
			resetMessage();
		}
	};

	const __createBetterLinks = async () => {
		// `task` is only populated once check_fbs_link answers. If that never
		// resolved, fall back to the URL so we never POST an empty taskId.
		const payload = task?.taskId ? task : { ...task, ...readTaskFromUrl() };
		const requestedTaskId = payload?.taskId;

		let form_data = new FormData();
		form_data.append('security', betterlinks_nonce);

		form_data = formatFormData(form_data, {
			action: 'betterlinks__create_fbs_link',
			...payload,
		});
		setLoading(true);

		try {
			const response = await axios
				.post(ajaxurl, form_data)
				.then((res) => res)
				.catch((err) => err);

			// Same-task check as the lookup: never write a reply for a task the
			// user has already navigated away from.
			if (activeTaskRef.current !== requestedTaskId) return;

			const { data: body, message } = unwrapResponse(response);
			const { result, status } = body;

			setOpenModal(true);

			if (status) {
				setTask((prev) => ({
					...prev,
					...payload,
					short_url: result?.short_url,
					old_short_url: result?.short_url,
					id: result?.ID,
					status,
					updateMessage: __('Short Link created successfully.', 'betterlinks'),
				}));
				resetMessage();
				return;
			}

			setTask((prev) => ({
				...prev,
				...payload,
				short_url: result?.short_url || task?.old_short_url,
				status: false,
				// Report what the server actually said. This branch used to
				// claim "Link already exists" for every failure, which hid
				// permission errors and empty-taskId rejections alike.
				updateMessage: message || __('Could not create the short link. Please try again.', 'betterlinks'),
			}));
		} finally {
			if (activeTaskRef.current === requestedTaskId) {
				setLoading(false);
			}
		}
	};

	const resetMessage = () => {
		// Held in a ref so switching tasks can cancel it — and so the
		// `clearTimeout` that used to sit here, firing immediately and killing
		// the timer it had just created, no longer leaves the message on screen
		// forever.
		clearTimeout(messageTimerRef.current);
		messageTimerRef.current = setTimeout(() => {
			setTask((prev) => ({
				...prev,
				updateMessage: null,
			}));
		}, 5000);
	};

	const hasErrors = (task) => {
		if (!task?.short_url && task?.old_short_url) {
			setTask((prev) => ({
				...prev,
				short_url: task?.old_short_url,
				status: false,
				updateMessage: __("Field can't be empty", 'betterlinks'),
			}));
			return true;
		}
		return false;
	};

	return (
		<>
			{/* Mirrors FluentBoards' own sidebar "Add Label" control: an
			    Element Plus button in its `mini` size, with the content
			    wrapped in the `<span>` Element Plus renders and the same
			    `.icon` / `.label` parts. Reusing their classes rather than
			    restating the metrics here means the two buttons stay the
			    same height, radius and type scale — the plain `.el-button`
			    this used to be picked up the 36px default and towered over
			    the rest of the card column. */}
			<button ref={buttonRef} type="button" className="el-button mini cursor_pointer btl-fbs-share-btn" aria-busy={loading} onClick={__handleClickShareButton}>
				<span>
					{/* The spinner replaces the logo rather than sitting on top
					    of the label, so the button keeps its size while
					    loading. */}
					<span className="icon">
						{loading ? (
							<ClipLoader className="btl-fbs-loader" color="#242f3e" size={12} />
						) : (
							<img width="14" src={plugin_root_url + 'assets/images/logo-black-white.svg'} alt={__('BetterLinks Logo', 'betterlinks')} />
						)}
					</span>
					<span className="label">{__('Share Task', 'betterlinks')}</span>
				</span>
			</button>
			{openModal && (
				<PopUp
					anchorRef={buttonRef}
					task={task}
					setTask={setTask}
					__updateBetterLinks={__updateBetterLinks}
					__createBetterLinks={__createBetterLinks}
					closeModal={() => setOpenModal(false)}
					updateText={updateText}
				/>
			)}
		</>
	);
};

export default App;

const PopUp = ({ anchorRef, task, setTask, __updateBetterLinks, __createBetterLinks, closeModal, updateText }) => {
	const [editShortUrl, setEditShortUrlStatus] = useState(false);
	const [copy, setCopy] = useState(false);
	const popoverRef = useRef(null);
	// Declared before the positioning hook so its layout effect attaches the
	// container first — otherwise the popover is still detached when we measure
	// its height and the flip-above check reads 0.
	const container = usePortalContainer();
	const position = useAnchoredPosition(anchorRef, popoverRef);

	useDismissOnOutsideClick(closeModal);

	const __handleUpdate = () => {
		setEditShortUrlStatus(false);
		if (task?.id) {
			if (task?.short_url === task?.old_short_url) return;
			__updateBetterLinks({
				id: task?.id,
				short_url: task?.short_url,
				old_short_url: task?.old_short_url,
			});
			return;
		}
		__createBetterLinks();
	};

	const __copyShortUrl = () => {
		const short_link = `${site_url}/${task?.short_url}`;
		if (copyToClipboard(short_link)) {
			setCopy(true);

			let timer = setTimeout(() => {
				setCopy(false);
				clearTimeout(timer);
			}, 3000);
		}
	};

	const __handleTaskUrlChange = (e) => {
		!editShortUrl && setEditShortUrlStatus(true);
		setTask((prev) => ({
			...prev,
			short_url: e.target.value,
		}));
	};

	return createPortal(
		<div
			ref={popoverRef}
			style={position}
			className="el-popper is-light el-popover fbs-task-add-popover-box"
			tabIndex={-1}
			aria-hidden="false"
			role="tooltip"
			data-popper-placement="bottom"
		>
			<div className="btl-fbs-top-bar">
				<span className="btl-title">{__('Share and more...', 'betterlinks')}</span>
				<span className="dashicons dashicons-no-alt close-button el-button" onClick={closeModal} />
			</div>
			<div className="btl-fbs-link-data">
				<div className="btl-form-group">
					<label htmlFor="short_url">{__('Link for this task', 'betterlinks')}</label>
					<div>
						<p className="btl-fbs-link-text">
							<div>
								<span className="btl-site-url">{site_url}/</span>
								<input id="short_url" type="text" value={`${task?.short_url}`} onChange={__handleTaskUrlChange} />
							</div>
							<div className="btl-fbs-icon">
								{copy ? (
									<span className="dashicons dashicons-yes" />
								) : (
									<img width={20} className="btl-copy-icon" onClick={__copyShortUrl} src={plugin_root_url + 'assets/images/copy-icon-1.svg'} />
								)}
							</div>
						</p>
					</div>
					{task?.updateMessage && <span className={`btl-fbs-message ${!!task?.status ? 'success' : 'error'}`}>{task.updateMessage}</span>}
				</div>
				{'' !== task?.short_url && (
					<>
						{task?.old_short_url && <QRScanner short_url={task.old_short_url} />}
						<div className="btl-form-group fbs_task_mover_actions">
							<a href={`${admin_url}?page=betterlinks`} target="_blank" title={__('Manage All Your Links with BetterLinks', 'betterlinks')}>
								{__('Manage All Your Links with BetterLinks', 'betterlinks')}
							</a>
							<button onClick={__handleUpdate} {...(task?.short_url === task?.old_short_url && { className: 'btl-btn-disable' })}>
								{task?.id ? updateText : __('Create', 'betterlinks')}
							</button>
						</div>
					</>
				)}
			</div>
			<span className="el-popper__arrow" data-popper-arrow />
		</div>,
		container
	);
};
