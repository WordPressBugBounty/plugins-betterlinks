import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { __ } from '@wordpress/i18n';

/**
 * Self-contained dialog for the Analytics "Reset clicks" flow.
 *
 * Deliberately NOT react-modal: the reset dialog kept inheriting global rules
 * aimed at `.ReactModal__Content` (a hard 870x380 box, a 600px white panel for
 * `.btl-anl-delete-clicks-modal`, `inset: 40px`), and every fix for one state
 * broke another. This renders its own portal with a private `bl-rc-*` namespace,
 * so nothing in the legacy stylesheet can reach inside it.
 *
 * The card sizes to its content, which is what lets one shell hold both the
 * ~950px two-month calendar and the ~460px confirm panel.
 */
const ResetClicksModal = ({ isOpen, onClose, labelledBy, className = '', children }) => {
	const cardRef = useRef(null);
	// Restores focus to whatever was focused before the dialog opened.
	const openerRef = useRef(null);

	useEffect(() => {
		if (!isOpen) return undefined;

		openerRef.current = document.activeElement;

		const onKeyDown = (event) => {
			if (event.key === 'Escape') {
				event.stopPropagation();
				onClose();
			}
		};
		document.addEventListener('keydown', onKeyDown);

		// The page behind must not scroll under the dialog.
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';

		// Move focus into the dialog so Esc and Tab land here, not on the page.
		cardRef.current?.focus();

		return () => {
			document.removeEventListener('keydown', onKeyDown);
			document.body.style.overflow = previousOverflow;
			if (openerRef.current instanceof HTMLElement) openerRef.current.focus();
		};
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return ReactDOM.createPortal(
		<div
			className="bl-rc"
			// Backdrop click closes; clicks inside the card must not bubble out to it.
			onMouseDown={(event) => {
				if (event.target === event.currentTarget) onClose();
			}}
		>
			<div
				className={`bl-rc__card ${className}`.trim()}
				role="dialog"
				aria-modal="true"
				aria-labelledby={labelledBy}
				tabIndex={-1}
				ref={cardRef}
			>
				<button type="button" className="bl-rc__close" onClick={onClose} aria-label={__('Close', 'betterlinks')}>
					<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
						<path d="M13 1L1 13M1 1L13 13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" fill="none" />
					</svg>
				</button>
				{children}
			</div>
		</div>,
		document.body
	);
};

export default ResetClicksModal;
