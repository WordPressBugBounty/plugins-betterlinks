const { PluginDocumentSettingPanel } = wp.editPost;
import { useState } from 'react';
import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import LinkCopyButton from 'components/LinkCopyUrl/LinkCopyButton';
import UpgradeToPro from 'components/Teasers/UpgradeToPro';
import { betterlinks_settings, is_pro_enabled } from 'utils/helper';
import { redirectType as redirectTypes } from 'utils/data';
import { btl_custom_domain } from 'gutenberg/components';
import extensionApi from 'gutenberg/extensionApi';
import ProUpdateNotice from '../../ProUpdateNotice';
import ToggleTitle from '../../ToggleTitle';

/**
 * Auto-Create Links is a BetterLinks Pro feature. Pro renders the panel and saves
 * the link through the `betterlinks.gutenberg.autoCreateLinks` filter; Free only
 * shows the upgrade teaser, or an update note when the active Pro predates the
 * filter.
 */
const AutoLinkCreateSidebar = ({ openUpgradeToProModal }) => {
	const [isOpenUpgradeToProModal, setUpgradeToProModal] = useState(false);
	const postType = wp.data.select('core/editor').getCurrentPostType();

	const panel = applyFilters('betterlinks.gutenberg.autoCreateLinks', null, {
		postType,
		siteUrl: btl_custom_domain,
		redirectTypes,
		ToggleTitle,
		LinkCopyButton,
		api: extensionApi,
	});
	if (panel) {
		return panel;
	}

	if (is_pro_enabled) {
		if (!betterlinks_settings?.[`${postType}_shortlinks`]) {
			return null;
		}
		return (
			<PluginDocumentSettingPanel
				name="betterlinks-auto-create-link"
				title={<ToggleTitle is_pro_feature={true} title={__('Auto-Create Links', 'betterlinks')} />}
				className="custom-panel"
				isOpen={true}
			>
				<ProUpdateNotice />
			</PluginDocumentSettingPanel>
		);
	}

	return (
		<PluginDocumentSettingPanel
			name="betterlinks-auto-create-link"
			title={<ToggleTitle is_pro_feature={true} title={__('Auto-Create Links', 'betterlinks')} />}
			className="custom-panel"
			isOpen={true}
		>
			<UpgradeToPro isOpenModal={isOpenUpgradeToProModal} closeModal={() => setUpgradeToProModal(false)} />
			<div className="betterlinks-auto-create-link">
				<p>{__('A BetterLink for this post will be generated on publish', 'betterlinks')}</p>
				<div>
					<div
						style={{
							display: 'flex',
							'flex-direction': 'column',
							'margin-bottom': '12px',
						}}
					>
						<p className="components-base-control__help" style={{ marginBottom: '5px' }}>
							<span style={{ display: 'inline-block', 'margin-bottom': '7px' }}>{`${btl_custom_domain}/`}</span>
							<label>
								<span className="pro-badge" onClick={openUpgradeToProModal}>
									{__('Pro', 'betterlinks')}
								</span>
							</label>
						</p>
						<input type="text" placeholder="go/3df796" style={{ width: '100%' }} disabled />
					</div>
					<div
						style={{
							display: 'flex',
							'flex-direction': 'column',
							'margin-bottom': '12px',
						}}
					>
						<label style={{ 'margin-bottom': '5px' }}>
							{__('BetterLinks Category', 'betterlinks')}
							<span className="pro-badge" onClick={openUpgradeToProModal}>
								{__('Pro', 'betterlinks')}
							</span>
						</label>
						<select disabled>
							<option>{__('Uncategorized', 'betterlinks')}</option>
						</select>
					</div>
					<div
						style={{
							display: 'flex',
							'flex-direction': 'column',
							'margin-bottom': '12px',
						}}
					>
						<label style={{ 'margin-bottom': '5px' }}>
							{__('Redirect Type', 'betterlinks')}
							<span className="pro-badge" onClick={openUpgradeToProModal}>
								{__('Pro', 'betterlinks')}
							</span>
						</label>
						<select disabled>
							<option>{__('307 (Temporary)', 'betterlinks')}</option>
						</select>
					</div>
				</div>
			</div>
		</PluginDocumentSettingPanel>
	);
};

export default AutoLinkCreateSidebar;
