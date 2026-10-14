import React from 'react';
import { __ } from '@wordpress/i18n';
import Modal from 'react-modal';
import { is_pro_enabled, pro_needs_update, modalCustomSmallStyles } from 'utils/helper';
import UpgradeToPro from './UpgradeToPro';
import ProUpdateRequired from './ProUpdateRequired';

// Default content of the `betterLinksAIBulkLinkModal` filter. The AI Bulk Link
// Generator is implemented in BetterLinks Pro, which replaces this through the
// filter. Here we only show the upgrade modal, or an update note when an older
// Pro (without the filter) is active.
const AIBulkLinkTeaser = ({ isOpen, onClose }) => {
	if (is_pro_enabled && pro_needs_update) {
		return (
			<Modal isOpen={!!isOpen} onRequestClose={onClose} style={modalCustomSmallStyles} ariaHideApp={false}>
				<span className="btl-close-modal" onClick={onClose}>
					<i className="btl btl-cancel" />
				</span>
				<ProUpdateRequired feature={__('AI Bulk Link Generator', 'betterlinks')} />
			</Modal>
		);
	}

	return <UpgradeToPro isOpenModal={!!isOpen} closeModal={onClose} />;
};

export default AIBulkLinkTeaser;
