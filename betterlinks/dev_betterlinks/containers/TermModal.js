import React, { useState } from 'react';
import Modal from 'react-modal';
import { __ } from '@wordpress/i18n';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { add_new_tag } from 'redux/actions/terms.actions';
import ActionButton from 'components/ActionButton';
import PermissionModal from 'components/PermissionModal';
import { TagIcon, FolderIcon } from 'components/Icons';
import { isProtectedTermId } from 'utils/helper';

const centeredModalStyles = {
	overlay: {
		background: 'rgba(15, 20, 30, 0.5)',
		zIndex: '100000',
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

const hasTermPermission = () => {
	if (window.betterLinksProGlobal && typeof window.betterLinksProGlobal.user_can_manage_tags_categories !== 'undefined') {
		return window.betterLinksProGlobal.user_can_manage_tags_categories || window.betterLinksProGlobal.user_can_manage_options;
	}
	return window.betterLinksGlobal && window.betterLinksGlobal.user_can_manage_options;
};

const CloseIcon = () => (
	<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
		<path d="M13 1 1 13M1 1l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);
const PlusIcon = () => (
	<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
		<path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
	</svg>
);

// Slug rules match the legacy behaviour: tags keep the trimmed text as-is,
// categories are lower-cased + hyphenated.
const toSlug = (val, isTag) => (isTag ? val.trim() : val.trim().toLowerCase().replace(/\s+/g, '-'));

const TermModal = ({ mode = 'add', type: fixedType = 'tag', defaultType = 'tag', row = {}, tags = [], categories = [], children, add_new_tag }) => {
	const isEdit = mode === 'edit';
	const [open, setOpen] = useState(false);
	const [type, setType] = useState(isEdit ? fixedType : defaultType);
	const [name, setName] = useState('');
	const [error, setError] = useState('');
	const [showPerm, setShowPerm] = useState(false);

	// Protected categories can't be renamed — the Terms REST controller answers a
	// rename of any `betterlinks/protected_term_ids` id with a 403. Testing the
	// filtered list rather than a literal ID 1 covers extension-owned categories
	// (Pro's "Link in Bio") too. Scoped to categories so a *tag* that happens to
	// share an id with a protected category stays editable.
	const isDefaultCategory = isEdit && fixedType === 'category' && isProtectedTermId(row?.id ?? row?.ID);
	const selfId = row?.ID ?? row?.id;

	const validate = (val, forType = type) => {
		const trimmed = val.trim();
		if (trimmed === '') return __("Name can't be empty", 'betterlinks');
		const isTag = forType === 'tag';
		const slug = toSlug(val, isTag);
		const list = isTag ? tags : categories;
		const dup = (list || []).some((item) => item.term_slug === slug && (item.ID ?? item.id) != selfId);
		if (dup) return isTag ? __('Tag already exists', 'betterlinks') : __('Category already exists', 'betterlinks');
		return '';
	};

	const openModal = () => {
		if (!hasTermPermission()) {
			setShowPerm(true);
			return;
		}
		const initType = isEdit ? fixedType : defaultType;
		setType(initType);
		setName(isEdit ? (initType === 'tag' ? row.term_slug || row.term_name || '' : row.term_name || '') : '');
		setError('');
		setOpen(true);
	};
	const closeModal = () => setOpen(false);

	const onChangeName = (val) => {
		setName(val);
		setError(validate(val));
	};
	const switchType = (t) => {
		setType(t);
		setError(name ? validate(name, t) : '');
	};

	const submit = (e) => {
		e.preventDefault();
		if (!hasTermPermission()) {
			setShowPerm(true);
			return;
		}
		const err = validate(name);
		if (err) {
			setError(err);
			return;
		}
		const isTag = type === 'tag';
		const trimmed = name.trim();
		const slug = toSlug(name, isTag);
		add_new_tag({
			ID: row?.ID || row?.id || null,
			// Tags store the raw text as both name & slug; categories keep a readable
			// name plus a hyphenated slug.
			term_name: isTag ? slug : trimmed,
			term_slug: slug,
			term_type: isTag ? 'tags' : 'category',
		});
		closeModal();
	};

	const isTag = type === 'tag';
	const title = isEdit ? (isTag ? __('Edit tag', 'betterlinks') : __('Edit category', 'betterlinks')) : isTag ? __('Add new tag', 'betterlinks') : __('Add new category', 'betterlinks');
	const submitLabel = isEdit ? __('Save changes', 'betterlinks') : isTag ? __('Create tag', 'betterlinks') : __('Create category', 'betterlinks');
	const placeholder = isTag ? __('e.g. launch campaign', 'betterlinks') : __('e.g. Marketing', 'betterlinks');

	return (
		<React.Fragment>
			{isEdit ? (
				isDefaultCategory ? (
					<ActionButton type="not" label={__("Default Category can't be edited", 'betterlinks')}>
						{children}
					</ActionButton>
				) : (
					<ActionButton type="edit" label={isTag ? __('Edit Tag', 'betterlinks') : __('Edit Category', 'betterlinks')} onClickHandler={openModal}>
						{children}
					</ActionButton>
				)
			) : (
				<div className="btl-create-autolinks">
					<button type="button" className="btl-create-autolink-button" onClick={openModal}>
						<PlusIcon />
						{defaultType === 'tag' ? __('Add New Tag', 'betterlinks') : __('Add New Category', 'betterlinks')}
					</button>
				</div>
			)}

			<Modal isOpen={open} onRequestClose={closeModal} closeTimeoutMS={200} style={centeredModalStyles} ariaHideApp={false}>
				<form className="bl-term-modal" onSubmit={submit}>
					<div className="bl-term-modal__header">
						<div className="bl-term-modal__heading">
							<span className="bl-term-modal__badge">{isTag ? <TagIcon size={20} /> : <FolderIcon size={20} />}</span>
							<h3 className="bl-term-modal__title">{title}</h3>
						</div>
						<button type="button" className="bl-term-modal__close" onClick={closeModal} aria-label={__('Close', 'betterlinks')}>
							<CloseIcon />
						</button>
					</div>

					<div className="bl-term-modal__body">
						{!isEdit && (
							<div className="bl-term-modal__field">
								<label className="bl-term-modal__label">{__('Type', 'betterlinks')}</label>
								<div className="bl-term-modal__type">
									<button type="button" className={`bl-term-modal__type-btn ${isTag ? 'is-active' : ''}`} onClick={() => switchType('tag')}>
										<TagIcon size={16} />
										{__('Tag', 'betterlinks')}
									</button>
									<button type="button" className={`bl-term-modal__type-btn ${!isTag ? 'is-active' : ''}`} onClick={() => switchType('category')}>
										<FolderIcon size={16} />
										{__('Category', 'betterlinks')}
									</button>
								</div>
							</div>
						)}

						<div className="bl-term-modal__field">
							<label className="bl-term-modal__label" htmlFor="bl-term-name">
								{__('Name', 'betterlinks')} <span className="bl-term-modal__req">*</span>
							</label>
							<input
								id="bl-term-name"
								type="text"
								className={`bl-term-modal__input ${error ? 'is-error' : ''}`}
								value={name}
								placeholder={placeholder}
								autoFocus
								onChange={(e) => onChangeName(e.target.value)}
							/>
							{error && <span className="bl-term-modal__error">{error}</span>}
						</div>
					</div>

					<div className="bl-term-modal__footer">
						<button type="button" className="bl-term-modal__btn bl-term-modal__btn--ghost" onClick={closeModal}>
							{__('Cancel', 'betterlinks')}
						</button>
						<button type="submit" className="bl-term-modal__btn bl-term-modal__btn--primary" disabled={!!error || name.trim() === ''}>
							{submitLabel}
						</button>
					</div>
				</form>
			</Modal>

			<PermissionModal isOpen={showPerm} onClose={() => setShowPerm(false)} title={__('Manage Permission Required', 'betterlinks')} />
		</React.Fragment>
	);
};

const mapDispatchToProps = (dispatch) => ({
	add_new_tag: bindActionCreators(add_new_tag, dispatch),
});

export default connect(null, mapDispatchToProps)(TermModal);
