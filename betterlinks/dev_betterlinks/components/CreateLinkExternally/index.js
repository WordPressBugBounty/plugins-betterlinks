import { betterlinks_auth, betterlinks_cle_endpoint, is_pro_enabled, pro_version_check, saveSettingsHandler, site_url } from 'utils/helper';
import { Form, Formik } from 'formik';
import { update_option } from 'redux/actions/settings.actions';
import { connect } from 'react-redux';
import { useState, useEffect } from 'react';
import { bindActionCreators } from 'redux';
import { __ } from '@wordpress/i18n';
import CreateLinkExternallyTeaser from 'components/Teasers/CreateLinkExternally';
import { redirectType } from 'utils/data';
import Select2 from 'react-select';
import { useUpgradeProModal } from 'utils/customHooks';
import UpgradeToPro from 'components/Teasers/UpgradeToPro';

const CreateLinkExternally = ({ settings, terms, update_option }) => {
	const [formSubmitText, setFormSubmitText] = useState(__('Save Settings', 'betterlinks'));

	const isProUpdated = pro_version_check('1.9.4');

	return (
		<>
			<Formik
				enableReinitialize={true}
				initialValues={{ ...settings }}
				onSubmit={(values) => {
					if (!betterlinks_auth && values?.cle?.enable_cle) return;
					saveSettingsHandler(values, update_option, setFormSubmitText);
				}}
			>
				{(props) => {
					return (
						<Form className="btl-cle">
							<Notes />
							{props.values?.cle?.enable_cle && <DragableButton cle={props.values?.cle} />}
							<FreeSettings props={props} isLatestVersion={isProUpdated} />
							{props.values?.cle?.enable_cle &&
								props.values?.cle?.advanced_options &&
								isProUpdated &&
								betterLinksHooks.applyFilters('betterLinksCleAdvanced', <CreateLinkExternallyTeaser props={props} />, { ...props, settings, terms, redirectType, Select2 })}
							{!isProUpdated && (
								<>
									<CreateLinkExternallyTeaser props={props} />
									<div className="btl-form-group">
										<div className="short-description">
											<b style={{ fontWeight: 700 }}>{__('Note: ')}</b>
											{__('To Configure the Advanced Options, kindly ensure that you have updated to the latest version of BetterLinks Pro', 'betterlinks')}
										</div>
									</div>
								</>
							)}
							<button
								className="button-primary btn-save-settings"
								type="submit"
								style={{ cursor: !!betterlinks_auth || !props.values?.cle?.enable_cle ? 'pointer' : 'not-allowed' }}
							>
								{formSubmitText}
							</button>
						</Form>
					);
				}}
			</Formik>
		</>
	);
};

const mapDispatchToProps = (dispatch) => ({
	update_option: bindActionCreators(update_option, dispatch),
});

export default connect(null, mapDispatchToProps)(CreateLinkExternally);

const FreeSettings = ({ props, isLatestVersion }) => {
	const [isOpenUpgradeToProModal, openUpgradeToProModal, closeUpgradeToProModal] = useUpgradeProModal();
	useEffect(() => {
		let cle = props?.values?.cle;
		if (typeof cle === 'string') {
			cle = JSON.parse(cle);
		}
		if (!cle || !('powered_by' in cle)) {
			props.setFieldValue('cle.powered_by', false);
		}
	}, []);

	return (
		<>
			<UpgradeToPro isOpenModal={isOpenUpgradeToProModal} closeModal={closeUpgradeToProModal} />
			<span className="btl-form-group">
				<label className="btl-form-label" style={{ 'min-width': '120px' }}>
					{__('Enable Quick Link Creation', 'betterlinks')}
				</label>
				<div className="btl-form-field">
					<label className="btl-checkbox-field block">
						<input
							className="btl-check"
							name="cle.enable_cle"
							type="checkbox"
							onChange={(e) => props.setFieldValue('cle.enable_cle', e.target.checked)}
							checked={props.values?.cle?.enable_cle}
						/>
						<span className="text">{__('', 'betterlinks')}</span>
					</label>
				</div>
			</span>
			{props.values?.cle?.enable_cle && (
				<>
					<span className="btl-form-group">
						<label className="btl-form-label" style={{ 'min-width': '120px' }}>
							{__('Enable Powered By', 'betterlinks')}
						</label>
						<div className="btl-form-field">
							<label className="btl-checkbox-field block">
								<input
									className="btl-check"
									name="cle.powered_by"
									type="checkbox"
									onChange={(e) => props.setFieldValue('cle.powered_by', e.target.checked)}
									checked={props.values?.cle?.powered_by}
								/>
								<span className="text">{__('', 'betterlinks')}</span>
							</label>
						</div>
					</span>
					<span className="btl-form-group">
						<label className="btl-form-label" style={{ 'min-width': '120px' }}>
							{__('Advanced Options', 'betterlinks')}
							{!is_pro_enabled && (
								<span onClick={openUpgradeToProModal} className="pro-badge">
									Pro
								</span>
							)}
						</label>
						<div className="btl-form-field">
							<label className="btl-checkbox-field block">
								{is_pro_enabled && isLatestVersion ? (
									<>
										<input
											className="btl-check"
											name="cle.advanced_options"
											type="checkbox"
											onChange={(e) => props.setFieldValue('cle.advanced_options', e.target.checked)}
											checked={props.values?.cle?.advanced_options}
										/>
										<span className="text">{__('', 'betterlinks')}</span>
									</>
								) : (
									<span
										onClick={() => props.setFieldValue('cle.advanced_options', !props.values?.cle?.advanced_options)}
										className={`dashicons dashicons-arrow-${props.values?.cle?.advanced_options ? 'up' : 'down'}-alt2`}
									/>
								)}
							</label>
						</div>
					</span>
				</>
			)}
		</>
	);
};

const Notes = () => {
	return (
		<div className="btl-form-group">
			<div className="btl-form-field">
				<div className="short-description">
					<b style={{ fontWeight: 700 }}>{__('Note', 'betterlinks')}: </b>
					<span>{__('It will allow you to create ', 'betterlinks')}</span>
					<span>
						<strong>{__('Quick Link ', 'betterlinks')}</strong>
					</span>
					<span>{__('directly from your bookmark. For more info, ', 'betterlinks')}</span>
					<a className="external-analytic-tooltip-anchor" href="https://betterlinks.io/docs/configure-quick-link-creation/" target="_blank" style={{ color: 'inherit' }}>
						{__('Click here', 'betterlinks')}
					</a>
				</div>
			</div>
		</div>
	);
};

const DragableButton = () => {
	if (!betterlinks_auth) {
		return (
			<div className="notice notice-error" style={{ marginLeft: '0', marginBottom: '15px', padding: '10px' }}>
				{__('A Quick Link Creation token could not be issued for your account. Only users who can manage BetterLinks get one. For more info, ', 'betterlinks')}
				<a className="external-analytic-tooltip-anchor" href="https://betterlinks.io/docs/configure-quick-link-creation/#8-toc-title" target="_blank" style={{ color: 'inherit' }}>
					{__('Click here', 'betterlinks')}
				</a>
			</div>
		);
	}

	// The bookmarklet POSTs and passes the token in an Authorization header, so
	// the credential never ends up in a URL — and therefore never in browser
	// history, sync, referrers, proxy logs or the site's own access logs. The
	// previous version navigated to
	// `?action=btl_cle&api_key=<md5(AUTH_KEY)>&target_url=...`, which leaked a
	// long-lived site-wide secret through every one of those channels.
	const endpoint = betterlinks_cle_endpoint || `${site_url}/wp-json/betterlinks/v1/quick-link`;
	const bookmarklet =
		`javascript:(function(){` +
		`fetch(${JSON.stringify(endpoint)},{` +
		`method:'POST',mode:'cors',` +
		`headers:{'Content-Type':'application/json','Authorization':'Bearer '+${JSON.stringify(betterlinks_auth)}},` +
		`body:JSON.stringify({target_url:location.href,title:document.title})` +
		`}).then(function(r){return r.json()}).then(function(d){` +
		`if(d&&d.data&&d.data.short_url){window.prompt('BetterLinks short link:',d.data.short_url)}` +
		`else{window.alert('BetterLinks: '+((d&&d.message)||'Could not create the link.'))}` +
		`}).catch(function(e){window.alert('BetterLinks: '+e)})})()`;

	return (
		<div className="btl-cle-dragable-section">
			<a onClick={(e) => e.preventDefault()} href={bookmarklet} className="button button-primary">
				{__('Quick Link Creation', 'betterlinks')}
			</a>
			<span>{__('Just Drag & Drop this button in your bookmark', 'betterlinks')}</span>
		</div>
	);
};
