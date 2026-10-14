import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { fetch_settings_data, fetch_tracking_settings } from 'redux/actions/settings.actions';
import { fetch_post_types_data } from 'redux/actions/posttypesdata.actions';
import { fetch_terms_data } from 'redux/actions/terms.actions';
import Migration from 'containers/Migration';
import Docs from 'components/Docs';
import SettingsShell from 'components/Settings/SettingsShell';
import { is_pro_enabled, makeRequest } from 'utils/helper';

function useQuery() {
	return new URLSearchParams(useLocation().search);
}

// Map deep-link query params / hash to a nav item id.
const initialActiveFrom = (query) => {
	// Generic deep link: ?tab=<nav-item-id> (e.g. the Pro "Activate" notice links
	// to ?tab=license). SettingsShell validates the id against the nav and falls
	// back to the first tab if it doesn't exist.
	const tab = query.get('tab');
	if (tab) return tab;
	if (query.get('import') === 'true') return 'import-export';
	if (query.get('advanced') === 'true') return 'feature-modules';
	if (typeof window !== 'undefined' && window.location.hash === '#btl-setting-user-agent') return 'tracking';
	return null;
};

const Settings = (props) => {
	const [autoCreateLinkSettings, setAutoCreateLinkSettings] = useState({});
	const [trackingSettings, setTrackingSettings] = useState({});
	const query = useQuery();
	const migration = query.get('migration');
	const { settings } = props.settings;
	const { terms } = props.terms;

	useEffect(() => {
		if (!settings) {
			props.fetch_settings_data();
		}
		if (!props?.settings?.tracking) {
			props.fetch_tracking_settings();
		}
		if (!props.postdatas.fetchedAll) {
			props.fetch_post_types_data();
		}
		if (is_pro_enabled) {
			makeRequest({ action: 'betterlinks/admin/get_auto_create_links_settings' }).then((response) => {
				if (response.data.data) {
					const s = response.data.data;
					setAutoCreateLinkSettings({
						enable_auto_link: s.enable_auto_link,
						post_shortlinks: s.enable_auto_link && s.post_shortlinks,
						post_default_cat: s.enable_auto_link && s.post_shortlinks && s.post_default_cat,
						page_shortlinks: s.enable_auto_link && s.page_shortlinks,
						page_default_cat: s.enable_auto_link && s.page_shortlinks && s.page_default_cat,
						custom_post_type_shortlinks: s.enable_auto_link && s.custom_post_type_shortlinks,
						custom_post_type_default_cat: s.enable_auto_link && s.custom_post_type_shortlinks && s.custom_post_type_default_cat,
						custom_post_types_selection: s.enable_auto_link && s.custom_post_type_shortlinks && s.custom_post_types_selection,
					});
				}
			});
		}
		if (!terms) {
			props.fetch_terms_data();
		}
	}, []);

	return (
		<React.Fragment>
			<SettingsShell
				settings={settings}
				terms={terms}
				postdatas={props?.postdatas || {}}
				trackingSettings={props.settings?.tracking}
				setTrackingSettings={setTrackingSettings}
				autoCreateLinkSettings={autoCreateLinkSettings}
				setAutoCreateLinkSettings={setAutoCreateLinkSettings}
				query={query}
				initialActive={initialActiveFrom(query)}
			/>
			{migration && <Migration mode={migration} />}
			<Docs />
		</React.Fragment>
	);
};

const mapStateToProps = (state) => ({
	settings: state.settings,
	postdatas: state.postdatas,
	terms: state.terms,
});

const mapDispatchToProps = (dispatch) => {
	return {
		fetch_settings_data: bindActionCreators(fetch_settings_data, dispatch),
		fetch_tracking_settings: bindActionCreators(fetch_tracking_settings, dispatch),
		fetch_post_types_data: bindActionCreators(fetch_post_types_data, dispatch),
		fetch_terms_data: bindActionCreators(fetch_terms_data, dispatch),
	};
};

export default connect(mapStateToProps, mapDispatchToProps)(Settings);
