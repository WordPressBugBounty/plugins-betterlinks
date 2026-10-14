import UpgradeToPro from '../UpgradeToPro';
import { __ } from '@wordpress/i18n';
import { useUpgradeProModal } from 'utils/customHooks';
import { is_pro_enabled, saveSettingsHandler } from 'utils/helper';
import { Formik, Form } from 'formik';
import { useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { update_option } from 'redux/actions/settings.actions';
import ReactQuill from 'react-quill';
import CheckList from '../utility/CheckList';
import SelectTeaser from '../utility/SelectTeaser';

const AffiliateLinkDisclosure = ({ settings, update_option, postTypes }) => {
	const [formSubmitText, setFormSubmitText] = useState(__('Save Settings', 'betterlinks'));
	const [isOpenUpgradeToProModal, openUpgradeToProModal, closeUpgradeToProModal] = useUpgradeProModal();

	return (
		<>
			<UpgradeToPro isOpenModal={isOpenUpgradeToProModal} closeModal={closeUpgradeToProModal} />
			<Formik enableReinitialize initialValues={{ ...settings }} onSubmit={(values) => saveSettingsHandler(values, update_option, setFormSubmitText)}>
				{(props) => (
					<Form>
						{!is_pro_enabled && (
							<>
								<CheckList title={__('Affiliate Link Disclosure', 'betterlinks')} onClick={openUpgradeToProModal} />
								<CheckList title={__('Enable Preview', 'betterlinks')} onClick={openUpgradeToProModal} />
								<SelectTeaser title={__('Enable by Default', 'betterlinks')} onClick={openUpgradeToProModal} />
								<SelectTeaser title={__('Disclosure Position', 'betterlinks')} onClick={openUpgradeToProModal} />
								<div className="btl-role-item btl-form-group" style={{ marginBottom: '60px' }}>
									<label className="btl-form-label">
										{__('Disclosure Content', 'betterlinks')}
										{/* <span className="pro-badge">{__('Pro', 'betterlinks')}</span> */}
									</label>
									<div className="link-options__body">
										<ReactQuill theme="snow" value="" onChange={openUpgradeToProModal} />
									</div>
								</div>
								<CheckList title={__('Advanced Options', 'betterlinks')} onClick={openUpgradeToProModal} />
							</>
						)}
						{betterLinksHooks.applyFilters('BetterLinksOptionsTabSettings', null, { ...props, postTypes, ReactQuill })}
						{is_pro_enabled && (
							<>
								<button className="button-primary btn-save-settings" type="submit">
									{formSubmitText}
								</button>
							</>
						)}
					</Form>
				)}
			</Formik>
		</>
	);
};
const mapDispatchToProps = (dispatch) => {
	return {
		update_option: bindActionCreators(update_option, dispatch),
	};
};
export default connect(null, mapDispatchToProps)(AffiliateLinkDisclosure);
