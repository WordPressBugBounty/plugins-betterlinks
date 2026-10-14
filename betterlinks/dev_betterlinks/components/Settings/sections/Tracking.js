import { __, sprintf } from '@wordpress/i18n';
import { useState } from 'react';
import ProBadge from 'components/Badge/ProBadge';
import { is_pro_enabled, pro_needs_update, min_pro_version, makeRequest } from 'utils/helper';
import { toastWarning } from 'components/Toast';
import { Row, ToggleLine } from '../parts';

// Usage data sharing lives outside the settings form: consent is stored by the
// usage tracker, so the switch saves immediately through the consent endpoint.
const UsageDataSharing = () => {
	const [allowed, setAllowed] = useState(!!window.betterLinksGlobal?.usage_tracking_allowed);
	const [saving, setSaving] = useState(false);

	const onToggle = async () => {
		if (saving) return;
		const next = !allowed;
		setSaving(true);
		setAllowed(next);
		try {
			const res = await makeRequest({ action: 'betterlinks__client_consent', opt_in_value: next ? 'yes' : 'no', context: 'settings' });
			if (!res?.data?.success) throw new Error('consent_not_saved');
		} catch (e) {
			setAllowed(!next);
			toastWarning(__('Could not update usage data sharing. Please try again.', 'betterlinks'));
		}
		setSaving(false);
	};

	return (
		<Row
			label={__('Usage Data Sharing', 'betterlinks')}
			desc={__('Sends non-sensitive diagnostic data (site URL, WordPress & PHP version, plugins & themes, admin email) to help keep BetterLinks compatible. Off unless you turn it on.', 'betterlinks')}
		>
			<ToggleLine
				label={__('Share usage data with BetterLinks', 'betterlinks')}
				name="betterlinks_usage_data_sharing"
				checked={allowed}
				onChange={onToggle}
			/>
		</Row>
	);
};

// Analytics / tracking behavior. Returns row fragments; the External Analytics
// (Pro) panel is rendered separately by GeneralSettingsForm (outside the form).
//
// IP exclusion and user-agent tracking are BetterLinks Pro features. Pro renders
// their rows through `betterLinksSettingsExcludedIps` and
// `betterLinksSettingsUserAgentTracking` — `(null, ctx) => node`, where ctx is
// `{ values, setFieldValue, Row, ToggleLine }` — and the values save with this
// form. When nothing answers a filter, a locked row is shown instead. It holds
// no form field, so the stored value is carried through the save unchanged.
const Tracking = ({ fp, ext }) => {
	const { fastClicks, openUpgradeToProModal } = ext;
	const attr = (name) => ({ checked: !!fp.values[name], onChange: () => fp.setFieldValue(name, !fp.values[name]) });
	const proCtx = { values: fp.values, setFieldValue: fp.setFieldValue, Row, ToggleLine };
	const excludedIpsRow = betterLinksHooks.applyFilters('betterLinksSettingsExcludedIps', null, proCtx);
	const userAgentRow = betterLinksHooks.applyFilters('betterLinksSettingsUserAgentTracking', null, proCtx);
	const countryTrackingRow = betterLinksHooks.applyFilters('betterLinksSettingsCountryTracking', null, proCtx);

	const onLocked = (feature) => () => {
		if (is_pro_enabled && pro_needs_update) {
			toastWarning(
				sprintf(
					/* translators: %s: required BetterLinks Pro version, e.g. "3.0.4" */
					__('Please update BetterLinks Pro to v%s or later to ensure compatibility with the current version of BetterLinks.', 'betterlinks'),
					min_pro_version
				),
				{ title: __('BetterLinks Pro needs an update', 'betterlinks'), duration: 5000 }
			);
			return;
		}
		openUpgradeToProModal();
	};
	return (
		<>
			<Row
				label={fastClicks.status ? __('Fetch Analytics Data', 'betterlinks') : (
					<>
						{__('Click Data', 'betterlinks')} <br /> {__('(Fast Mode)', 'betterlinks')}
					</>
				)}
				desc={
					fastClicks.status
						? __("Analytics data updates hourly. Use Refresh Stats to update instantly.", 'betterlinks')
						: __('When active, click data is buffered to a .json file and flushed hourly instead of on every click.', 'betterlinks')
				}
			>
				<div className="bl-set-status">
					<span className={`bl-set-status__pill ${fastClicks.status ? 'is-active' : 'is-disabled'}`}>
						{fastClicks.status ? __('Active', 'betterlinks') : __('Disabled', 'betterlinks')}
					</span>
					<button type="button" className="bl-set-status__btn" onClick={fastClicks.action}>
						{fastClicks.buttonText}
					</button>
				</div>
			</Row>

			<UsageDataSharing />

			<Row label={__('Bot Clicks', 'betterlinks')}>
				<ToggleLine
					label={__('Disable Bot Clicks', 'betterlinks')}
					tooltip={__('This will prevent your site from bot traffic', 'betterlinks')}
					name="disablebotclicks"
					{...attr('disablebotclicks')}
				/>
			</Row>

			<Row label={__('Clicks IP', 'betterlinks')}>
				<ToggleLine
					label={__('Disable IP Addresses for Analytics', 'betterlinks')}
					tooltip={__("If checked, users' ip addresses won't be saved & won't be shown in analytics section", 'betterlinks')}
					name="is_disable_analytics_ip"
					{...attr('is_disable_analytics_ip')}
				/>
			</Row>

			{excludedIpsRow || (
				<Row
					label={__('Exclude IP Addresses', 'betterlinks')}
					badge={!is_pro_enabled && <ProBadge />}
					tooltip={__('Clicks from these IP addresses will not be counted in analytics.', 'betterlinks')}
					className="is-teaser"
					onClick={onLocked(__('IP exclusion', 'betterlinks'))}
				>
					<div className="btl-ip-tag-input-wrapper btl-ip-tag-input-disabled" aria-hidden="true">
						<div className="btl-ip-tag-input-container disabled">
							<div className="btl-ip-tags-list">
								<span className="btl-ip-tag-input">{__('Enter IP addresses (Ex: 127.xxx.xxx or 2001:xxxx:xxxx)', 'betterlinks')}</span>
							</div>
						</div>
					</div>
				</Row>
			)}

			{userAgentRow || (
				<Row
					label={__('User-Agent', 'betterlinks')}
					badge={!is_pro_enabled && <ProBadge />}
					className="is-teaser"
					id="btl-setting-user-agent"
					onClick={onLocked(__('User-agent tracking', 'betterlinks'))}
				>
					<ToggleLine
						label={__('Enable User-Agent Tracking', 'betterlinks')}
						tooltip={__('This will capture and store user agent information in analytics for detailed browser tracking', 'betterlinks')}
						locked
					/>
				</Row>
			)}

			{countryTrackingRow || (
				<Row
					label={__('Country', 'betterlinks')}
					badge={!is_pro_enabled && <ProBadge />}
					className="is-teaser"
					id="btl-setting-country-tracking"
					onClick={onLocked(__('Country tracking', 'betterlinks'))}
				>
					<ToggleLine
						label={__('Enable Country Tracking', 'betterlinks')}
						tooltip={__("Track the country where each click comes from using the visitor's IP address.", 'betterlinks')}
						locked
					/>
				</Row>
			)}
		</>
	);
};

export default Tracking;
