import { __, sprintf } from '@wordpress/i18n';
import { min_pro_version, route_path } from 'utils/helper';

// Shown in place of a Pro feature when BetterLinks Pro is active but too old to
// provide it: the feature now lives in Pro and plugs in through hooks this
// version of BetterLinks exposes.
// The copy is deliberately identical everywhere it appears — Analytics,
// Settings, AI Configuration, the Plugins screen — so a user meets one
// instruction rather than five wordings of it. Call sites may still pass a
// `feature` prop; it is not rendered.
const ProUpdateRequired = () => (
	<div className="btl-pro-update-required" role="status">
		<span className="btl-pro-update-required__icon" aria-hidden="true">
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
				<circle cx="12" cy="12" r="10" />
				<path d="M12 16V8" />
				<path d="M8.5 11.5L12 8l3.5 3.5" />
			</svg>
		</span>
		<p className="btl-pro-update-required__text">
			<strong>{__('BetterLinks Pro needs an update.', 'betterlinks')}</strong>{' '}
			{sprintf(
				/* translators: %s: required BetterLinks Pro version, e.g. "3.0.4" */
				__('Please update BetterLinks Pro to v%s or later to ensure compatibility with the current version of BetterLinks.', 'betterlinks'),
				min_pro_version
			)}
		</p>
		<a className="btl-pro-update-required__link" href={`${route_path || '/wp-admin/'}plugins.php`}>
			{__('Update now', 'betterlinks')}
		</a>
	</div>
);

export default ProUpdateRequired;
