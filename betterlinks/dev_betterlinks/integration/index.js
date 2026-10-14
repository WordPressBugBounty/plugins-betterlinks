import { createRoot } from 'react-dom/client';
import App from './fluent-boards';
import { fbs_settings, WRAPPER_ID } from './utils/helper';

// FluentBoards 2.0 replaced the flat "action buttons" row with a column of
// `.fbs-task-sidebar-card` sections. There is no hook to register into — the
// task modal is a pre-compiled Vue render function with no slot, no v-html
// region and no component registry — so the button has to be placed by hand.
const LEGACY_ROW = '.fbs-task-sidebar-action-btns'; // FluentBoards <= 1.95
const SIDEBAR = '.fbs-task-sidebar'; // 2.0
const LABELS_CARD = '.fbs-task-labels-card';
const PROPERTIES_CARD = '.fbs-task-properties-card';

// Marks the card as sitting under Labels, which reserves space below itself
// that would otherwise stack on top of the column gap.
const AFTER_LABELS_CLASS = 'btl-fbs-card--after-labels';

// The 2.0 task details live in an `el-dialog` teleported to `document.body`.
// Scoping the sidebar lookup to it means a sidebar that belongs to a dialog
// which is closing — or to anything else that happens to reuse the class —
// can never capture the button.
const TASK_MODAL = '.fbs_view_task_modal, .fbs_view_task_modal_class, .fbs-task-details-wrap';

/**
 * Rendered, i.e. not sitting inside a hidden dialog.
 *
 * Client rects alone are not the test. Below 900px of modal width FluentBoards
 * switches the task sidebar to `display: contents`, which generates no box of
 * its own — `getClientRects()` returns nothing even though the sidebar and all
 * its cards are on screen. Treating that as hidden meant the button never
 * mounted at all on narrower windows. What actually needs rejecting is a node
 * inside a `display: none` subtree, which is how Element Plus parks a closed
 * dialog, so walk the ancestors and look for that instead.
 */
const isVisible = (el) => {
	if (!el || !el.isConnected) {
		return false;
	}

	if (el.getClientRects().length > 0) {
		return true;
	}

	for (let node = el; node instanceof Element; node = node.parentElement) {
		const { display, visibility } = window.getComputedStyle(node);

		if ('none' === display || 'hidden' === visibility) {
			return false;
		}
	}

	return true;
};

/**
 * The live task sidebar, preferring one inside an open task dialog.
 */
const findSidebar = () => {
	const scopes = [...document.querySelectorAll(TASK_MODAL), document];

	for (const scope of scopes) {
		const sidebar = scope.querySelector(SIDEBAR);

		if (isVisible(sidebar)) {
			return sidebar;
		}
	}

	return null;
};

let root = null;
let wrapper = null;
let frame = null;

/**
 * Build the node the React tree renders into.
 *
 * On 2.0 the button gets its own sidebar card so it matches the surrounding
 * Properties / Labels / Time cards, and it is placed next to one of them
 * rather than appended to the end — the sidebar is a `max-height` +
 * `overflow-y: auto` column, so anything appended last is below the fold.
 *
 * Note that DOM order alone does not decide where the card lands: those cards
 * carry explicit flex `order` values, so the wrapper has to claim one too —
 * see mountWrapper().
 */
const createWrapper = (isLegacyRow) => {
	if (isLegacyRow) {
		const div = document.createElement('div');
		div.id = WRAPPER_ID;
		return div;
	}

	const section = document.createElement('section');
	section.id = WRAPPER_ID;
	section.className = 'fbs-task-sidebar-card btl-fbs-card';

	return section;
};

/**
 * Put the wrapper in the open task modal, or return null when no modal is open.
 */
const mountWrapper = () => {
	const legacyRow = document.querySelector(LEGACY_ROW);

	if (isVisible(legacyRow)) {
		const node = createWrapper(true);
		legacyRow.append(node);
		return node;
	}

	const sidebar = findSidebar();

	if (!sidebar) {
		return null;
	}

	const node = createWrapper(false);

	// Directly under Labels, so "Share Task" reads as the next control in that
	// group. Properties is the fallback for the boards that hide labels
	// altogether, where there is no Labels card to sit behind.
	const labelsCard = sidebar.querySelector(LABELS_CARD);
	const anchorCard = labelsCard || sidebar.querySelector(PROPERTIES_CARD);

	if (!anchorCard) {
		sidebar.prepend(node);
		return node;
	}

	if (labelsCard) {
		node.classList.add(AFTER_LABELS_CLASS);
	}

	// Vue tracks its own children by vnode and inserts relative to the element
	// references it holds, so a foreign node sitting between two of them is not
	// disturbed by later patches.
	anchorCard.after(node);

	// The sidebar is a flex column whose cards set their own `order`, so being
	// after the anchor in the DOM decides nothing on its own — a card left at
	// the default `order: 0` is painted above every card that names a higher
	// one, which is how the button ended up sitting above Properties. Copying
	// the anchor's order makes the two tie, and flexbox breaks that tie with
	// DOM order, putting us immediately behind it.
	//
	// Read rather than hardcoded: FluentBoards only started ordering these
	// cards in 2.0, and on a build that does not (every card at `order: 0`) a
	// fixed number would push the button to the very bottom of a scrolling
	// column instead — the placement this code went out of its way to avoid.
	node.style.order = window.getComputedStyle(anchorCard).order;

	return node;
};

/**
 * Drop the current button and everything it owns.
 *
 * React refuses to unmount a root while it is rendering, and callers here can
 * run from a MutationObserver microtask, hence the deferral.
 */
const unmount = () => {
	const staleRoot = root;
	const staleWrapper = wrapper;

	root = null;
	wrapper = null;

	if (!staleRoot) {
		staleWrapper?.remove();
		return;
	}

	setTimeout(() => {
		staleRoot.unmount();
		staleWrapper?.remove();
	}, 0);
};

/**
 * Reconcile "is there a button in the task modal that is open right now?".
 *
 * Deliberately written as a idempotent check of current state rather than as a
 * reaction to a particular event. FluentBoards tears the modal down on close
 * (`destroy-on-close`), rebuilds it on open, and additionally reuses the same
 * sidebar when the modal's next/previous arrows move between tasks — reacting
 * to any single one of those signals is how this kept ending up in a state it
 * could not recover from without a page reload.
 */
const sync = () => {
	// `isConnected` is the only reliable test: Vue can discard the subtree the
	// wrapper lives in at any point, which leaves the React root rendering into
	// a detached node — a button that exists but is nowhere on screen.
	if (wrapper && !isVisible(wrapper)) {
		unmount();
	}

	if (wrapper) {
		// Still live in the open modal. Re-mounting on every mutation would
		// throw away the looked-up short link constantly, and FluentBoards
		// mutates this subtree on nearly every interaction.
		return;
	}

	// Any wrapper with no root behind it is a leftover. `querySelectorAll`
	// rather than `getElementById`, which stops at the first match and would
	// leave a second stale card on screen — these all share one id.
	document.querySelectorAll(`#${WRAPPER_ID}`).forEach((el) => el.remove());

	const node = mountWrapper();

	if (!node) {
		return;
	}

	wrapper = node;
	root = createRoot(node);
	root.render(<App />);
};

/**
 * Vue flushes its DOM patches in a microtask and MutationObserver callbacks are
 * microtasks too, so acting on a record the instant it arrives can mean
 * mounting into a node Vue is about to discard. A rAF tick lands after the
 * whole flush, and collapses the burst of records a modal open produces.
 */
const scheduleSync = () => {
	if (frame) {
		return;
	}

	frame = requestAnimationFrame(() => {
		frame = null;
		sync();
	});
};

const start = () => {
	if (!fbs_settings?.enable_fbs) {
		return;
	}

	new MutationObserver(scheduleSync).observe(document.body, { childList: true, subtree: true });

	// Opening, closing and next/previous-ing a task are all router pushes.
	window.addEventListener('hashchange', scheduleSync);
	window.addEventListener('popstate', scheduleSync);

	// Safety net. Every event-driven signal above can be missed — a mutation
	// batch that lands while the subtree is mid-rebuild, a router push that
	// fires neither event — and a missed signal used to mean the button stayed
	// gone until the page was reloaded. `sync()` is a cheap no-op (one
	// `isConnected` read) whenever the button is already in place.
	setInterval(sync, 500);

	sync();
};

if ('loading' === document.readyState) {
	document.addEventListener('DOMContentLoaded', start);
} else {
	// The bundle is enqueued in the footer, so DOMContentLoaded may already have
	// fired by the time it runs.
	start();
}
