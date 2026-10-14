import { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { update_option } from 'redux/actions/settings.actions';
import { saveSettingsHandler } from 'utils/helper';
import { Row, ToggleLine } from 'components/Settings/parts';

/**
 * "Configure" panel for the Bio Links module.
 *
 * Bio pages file their tracked links into a protected "Link in Bio" category.
 * That category is an implementation detail of the feature, so by default it is
 * kept out of Manage Links — this panel is the opt-in that brings it back.
 *
 * The hiding itself happens server-side: `show_bio_links_category` is read by
 * Pro's `betterlinks/dashboard_hidden_term_ids` filter, which excludes the
 * category from the links query. Saving settings clears the links cache and
 * `update_option` re-reads the links once the PUT resolves, so the board
 * reflects the change without a reload.
 *
 * The second control is the site-wide branding switch. Each bio page already
 * has its own "Show credit" toggle in the builder's Footer panel; this one
 * turns the credit off across every page at once, which is what a white-label
 * setup wants. Pro reads `show_bio_links_branding` in its
 * `betterlinks/link_in_bio/show_credit` filter.
 */
const BioLinksSettings = ({ settings, update_option }) => {
	const [showCategory, setShowCategory] = useState(!!settings?.show_bio_links_category);
	// Absent means "show". A site upgrading from a build without this setting
	// must not silently lose its attribution, so the default is on, never off.
	const [showBranding, setShowBranding] = useState(settings?.show_bio_links_branding !== false);
	const [, setSavingText] = useState('');

	const toggleShowCategory = () => {
		const next = !showCategory;
		setShowCategory(next);
		saveSettingsHandler({ ...settings, show_bio_links_category: next }, update_option, setSavingText);
	};

	const toggleShowBranding = () => {
		const next = !showBranding;
		setShowBranding(next);
		saveSettingsHandler({ ...settings, show_bio_links_branding: next }, update_option, setSavingText);
	};

	return (
		<>
			<Row
				label={__('Link in Bio Category', 'betterlinks')}
				desc={__('Show a dedicated “Link in Bio” category in Manage Links to organize your bio page links.', 'betterlinks')}
			>
				<ToggleLine
					label={__("Show 'Link in Bio' in Manage Links", 'betterlinks')}
					name="show_bio_links_category"
					checked={showCategory}
					onChange={toggleShowCategory}
				/>
			</Row>
			<Row
				label={__('Bio Page Branding', 'betterlinks')}
				desc={__("Disable the 'Made with BetterLinks' branding from your bio pages.", 'betterlinks')}
			>
				<ToggleLine
					label={__("Hide 'Made with BetterLinks'", 'betterlinks')}
					name="show_bio_links_branding"
					checked={showBranding}
					onChange={toggleShowBranding}
				/>
			</Row>
		</>
	);
};

const mapDispatchToProps = (dispatch) => ({ update_option: bindActionCreators(update_option, dispatch) });

export default connect(null, mapDispatchToProps)(BioLinksSettings);
