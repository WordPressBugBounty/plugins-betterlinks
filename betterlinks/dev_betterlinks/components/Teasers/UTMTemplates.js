import { __ } from '@wordpress/i18n';
import { plugin_root_url } from 'utils/helper';
import ProBadge from 'components/Badge/ProBadge';
// Presentational styles for the template list and the template modal. BetterLinks
// Pro renders the real manager with these class names, so they stay in the
// shared stylesheet.
import '../../../assets/scss/components/_utm_builder_style.scss';
import '../../../assets/scss/components/_utm-template-modal-redesign.scss';

const POINTS = [
	__('Save reusable sets of UTM parameters as templates', 'betterlinks'),
	__('Assign a template to link categories', 'betterlinks'),
	__('Apply a template to new links in those categories automatically', 'betterlinks'),
	__('Add, rewrite or reset UTM parameters on existing links in bulk', 'betterlinks'),
];

/**
 * Settings → UTM Builder when BetterLinks Pro does not provide the template
 * manager (it replaces this item through `betterLinksSettingsNav`).
 *
 * Static preview only: no stored data, no requests.
 */
const UTMTemplatesTeaser = ({ openUpgradeToProModal = () => {} }) => (
	<div className="btl-utm-global-settings">
		<div className="btl-utm-templates-section">
			<div className="btl-utm-templates-wrapper">
				<div className="btl-utm-templates-title btl-d-title">
					{__('Dynamic UTM Templates', 'betterlinks')} <ProBadge />
				</div>
				<button type="button" className="button-primary btn-save-settings" onClick={openUpgradeToProModal} style={{ cursor: 'not-allowed' }}>
					<img style={{ marginRight: '8px' }} src={plugin_root_url + 'assets/images/add-icon.svg'} alt="" />
					{__('Create New Template', 'betterlinks')}
				</button>
			</div>
			<div className="btl-utm-empty-state">
				<div className="btl-utm-empty-content">
					<div className="btl-utm-empty-icon">
						<img src={plugin_root_url + 'assets/images/icons/empty-template.svg'} alt="" width="56" height="56" />
					</div>
					<h4 className="btl-utm-empty-title">{__('UTM templates are available in BetterLinks Pro', 'betterlinks')}</h4>
					<ul className="btl-utm-empty-description" style={{ textAlign: 'left', listStyle: 'disc', paddingLeft: '20px' }}>
						{POINTS.map((point) => (
							<li key={point}>{point}</li>
						))}
					</ul>
					<button type="button" className="btl-utm-empty-cta" onClick={openUpgradeToProModal}>
						{__('Upgrade to Pro', 'betterlinks')}
					</button>
				</div>
			</div>
		</div>
	</div>
);

export default UTMTemplatesTeaser;
