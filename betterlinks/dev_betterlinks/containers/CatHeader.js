import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import Modal from 'react-modal';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { update_cat, delete_cat, add_new_link } from 'redux/actions/links.actions';
import { isProtectedTermId } from 'utils/helper';
import Link from 'containers/Link';
import CatForm from 'components/Terms/CatForm';
import PermissionModal from 'components/PermissionModal';
import ConfirmDeleteModal from 'components/ConfirmDeleteModal';

const propTypes = {
	catId: PropTypes.number,
	catName: PropTypes.string,
	catSlug: PropTypes.string,
	count: PropTypes.number,
	clicks: PropTypes.number,
	dragHandleProps: PropTypes.object,
};

// Centred dialog with no chrome of react-modal's own — the `bl-term-modal`
// inside draws its own card, so the content box is transparent and unpadded.
// Same values `containers/TermModal.js` and `ConfirmDeleteModal` use.
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

// Column reorder grip (six dots). Only shown when the board passes drag-handle
// props (i.e. reordering is enabled — pristine, unfiltered board).
const GripIcon = () => (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
		<circle cx="9" cy="6" r="1.6" />
		<circle cx="15" cy="6" r="1.6" />
		<circle cx="9" cy="12" r="1.6" />
		<circle cx="15" cy="12" r="1.6" />
		<circle cx="9" cy="18" r="1.6" />
		<circle cx="15" cy="18" r="1.6" />
	</svg>
);

const CatHeader = (props) => {
	const { catId, catName, catSlug, count = 0, clicks = 0, update_cat, delete_cat, add_new_link, dragHandleProps } = props;
	const { sortByFav } = props.favouriteSort || {};
	const [modalIsOpen, setModalIsOpen] = useState(false);
	const [isCatAction, setCatAction] = useState(false);
	const [isDeleteConfirm, setDeleteConfrim] = useState(false);
	const [showPermissionModal, setShowPermissionModal] = useState(false);

	// `protected_term_ids` covers Uncategorized plus any extension-owned category
	// (Pro's "Link in Bio"), but the two want different menus:
	//
	//   Uncategorized  — the default bucket. Can't be renamed or deleted, but it
	//                    takes links like any other category, so: New link only.
	//   Extension-owned — the feature owns what lives in it, so links aren't added
	//                    by hand and it must not be deleted, so: Edit only.
	//   Everything else — New link, Edit, Delete.
	const isProtected = isProtectedTermId(catId) || catSlug == 'uncategorized';
	const isUncategorized = Number(catId) === 1 || catSlug == 'uncategorized';
	const isFeatureOwned = isProtected && !isUncategorized;

	// Same gate the column footer's "Add link" button uses, so the two agree.
	const canCreate = betterLinksHooks.applyFilters('betterLinksIsShowWriteLink', true) && !sortByFav && !isFeatureOwned;
	// `isShowCatControl` lets BetterLinks Pro hide category edit/delete from roles
	// that may not manage categories.
	const showCatControl = betterLinksHooks.applyFilters('isShowCatControl', true);
	const canEdit = !isUncategorized && showCatControl;
	const canDelete = !isProtected && showCatControl;
	const hasMenu = canCreate || canEdit || canDelete;

	// Check if user has permission to manage tags and categories
	const hasPermission = () => {
		if (window.betterLinksProGlobal && typeof window.betterLinksProGlobal.user_can_manage_tags_categories !== 'undefined') {
			return window.betterLinksProGlobal.user_can_manage_tags_categories || window.betterLinksProGlobal.user_can_manage_options;
		}
		return window.betterLinksGlobal && window.betterLinksGlobal.user_can_manage_options;
	};
	const catActionHandler = () => {
		setDeleteConfrim(false);
		setCatAction(!isCatAction);
	};
	const deleteHandler = () => {
		if (!hasPermission()) {
			setShowPermissionModal(true);
			return;
		}
		setCatAction(false);
		setDeleteConfrim(true);
	};
	const noDelete = () => {
		setCatAction(false);
		setDeleteConfrim(false);
	};
	const confirmDelete = () => {
		if (!hasPermission()) {
			setShowPermissionModal(true);
			return;
		}
		setDeleteConfrim(false);
		delete_cat({ cat_id: catId });
	};

	function openModal() {
		if (!hasPermission()) {
			setShowPermissionModal(true);
			return;
		}
		setModalIsOpen(true);
	}

	function closeModal() {
		setCatAction(false);
		setModalIsOpen(false);
	}

	return (
		<React.Fragment>
			<div className="blb-col__head">
				<div className="blb-col__head-left">
					{dragHandleProps && (
						<span className="blb-col__grip" {...dragHandleProps} title={__('Drag to reorder category', 'betterlinks')} aria-label={__('Drag to reorder category', 'betterlinks')}>
							<GripIcon />
						</span>
					)}
					<h4 className="blb-col__title" title={catName}>
						{catName}
					</h4>
					<span className="blb-col__count">{count}</span>
				</div>
				<div className="blb-col__head-right">
					<span className="blb-col__clicks">
						{clicks.toLocaleString()} {__('clicks', 'betterlinks')}
					</span>
					{hasMenu && (
						<div className="blb-col__menu dropdown">
							<button className="blb-col__menu-btn icon" onClick={() => catActionHandler()} title={__('Category options', 'betterlinks')}>
								<i className="btl btl-more"></i>
							</button>
							{/*
							  The list stays mounted and is hidden with CSS rather than
							  unmounted while closed: <Link> owns the create-link modal, and
							  unmounting it the moment the menu closes would take that modal
							  down with it.
							*/}
							<div className={`dropdown-menu ${isCatAction ? 'is-open' : ''}`}>
								<ul>
									{canCreate && (
										<li className="blb-col__menu-create" onClick={() => setCatAction(false)}>
											<Link catId={parseInt(catId)} catName={catName} createLabel={__('New link', 'betterlinks')} submitHandler={add_new_link} />
										</li>
									)}
									{canEdit && (
										<li>
											<button onClick={openModal} className="link">
												{__('Edit', 'betterlinks')}
											</button>
										</li>
									)}
									{canDelete && (
										<li>
											<button className="link delete" onClick={() => deleteHandler()}>
												{__('Delete', 'betterlinks')}
											</button>
										</li>
									)}
								</ul>
							</div>
						</div>
					)}
				</div>
			</div>

			{/*
			  `CatForm` draws the whole `bl-term-modal` dialog — its own header, close
			  button and footer — so react-modal contributes no chrome of its own here.
			*/}
			<Modal isOpen={modalIsOpen} onRequestClose={closeModal} closeTimeoutMS={200} style={centeredModalStyles} ariaHideApp={false}>
				<CatForm catId={parseInt(catId)} catName={catName} catSlug={catSlug} submitHandler={update_cat} hideHandler={closeModal} />
			</Modal>

			<ConfirmDeleteModal
				isOpen={isDeleteConfirm}
				onClose={noDelete}
				onConfirm={confirmDelete}
				title={__('Delete category?', 'betterlinks')}
				description={
					<>
						{__('This deletes the', 'betterlinks')} <strong>{catName}</strong> {__("category. This can't be undone.", 'betterlinks')}
					</>
				}
			/>

			<PermissionModal isOpen={showPermissionModal} onClose={() => setShowPermissionModal(false)} title={__('Category Management Permission Required', 'betterlinks')} />
		</React.Fragment>
	);
};

CatHeader.propTypes = propTypes;

const mapStateToProps = (state) => ({
	links: state.links,
	favouriteSort: state.favouriteSort,
});

const mapDispatchToProps = (dispatch) => {
	return {
		update_cat: bindActionCreators(update_cat, dispatch),
		delete_cat: bindActionCreators(delete_cat, dispatch),
		add_new_link: bindActionCreators(add_new_link, dispatch),
	};
};

export default connect(mapStateToProps, mapDispatchToProps)(CatHeader);
