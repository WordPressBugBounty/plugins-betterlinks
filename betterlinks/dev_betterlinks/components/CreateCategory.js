import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import CatForm from 'components/Terms/CatForm';
import PermissionModal from 'components/PermissionModal';

const CreateCategory = ({ createCatHandler }) => {
	const [isOpenForm, setIsOpenForm] = useState(false);
	const [showPermissionModal, setShowPermissionModal] = useState(false);

	// Check if user has permission to manage tags and categories
	const hasPermission = () => {
		// Check if betterLinksProGlobal exists (pro version with role management)
		if (window.betterLinksProGlobal && typeof window.betterLinksProGlobal.user_can_manage_tags_categories !== 'undefined') {
			return window.betterLinksProGlobal.user_can_manage_tags_categories || window.betterLinksProGlobal.user_can_manage_options;
		}
		// Fallback for free version - only admins can manage
		return window.betterLinksGlobal && window.betterLinksGlobal.user_can_manage_options;
	};

	const handleButtonClick = () => {
		if (!hasPermission()) {
			setShowPermissionModal(true);
			return;
		}
		setIsOpenForm(!isOpenForm);
	};

	const handleFormSubmit = (values) => {
		if (!hasPermission()) {
			setShowPermissionModal(true);
			return;
		}
		createCatHandler(values);
	};

	return (
		<>
			<div className="dnd-create-category">
				<button className="dnd-create-category-button" onClick={handleButtonClick}>
					<i className="btl btl-add"></i>
				</button>
				<p className="dnd-create-category-text">{__('Add New Category', 'betterlinks')}</p>
				{isOpenForm && <CatForm hideHandler={setIsOpenForm} submitHandler={handleFormSubmit} />}
			</div>
			<PermissionModal
				isOpen={showPermissionModal}
				onClose={() => setShowPermissionModal(false)}
				title={__('Create Category Permission Required', 'betterlinks')}
			/>
		</>
	);
};

export default CreateCategory;
