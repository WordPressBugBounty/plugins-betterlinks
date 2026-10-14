import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';

/**
 * Branded tooltip whose bubble is portaled to <body>.
 *
 * The board column (`.blb-col__list`) is a scroll container, and a scroller
 * clips absolutely-positioned descendants — which cropped every card tooltip at
 * the column edge. Rendering the bubble into <body> at fixed coordinates takes
 * it out of that clipping context entirely, so it stays fully visible wherever
 * the trigger happens to sit.
 *
 * The trigger keeps whatever class it had (`btl-tooltip`, `dnd-link-button`, …)
 * so all existing layout CSS still applies; only the bubble moved.
 */
const Tooltip = ({ label, as: Tag = 'div', className = '', children, onMouseEnter, onMouseLeave, onFocus, onBlur, onMouseDown, onClick, ...rest }) => {
	const ref = useRef(null);
	const [pos, setPos] = useState(null);

	// True only when an event originated on the trigger's own DOM subtree — not
	// bubbled up through a React portal. Some triggers wrap a component (e.g. the
	// "Edit Link" tooltip wraps <Link>) whose edit drawer and UTM/Social modals
	// render as React children but portal to <body>. React bubbles those portal
	// events (focus, mouseover→enter) up the React tree into this tooltip's
	// handlers, which would re-show the bubble over the drawer. Their DOM target
	// sits outside the trigger, so a containment check filters them out.
	const isTriggerEvent = useCallback((e) => {
		const el = ref.current;
		if (!el) return false;
		const target = e && e.target;
		return !target || el === target || el.contains(target);
	}, []);

	const show = useCallback((e) => {
		const el = ref.current;
		if (!el || !label || !isTriggerEvent(e)) return;
		const rect = el.getBoundingClientRect();
		setPos({ top: rect.top, left: rect.left + rect.width / 2 });
	}, [label, isTriggerEvent]);

	const hide = useCallback(() => setPos(null), []);

	// Show on focus only when it's keyboard focus. A mouse click also focuses the
	// trigger, and showing then would re-open the bubble right after the click
	// hid it — leaving it stranded on top of the drawer the click just opened.
	const showOnFocus = useCallback((e) => {
		if (!isTriggerEvent(e)) return;
		const el = ref.current;
		try {
			if (el && el.matches && !el.matches(':focus-visible')) return;
		} catch (err) {
			/* :focus-visible unsupported — fall through and show */
		}
		show(e);
	}, [show, isTriggerEvent]);

	// Run our tooltip handler first, then defer to any handler the caller passed.
	const compose = (own, passed) => (e) => {
		own(e);
		if (passed) passed(e);
	};

	// A fixed bubble doesn't follow its trigger, so drop it as soon as anything
	// moves underneath it. Capture phase catches nested scrollers (the board
	// column, the page) as well as the window.
	useEffect(() => {
		if (!pos) return undefined;
		window.addEventListener('scroll', hide, true);
		window.addEventListener('resize', hide);
		// Any pointer-down anywhere dismisses the bubble. Capture phase runs
		// before the target's own handler (and before any stopPropagation), so
		// this fires even when the click opens a drawer/modal over the trigger —
		// preventing a stale tooltip from floating on top of that drawer.
		document.addEventListener('mousedown', hide, true);
		return () => {
			window.removeEventListener('scroll', hide, true);
			window.removeEventListener('resize', hide);
			document.removeEventListener('mousedown', hide, true);
		};
	}, [pos, hide]);

	return (
		<Tag
			ref={ref}
			className={className}
			onMouseEnter={compose(show, onMouseEnter)}
			onMouseLeave={compose(hide, onMouseLeave)}
			onFocus={compose(showOnFocus, onFocus)}
			onBlur={compose(hide, onBlur)}
			// Dismiss on interaction: clicking an action (Edit Link, QR, …) opens a
			// drawer/modal over the trigger, so `mouseleave` never fires and the
			// portaled bubble would otherwise linger on top of that drawer.
			onMouseDown={compose(hide, onMouseDown)}
			onClick={compose(hide, onClick)}
			{...rest}
		>
			{children}
			{pos &&
				createPortal(
					<span className="bl-tip" role="tooltip" style={{ top: `${pos.top}px`, left: `${pos.left}px` }}>
						{label}
					</span>,
					document.body
				)}
		</Tag>
	);
};

Tooltip.propTypes = {
	label: PropTypes.node,
	as: PropTypes.elementType,
	className: PropTypes.string,
	children: PropTypes.node,
};

export default Tooltip;
