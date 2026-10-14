import { __ } from '@wordpress/i18n';
import { is_pro_enabled, pro_version_check } from 'utils/helper';
import CustomizeLinkPreviewTeaser from './CustomizeLinkPreviewTeaser';
import Modal from 'react-modal';
import { useState } from 'react';
import { modalCustomStyles } from 'utils/helper';
import { useUpgradeProModal } from 'utils/customHooks';
import UpgradeToPro from 'components/Teasers/UpgradeToPro';
import Note from './Note';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import ProBadge from 'components/Badge/ProBadge';

const CustomizeLinkPreview = ({ openAccordion, form, settings, __handleToggle }) => {
	const { enable_customize_meta_tags } = settings.settings;
	if (is_pro_enabled && !enable_customize_meta_tags) return null;

	const [openModal, setOpenModal] = useState(false);
	const [isOpenUpgradeToProModal, openUpgradeToProModal, closeUpgradeToProModal] = useUpgradeProModal();
	const closeModal = () => setOpenModal(false);

	const ReactTabs = { Tab, Tabs, TabList, TabPanel };

	const customStyles = {
		...modalCustomStyles,
		overlay: {
			...modalCustomStyles.overlay,
			zIndex: '999999',
		},
		content: {
			...modalCustomStyles.content,
			maxWidth: '1040px',
		},
	};

	// The stored preview (`enable_meta_tags`, `meta_title`, `meta_description`,
	// `meta_image`) is loaded into the form and saved by BetterLinks Pro.
	const isProUpdated = pro_version_check('1.8.0');
	return (
		<>
			<div className={`link-options link-options--advanced link-options--customize-link-preview ${openAccordion ? 'link-options--open' : ''}`}>
				<button
					className="link-options__head"
					type="button"
					onClick={() => {
						!is_pro_enabled && setOpenModal(true);
						__handleToggle('optimizeMetaTags');
					}}
				>
					<h4 className="link-options__head--title">
						{__('Customize Link Preview', 'betterlinks')} {!is_pro_enabled && <ProBadge />}
					</h4>{' '}
					{is_pro_enabled && <i className="btl btl-angle-arrow-down" />}
				</button>
				<>
					{is_pro_enabled && (
						<div className="link-options__body">
							<div className="link-options--teasers">
								<div className="btl-modal-form-group">
									<label className="btl-checkbox-field">
										<input
											id="enable_meta_tags"
											name="enable_meta_tags"
											className="btl-check"
											type="checkbox"
											checked={!!form.values?.enable_meta_tags}
											onClick={(e) => {
												const checked = e.target.checked;
												if (checked) setOpenModal(checked);
												form.setFieldValue('enable_meta_tags', checked);
											}}
										/>
										<span className="text">
											<span>{__('Enable Link Preview', 'betterlinks')}</span>
											{form.values.enable_meta_tags && (
												<div className="btl-tooltip">
													<span
														className="btl btl-edit"
														onClick={(e) => {
															e.preventDefault();
															setOpenModal(true);
														}}
													/>
													<span className="btl-tooltiptext">{__('Edit Link Preview', 'betterlinks')}</span>
												</div>
											)}
										</span>
									</label>
								</div>
							</div>
						</div>
					)}
					<Modal isOpen={openModal} onRequestClose={closeModal} style={customStyles} ariaHideApp={false}>
						<span className="btl-close-modal" onClick={closeModal}>
							<i className="btl btl-cancel" />
						</span>
						{!isProUpdated && (
							<div className="btl-form-group">
								<div className="short-description">
									<b style={{ fontWeight: 700 }}>{__('Note: ')}</b>
									{__('To Utilize the Customize Link Preview Feature, kindly ensure that you have updated to the latest version of BetterLinks Pro v-1.8.0', 'betterlinks')}
								</div>
							</div>
						)}
						<UpgradeToPro isOpenModal={isOpenUpgradeToProModal} closeModal={closeUpgradeToProModal} />
						{betterLinksHooks.applyFilters('linkOptionsOptimizeMetaTags', <CustomizeLinkPreviewTeaser openUpgradeToProModal={openUpgradeToProModal} closeModal={closeModal} />, {
							...form,
							...settings,
							Note,
							closeModal,
							ReactTabs,
						})}
					</Modal>
				</>
			</div>
		</>
	);
};

export default CustomizeLinkPreview;
