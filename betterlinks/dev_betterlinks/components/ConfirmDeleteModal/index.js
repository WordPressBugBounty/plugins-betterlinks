import React, { useRef } from 'react';
import Modal from 'react-modal';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';

// Shared danger-confirmation dialog for every destructive action (link,
// keyword, tag, category). Callers only vary the copy — the chrome stays the
// same. Portaled to <body> like the other `bl-*` dialogs, so `_confirm-delete-
// modal.scss` lives at root level.
const centeredModalStyles = {
	overlay: {
		background: 'rgba(15, 20, 30, 0.5)',
		zIndex: '100001',
	},
	content: {
		top: '50%',
		left: '50%',
		right: 'auto',
		bottom: 'auto',
		marginRight: '-50%',
		transform: 'translate(-50%, -50%)',
		padding: 0,
		border: 'none',
		background: 'transparent',
		overflow: 'visible',
		borderRadius: 0,
		maxHeight: 'calc(100vh - 40px)',
	},
};

const TrashIcon = ({ size = 20 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<path d="M4 7h16M10 4h4a1 1 0 0 1 1 1v2H9V5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
		<path d="M6.5 7l.7 11.1A2 2 0 0 0 9.2 20h5.6a2 2 0 0 0 2-1.9L17.5 7M10 11v5M14 11v5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

const ConfirmDeleteModal = ({
	isOpen,
	onClose,
	onConfirm,
	title = __('Delete item?', 'betterlinks'),
	description = __("This action can't be undone.", 'betterlinks'),
	confirmLabel = __('Delete', 'betterlinks'),
	cancelLabel = __('Cancel', 'betterlinks'),
	busy = false,
}) => {
	const handleConfirm = () => {
		if (busy) return;
		if (onConfirm) onConfirm();
	};

	// The modal stays mounted through its 200ms close animation, but by then the
	// caller has usually cleared the deleted row (so `description`/`title` would
	// render empty — "This removes  from auto-linking"). Cache the last content
	// shown while open and keep displaying it during the fade-out.
	const lastContent = useRef({ title, description, confirmLabel, cancelLabel });
	if (isOpen) {
		lastContent.current = { title, description, confirmLabel, cancelLabel };
	}
	const content = isOpen ? { title, description, confirmLabel, cancelLabel } : lastContent.current;

	return (
		<Modal isOpen={isOpen} onRequestClose={onClose} closeTimeoutMS={200} style={centeredModalStyles} ariaHideApp={false}>
			<div className="bl-confirm-modal">
				<div className="bl-confirm-modal__header">
					<span className="bl-confirm-modal__badge">
						<TrashIcon size={22} />
					</span>
					<h3 className="bl-confirm-modal__title">{content.title}</h3>
				</div>

				<div className="bl-confirm-modal__body">
					<p className="bl-confirm-modal__desc">{content.description}</p>
				</div>

				<div className="bl-confirm-modal__footer">
					<button type="button" className="bl-confirm-modal__btn bl-confirm-modal__btn--ghost" onClick={onClose}>
						{content.cancelLabel}
					</button>
					<button type="button" className="bl-confirm-modal__btn bl-confirm-modal__btn--danger" onClick={handleConfirm} disabled={busy}>
						<TrashIcon size={16} />
						{content.confirmLabel}
					</button>
				</div>
			</div>
		</Modal>
	);
};

ConfirmDeleteModal.propTypes = {
	isOpen: PropTypes.bool,
	onClose: PropTypes.func,
	onConfirm: PropTypes.func,
	title: PropTypes.node,
	description: PropTypes.node,
	confirmLabel: PropTypes.node,
	cancelLabel: PropTypes.node,
	busy: PropTypes.bool,
};

export default ConfirmDeleteModal;
