import { __ } from '@wordpress/i18n';
import RedirectType from 'components/RedirectType';
import ProBadge from 'components/Badge/ProBadge';
import { redirectType } from 'utils/data';
import { is_pro_enabled } from 'utils/helper';
import { Row, ToggleLine } from '../parts';

// Redirect behavior. Returns row fragments; panel + save footer live in
// GeneralSettingsForm. The Pro `BetterLinksAddOptionSettingsTabGeneral` filter
// (Force HTTPS + Uncloaked Categories) is invoked here — its natural home.
const Redirects = ({ fp, ext }) => {
	const { fastRedirect, openUpgradeToProModal, postdatas, terms } = ext;
	const attr = (name) => ({ checked: !!fp.values[name], onChange: () => fp.setFieldValue(name, !fp.values[name]) });

	return (
		<>
			<Row
				label={
					<>
						{__('Link Redirection', 'betterlinks')} <br />
						{__('(Fast Mode)', 'betterlinks')}
					</>
				}
				desc={__(
					"When active, the target URL is served from a .json cache instead of the database for faster redirects.",
					'betterlinks'
				)}
			>
				<div className="bl-set-status">
					<span className={`bl-set-status__pill ${fastRedirect.status ? 'is-active' : 'is-disabled'}`}>
						{fastRedirect.status ? __('Active', 'betterlinks') : __('Disabled', 'betterlinks')}
					</span>
					{!fastRedirect.status && (
						<button type="button" className="bl-set-status__btn" onClick={fastRedirect.activate}>
							{fastRedirect.buttonText}
						</button>
					)}
				</div>
			</Row>

			<Row label={__('Redirect Type', 'betterlinks')} desc={__('The HTTP status used when redirecting your short links.', 'betterlinks')}>
				<RedirectType
					className="btl-modal-select--full"
					classNamePrefix="btl-react-select"
					id="redirect_type"
					name="redirect_type"
					setUpgradeToProModal={openUpgradeToProModal}
					value={[
						...redirectType,
						{
							value: is_pro_enabled ? 'cloak' : 'pro',
							label: is_pro_enabled ? (
								__('Cloaked', 'betterlinks')
							) : (
								<>
									{__('Cloaked', 'betterlinks')}
									<ProBadge />
								</>
							),
						},
					]}
					defaultValue={ext.settings?.redirect_type == 'cloak' && !is_pro_enabled ? '307' : ext.settings?.redirect_type}
					setFieldValue={fp.setFieldValue}
					isMulti={false}
				/>
			</Row>

			<Row label={__('Wildcards', 'betterlinks')}>
				<ToggleLine
					label={__('Use Wildcards?', 'betterlinks')}
					tooltip={__('To use wildcards, put an asterisk (*) after the folder name that you want to redirect.', 'betterlinks')}
					name="wildcards"
					{...attr('wildcards')}
				/>
			</Row>

			<Row label={__('Instant Redirect', 'betterlinks')}>
				<ToggleLine
					label={__('Allow Instant Redirect', 'betterlinks')}
					tooltip={__('This will allow you to redirect your links instantly from Gutenberg and Elementor Editor.', 'betterlinks')}
					name="is_allow_gutenberg"
					{...attr('is_allow_gutenberg')}
				/>
			</Row>

			<Row label={__('Custom Domain Menu', 'betterlinks')}>
				<ToggleLine
					label={__('Enable Custom Domain Menu', 'betterlinks')}
					tooltip={__('This will allow you to show Custom Domain on the BetterLinks submenu for quick access.', 'betterlinks')}
					name="enable_custom_domain_menu"
					{...attr('enable_custom_domain_menu')}
				/>
			</Row>

			{/* Pro injection: Force HTTPS + Uncloaked Categories (rendered when Pro is active) */}
			{betterLinksHooks.applyFilters('BetterLinksAddOptionSettingsTabGeneral', null, { ...fp, postdatas, terms })}

			{/* Free teasers for the same Pro features */}
			{!is_pro_enabled && (
				<>
					<Row label={__('Force HTTPS', 'betterlinks')} badge={<ProBadge />} className="is-teaser" onClick={openUpgradeToProModal}>
						<ToggleLine
							label={__('Enable HTTPS Redirection', 'betterlinks')}
							tooltip={__('This will allow you to redirect your Target URLs in HTTPS.', 'betterlinks')}
							name="force_https"
							locked
							onLocked={openUpgradeToProModal}
						/>
					</Row>
					<Row label={__('Uncloak Categories', 'betterlinks')} badge={<ProBadge />} className="is-teaser" onClick={openUpgradeToProModal}>
						<ToggleLine
							label={__('Enable uncloaking categories', 'betterlinks')}
							tooltip={__('This will allow you to uncloak categories', 'betterlinks')}
							name="uncloak_categories"
							locked
							onLocked={openUpgradeToProModal}
						/>
					</Row>
				</>
			)}
		</>
	);
};

export default Redirects;
