import DateFnsUtils from '@date-io/date-fns';
import { DateTimePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import UpgradeToPro from 'components/Teasers/UpgradeToPro';
import { redirectType } from 'utils/data';
import { formatDate, generateSlug, getJsonString, getHiddenDashboardTermIds, is_pro_enabled, makeRequest, permalinkToShortUrl } from 'utils/helper';
import { edit_gutenberg_link, edit_link_expire_option, fetch_link_for_permalink, edit_link_misc } from 'redux/actions/gutenbergredirectlink.actions';
import { add_new_link, edit_link } from 'redux/actions/links.actions';
import { fetch_settings_data } from 'redux/actions/settings.actions';
import { fetch_terms_data } from 'redux/actions/terms.actions';
import { betterlinksGutenStore } from 'redux/gutenbergStore';
import { RESET_GUTENBERG_INSTANT_REDIRECT, DELETE_GUTENBERG_LINK } from 'redux/actions/actionstrings';
import { applyFilters } from '@wordpress/hooks';
const { __ } = wp.i18n;
const { Fragment, useState, useEffect } = wp.element;
const { ToggleControl, TextControl, SelectControl, Button } = wp.components;
const { withDispatch, subscribe } = wp.data;
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import AutoLinkCreateSidebar from './AutoLink/AutoLinkCreateSidebar';
import ToggleTitle from '../ToggleTitle';
import AffiliateLinkDisclosure from './AffiliateLinkDisclosure';

/** Date-time input handed to extensions through the Instant Redirect filters. */
const DateTimeField = ({ value, onChange }) => (
	<MuiPickersUtilsProvider utils={DateFnsUtils}>
		<DateTimePicker disablePast={true} label="" inputVariant="outlined" value={value ? value : new Date()} onChange={onChange} />
	</MuiPickersUtilsProvider>
);

const CustomSidebarComponent = (props) => {
	const [isAllowInstantRedirect, setIsAllowInstantRedirect] = useState(false);
	const [isShowInstantRedirect, setIsShowInstantRedirect] = useState(true);
	const [isOpenUpgradeToProModal, setUpgradeToProModal] = useState(false);
	const [terms, setTerms] = useState(false);
	const [targetUrl, setTargetUrl] = useState('');
	const [redirectMode, setRedirectMode] = useState(null);
	const [catId, setCatId] = useState(null);
	const [isNofollow, setIsNoFollow] = useState(null);
	const [isSponsored, setSponsored] = useState(null);
	const [isParamForwarding, setIsParamForwarding] = useState(null);
	const [isTrackMe, setIsTrackMe] = useState(null);
	// The loaded Instant Redirect row, for the fields an extension edits through
	// `betterlinks.gutenberg.instantRedirectAdvanced` (link status, expiry).
	const [loadedLinkData, setLoadedLinkData] = useState(null);
	const [enableAffiliateDisclosure, setEnableAffiliateDisclosure] = useState(false);

	useEffect(() => {
		const settings = betterlinksGutenStore?.getState()?.settings?.settings;
		if (settings) {
			setIsAllowInstantRedirect(!!settings?.is_allow_gutenberg);
			setEnableAffiliateDisclosure(!!settings?.affiliate_link_disclosure);
		} else {
			fetch_settings_data()(betterlinksGutenStore.dispatch)
				.then(() => {
					const settings = betterlinksGutenStore?.getState()?.settings?.settings;
					setIsAllowInstantRedirect(!!settings?.is_allow_gutenberg);
					setEnableAffiliateDisclosure(!!settings?.affiliate_link_disclosure);
				})
				.catch((err) => console.log('error!! failed in sidebar fetching betterlinks Settings data', err));
		}
	}, []);

	useEffect(() => {
		const short_url = permalinkToShortUrl(wp.data.select('core/editor').getPermalink());

		if (short_url) {
			const storeTerms = betterlinksGutenStore?.getState()?.terms?.terms;
			if (storeTerms) {
				setTerms(storeTerms);
			} else {
				fetch_terms_data()(betterlinksGutenStore.dispatch)
					.then(() => {
						const storeTerms = betterlinksGutenStore?.getState()?.terms?.terms;
						setTerms(storeTerms);
					})
					.catch((err) => console.log('error!! failed fetching betterlinks terms data', err));
			}
		}
	}, [terms]);

	useEffect(() => {
		document?.body?.classList?.add('betterlinks-guten-link-data-not-rendered-in-sidebar');

		const setAllStatesForLinkData = (linkData) => {
			setTimeout(() => {
				document?.body?.classList?.remove('betterlinks-guten-link-data-not-rendered-in-sidebar');
			}, 500);
			if (!linkData) {
				setIsShowInstantRedirect(false);
				return false;
			}
			// An existing row forces the panel on. A post with no Instant Redirect yet
			// still has to seed its fields: fetch_link_for_permalink() puts the
			// Settings → Link Attributes defaults (No Follow, Sponsored, Parameter
			// Forwarding, Tracking, redirect type) into the store under a blank ID.
			// Returning early here left every toggle at its null initial state, so a
			// fresh panel showed everything off and disagreed with the configured
			// defaults — until the link was saved and the page reloaded, at which
			// point the saved row finally populated them.
			if (linkData.ID || linkData.ID === 0) {
				setIsAllowInstantRedirect(true);
			}
			setTargetUrl(linkData.target_url);

			if (!is_pro_enabled && linkData.redirect_type === 'cloak') {
				edit_gutenberg_link({ redirect_type: '307' });
				setRedirectMode('307');
			} else {
				setRedirectMode(linkData.redirect_type);
			}
			setCatId(linkData.cat_id);
			setIsNoFollow(linkData.nofollow);
			setSponsored(linkData.sponsored);
			setIsParamForwarding(linkData.param_forwarding);
			setIsTrackMe(linkData.track_me);
			setLoadedLinkData(linkData);
		};

		const resultOfFetchPermalink = fetch_link_for_permalink();
		if (!resultOfFetchPermalink) {
			setTimeout(() => {
				document?.body?.classList?.remove('betterlinks-guten-link-data-not-rendered-in-sidebar');
			}, 500);
			return () => { };
		}
		resultOfFetchPermalink
			.then(() => {
				let x = 0;
				const intervalId = setInterval(() => {
					x++;
					let linkData = betterlinksGutenStore?.getState()?.gutenbergredirectlink?.linkData;
					if (!linkData?.dispatched_successfully && x < 600) {
						return false;
					}
					if (typeof linkData?.expire === 'string') {
						linkData = {
							...linkData,
							expire: getJsonString(linkData.expire),
						};
					}
					setAllStatesForLinkData(linkData);
					clearInterval(intervalId);
				}, 500);
			})
			.catch((error) => console.log(error));
	}, []);

	const onSetTargetUrl = (url) => {
		setTargetUrl(url);
		edit_gutenberg_link({ target_url: url });
	};

	const onSetRedirectType = (type) => {
		setRedirectMode(type);
		edit_gutenberg_link({ redirect_type: type });
	};

	const onSetCatId = (catid) => {
		setCatId(catid);
		edit_gutenberg_link({ cat_id: catid });
	};

	const onSetNoFollow = (isnofollow) => {
		setIsNoFollow(isnofollow);
		edit_gutenberg_link({ nofollow: isnofollow });
	};

	const onSetSponsored = (issponsored) => {
		setSponsored(issponsored);
		edit_gutenberg_link({ sponsored: issponsored });
	};

	const onSetParamForwarding = (isparamforwarding) => {
		setIsParamForwarding(isparamforwarding);
		edit_gutenberg_link({ param_forwarding: isparamforwarding });
	};

	const onSetTrackMe = (istrackme) => {
		setIsTrackMe(istrackme);
		edit_gutenberg_link({ track_me: istrackme });
	};

	// Categories the Manage Links dashboard deliberately excludes (Link in Bio,
	// Fluent Boards' task category). A link filed under one saves fine but is
	// invisible on Manage Links, so it must never be offered here or picked as
	// a fallback.
	const hiddenTermIds = getHiddenDashboardTermIds();
	const isSelectableCategory = (item) => item.term_type == 'category' && !hiddenTermIds.includes(Number(item.ID));

	const getDefaultCatID = (savedCatID, terms) => {
		if (savedCatID && savedCatID != '') {
			return savedCatID;
		}
		// `terms` is the raw API order, which is neither the order shown in the
		// dropdown nor filtered to categories — taking terms[0] blindly filed new
		// Instant Redirects under whatever happened to come back first (on sites
		// with Bio Pages, the hidden "Link in Bio" category).
		const selectable = terms.filter(isSelectableCategory);
		const fallback = selectable.find((item) => item.term_slug == 'uncategorized') || selectable[0];
		if (fallback) {
			onSetCatId(fallback.ID);
			return fallback.ID;
		}
		return null;
	};

	const getDefaultRedirectType = (savedRedirectType) => {
		if (savedRedirectType && savedRedirectType != '') {
			return savedRedirectType;
		}
		onSetRedirectType('307');
		return '307';
	};

	const deleteInstantRedirect = () => {
		const ID = betterlinksGutenStore?.getState()?.gutenbergredirectlink?.linkData?.ID;
		const short_url = betterlinksGutenStore?.getState()?.gutenbergredirectlink?.linkData?.short_url;
		const cat_id = betterlinksGutenStore?.getState()?.gutenbergredirectlink?.linkData?.cat_id;

		if (!ID) return false;

		document?.body?.classList?.add('betterlinks-guten-store-initial-data-still-fetching');
		makeRequest({
			action: 'betterlinks/admin/delete_link',
			ID,
			short_url,
			cat_id,
		})
			.then((response) => {
				const settings = betterlinksGutenStore?.getState()?.settings?.settings;
				const linkData = {
					ID: '',
					cat_id: '',
					target_url: '',
					link_title: '',
					link_slug: '',
					expire: {
						status: false,
					},
					link_status: 'publish',
					redirect_type: settings?.redirect_type,
					nofollow: settings?.nofollow,
					sponsored: settings?.sponsored,
					param_forwarding: settings?.param_forwarding,
					track_me: settings?.track_me,
				};

				betterlinksGutenStore.dispatch({
					type: DELETE_GUTENBERG_LINK,
					payload: {
						...response?.data?.data,
						cat_id,
					},
				});

				betterlinksGutenStore.dispatch({
					type: RESET_GUTENBERG_INSTANT_REDIRECT,
					payload: linkData,
				});

				onSetTargetUrl('');
				onSetCatId('');
				setLoadedLinkData(linkData);
				onSetRedirectType(settings?.redirect_type);
				onSetNoFollow(settings?.nofollow);
				onSetSponsored(settings?.sponsored);
				onSetParamForwarding(settings?.param_forwarding);
				onSetTrackMe(settings?.track_me);

				document?.body?.classList?.remove('betterlinks-guten-store-initial-data-still-fetching');
			})
			.catch((error) => {
				console.log(error);
			});
	};

	const openUpgradeToProModal = () => {
		setUpgradeToProModal(true);
	};

	const closeUpgradeToProModal = () => {
		setUpgradeToProModal(false);
	};

	// Link status and expiry are BetterLinks Pro fields; Pro renders them here.
	const advancedFields =
		isAllowInstantRedirect && isShowInstantRedirect
			? applyFilters('betterlinks.gutenberg.instantRedirectAdvanced', null, {
					linkData: loadedLinkData,
					editLink: edit_gutenberg_link,
					editExpire: edit_link_expire_option,
					onChange: () => props.showSaveButton(),
					formatDate,
					DateTimeField,
			  })
			: null;

	return (
		<Fragment>
			<AffiliateLinkDisclosure enableAffiliateDisclosure={enableAffiliateDisclosure} />
			<AutoLinkCreateSidebar openUpgradeToProModal={openUpgradeToProModal} />
			{isAllowInstantRedirect && isShowInstantRedirect && (
				<PluginDocumentSettingPanel name="betterlinks-redirect" title={<ToggleTitle title={__('Instant Redirect', 'betterlinks')} />} className="custom-panel" isOpen={false}>
					{/* CustomSidebarMeta start  */}

					<div className="betterlinks-loader-sidebar-wrapper">
						<div className="betterlinks-loader-for-sidebar">
							<div className="betterlinks-round-loader"></div>
						</div>
					</div>

					<div className="betterlinks-instant-redirect">
						<UpgradeToPro isOpenModal={isOpenUpgradeToProModal} closeModal={closeUpgradeToProModal} />

						<div className="betterlinks-instant-gutenberg-redirect-delete-button-wrapper">
							<Button
								isDestructive={true}
								onClick={() => {
									if (confirm(__('Are you sure you want to delete your Instant Redirect Rule?', 'betterlinks'))) {
										deleteInstantRedirect();
									}
								}}
								style={{ marginBottom: '10px', border: '1px solid currentColor' }}
							>
								Delete Instant Redirect
							</Button>
						</div>

						<TextControl
							label={__('Target URL', 'betterlinks')}
							value={targetUrl}
							onChange={(value) => {
								onSetTargetUrl(value);
								props.showSaveButton();
							}}
						/>
						<SelectControl
							label={__('Redirect Type', 'betterlinks')}
							options={
								is_pro_enabled
									? [
										...redirectType,
										{
											value: 'cloak',
											label: __('Cloaked', 'betterlinks'),
										},
									]
									: redirectType
							}
							value={getDefaultRedirectType(redirectMode)}
							onChange={(mode) => {
								onSetRedirectType(mode);
								props.showSaveButton();
							}}
						/>
						{terms && (
							<SelectControl
								label={__('Choose Category', 'betterlinks')}
								value={getDefaultCatID(catId, terms)}
								options={terms
									.filter(isSelectableCategory)
									.sort((a, b) => a.term_name.localeCompare(b.term_name))
									.map((item) => ({
										value: item.ID,
										label: item.term_name,
									}))}
								onChange={(catID) => {
									onSetCatId(catID);
									props.showSaveButton();
								}}
							/>
						)}
						<h3 className="btl-link-generator">
							<strong>{__('Link Options', 'betterlinks')}</strong>
						</h3>
						<ToggleControl
							label={__('No Follow', 'betterlinks')}
							checked={!!isNofollow}
							onChange={(value) => {
								onSetNoFollow(value);
								props.showSaveButton();
							}}
						/>
						<ToggleControl
							label={__('Sponsored', 'betterlinks')}
							checked={!!isSponsored}
							onChange={(value) => {
								onSetSponsored(value);
								props.showSaveButton();
							}}
						/>
						<ToggleControl
							label={__('Parameter Forwarding', 'betterlinks')}
							checked={!!isParamForwarding}
							onChange={(value) => {
								onSetParamForwarding(value);
								props.showSaveButton();
							}}
						/>
						<ToggleControl
							label={__('Tracking', 'betterlinks')}
							checked={!!isTrackMe}
							onChange={(value) => {
								onSetTrackMe(value);
								props.showSaveButton();
							}}
						/>
						<div className="betterlinks-instant-redirect betterlinks-instant-redirect--teasers">
							<div className="betterlinks-instant-redirect__head">
								<h4 className="betterlinks-instant-redirect__head--title">
									<strong>{__('Advanced', 'betterlinks')}</strong>
								</h4>
							</div>
							{advancedFields ||
								(!is_pro_enabled ? (
									<>
										<div className="betterlinks-instant-redirect-form-group" onClick={() => openUpgradeToProModal()}>
											<label className="betterlinks-instant-redirect-form-label" htmlFor="status">
												{__('Status', 'betterlinks')} <span className="pro-badge">{__('Pro', 'betterlinks')}</span>
											</label>
											<select id="status" disabled>
												<option value="publish">{__('Active', 'betterlinks')}</option>
												<option value="expired">{__('Expired', 'betterlinks')}</option>
												<option value="draft">{__('Draft', 'betterlinks')}</option>
											</select>
										</div>
										<div className="betterlinks-instant-redirect-form-group" onClick={() => openUpgradeToProModal()}>
											<label className="betterlinks-instant-redirect-form-label" htmlFor="expire">
												{__('Expire', 'betterlinks')} <span className="pro-badge">{__('Pro', 'betterlinks')}</span>
											</label>
											<input id="expire" type="checkbox" disabled />
										</div>
									</>
								) : (
									<p className="components-base-control__help">{__('Update BetterLinks Pro to edit the link status and expiry here.', 'betterlinks')}</p>
								))}
						</div>
					</div>

					{/* CustomSidebarMeta end  */}
				</PluginDocumentSettingPanel>
			)}
		</Fragment>
	);
};

(() => {
	//👇 this is used to stop unnecessary request for betterlinks instant gutenberg link
	// let lastChangedTimeStamp = window.betterlinksInstantGutenbergChangeTimeStamp;
	subscribe(() => {
		if (
			wp.data.select('core/editor')?.isSavingPost() &&
			!wp.data.select('core/editor')?.isAutosavingPost() &&
			wp.data.select('core/editor')?.isCurrentPostPublished() &&
			wp.data.select('core/editor')?.getPermalink() &&
			betterlinksGutenStore?.getState()?.gutenbergredirectlink?.linkData?.target_url &&
			betterlinksGutenStore?.getState()?.gutenbergredirectlink?.linkData?.target_url.trim() != ''
		) {
			const permalink = wp.data.select('core/editor').getPermalink();
			const currentPost = wp.data.select('core/editor').getCurrentPost();
			const currentDate = formatDate(new Date(), 'yyyy-mm-dd h:m:s');

			const terms = betterlinksGutenStore?.getState()?.terms?.terms || [];
			const values = betterlinksGutenStore?.getState()?.gutenbergredirectlink?.linkData || {};
			const freeParams = { ...(betterlinksGutenStore?.getState()?.gutenbergredirectlink?.linkData || {}) };
			const misc = betterlinksGutenStore?.getState()?.gutenbergredirectlink?.misc || {};

			// `expire`, `link_status` and `dynamic_redirect` go back as they were loaded
			// (plus any edits an extension made). BetterLinks Pro rewrites a missing
			// `expire` or `dynamic_redirect` to empty on every save, so leaving them out
			// would wipe them while an older Pro is active. Without Pro the links schema
			// drops the two Pro fields.

			// remove unnecessary param/property
			delete freeParams.dispatched_successfully;

			const short_url = permalinkToShortUrl(permalink);
			const link_title = currentPost.title;
			const link_slug = currentPost.slug;

			// redirect
			let params = {
				...freeParams,
				short_url,
				link_title,
				link_slug,
				link_modified: currentDate,
				link_modified_gmt: currentDate,
				// short_url here IS this post's own permalink — that is what Instant
				// Redirect does. The server refuses a short URL that shadows existing
				// WordPress content, so tell it which post is being shadowed on
				// purpose; it exempts that one path and nothing else.
				instant_redirect_post_id: currentPost.id,
			};

			// Let an extension (BetterLinks Pro) normalise the fields it owns.
			params = applyFilters('betterlinks.gutenberg.instantRedirectSaveParams', params, { values });

			if (!params.cat_id) {
				// Same rule as the sidebar dropdown: prefer Uncategorized, and never
				// fall back to a category Manage Links hides. Indexing [0] directly
				// also threw here on installs with no "uncategorized" term, which
				// aborted the whole save.
				const hidden = getHiddenDashboardTermIds();
				const selectable = terms.filter((item) => item.term_type == 'category' && !hidden.includes(Number(item.ID)));
				const fallback = selectable.find((item) => item.term_slug == 'uncategorized') || selectable[0];
				if (fallback) {
					params.cat_id = fallback.ID;
				}
			}
			if (!params.link_slug) {
				params.link_slug = generateSlug(params.link_title);
			}
			params.wildcards = Number(params.short_url.includes('*'));

			if (params.cat_id && params.target_url !== '') {
				const link_title = params.link_title.trim();
				if (link_title) {
					params.link_title = link_title;

					if (params.ID) {
						edit_link(
							params,
							true
						)(betterlinksGutenStore.dispatch)
							.then(() => { })
							.catch((error) => console.error(error));
					} else {
						if (misc?.short_url) return;
						edit_link_misc({ short_url: params.short_url });
						add_new_link(
							params,
							true,
							true
						)(betterlinksGutenStore.dispatch)
							.then((res) => {
								// A refused write resolves instead of throwing, so the
								// catch below never cleared the guard and every later
								// post save skipped the Instant Redirect until reload.
								if (res?.data?.success === false) {
									edit_link_misc({ short_url: '' });
								}
							})
							.catch((error) => {
								delete misc?.short_url;
								console.error(error);
							});
					}
				}
			}
		}
	});
})();

const CustomSidebarMeta = withDispatch((dispatch) => ({
	showSaveButton: (value) => {
		window.betterlinksInstantGutenbergChangeTimeStamp = Date.now();
		return dispatch('core/editor').editPost({ meta: { betterlinks_show_saved_button: value } });
	},
}))(CustomSidebarComponent);

const CustomBetterlinksSidebar = () => <CustomSidebarMeta />;

export default CustomBetterlinksSidebar;
