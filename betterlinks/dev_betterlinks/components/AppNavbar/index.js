import React, { useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { __ } from '@wordpress/i18n';
import { plugin_root_url, is_pro_enabled } from 'utils/helper';
import { update_theme_mode } from 'redux/actions/activity.actions';

/**
 * Global top navigation bar shared across every BetterLinks admin screen.
 * Holds the brand + tier badge and the light/dark theme toggle so the toggle
 * lives in a single place instead of being repeated in each page's TopBar.
 */
const AppNavbar = (props) => {
	const isDarkMode = props.activity.darkMode;

	// Keep the dark-mode class on <body> in sync with the stored preference.
	useEffect(() => {
		if (isDarkMode) {
			document.body.classList.add('betterlinks-dark-mode');
		} else {
			document.body.classList.remove('betterlinks-dark-mode');
		}
	}, [isDarkMode]);

	const darkModeHandler = (mode) => {
		props.update_theme_mode(mode);
	};

	// WordPress prints admin notices into `#wpbody-content`, i.e. ABOVE this
	// navbar, which pushes the brand bar down the page. They belong under it, so
	// the nodes are relocated into the slot rendered below.
	//
	// Moved rather than re-rendered: these are server-printed nodes that already
	// carry WordPress's injected dismiss button and the click handler `App.js`
	// binds to it, both of which survive a move but not a re-render.
	//
	// `_admin-notices.scss` keeps notices still sitting in `#wpbody-content`
	// hidden, so there is no flash of them above the navbar before this runs.
	const noticeSlot = useRef(null);

	useEffect(() => {
		const slot = noticeSlot.current;
		const host = document.getElementById('wpbody-content');
		if (!slot || !host) return undefined;

		const SELECTOR = ':scope > .notice, :scope > .updated, :scope > .error, :scope > .wpdeveloper-licensing-notice';
		const relocate = () => {
			host.querySelectorAll(SELECTOR).forEach((node) => slot.appendChild(node));
		};

		relocate();

		// Notices can also be printed late (WordPress's own dismiss-button pass, or
		// another plugin injecting after mount). `childList` only — no `subtree` —
		// so appending into the slot cannot retrigger this and loop.
		const observer = new MutationObserver(relocate);
		observer.observe(host, { childList: true });
		return () => observer.disconnect();
	}, []);

	return (
		<React.Fragment>
		<div className="bl-navbar">
			<div className="bl-navbar__brand">
				<img
					className="bl-navbar__logo"
					src={plugin_root_url + `assets/images/logo-large${isDarkMode ? '-white' : ''}.svg`}
					alt={__('BetterLinks', 'betterlinks')}
				/>
				<span className="bl-navbar__title">{__('BetterLinks', 'betterlinks')}</span>
				<span className={`bl-navbar__badge ${is_pro_enabled ? 'is-pro' : 'is-free'}`}>{is_pro_enabled ? __('PRO', 'betterlinks') : __('FREE', 'betterlinks')}</span>
			</div>
			<label className="theme-mood-button" htmlFor="bl-navbar-theme-mood" title={__('Theme Mode', 'betterlinks')}>
				{/* No `value`: a checkbox is controlled by `checked`, and passing the
				    theme flag there made React warn whenever it was null. */}
				<input type="checkbox" name="bl-navbar-theme-mood" id="bl-navbar-theme-mood" onChange={() => darkModeHandler(!isDarkMode)} checked={!!isDarkMode} />
				<span className="theme-mood">
					<span className="icon">
						<i className="btl btl-sun"></i>
					</span>
					<span className="icon">
						<i className="btl btl-moon"></i>
					</span>
				</span>
			</label>
		</div>
		<div className="bl-notice-area" ref={noticeSlot} />
		</React.Fragment>
	);
};

const mapStateToProps = (state) => ({
	activity: state.activity,
});

const mapDispatchToProps = (dispatch) => ({
	update_theme_mode: bindActionCreators(update_theme_mode, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(AppNavbar);
