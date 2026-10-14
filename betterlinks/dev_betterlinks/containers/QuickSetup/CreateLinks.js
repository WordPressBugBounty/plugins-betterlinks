import { __ } from '@wordpress/i18n';
import { Field, Form, Formik } from 'formik';
import { SetupContext } from 'index';
import { useContext, useState } from 'react';
import { redirectType } from 'utils/data';
import { generateShortURL, is_pro_enabled, modalCustomSmallStyles, plugin_root_url, site_url } from 'utils/helper';
import Select from 'components/Select';
import Modal from 'react-modal';
import UTMBuilder from 'components/UTMBuilder';
import Copy from 'components/Copy';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { update_quick_setup } from 'redux/actions/quick-setup.actions';

const CreateLink = (props) => {
	const { linkOptions, setLinkOptions, modal, settings } = useContext(SetupContext);
	const [slugIsExists, setSlugIsExists] = useState(false);
	const [modalUTMIsOpen, setModalUTMIsOpen] = useState(false);
	const [isShowCustomUTMModalContent, setIsShowCustomUTMModalContent] = useState(true);
	const { setUpgradeToProModal, openUpgradeToProModal } = modal;
	const [options, setOptions] = useState({ ...linkOptions, ...settings });
	const isDisableLinkFormEditView = betterLinksHooks.applyFilters('isDisableLinkFormEditView', false, options);

	const openUTMModal = () => {
		setModalUTMIsOpen(true);
	};
	const closeUTMModal = () => {
		setIsShowCustomUTMModalContent(true);
		setModalUTMIsOpen(false);
	};
	const builtInUTMModalOpenHandler = () => {
		if (is_pro_enabled) {
			setIsShowCustomUTMModalContent(false);
			openUTMModal();
		} else {
			openUpgradeToProModal();
		}
	};
	const handleTitleChange = (setFieldValue, title, short_url = null, targetUrl = null) => {
		setFieldValue('link_title', title);
		// Only update short_url for 'from_title' type, not for random types
		const generationType = settings?.url_slug_generation_type || 
			(settings?.is_random_string ? 'random_number' : 'from_title');
		
		if (generationType === 'from_title') {
			let shortURL = generateShortURL(settings, short_url || title, targetUrl, false);
			if (shortURL && shortURL.length > 0) {
				setFieldValue('short_url', shortURL);
				setSlugIsExists(false);
				return shortURL;
			}
		}
		return '';
	};

	const handleTargetUrlChange = (setFieldValue, targetUrl, title = null) => {
		const generationType = settings?.url_slug_generation_type || 
			(settings?.is_random_string ? 'random_number' : 'from_title');
		
		if (generationType === 'from_url') {
			let shortURL = generateShortURL(settings, title, targetUrl, false);
			if (shortURL && shortURL.length > 0) {
				setFieldValue('short_url', shortURL);
				setSlugIsExists(false);
			}
		}
	};

	const closeDuplicateLinkModal = () => {
		props.update_quick_setup({ duplicateLink: false });
	};

	return (
		<>
			<div className="create-links">
				<div className="bl-qs__head">
					<h2 className="bl-qs__head-title">{__('Create your first link', 'betterlinks')}</h2>
					<p className="bl-qs__head-desc">
						{__('Create a new link in seconds — set the slug, choose redirect rules, adjust link options and start tracking right away.', 'betterlinks')}
					</p>
				</div>
				<div className="option">
					{props?.duplicateLink && (
						<div className="duplicate-link-modal">
							<Modal
								isOpen={props.duplicateLink}
								onRequestClose={closeDuplicateLinkModal}
								style={modalCustomSmallStyles}
								ariaHideApp={false}
								parentSelector={() => document.querySelector('.create-links .option')}
							>
								<span className="btl-close-modal" onClick={closeDuplicateLinkModal}>
									<i className="btl btl-cancel" />
								</span>
								<h3>{__('Duplicate Link', 'betterlinks')}</h3>
								<p>{__('The short URL you entered is already exists. Please enter a different short URL.', 'betterlinks')}</p>
							</Modal>
						</div>
					)}
					<Formik initialValues={betterLinksHooks.applyFilters('linkFormInitialValues', options)} onSubmit={() => { }}>
						{(props) => {
							const { errors } = props;
							return (
								<Form className="ReactModal__Content">
									<div className="btl-entry-content">
										<Modal isOpen={modalUTMIsOpen} onRequestClose={closeUTMModal} style={modalCustomSmallStyles} ariaHideApp={false}>
											<span className="btl-close-modal" onClick={closeUTMModal}>
												<i className="btl btl-cancel" />
											</span>
											{isShowCustomUTMModalContent ? (
												<>
													{betterLinksHooks.applyFilters(
														'linksUTMBuilderField',
														<UTMBuilder targetUrl={props.values.target_url} saveValueHandler={props.setFieldValue} closeModalHandler={closeUTMModal} categoryId={props.values.cat_id} />,
														props.values.target_url,
														props.setFieldValue,
														closeUTMModal,
														props.values.cat_id
													)}
												</>
											) : (
												<React.Fragment>
													{betterLinksHooks.applyFilters('linksBuiltInUTMBuilderField', '', props.values.target_url, props.setFieldValue, closeUTMModal)}
												</React.Fragment>
											)}
										</Modal>
										<div className="btl-entry-content-left" style={{ marginBottom: '20px' }}>
											<div className="btl-modal-form-group">
												<label className="btl-modal-form-label btl-required" htmlFor="link_title">
													{__('Title', 'betterlinks')}
												</label>
												<div className="btl-modal-form-title-wrapper">
													<div
														style={{
															display: 'flex',
															flexDirection: 'column',
															width: '100%',
														}}
													>
														<Field
															className="btl-modal-form-control"
															id="link_title"
															name="link_title"
															disabled={isDisableLinkFormEditView}
															onChange={(e) => {
																const short_url = handleTitleChange(props.setFieldValue, e.target.value, null, props.values?.target_url);
																// Only update if short_url was actually generated (for from_title type)
																if (short_url) {
																	setLinkOptions((prev) => ({
																		...prev,
																		link_title: e.target.value,
																		short_url,
																	}));
																} else {
																	setLinkOptions((prev) => ({
																		...prev,
																		link_title: e.target.value,
																	}));
																}
															}}
															required
														/>
														{errors?.link_title && <span style={{ color: 'red' }}>{errors?.link_title}</span>}
													</div>
												</div>
											</div>
											<div className="btl-modal-form-group">
												<label className="btl-modal-form-label btl-required" htmlFor="redirect_type">
													{__('Redirect Type', 'betterlinks')}
												</label>
												<Select
													id="redirect_type"
													name="redirect_type"
													value={[
														...redirectType,
														{
															value: is_pro_enabled ? 'cloak' : 'pro',
															label: __('Cloaked', 'betterlinks'),
															disabled: !is_pro_enabled,
														},
													]}
													setUpgradeToProModal={setUpgradeToProModal}
													setFieldValue={props.setFieldValue}
													disabled={isDisableLinkFormEditView}
													isMulti={false}
													enable_password={false}
													isQuickSetup={true}
													setLinkOptions={setLinkOptions}
												/>
											</div>
											<div className="btl-modal-form-group btl-has-utm-button">
												<label className="btl-modal-form-label btl-required" htmlFor="target_url">
													{__('Target URL', 'betterlinks')}
												</label>
												<Field
													className="btl-modal-form-control"
													id="target_url"
													name="target_url"
													onChange={(e) => {
														const target_url = e.target.value.replace(/\s+/g, '');
														props.setFieldValue('target_url', target_url);
														setLinkOptions((prev) => ({
															...prev,
															target_url,
														}));
														// Handle URL-based slug generation
														handleTargetUrlChange(props.setFieldValue, target_url, props.values?.link_title);
													}}
													placeholder=""
													disabled={isDisableLinkFormEditView}
													required
												/>
												<div className="btl-utm-button-group">
													<button
														type="button"
														className={`btl-utm-button ${props.values.target_url && (props.values.target_url.includes('utm_source') || props.values.target_url.includes('utm_medium') || props.values.target_url.includes('utm_campaign') || props.values.target_url.includes('utm_term') || props.values.target_url.includes('utm_content')) ? 'btl-utm-button--applied' : 'btl-utm-button--not-applied'}`}
														onClick={openUTMModal}
														disabled={isDisableLinkFormEditView}
													>
														{__('UTM', 'betterlinks')}
														{props.values.target_url && (props.values.target_url.includes('utm_source') || props.values.target_url.includes('utm_medium') || props.values.target_url.includes('utm_campaign') || props.values.target_url.includes('utm_term') || props.values.target_url.includes('utm_content')) && (
															<span className="btl-utm-badge">
																<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
																	<path d="M10.332 1.22725C11.3375 1.80782 12.174 2.64093 12.7586 3.64411C13.3432 4.6473 13.6556 5.78576 13.665 6.94681C13.6744 8.10785 13.3803 9.25121 12.812 10.2637C12.2437 11.2762 11.4209 12.1227 10.4249 12.7195C9.42886 13.3162 8.29428 13.6425 7.13343 13.666C5.97258 13.6894 4.82573 13.4094 3.8064 12.8534C2.78707 12.2975 1.93061 11.4849 1.32181 10.4963C0.713006 9.50758 0.372971 8.37705 0.335365 7.21658L0.332031 7.00058L0.335365 6.78458C0.3727 5.63324 0.70773 4.51122 1.30779 3.52791C1.90785 2.5446 2.75247 1.73355 3.75929 1.17383C4.76612 0.614121 5.90079 0.324844 7.0527 0.334205C8.20461 0.343565 9.33443 0.651244 10.332 1.22725ZM9.47003 5.19591C9.35524 5.08113 9.2025 5.01217 9.04048 5.00199C8.87847 4.9918 8.7183 5.04108 8.59003 5.14058L8.52736 5.19591L6.33203 7.39058L5.47003 6.52925L5.40736 6.47391C5.27909 6.37448 5.11895 6.32526 4.95697 6.33548C4.79499 6.3457 4.6423 6.41466 4.52754 6.52942C4.41278 6.64418 4.34382 6.79687 4.3336 6.95885C4.32338 7.12083 4.3726 7.28097 4.47203 7.40925L4.52736 7.47191L5.8607 8.80525L5.92336 8.86058C6.04028 8.95129 6.18405 9.00052 6.33203 9.00052C6.48001 9.00052 6.62378 8.95129 6.7407 8.86058L6.80336 8.80525L9.47003 6.13858L9.52536 6.07591C9.62486 5.94764 9.67414 5.78748 9.66396 5.62546C9.65377 5.46344 9.58482 5.31071 9.47003 5.19591Z" fill="#6FD965" />
																</svg>
															</span>
														)}
													</button>
													</div>
											</div>
											<div className="btl-modal-shorturl-wrap">
												<div className="btl-modal-form-group shorturl">
													<label className="btl-modal-form-label" htmlFor="short_url">
														{__('Shortened URL', 'betterlinks')}
													</label>
													<div className={slugIsExists ? 'btl-link-field-copyable is-invalid' : 'btl-link-field-copyable'}>
														<span className="btl-static-link">{site_url + '/'}</span>
														<Field
															className="btl-dynamic-link"
															id="short_url"
															name="short_url"
															onChange={(e) => {
																const short_url = e.target.value.replace(/\s+/g, '-');
																props.setFieldValue('short_url', short_url);
																setLinkOptions((prev) => ({
																	...prev,
																	short_url,
																}));
																setSlugIsExists(false);
															}}
															disabled={isDisableLinkFormEditView}
															required
														/>
														<Copy siteUrl={site_url} shortUrl={props.values.short_url} />
													{!is_pro_enabled ? (
														<button
															type="button"
															className="btl-link-share-button btl-link-share-button--locked"
															onClick={builtInUTMModalOpenHandler}
															disabled={isDisableLinkFormEditView}
															title={__('Social Share', 'betterlinks')}
														>
															<i className="btl btl-share"></i>
															<img className="locked" src={plugin_root_url + 'assets/images/lock-round.svg'} alt="icon" />
														</button>
													) : (
														<button
															type="button"
															className="btl-link-share-button"
															onClick={builtInUTMModalOpenHandler}
															disabled={isDisableLinkFormEditView}
															title={__('Social Share', 'betterlinks')}
														>
															<i className="btl btl-share"></i>
														</button>
													)}
													</div>
												</div>
												{slugIsExists == true && <div className="errorlog">{__('Already Exists', 'betterlinks')}</div>}
											</div>
											{/* <div className="btl-modal-form-group">
												<label className="btl-modal-form-label" htmlFor="catId">
													{__('Category', 'betterlinks')}
												</label>
												<Category catId={parseInt(linkOptions.cat_id)} data={terms} fieldName="cat_id" setFieldValue={props.setFieldValue} disabled={isDisableLinkFormEditView} />
											</div> */}
										</div>
										<div className="btl-entry-content-right">
											<div className="link-options link-options--open">
												<button className="link-options__head" type="button">
													<h4 className="link-options__head--title">{__('Link Options', 'betterlinks')}</h4>
												</button>
												<div className="link-options__body">
													<label className="btl-checkbox-field">
														<Field
															className="btl-check"
															name="nofollow"
															type="checkbox"
															onChange={() => {
																props.setFieldValue('nofollow', !props.values.nofollow);
																setLinkOptions((prev) => ({
																	...prev,
																	nofollow: !props.values.nofollow,
																}));
															}}
															disabled={isDisableLinkFormEditView}
														/>
														<span className="text">
															{__('No Follow', 'betterlinks')}
															<div className="btl-tooltip">
																<span className="dashicons dashicons-info-outline"></span>
																<span className="btl-tooltiptext">{__('This will add nofollow attribute to your link. (Recommended)', 'betterlinks')}</span>
															</div>
														</span>
													</label>
													<label className="btl-checkbox-field">
														<Field
															className="btl-check"
															name="sponsored"
															type="checkbox"
															onChange={() => {
																props.setFieldValue('sponsored', !props.values.sponsored);
																setLinkOptions((prev) => ({
																	...prev,
																	sponsored: !props.values.sponsored,
																}));
															}}
															disabled={isDisableLinkFormEditView}
														/>
														<span className="text">
															{__('Sponsored', 'betterlinks')}
															<div className="btl-tooltip">
																<span className="dashicons dashicons-info-outline"></span>
																<span className="btl-tooltiptext">{__('This will add sponsored attribute to your link. (Recommended for Affiliate links)', 'betterlinks')}</span>
															</div>
														</span>
													</label>
													<label className="btl-checkbox-field">
														<Field
															className="btl-check"
															name="param_forwarding"
															type="checkbox"
															onChange={() => {
																props.setFieldValue('param_forwarding', !props.values.param_forwarding);
																setLinkOptions((prev) => ({
																	...prev,
																	param_forwarding: !props.values.param_forwarding,
																}));
															}}
															disabled={isDisableLinkFormEditView}
														/>
														<span className="text">
															{__('Parameter Forwarding', 'betterlinks')}
															<div className="btl-tooltip">
																<span className="dashicons dashicons-info-outline"></span>
																<span className="btl-tooltiptext">{__('This will pass the parameters you have set in the target URL', 'betterlinks')}</span>
															</div>
														</span>
													</label>
													<label className="btl-checkbox-field">
														<Field
															className="btl-check"
															name="track_me"
															type="checkbox"
															onChange={() => {
																props.setFieldValue('track_me', !props.values.track_me);
																setLinkOptions((prev) => ({
																	...prev,
																	track_me: !props.values.track_me,
																}));
															}}
															disabled={isDisableLinkFormEditView}
														/>
														<span className="text">
															{__('Tracking', 'betterlinks')}
															<div className="btl-tooltip">
																<span className="dashicons dashicons-info-outline"></span>
																<span className="btl-tooltiptext">{__('This will let you check Analytics report of your links', 'betterlinks')}</span>
															</div>
														</span>
													</label>
													{/* {!is_pro_enabled && (
														<label className="btl-checkbox-field link-options--teasers" onClick={() => openUpgradeToProModal()}>
															<Field
																disabled={true}
																className="btl-check"
																type="checkbox"
																checked={false}
																onChange={() => openUpgradeToProModal()}
																onClick={() => openUpgradeToProModal()}
															/>
															<span className="text">
																{__('Uncloak', 'betterlinks')}
																<ProBadge />
																<div className="btl-tooltip">
																	<span className="dashicons dashicons-info-outline"></span>
																	<span className="btl-tooltiptext">{__('This will uncloak your link', 'betterlinks')}</span>
																</div>
															</span>
														</label>
													)} */}
													{/* {betterLinksHooks.applyFilters('linkOptionsBasic', null, { ...props, isDisableLinkFormEditView, Field, ...settings })} */}
												</div>
											</div>
										</div>
									</div>
								</Form>
							);
						}}
					</Formik>
				</div>
			</div>
		</>
	);
};
const mapStateToProps = (state) => ({
	duplicateLink: state.quickSetup?.duplicateLink,
});
const mapDispatchToProps = (dispatch) => ({
	update_quick_setup: bindActionCreators(update_quick_setup, dispatch),
});
export default connect(mapStateToProps, mapDispatchToProps)(CreateLink);
