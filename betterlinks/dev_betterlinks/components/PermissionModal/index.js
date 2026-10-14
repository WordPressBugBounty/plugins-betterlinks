import React from 'react';
import { __ } from '@wordpress/i18n';
import Modal from 'react-modal';
import { plugin_root_url } from 'utils/helper';

const PermissionModal = ({ isOpen, onClose, title = __('Permission Required', 'betterlinks') }) => {
    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            contentLabel={title}
            className="btl-permission-modal btl-permission-modal-expanded"
            overlayClassName="btl-modal-overlay"
            appElement={document.getElementById('wpbody') || document.body}
            style={{
                overlay: {
                    background: 'rgba(35, 40, 45, 0.62)',
                    zIndex: 999999
                },
                content: {
                    top: '50%',
                    left: '50%',
                    right: 'auto',
                    bottom: 'auto',
                    border: 'none',
                    background: '#fff',
                    borderRadius: '8px',
                    width: '90%',
                    marginRight: '-50%',
                    transform: 'translate(-50%, -50%)',
                    overflow: 'visible',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
                }
            }}
        >
            <div className="btl-modal-header">
                {/* <h2>{title}</h2> */}
                <button onClick={onClose} className="btl-modal-close">
                    ×
                </button>
            </div>
            <div className="btl-modal-content">
                <div className="btl-permission-message">
                    <div className="btl-permission-icon">
                        <img src={plugin_root_url + '/assets/images/access-icon.svg'} alt="Access icon" />
                    </div>
                    <div className="btl-permission-text">{__("You don't have permission to perform this action.", 'betterlinks')}</div>
                    <div className="btl-permission-sub-text">
                        {__('Please contact your administrator if you need access to this feature.', 'betterlinks')}
                    </div>
                </div>
                <div className="btl-modal-footer">
                    <button onClick={onClose} className="button button-primary">
                        {__('OK', 'betterlinks')}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default PermissionModal;
