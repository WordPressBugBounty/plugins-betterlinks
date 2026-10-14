import { __ } from '@wordpress/i18n';
import { CheckIcon, CrownIcon } from '../Icons';

const FEATURES = [
	__('AI Bulk Link Generator', 'betterlinks'),
	__('AI Link Assistant ', 'betterlinks'),
	__('Custom Domain', 'betterlinks'),
	__('Individual Link Analytics', 'betterlinks'),
	__('Password Protected Redirects', 'betterlinks'),
	__('Full-Site Link Scanner', 'betterlinks'),
	__('Auto-Link Keywords', 'betterlinks'),
	__('Role Management', 'betterlinks'),
	__('Google Analytics Integration', 'betterlinks'),
	__('Dynamic & Geo Redirects', 'betterlinks'),
];

// Free-plugin License section: an upgrade teaser. In Pro, the real <License/>
// activation panel replaces this via the `betterLinksSettingsNav` hook.
const LicenseTeaser = ({ openUpgradeToProModal }) => (
	<div className="bl-settings__panel">
		<div className="bl-license-teaser">
			<span className="bl-license-teaser__badge">
				<CrownIcon size={30} />
			</span>
			<h2 className="bl-license-teaser__title">{__('Activate BetterLinks Pro', 'betterlinks')}</h2>
			<p className="bl-license-teaser__text">
				{__(
					'Enter a license key here once you upgrade. BetterLinks Pro unlocks branded domains, deep analytics, automation and much more to run successful marketing campaigns.',
					'betterlinks'
				)}
			</p>
			<ul className="bl-license-teaser__list">
				{FEATURES.map((f) => (
					<li key={f}>
						<CheckIcon size={16} />
						{f}
					</li>
				))}
			</ul>
			<a className="bl-license-teaser__cta" href="https://wpdeveloper.com/in/upgrade-betterlinks" target="_blank" rel="noreferrer">
				<CrownIcon size={18} />
				{__('Upgrade to PRO', 'betterlinks')}
			</a>
		</div>
	</div>
);

export default LicenseTeaser;
