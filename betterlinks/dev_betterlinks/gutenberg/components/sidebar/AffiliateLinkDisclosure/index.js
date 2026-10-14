import { applyFilters } from '@wordpress/hooks';
import { __, sprintf } from '@wordpress/i18n';
import UpgradeToPro from 'components/Teasers/UpgradeToPro';
import ReactQuill from 'react-quill';
import ProUpdateNotice from 'gutenberg/components/ProUpdateNotice';
import ToggleTitle from 'gutenberg/components/ToggleTitle';
import { useUpgradeProModal } from 'utils/customHooks';
import { betterlinks_settings, is_pro_enabled } from 'utils/helper';
import { affiliateLinkPosition } from 'utils/data';

const { PluginDocumentSettingPanel } = wp.editPost;

/**
 * Affiliate Link Disclosure is a BetterLinks Pro feature. Pro renders the panel and
 * stores the per-post disclosure through the `betterlinks.gutenberg.affiliateDisclosure`
 * filter; Free only shows the upgrade teaser, or an update note when the active Pro
 * predates the filter.
 */
const AffiliateLinkDisclosure = ({ enableAffiliateDisclosure }) => {
	const [isOpenUpgradeToProModal, openUpgradeToProModal, closeUpgradeToProModal] = useUpgradeProModal();
	const postType = wp.data.select('core/editor').getCurrentPostType();

	const panel = applyFilters('betterlinks.gutenberg.affiliateDisclosure', null, {
		postType,
		enabled: enableAffiliateDisclosure,
		settings: betterlinks_settings || {},
		positions: affiliateLinkPosition,
		ToggleTitle,
		ReactQuill,
	});
	if (panel) {
		return panel;
	}

	if (is_pro_enabled) {
		if (!enableAffiliateDisclosure) {
			return null;
		}
		return (
			<PluginDocumentSettingPanel
				name="betterlinks-affiliate-link-disclosure"
				title={<ToggleTitle is_pro_feature={true} title={__('Affiliate Link Disclosure', 'betterlinks')} />}
				className="custom-panel"
				isOpen={false}
			>
				<ProUpdateNotice />
			</PluginDocumentSettingPanel>
		);
	}

	/* translators: %s: post type name, e.g. "post" */
	const teaserText = sprintf(__('This will allow you to add an Affiliate Link Disclosure in this %s', 'betterlinks'), postType);
	return (
		<PluginDocumentSettingPanel
			name="betterlinks-affiliate-link-disclosure"
			title={<ToggleTitle is_pro_feature={true} title={__('Affiliate Link Disclosure', 'betterlinks')} />}
			className="custom-panel"
			isOpen={false}
		>
			<UpgradeToPro isOpenModal={isOpenUpgradeToProModal} closeModal={closeUpgradeToProModal} />
			<div className="betterlinks-affiliate-link-disclosure">
				<p>{teaserText}</p>
				<>
					<div
						style={{
							display: 'flex',
							'flex-direction': 'column',
							'margin-bottom': '12px',
						}}
					>
						<label style={{ 'margin-bottom': '5px' }}>
							{__('Affiliate Disclosure Position', 'betterlinks')}
							<span className="pro-badge" onClick={openUpgradeToProModal}>
								{__('Pro', 'betterlinks')}
							</span>
						</label>
						<select disabled style={{ cursor: 'not-allowed' }}>
							<option>{__('Top', 'betterlinks')}</option>
						</select>
					</div>
					<div>
						<p className="components-base-control__help" style={{ marginBottom: '5px' }}>
							{__('Affiliate Text', 'betterlinks')}
							<label>
								<span className="pro-badge" onClick={openUpgradeToProModal}>
									{__('Pro', 'betterlinks')}
								</span>
							</label>
						</p>
						<textarea style={{ width: '100%', cursor: 'not-allowed' }} disabled></textarea>
					</div>
				</>
			</div>
		</PluginDocumentSettingPanel>
	);
};

export default AffiliateLinkDisclosure;
