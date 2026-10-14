import { Button, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Shown in place of a block editor panel that BetterLinks Pro provides, when the
 * active Pro is too old to provide it.
 */
const ProUpdateNotice = () => (
	<Notice status="warning" isDismissible={false} className="betterlinks-pro-update-notice">
		<p>
			<strong>{__('BetterLinks Pro needs an update.', 'betterlinks')}</strong>
		</p>
		<p>{__('Update BetterLinks Pro to use this panel with the current version of BetterLinks. Your saved settings are kept.', 'betterlinks')}</p>
		<Button variant="secondary" href={`${window.betterLinksGlobal?.route_path || '/wp-admin/'}plugins.php`}>
			{__('Update BetterLinks Pro', 'betterlinks')}
		</Button>
	</Notice>
);

export default ProUpdateNotice;
