import React, { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { Formik, Form } from 'formik';
import axios from 'axios';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { update_option } from 'redux/actions/settings.actions';
import { fetch_clicks_data } from 'redux/actions/clicks.actions';
import { betterlinks_nonce, delayStatusChanged, exists_clicks_json, exists_links_json, saveSettingsHandler } from 'utils/helper';
import ExternalAnalytics from 'components/Teasers/ExternalAnalytics';
import ProBadge from 'components/Badge/ProBadge';
import { SaveIcon } from 'components/Settings/Icons';
import LinkDefaults from './sections/LinkDefaults';
import Redirects from './sections/Redirects';
import Tracking from './sections/Tracking';

const SECTION_META = {
	'link-defaults': { title: __('Link Defaults', 'betterlinks'), desc: __('Defaults applied to every new link you create.', 'betterlinks') },
	redirects: { title: __('Redirects', 'betterlinks'), desc: __('How your short links redirect visitors.', 'betterlinks') },
	tracking: { title: __('Tracking', 'betterlinks'), desc: __('Analytics capture and privacy controls.', 'betterlinks') },
	'external-analytics': { title: __('External Analytics', 'betterlinks'), desc: __('Send click events to third-party analytics platforms.', 'betterlinks') },
};

// Owns the ONE Formik form shared by Link Defaults / Redirects / Tracking, so a
// single Save persists the whole settings object and switching between the three
// sub-sections preserves unsaved edits (all three stay mounted; only the active
// one is visible). The Pro External Analytics panel renders OUTSIDE the form to
// avoid nesting <form> elements.
const GeneralSettingsForm = ({ settings, terms, postdatas, trackingSettings, activeSection, openUpgradeToProModal, update_option, fetch_clicks_data }) => {
	const [formSubmitText, setFormSubmitText] = useState(__('Save Settings', 'betterlinks'));
	const [redirectBtn, setRedirectBtn] = useState(__('Active Now', 'betterlinks'));
	const [redirectStatus, setRedirectStatus] = useState(exists_links_json);
	const [clicksBtn, setClicksBtn] = useState(__('Active Now', 'betterlinks'));
	const [cacheBtn, setCacheBtn] = useState(__('Refresh Stats', 'betterlinks'));
	const [clicksStatus, setClicksStatus] = useState(exists_clicks_json);

	// Deep-link: scroll to and highlight the User-Agent control when linked.
	useEffect(() => {
		const handleHash = () => {
			if (window.location.hash === '#btl-setting-user-agent') {
				const el = document.getElementById('btl-setting-user-agent');
				if (el) {
					el.scrollIntoView({ behavior: 'smooth', block: 'center' });
					el.classList.add('btl-temp-focus');
					setTimeout(() => el.classList.remove('btl-temp-focus'), 6000);
				}
			}
		};
		handleHash();
		window.addEventListener('hashchange', handleHash);
		return () => window.removeEventListener('hashchange', handleHash);
	}, [activeSection]);

	const activateRedirect = () => {
		setRedirectBtn(__('Activating...', 'betterlinks'));
		axios.post(`${ajaxurl}?action=betterlinks/admin/write_json_links&security=${betterlinks_nonce}`).then((response) => {
			if (response.data) {
				delayStatusChanged(null, __('Activated!', 'betterlinks'), __('Active Now', 'betterlinks'), setRedirectBtn);
				setTimeout(() => setRedirectStatus(true), 1500);
			}
		});
	};
	const activateClicks = () => {
		setClicksBtn(__('Activating...', 'betterlinks'));
		axios.post(`${ajaxurl}?action=betterlinks/admin/write_json_clicks&security=${betterlinks_nonce}`).then((response) => {
			if (response.data) {
				delayStatusChanged(null, __('Activated!', 'betterlinks'), __('Refresh Stats', 'betterlinks'), setClicksBtn);
				setTimeout(() => setClicksStatus(true), 1500);
			}
		});
	};
	const refreshStats = () => {
		setCacheBtn(__('Refreshing...', 'betterlinks'));
		axios.post(`${ajaxurl}?action=betterlinks/admin/analytics&security=${betterlinks_nonce}`).then((response) => {
			if (response.data) {
				delayStatusChanged(null, __('Done!', 'betterlinks'), __('Refresh Stats', 'betterlinks'), setCacheBtn);
				fetch_clicks_data({});
			}
		});
	};

	const meta = SECTION_META[activeSection] || SECTION_META['link-defaults'];
	// External Analytics is its own sub-section now, and it is not part of the
	// settings form — so the Formik panel (and its Save button) sits this one out.
	const isExternalAnalytics = activeSection === 'external-analytics';

	if (isExternalAnalytics) {
		return (
			<div className="bl-settings__panel">
				<div className="bl-settings__panel-head">
					{/* Pro-only feature — `ProBadge` renders nothing once Pro is active. */}
					<h2 className="bl-settings__panel-title">
						{meta.title}
						<ProBadge />
					</h2>
					<p className="bl-settings__panel-desc">{meta.desc}</p>
				</div>
				<ExternalAnalytics trackingSettings={trackingSettings} />
			</div>
		);
	}

	return (
		<>
			<div className="bl-settings__panel">
				<div className="bl-settings__panel-head">
					<h2 className="bl-settings__panel-title">{meta.title}</h2>
					<p className="bl-settings__panel-desc">{meta.desc}</p>
				</div>

				<Formik
					enableReinitialize
					initialValues={{ ...settings, url_slug_generation_type: settings?.url_slug_generation_type || 'from_title' }}
					onSubmit={(values) => saveSettingsHandler(values, update_option, setFormSubmitText)}
				>
					{(fp) => {
						const ext = {
							settings,
							terms,
							postdatas,
							openUpgradeToProModal,
							fastRedirect: { status: redirectStatus, buttonText: redirectBtn, activate: activateRedirect },
							fastClicks: {
								status: clicksStatus,
								buttonText: clicksStatus ? cacheBtn : clicksBtn,
								action: clicksStatus ? refreshStats : activateClicks,
							},
						};
						return (
							<Form>
								<div style={{ display: activeSection === 'link-defaults' ? 'block' : 'none' }}>
									<LinkDefaults fp={fp} ext={ext} />
								</div>
								<div style={{ display: activeSection === 'redirects' ? 'block' : 'none' }}>
									<Redirects fp={fp} ext={ext} />
								</div>
								<div style={{ display: activeSection === 'tracking' ? 'block' : 'none' }}>
									<Tracking fp={fp} ext={ext} />
								</div>
								<div className="bl-set-footer">
									<button className="bl-set-save" type="submit">
										<SaveIcon size={16} />
										{formSubmitText}
									</button>
								</div>
							</Form>
						);
					}}
				</Formik>
			</div>

		</>
	);
};

const mapStateToProps = (state) => ({
	postdatas: state.postdatas,
	terms: state.terms,
});
const mapDispatchToProps = (dispatch) => ({
	update_option: bindActionCreators(update_option, dispatch),
	fetch_clicks_data: bindActionCreators(fetch_clicks_data, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(GeneralSettingsForm);
