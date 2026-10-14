import { __, sprintf } from '@wordpress/i18n';
import UpgradeToPro from 'components/Teasers/UpgradeToPro';
import { useUpgradeProModal } from 'utils/customHooks';
import { is_pro_enabled } from 'utils/helper';

const { PluginDocumentSettingPanel } = wp.editPost;

// Minimum Pro version that ships the AI Link Assistant.
const LINK_GENIUS_MIN_PRO = '2.8.0';

// This panel only registers when the feature is unavailable. So if Pro is active
// here, it's an existing Pro user on an older build (< 2.8.0) — they should be
// told to *update*, not shown an "Upgrade to Pro" upsell / Pro badge.
const isOldPro = !!is_pro_enabled;

// Gradient sparkle tile shared by the panel title and the hero.
const SparkTile = ({ size = 22 }) => (
	<svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
		<rect width="56" height="56" rx="14" fill="url(#btlGeniusTeaserGrad)" />
		<path d="M39.531 29.6771L43.6881 28.1782C44.0636 28.0441 44.0636 27.5106 43.6881 27.3765L39.531 25.8776C34.915 24.2147 31.2823 20.5821 29.6195 15.9661L28.1205 11.809C27.9864 11.4335 27.453 11.4335 27.3189 11.809L25.82 15.9661C24.1571 20.5821 20.5245 24.2147 15.9085 25.8776L11.7513 27.3765C11.3759 27.5106 11.3759 28.0441 11.7513 28.1782L15.9085 29.6771C20.5245 31.3399 24.1571 34.9726 25.82 39.5886L27.3189 43.7457C27.453 44.1212 27.9864 44.1212 28.1205 43.7457L29.6195 39.5886C31.2823 34.9726 34.915 31.3399 39.531 29.6771Z" fill="#fff" />
		<defs>
			<linearGradient id="btlGeniusTeaserGrad" x1="4" y1="4" x2="52" y2="52" gradientUnits="userSpaceOnUse">
				<stop stopColor="#9B6CF6" />
				<stop offset="0.5" stopColor="#5C7CF0" />
				<stop offset="1" stopColor="#43B0F6" />
			</linearGradient>
		</defs>
	</svg>
);

const CheckGlyph = () => (
	<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<circle cx="12" cy="12" r="10" fill="#EEF3FF" />
		<path d="M8.5 12.2l2.4 2.4 4.6-4.8" stroke="#3669F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

/**
 * Locked, Pro-badged version of the "AI Link Assistant" editor panel, shown to
 * free users and Pro builds older than 2.8.0. The real panel ships in
 * BetterLinks Pro 2.8.0+; this teaser only registers when that's unavailable, so
 * the two never appear together.
 */
const LinkGeniusTeaser = () => {
	const [isOpenUpgradeToProModal, openUpgradeToProModal, closeUpgradeToProModal] = useUpgradeProModal();

	const perks = [
		__('Smart, AI-ranked link suggestions as you write', 'betterlinks'),
		__('Insert the best-performing BetterLink in one click', 'betterlinks'),
		__('Auto-detect raw URLs and cloak them into tracked links', 'betterlinks'),
	];

	// Existing Pro user on an old build → snackbar prompting an update (no upsell modal).
	const notifyUpdate = () => {
		wp.data
			?.dispatch?.('core/notices')
			?.createNotice?.(
				'warning',
				sprintf(
					/* translators: %s: minimum required BetterLinks Pro version. */
					__('Please update BetterLinks Pro to v%s or greater to use the AI Link Assistant.', 'betterlinks'),
					LINK_GENIUS_MIN_PRO
				),
				{ type: 'snackbar', isDismissible: true }
			);
	};

	const onCta = isOldPro ? notifyUpdate : openUpgradeToProModal;
	const ctaLabel = isOldPro ? __('Update BetterLinks Pro', 'betterlinks') : __('Upgrade to PRO', 'betterlinks');

	return (
		<PluginDocumentSettingPanel
			name="betterlinks-link-genius-teaser"
			title={
				<>
					<SparkTile size={22} />
					<span className="btl-genius-teaser__panel-title">{__('AI Link Assistant', 'betterlinks')}</span>
					{!isOldPro && <span className="pro-badge btl-genius-teaser__pro">{__('Pro', 'betterlinks')}</span>}
				</>
			}
			className="btl-genius-teaser-panel"
		>
			{!isOldPro && <UpgradeToPro isOpenModal={isOpenUpgradeToProModal} closeModal={closeUpgradeToProModal} />}
			<div className="btl-genius-teaser">
				<div className="btl-genius-teaser__hero">
					<span className="btl-genius-teaser__icon">
						<SparkTile size={48} />
					</span>
					<h2 className="btl-genius-teaser__title">{__('Smarter links as you write', 'betterlinks')}</h2>
					<p className="btl-genius-teaser__text">
						{isOldPro
							? __('Update BetterLinks Pro to unlock AI link suggestions that boost clicks & visibility.', 'betterlinks')
							: __('AI analyzes your content to suggest high-performing links that boost clicks & visibility.', 'betterlinks')}
					</p>
				</div>
				<button type="button" className="btl-genius-teaser__cta" onClick={onCta}>
					{ctaLabel}
				</button>
			</div>
		</PluginDocumentSettingPanel>
	);
};

export default LinkGeniusTeaser;
