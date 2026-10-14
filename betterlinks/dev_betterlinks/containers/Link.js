import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';
import Modal from 'react-modal';
import Select from 'components/Select';
import { Formik, Field, Form } from 'formik';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import _ from 'lodash';

//👇 slight tweak (renamed 'fetch_terms_data' to 'fetch_terms_action_function') to use the <Link /> component inside gutenberg
import { fetch_terms_data as fetch_terms_action_function, fetch_all_categories, fetch_all_tags } from 'redux/actions/terms.actions';
import { fetch_links_data } from 'redux/actions/links.actions';

import {
	modalCustomStyles,
	modalCustomSmallStyles,
	site_url as site_link,
	generateSlug,
	generateShortURL,
	formatDate,
	plugin_root_url,
	is_pro_enabled,
	pro_needs_update,
	add_top_loader,
	remove_top_loader,
	shortURLUniqueCheck,
	makeRequest,
} from 'utils/helper';
import { redirectType, redirectTypeForPasswordProtection } from 'utils/data';
import Category from 'components/Terms/Category';
import Tags from 'components/Terms/Tags';
import Copy from 'components/Copy';
import UTMBuilder from 'components/UTMBuilder';
import UpgradeToPro from 'components/Teasers/UpgradeToPro';
import CustomizeLinkPreview from 'components/CustomizeLinkPreview';
import CustomTrackingScripts from 'components/CustomTrackingScripts';
import { fetch_tracking_settings } from 'redux/actions/settings.actions';
import LinkFields from 'components/CustomFields/LinkFields';
import FetchedTitleConfirmation from 'components/Link/FetchedTitleConfirmation';
import AdvanceOptionTeaser from 'components/Teasers/Link/AdvanceOptionTeaser';
import DynamicRedirectsTeaser from 'components/Teasers/Link/DynamicRedirectsTeaser';
import ProBadge from 'components/Badge/ProBadge';
import AIBulkLinkTeaser from 'components/Teasers/AIBulkLinkTeaser';
import ProUpdateRequired from 'components/Teasers/ProUpdateRequired';
import { LinkEditIcon, LinkDulicateIcon } from 'components/SvgIcons';

const propTypes = {
	isShowIcon: PropTypes.bool,
	catId: PropTypes.number,
	catName: PropTypes.string,
	data: PropTypes.object,
	submitHandler: PropTypes.func,
};

export const Link = (props) => {
	const {
		isShowIcon = true,
		catId,
		data,
		submitHandler, // this is add_new_link function
		fetch_terms_data,
		plusIcon = false, // redesign: render a leading + icon on the create button
		createLabel, // redesign: custom create-button text ("New link" / "Add link")
		aiLabel, // redesign: custom AI bulk generator button text

		//👇 these flowwowing props will be passed from the component's gutenberg call
		betterlinksGutenStore,
		setShowLinkModal = () => { },
		searchFieldRef,
		linkNewTab,
		type = '',
	} = props;

	//👇 slight tweaks to use <Link /> component inside gutenberg start
	const settings = betterlinksGutenStore ? betterlinksGutenStore?.getState()?.settings : props.settings;
	const terms = betterlinksGutenStore ? betterlinksGutenStore?.getState()?.terms : props.terms;
	window.betterLinksHooks = betterlinksGutenStore ? { applyFilters: (handle, defaultVal) => defaultVal } : window.betterLinksHooks;
	//👆 slight tweaks to use <Link /> component inside gutenberg end

	const [modalIsOpen, setModalIsOpen] = useState(false);
	const [isFetchTerms, setIsFetchTerms] = useState(false);
	const [slugIsExists, setSlugIsExists] = useState(false);
	// "Redirect this path anyway" for a slug that shadows WordPress content.
	const [wpUrlOverride, setWpUrlOverride] = useState(false);
	// A new slug needs a fresh check, and a confirmation given for the old one
	// must not carry over to it.
	const clearSlugCheck = () => {
		setSlugIsExists(false);
		setWpUrlOverride(false);
	};
	const [modalUTMIsOpen, setModalUTMIsOpen] = useState(false);
	const [isOpenUpgradeToProModal, setUpgradeToProModal] = useState(false);
	const [isShowCustomUTMModalContent, setIsShowCustomUTMModalContent] = useState(true);
	const [isAIBulkLinkOpen, setIsAIBulkLinkOpen] = useState(false);
	// AI Bulk Link Generator is implemented in BetterLinks Pro (filter below). These
	// callbacks let it refresh the free links list and terms after publishing. The
	// dispatchers are absent inside the gutenberg editor, where they are no-ops.
	const { fetch_links_data: dispatchFetchLinks, fetch_all_categories: dispatchFetchCategories, fetch_all_tags: dispatchFetchTags } = props;
	const closeAIBulkLink = useCallback(() => setIsAIBulkLinkOpen(false), []);
	const refreshAIBulkLinks = useCallback(() => (typeof dispatchFetchLinks === 'function' ? dispatchFetchLinks() : Promise.resolve()), [dispatchFetchLinks]);
	const refreshAIBulkTerms = useCallback(
		() =>
			Promise.all([
				typeof fetch_terms_data === 'function' ? fetch_terms_data() : null,
				typeof dispatchFetchCategories === 'function' ? dispatchFetchCategories() : null,
				typeof dispatchFetchTags === 'function' ? dispatchFetchTags() : null,
			]),
		[fetch_terms_data, dispatchFetchCategories, dispatchFetchTags]
	);
	const currentDate = formatDate(new Date(), 'yyyy-mm-dd h:m:s');
	const isDisableLinkFormEditView = betterLinksHooks.applyFilters('isDisableLinkFormEditView', false, data);
	const [isOpenLinkPanel, setOpenLinkPanel] = useState({
		options: true,
		advanced: false,
		dynamicRedirect: false,
		optimizeMetaTags: false,
		customTrackingScripts: false,
	});
	const [fetchedTitle, setFetchedTitle] = useState(null);

	const customFields = settings?.settings?.customFields || [];
	//👇 this useEffect is only for this 'Link' component's gutenberg implementation start
	useEffect(() => {
		if (betterlinksGutenStore) {
			setModalIsOpen(true);
		}
		return () => {
			if (searchFieldRef?.current) {
				searchFieldRef?.current?.focus();
			}
		};
	}, [betterlinksGutenStore]);
	// 👆 this useEffect is only for this 'Link' component's gutenberg implementation end

	//👇 this variable 'objForGutenTargetBlank' added to handle the 'open in new tab' option in gutenberg format
	const objForGutenTargetBlank = betterlinksGutenStore
		? {
			openInNewTab: linkNewTab,
		}
		: {};

	const initialValues = {
		link_title: '',
		link_slug: '',
		target_url: '',
		short_url: generateShortURL(settings.settings, null, null, true),
		link_note: '',
		link_date: currentDate,
		link_date_gmt: currentDate,
		link_modified: currentDate,
		link_modified_gmt: currentDate,
		redirect_type: '307',
		cat_id: catId || settings?.settings?.default_category || '1', // Default to "Uncategorized" (ID: 1)
		tags_id: [], // Initialize empty tags array for new links
		...settings.settings,
		...objForGutenTargetBlank,
	};

	const initialUpdateValues = {
		...settings.settings,
		link_modified: currentDate,
		link_modified_gmt: currentDate,
		cat_id: catId,
		old_short_url: data ? data.short_url : '',
		...data,
		...objForGutenTargetBlank,
	};

	function openModal() {
		// Start every open with a clean slate — the submit path closes the drawer
		// via setModalIsOpen(false) (not closeModal), so reset here too to guarantee
		// no stale fetched-title suggestion carries over from a previous link.
		setFetchedTitle(null);
		setIsFetchTerms(true);

		//👇 this line added because for gutenberg implementaton 'fetch_terms_data' function call isn't needed
		if (betterlinksGutenStore) return false;

		if (terms?.terms) {
			setModalIsOpen(true);
			setIsFetchTerms(false);
		} else {
			fetch_terms_data().then(() => {
				setModalIsOpen(true);
				setIsFetchTerms(false);
			});
		}
	}

	function closeModal() {
		// Clear any leftover auto-fetched-title suggestion so it doesn't reappear
		// the next time the (persistently-mounted) drawer is opened.
		setFetchedTitle(null);
		//👇 this following code is only for gutenberg implementation of the 'Link' component & to make sure memory leak doesn't happen ('Can't perform a React state update on an unmounted component')
		if (betterlinksGutenStore) {
			setShowLinkModal(false);
		} else {
			setModalIsOpen(false);
		}
	}

	const openUTMModal = () => {
		setModalIsOpen(true);
		setModalUTMIsOpen(true);
	};

	const builtInUTMModalOpenHandler = () => {
		if (is_pro_enabled) {
			setIsShowCustomUTMModalContent(false);
			openUTMModal();
		} else {
			openUpgradeToProModal();
		}
	};

	const closeUTMModal = () => {
		setIsShowCustomUTMModalContent(true);
		setModalUTMIsOpen(false);
	};

	const openUpgradeToProModal = () => {
		setUpgradeToProModal(true);
	};
	const closeUpgradeToProModal = () => {
		setUpgradeToProModal(false);
	};

	const onSubmit = (values) => {
		const { short_url } = values;
		values.short_url = short_url.substring(0, short_url.length - +(short_url.lastIndexOf('/') == short_url.length - 1));
		shortURLUniqueCheck(values.short_url, values.ID, setSlugIsExists, wpUrlOverride).then((isDuplicate) => {
			if (!isDuplicate) {
				// Set only once the user ticked "Redirect this path anyway" for this
				// slug; changing the slug clears the tick again.
				if (wpUrlOverride) {
					values.allow_wp_url_override = true;
				} else {
					delete values.allow_wp_url_override;
				}
				if (!values.cat_id) {
					// Priority: 1) Contextual category (catId), 2) Default category setting, 3) Fallback to uncategorized
					if (catId) {
						// Category-specific link creation - use the contextual category
						values.cat_id = catId;
					} else {
						// Global link creation - use default category setting
						const defaultCategoryId = settings?.settings?.default_category;
						if (defaultCategoryId) {
							values.cat_id = defaultCategoryId;
						} else {
							const uncategorizedTerm = terms.terms.filter((item) => item.term_slug == 'uncategorized')[0];
							values.cat_id = uncategorizedTerm ? uncategorizedTerm.ID : 1;
						}
					}
				}
				if (!values.link_slug) {
					values.link_slug = generateSlug(values.link_title);
				}
				if (isNaN(values?.cat_id)) {
					values.cat_slug = generateSlug(values.cat_id);
				}
				values.wildcards = Number(values.short_url.includes('*'));
				if (values.cat_id) {
					const link_title = values.link_title.trim();
					if (link_title) {
						values.link_title = link_title;
						// 👇 the 'if statement' is to fix memory leak warning 'Can't perform a React state update on an unmounted component' when using this <Link /> component for gutenberg format
						if (!betterlinksGutenStore) {
							submitHandler(values);
							setModalIsOpen(false);
						} else {
							submitHandler(values)
								.then((response) => {
									if (response?.data) {
										setShowLinkModal(false);
									}
									remove_top_loader(document);
								})
								.catch((error) => console.log('---error (submitHandler)--', { error }));
							add_top_loader(document);
						}
					}
				}
			}
		});
	};

	const togglePanel = (type) => {
		setOpenLinkPanel({
			options: false,
			advanced: false,
			dynamicRedirect: false,
			[type]: !isOpenLinkPanel[type],
		});
	};

	const __handleToggle = (toggle) => {
		togglePanel(toggle);
	};

	const fetchTargetURL = useCallback(
		_.debounce(async (target_url, setFieldValue, willUpdate, previousTitle) => {
			try {
				// Check if auto title suggestion is enabled
				const isAutoTitleEnabled = settings?.settings?.enable_auto_title_suggestion !== false;
				if (!isAutoTitleEnabled) {
					return;
				}

				const res = await makeRequest({
					action: 'betterlinks__fetch_target_url',
					target_url,
				});
				if (res.data.result) {
					let fetchedTitle = res.data.result?.title;
					if (fetchedTitle === previousTitle) return;
					let short_url = null;
					if (fetchedTitle.length > 20) {
						short_url = fetchedTitle
							.split(' ')
							.map((item) => item[0])
							.join('');
					}
					if (!willUpdate) {
						setFetchedTitle(fetchedTitle);
						return;
					}
					handleTitleChange(setFieldValue, fetchedTitle || '', short_url, target_url);
				}
			} catch (error) {
				console.log(error);
			}
		}, 500),
		[settings.settings]
	);

	const handleTitleChange = (setFieldValue, title, short_url = null, targetUrl = null) => {
		setFieldValue('link_title', title);
		if (!data) {
			// Only update short_url for 'from_title' type, not for random types
			const generationType = settings.settings?.url_slug_generation_type || 
				(settings.settings?.is_random_string ? 'random_number' : 'from_title');
			
			if (generationType === 'from_title') {
				let shortURL = generateShortURL(settings.settings, short_url || title, targetUrl, false);
				if (shortURL && shortURL.length > 0) {
					setFieldValue('short_url', shortURL);
					clearSlugCheck();
				}
			}
			// For random types (random_string, random_number, random_mixed), 
			// the slug remains fixed from initial generation
		}
	};

	const handleTargetUrlChange = (setFieldValue, targetUrl, title = null) => {
		if (!data) {
			const generationType = settings.settings?.url_slug_generation_type || 
				(settings.settings?.is_random_string ? 'random_number' : 'from_title');
			
			if (generationType === 'from_url') {
				let shortURL = generateShortURL(settings.settings, title, targetUrl, false);
				if (shortURL && shortURL.length > 0) {
					setFieldValue('short_url', shortURL);
					clearSlugCheck();
				}
			}
		}
	};

	const handleTargetUrlBlur = (setFieldValue, targetUrl) => {
		if (!targetUrl) return;

		const trimmedUrl = targetUrl.trim();
		
		// Check if the URL starts with a slash (local slug)
		if (trimmedUrl.startsWith('/')) {
			// Remove trailing slash from site_url if it exists
			const baseSiteUrl = site_url.replace(/\/$/, '');
			// Construct the full URL
			const fullUrl = baseSiteUrl + trimmedUrl;
			
			// Validate the URL
			try {
				new URL(fullUrl);
				// If valid, update the field value
				setFieldValue('target_url', fullUrl);
			} catch (error) {
				// If invalid URL, keep the original value
				console.warn('Invalid URL constructed:', fullUrl);
			}
		}
	};

	const submitLinkHandler = (values, actions) => {
		const { setSubmitting, setFieldError } = actions;
		setSubmitting(false);

		const regex = /<script\b[^>]*>[\s\S]*?<\/script\b[^>]*>/;
		if (regex.test(values.link_title)) {
			setFieldError('link_title', __('Please ensure the link title does not contain any script.', 'betterlinks'));
			return;
		}

		if (values?.enable_custom_scripts && !values?.custom_tracking_scripts) {
			setFieldError('custom_tracking_scripts', true);
			return;
		}

		// Validate and filter dynamic redirect data
		if (values?.dynamic_redirect && values.dynamic_redirect.type && values.dynamic_redirect.type !== 'none') {
			const { type, value, extra } = values.dynamic_redirect;

			// Helper function to filter valid entries based on type
			const filterValidEntries = (type, value) => {
				if (!value || !Array.isArray(value)) return [];

				switch (type) {
					case 'rotation':
						return value.filter(item => item.link && item.link.trim() !== '' && item.weight > 0);
					case 'geographic':
						return value.filter(item =>
							item.link && item.link.trim() !== '' &&
							item.country && (Array.isArray(item.country) ? item.country.length > 0 : item.country.trim() !== '')
						);
					case 'technology':
						return value.filter(item => item.link && item.link.trim() !== '');
					case 'time':
						return value.filter(item =>
							item.link && item.link.trim() !== '' &&
							item.start_date && item.end_date
						);
					default:
						return value;
				}
			};

			const filteredValue = filterValidEntries(type, value);

			// Validate dynamic redirect settings
			if (filteredValue.length === 0) {
				setFieldError('dynamic_redirect', __('At least one valid entry is required for dynamic redirect.', 'betterlinks'));
				return;
			}

			if (type === 'rotation' && extra?.rotation_mode === 'weighted') {
				const totalWeight = filteredValue.reduce((acc, item) => acc + (item.weight || 0), 0);
				if (totalWeight !== 100) {
					setFieldError('dynamic_redirect', __('The total of all target URL percentages must equal 100% before you can continue.', 'betterlinks'));
					return;
				}
			}

			if (type === 'time') {
				for (let item of filteredValue) {
					if (item.start_date && item.end_date && item.start_date > item.end_date) {
						setFieldError('dynamic_redirect', __('Your Time Period Redirect start time must come before the end time.', 'betterlinks'));
						return;
					}
				}
			}

			// Update values with filtered data
			values.dynamic_redirect.value = filteredValue;
		}

		// Uncloaking is a BetterLinks Pro option. Without Pro the form has no
		// uncloak field, so an update leaves the stored value as it is.
		if (!is_pro_enabled && data && '' === type) {
			delete values.uncloaked;
		}

		if ('duplicate' === type) {
			delete values.ID;
			delete values.analytic;
			delete values.favorite;
			// FIX: Clear old_short_url when duplicating to prevent JSON sync issues
			// This ensures the new link is treated as a completely new entry
			delete values.old_short_url;
			values.link_date = currentDate;
			values.link_date_gmt = currentDate;
			values.link_modified = currentDate;
			values.link_modified_gmt = currentDate;
		}
		onSubmit(values);
	};

	const site_url = betterLinksHooks.applyFilters('site_url', site_link);

	return (
		<>
			{data ? (
				<button
					onClick={openModal}
					className={`dnd-link-button ${isFetchTerms ? 'btl-rotating' : ''}`}
					// Icon-only trigger (no children): expose the action as its accessible
					// name. With children it's a text button and already named.
					aria-label={!props.children ? ('duplicate' === type ? __('Create Duplicate', 'betterlinks') : __('Edit Link', 'betterlinks')) : undefined}
				>
					<span style={{ textDecoration: 'underline', cursor: 'pointer' }}>{props.children}</span>
					{!props.children && <span className="icon">{!isFetchTerms ? ('' === type ? <LinkEditIcon size={15} /> : <LinkDulicateIcon size={15} />) : <i className="btl btl-reload"></i>}</span>}
				</button>
			) : (
				<>
					<button onClick={openModal} className={`btl-create-link-button ${isShowIcon && isFetchTerms ? 'btl-rotating' : ''}`}>
						{(plusIcon || isShowIcon) && <i className="btl btl-add"></i>}
						{createLabel ? <span>{createLabel}</span> : !isShowIcon && __('Add New Link', 'betterlinks')} {!isShowIcon && isFetchTerms ? ' ...' : ''}
					</button>
					{
						// Not offered inside the gutenberg editor: hooks are stubbed there, so
						// BetterLinks Pro cannot provide the generator.
						! isShowIcon && ! betterlinksGutenStore && (
							<div className="btl-ai-button-wrapper"
								onClick={() => setIsAIBulkLinkOpen(true)}
							>
								<button className="btl-ai-button">
									<img src={plugin_root_url + '/assets/images/icons/ai-btn-icon.svg'} alt="AI Icon" />
									<span>{aiLabel || __('AI Bulk Link Generator', 'betterlinks')}</span>
								</button>
							</div>
						)
					}
				</>
			)}
			<Modal isOpen={modalIsOpen} onRequestClose={closeModal} closeTimeoutMS={300} portalClassName="bl-drawer-portal" ariaHideApp={false}>
				<Formik initialValues={betterLinksHooks.applyFilters('linkFormInitialValues', data ? initialUpdateValues : initialValues)} onSubmit={submitLinkHandler}>
					{(props) => {
						const redirectionTypes = props.values?.enable_password ? redirectTypeForPasswordProtection : redirectType;
						const { errors } = props;
						return (
							<Form className="bl-drawer">
								<div className="bl-drawer__header">
									<span className="bl-drawer__title">
										{data && '' === type ? __('Edit link', 'betterlinks') : __('Add new link', 'betterlinks')}
									</span>
									<button type="button" className="bl-drawer__close" onClick={closeModal} aria-label={__('Close', 'betterlinks')}>
										<i className="btl btl-cancel" />
									</button>
								</div>
								<div className="btl-entry-content">
									<UpgradeToPro isOpenModal={isOpenUpgradeToProModal} closeModal={closeUpgradeToProModal} />
									<Modal isOpen={modalUTMIsOpen} onRequestClose={closeUTMModal} style={modalCustomSmallStyles} ariaHideApp={false}>
										<span className="btl-close-modal" onClick={closeUTMModal}>
											<i className="btl btl-cancel" />
										</span>
										{isShowCustomUTMModalContent ? (
											<React.Fragment>
												{betterLinksHooks.applyFilters(
													'linksUTMBuilderField',
													<UTMBuilder targetUrl={props.values.target_url} saveValueHandler={props.setFieldValue} closeModalHandler={closeUTMModal} categoryId={props.values.cat_id} />,
													props.values.target_url,
													props.setFieldValue,
													closeUTMModal,
													props.values.cat_id
												)}
											</React.Fragment>
										) : (
											<React.Fragment>
												{betterLinksHooks.applyFilters('linksBuiltInUTMBuilderField', '', site_url + '/' + props.values.short_url, props.setFieldValue, closeUTMModal)}
											</React.Fragment>
										)}
									</Modal>
									<div className="btl-entry-content-left" style={{ marginBottom: '20px' }}>
										<div className="btl-modal-form-group" data-testid="btl-link-title">
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
															handleTitleChange(props.setFieldValue, e.target.value, null, props.values?.target_url);
														}}
														required
													/>
													{errors.link_title && <span style={{ color: 'red' }}>{errors.link_title}</span>}
												</div>
												{fetchedTitle && (
													<FetchedTitleConfirmation
														fetchedTitle={fetchedTitle}
														handleYes={() => {
															handleTitleChange(props.setFieldValue, fetchedTitle, null, props.values?.target_url);
															setFetchedTitle(null);
														}}
														handleNo={() => setFetchedTitle(null)}
													/>
												)}
											</div>
										</div>
										<div className="btl-modal-form-group " data-testid="btl-link-note">
											<label className="btl-modal-form-label" htmlFor="link_note">
												{__('Description', 'betterlinks')}
											</label>
											<Field className="btl-modal-form-control" component="textarea" id="link_note" name="link_note" disabled={isDisableLinkFormEditView} />
										</div>
										<div className="btl-modal-form-group" data-testid="btl-redirect-type">
											<label className="btl-modal-form-label btl-required" htmlFor="redirect_type">
												{__('Redirect Type', 'betterlinks')}
											</label>
											<Select
												id="redirect_type"
												name="redirect_type"
												value={[
													...redirectionTypes,
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
												enable_password={props.values?.enable_password}
											/>
										</div>
										<div className="btl-modal-form-group btl-has-utm-button" data-testid="btl-target-url">
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
													const willUpdateTitle = '' === props.values?.link_title;
													fetchTargetURL(target_url, props.setFieldValue, willUpdateTitle, props.values?.link_title);
													// Handle URL-based slug generation
													handleTargetUrlChange(props.setFieldValue, target_url, props.values?.link_title);
												}}
												onBlur={(e) => {
													handleTargetUrlBlur(props.setFieldValue, e.target.value);
												}}
												placeholder=""
												disabled={isDisableLinkFormEditView}
												required
											/>
											<div className="btl-utm-button-group">
												<button
													type="button"
													className={`btl-utm-button ${props.values.target_url && (props.values.target_url.includes('utm_source') || props.values.target_url.includes('utm_medium') || props.values.target_url.includes('utm_campaign') || props.values.target_url.includes('utm_term') || props.values.target_url.includes('utm_content')) ? 'btl-utm-button--applied' : 'btl-utm-button--not-applied'}`}
													data-testid="btl-utm-button"
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
											<div className="btl-modal-form-group shorturl" data-testid="btl-short-url">
												<label className="btl-modal-form-label" htmlFor="short_url">
													{__('Shortened URL', 'betterlinks')}
												</label>
												<div className={slugIsExists && !(slugIsExists.overridable && wpUrlOverride) ? 'btl-link-field-copyable is-invalid' : 'btl-link-field-copyable'}>
													<span className="btl-static-link">{site_url + '/'}</span>
													<Field
														className="btl-dynamic-link"
														data-testid="btl-short-url"
														id="short_url"
														name="short_url"
														onChange={(e) => {
															props.setFieldValue('short_url', e.target.value.replace(/\s+/g, '-'));
															clearSlugCheck();
														}}
														disabled={isDisableLinkFormEditView}
														required
													/>
													<Copy siteUrl={site_url} shortUrl={props.values.short_url} />
													{!is_pro_enabled ? (
														<button type="button" className="btl-link-share-button btl-link-share-button--locked" data-testid="btl-share-button" onClick={builtInUTMModalOpenHandler} disabled={isDisableLinkFormEditView} title={__('Social Share', 'betterlinks')}>
															<i className="btl btl-share"></i>
															<img className="locked" src={plugin_root_url + 'assets/images/lock-round.svg'} alt="icon" />
														</button>
													) : (
														<button type="button" className="btl-link-share-button" data-testid="btl-share-button" onClick={builtInUTMModalOpenHandler} disabled={isDisableLinkFormEditView} title={__('Social Share', 'betterlinks')}>
															<i className="btl btl-share"></i>
														</button>
													)}
												</div>
											</div>
											{slugIsExists && !slugIsExists.overridable && <div className="errorlog">{slugIsExists.message || __('Already Exists', 'betterlinks')}</div>}
											{/* WordPress content at this path: a deliberate redirect is allowed once confirmed. */}
											{slugIsExists?.overridable && (
												<div className="errorlog errorlog--overridable">
													<span>{slugIsExists.message}</span>
													<label className="btl-wp-url-override">
														<input type="checkbox" checked={wpUrlOverride} onChange={(e) => setWpUrlOverride(e.target.checked)} disabled={isDisableLinkFormEditView} />
														<span>{__('Redirect this path anyway. Visitors to it will be sent to the target URL.', 'betterlinks')}</span>
													</label>
												</div>
											)}
										</div>
										<div className="btl-modal-form-group" data-testid="btl-cat-id">
											<label className="btl-modal-form-label" htmlFor="catId">
												{__('Category', 'betterlinks')}
											</label>
											<Category
												catId={parseInt(catId || settings?.settings?.default_category || 1)}
												data={terms}
												fieldName="cat_id"
												setFieldValue={props.setFieldValue}
												disabled={isDisableLinkFormEditView}
											/>
										</div>
										<div className="btl-modal-form-group" data-testid="btl-tags-id">
											<label className="btl-modal-form-label" htmlFor="tags">
												{__('Tags', 'betterlinks')}
											</label>
											<Tags linkId={data ? parseInt(data.ID) : 0} fieldName="tags_id" data={terms} setFieldValue={props.setFieldValue} disabled={isDisableLinkFormEditView} />
										</div>
										{/* Custom Native Fields are here */}
										{customFields?.length > 0 && <LinkFields props={props} customFields={customFields} />}

									</div>
									<div className="btl-entry-content-right">
										<div className={`link-options ${isOpenLinkPanel.options ? 'link-options--open' : ''}`}>
											<button className="link-options__head" type="button" onClick={() => togglePanel('options')}>
												<h4 className="link-options__head--title">{__('Link Options', 'betterlinks')}</h4> <i className="btl btl-angle-arrow-down"></i>
											</button>
											<div className="link-options__body">
												{betterlinksGutenStore && (
													<label className="btl-checkbox-field">
														<Field
															className="btl-check"
															name="openInNewTab"
															type="checkbox"
															onChange={() => props.setFieldValue('openInNewTab', !props.values.openInNewTab)}
															disabled={false}
														/>
														<span className="text">
															{__('Open In New Tab', 'betterlinks')}
															<div className="btl-tooltip">
																<span className="dashicons dashicons-info-outline"></span>
																<span className="btl-tooltiptext">{__('This will open your link in a new tab when clicked', 'betterlinks')}</span>
															</div>
														</span>
													</label>
												)}

												<label className="btl-checkbox-field">
													<Field
														className="btl-check"
														name="nofollow"
														type="checkbox"
														onChange={() => props.setFieldValue('nofollow', !props.values.nofollow)}
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
														onChange={() => props.setFieldValue('sponsored', !props.values.sponsored)}
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
														onChange={() => props.setFieldValue('param_forwarding', !props.values.param_forwarding)}
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
														onChange={() => props.setFieldValue('track_me', !props.values.track_me)}
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
												{/* Uncloak is a BetterLinks Pro option (Pro renders it through
												    `linkOptionsBasic`). This locked preview has no name, so it
												    never adds `uncloaked` to the submitted values. */}
												{!is_pro_enabled && (
													<label className="btl-checkbox-field link-options--teasers" onClick={() => openUpgradeToProModal()}>
														<input disabled={true} className="btl-check" type="checkbox" checked={false} readOnly />
														<span className="text btl-text">
															{__('Uncloak', 'betterlinks')}
															<ProBadge />
															<div className="btl-tooltip">
																<span className="dashicons dashicons-info-outline"></span>
																<span className="btl-tooltiptext">{__('This will uncloak your link', 'betterlinks')}</span>
															</div>
														</span>
													</label>
												)}
												{betterLinksHooks.applyFilters('linkOptionsBasic', null, { ...props, isDisableLinkFormEditView, Field, ...settings })}
											</div>
										</div>
										{!betterlinksGutenStore && (
											<>
												<div className={`link-options link-options--advanced ${isOpenLinkPanel.advanced ? 'link-options--open' : ''}`}>
													<button className="link-options__head" type="button" onClick={() => togglePanel('advanced')}>
														<h4 className="link-options__head--title">
															{__('Advanced', 'betterlinks')} {!is_pro_enabled && <ProBadge />}
														</h4>
														<i className="btl btl-angle-arrow-down" />
													</button>
													{/* Advance Options teaser */}
													<AdvanceOptionTeaser openUpgradeToProModal={openUpgradeToProModal} />
													{/* An older BetterLinks Pro still renders password protection here
													    but relied on this plugin to save it. */}
													{is_pro_enabled && pro_needs_update && (
														<div className="link-options__body">
															<ProUpdateRequired feature={__('Password protection & link previews', 'betterlinks')} />
														</div>
													)}
													<>{betterLinksHooks.applyFilters('linkOptionsAdvanced', null, { ...props, ...settings })}</>
												</div>
												<div className={`link-options link-options--dynamic-redirect ${isOpenLinkPanel.dynamicRedirect ? 'link-options--open' : ''}`}>
													<button className="link-options__head" type="button" onClick={() => togglePanel('dynamicRedirect')}>
														<h4 className="link-options__head--title">
															{__('Dynamic Redirects', 'betterlinks')} {!is_pro_enabled && <ProBadge />}{' '}
															{is_pro_enabled && props.values.dynamic_redirect && props.values.dynamic_redirect.type && props.values.dynamic_redirect.type !== 'none' ? (
																<span className="status">{__('ON', 'betterlinks')}</span>
															) : (
																''
															)}
														</h4>{' '}
														<i className="btl btl-angle-arrow-down"></i>
													</button>
													<div className="link-options__body">
														{/* Dynamic Redirects teaser */}
														{betterLinksHooks.applyFilters('linkOptionsDynamicRedirect', <DynamicRedirectsTeaser openUpgradeToProModal={openUpgradeToProModal} />, props)}
													</div>
												</div>
												{/* Customize Link Preview */}
												<CustomizeLinkPreview
													openAccordion={isOpenLinkPanel.optimizeMetaTags}
													openUpgradeToProModal={openUpgradeToProModal}
													form={props}
													settings={settings}
													__handleToggle={__handleToggle}
												/>
												{/* Custom Tracking Scripts */}
												<CustomTrackingScripts
													openAccordion={isOpenLinkPanel.customTrackingScripts}
													openUpgradeToProModal={openUpgradeToProModal}
													__handleToggle={__handleToggle}
													props={{ ...props, tracking: settings?.tracking, Field }}
												/>
												{!is_pro_enabled && (
													<div>
														<div className={`link-options link-options--auto-link-keywords`}>
															<button className="link-options__head" type="button" onClick={() => openUpgradeToProModal()}>
																<h4 className="link-options__head--title">
																	{__('Auto-Link Keywords', 'betterlinks')} <ProBadge />
																</h4>
															</button>
														</div>
													</div>
												)}
											</>
										)}
									</div>
								</div>
								<div className="bl-drawer__footer">
									{betterLinksHooks.applyFilters('isShowLinkSubmitButton', true, data) && (
										<button type="submit" className="bl-drawer__publish" data-testid="btl-submit-button">
											{data && '' === type ? __('Update', 'betterlinks') : __('Publish', 'betterlinks')}
										</button>
									)}
									<button type="button" className="bl-drawer__cancel" onClick={closeModal}>
										{__('Cancel', 'betterlinks')}
									</button>
								</div>
							</Form>
						);
					}}
				</Formik>
			</Modal>
			{/* AI Bulk Link Generator: BetterLinks Pro replaces the upsell teaser through this filter. */}
			{!data &&
				!isShowIcon &&
				!betterlinksGutenStore &&
				betterLinksHooks.applyFilters('betterLinksAIBulkLinkModal', <AIBulkLinkTeaser isOpen={isAIBulkLinkOpen} onClose={closeAIBulkLink} />, {
					isOpen: isAIBulkLinkOpen,
					onClose: closeAIBulkLink,
					terms,
					settings,
					refreshLinks: refreshAIBulkLinks,
					refreshTerms: refreshAIBulkTerms,
				})}
		</>
	);
};
const mapStateToProps = (state) => ({
	settings: state.settings,
	terms: state.terms,
});

const mapDispatchToProps = (dispatch) => {
	return {
		//👇 slight tweak (renamed 'fetch_terms_data' to 'fetch_terms_action_function') to use the <Link /> component inside gutenberg
		fetch_terms_data: bindActionCreators(fetch_terms_action_function, dispatch),
		fetch_tracking_settings: bindActionCreators(fetch_tracking_settings, dispatch),
		// Passed to BetterLinks Pro's AI Bulk Link Generator as refresh callbacks.
		fetch_links_data: bindActionCreators(fetch_links_data, dispatch),
		fetch_all_categories: bindActionCreators(fetch_all_categories, dispatch),
		fetch_all_tags: bindActionCreators(fetch_all_tags, dispatch),
	};
};
export default connect(mapStateToProps, mapDispatchToProps)(Link);
Link.propTypes = propTypes;
