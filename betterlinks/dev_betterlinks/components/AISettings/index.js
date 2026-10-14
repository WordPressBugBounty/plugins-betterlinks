import { __ } from '@wordpress/i18n';
import { useUpgradeProModal } from 'utils/customHooks';
import { is_pro_enabled, pro_needs_update, pro_version_check } from 'utils/helper';
import UpgradeToPro from '../Teasers/UpgradeToPro';
import LinkAssistantTeaser from './LinkAssistantTeaser';
import LinkAssistantInjector from './LinkAssistantInjector';
import ProUpdateRequired from '../Teasers/ProUpdateRequired';
import ProBadge from 'components/Badge/ProBadge';

// Newer Pro builds (>= 2.8.0) expose a filter slot before their Save button; fill it so
// the teaser markup/copy is owned by the (more frequently updated) free plugin.
betterLinksHooks.addFilter('BetterLinksAILinkAssistant', 'betterlinks', () => <LinkAssistantTeaser />);

const AISettings = () => {
	const filterResult = betterLinksHooks.applyFilters('BetterLinksAISettings', null, {});

	// A Pro older than this release serves the AI settings screen but not the
	// `betterlinks/v1/ai-settings` route behind it — the route moved into Pro's
	// AI module. Its form then fetched a 404 and reported "Failed to fetch AI
	// settings", which reads as a bug rather than what it is. Show the update
	// notice instead of mounting a screen that cannot load.
	if (is_pro_enabled && pro_needs_update) {
		return (
			<div className="btl-ai-settings bl-ai">
				<header className="bl-ai__head">
					<div className="bl-ai__head-text">
						<h3 className="bl-ai__title">{__('API Configuration', 'betterlinks')}</h3>
						<p className="bl-ai__subtitle">
							{__('Connect an AI provider to power bulk link generation and the Link Assistant.', 'betterlinks')}
						</p>
					</div>
				</header>
				<ProUpdateRequired feature={__('AI provider settings', 'betterlinks')} />
			</div>
		);
	}

	// Pro active -> filterResult is the Pro AI settings form; Pro inactive -> null (show teaser).
	if (filterResult) {
		// For EXISTING Pro users on an older build (< 2.8.0) whose installed Pro bundle
		// has no filter slot, the injector DOM-mounts the teaser before the Pro Save
		// button. It self-disables on Pro 2.8.0+ (which renders the real assistant UI).
		return (
			<>
				{filterResult}
				<LinkAssistantInjector />
			</>
		);
	}
	return <Teaser />;
};
// Gradient sparkle tile beside the "AI Link Assistant" heading. Matches Pro's
// `AssistantSparkIcon`; the plain white sparkle it replaced was invisible once
// the card behind it turned white. The gradient id is teaser-specific so it
// cannot collide with Pro's if both ever render.
const SparkIcon = () => (
	<svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
		<rect width="56" height="56" rx="14" fill="url(#btlAiTeaserGrad)" />
		<path
			d="M39.531 29.6771L43.6881 28.1782C44.0636 28.0441 44.0636 27.5106 43.6881 27.3765L39.531 25.8776C34.915 24.2147 31.2823 20.5821 29.6195 15.9661L28.1205 11.809C27.9864 11.4335 27.453 11.4335 27.3189 11.809L25.82 15.9661C24.1571 20.5821 20.5245 24.2147 15.9085 25.8776L11.7513 27.3765C11.3759 27.5106 11.3759 28.0441 11.7513 28.1782L15.9085 29.6771C20.5245 31.3399 24.1571 34.9726 25.82 39.5886L27.3189 43.7457C27.453 44.1212 27.9864 44.1212 28.1205 43.7457L29.6195 39.5886C31.2823 34.9726 34.915 31.3399 39.531 29.6771Z"
			fill="#fff"
		/>
		<defs>
			<linearGradient id="btlAiTeaserGrad" x1="4" y1="4" x2="52" y2="52" gradientUnits="userSpaceOnUse">
				<stop stopColor="#9B6CF6" />
				<stop offset="0.5" stopColor="#5C7CF0" />
				<stop offset="1" stopColor="#43B0F6" />
			</linearGradient>
		</defs>
	</svg>
);

export default AISettings;

// Mirrors the Pro form's layout (betterlinks-pro components/AISettings) so the
// teaser previews the real screen. Shared `.bl-ai` styles live in the free
// plugin — assets/scss/components/_ai-settings.scss — and Pro inherits them.
const PROVIDERS = [
	{ value: 'openai', label: 'OpenAI', desc: __('GPT models — broad quality, paid usage.', 'betterlinks'), mark: 'AI' },
	{ value: 'gemini', label: 'Google Gemini', desc: __('Gemini models — fast, generous free tier.', 'betterlinks'), mark: 'G' },
];

const CheckIcon = () => (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<path d="M5 12.5 9.5 17 19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

const ChevronIcon = () => (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

const LockIcon = () => (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<rect x="4.5" y="10.5" width="15" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
		<path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
	</svg>
);

const ASSISTANT_ROWS = [
	{
		title: __('Smart link suggestions', 'betterlinks'),
		desc: __('Suggest relevant short links as you write in the content editor.', 'betterlinks'),
	},
	{
		title: __('Detect untracked URLs', 'betterlinks'),
		desc: __('Spot plain URLs and offer to convert them into short tracked links.', 'betterlinks'),
	},
];

const Teaser = () => {
	const [isOpenUpgradeToProModal, openUpgradeToProModal, closeUpgradeToProModal] = useUpgradeProModal();
	const isProVersionValid = pro_version_check('2.6.0');

	return (
		<>
			<UpgradeToPro isOpenModal={isOpenUpgradeToProModal} closeModal={closeUpgradeToProModal} />

			<div className="btl-ai-settings bl-ai bl-ai--teaser" onClick={openUpgradeToProModal}>
				<header className="bl-ai__head">
					<div className="bl-ai__head-text">
						<h3 className="bl-ai__title">
							{__('API Configuration', 'betterlinks')}
							<ProBadge />
						</h3>
						<p className="bl-ai__subtitle">
							{__('Connect an AI provider to power bulk link generation and the Link Assistant.', 'betterlinks')}
						</p>
					</div>
					<span className="bl-ai__status">
						<span className="bl-ai__status-dot" />
						{__('Not configured', 'betterlinks')}
					</span>
				</header>

				{!isProVersionValid && (
					<p className="bl-ai__error">
						{__('AI Bulk Link Generator requires BetterLinks Pro v2.6.0 or newer. Please update the plugin to use it.', 'betterlinks')}
					</p>
				)}

				{/* ---- Provider ---------------------------------------------- */}
				<section className="bl-ai__card">
					<div className="bl-ai__card-head">
						<div>
							<h4 className="bl-ai__card-title">{__('Provider', 'betterlinks')}</h4>
							<p className="bl-ai__card-desc">{__('Choose which service BetterLinks should call, then add its key.', 'betterlinks')}</p>
						</div>
					</div>

					<div className="bl-ai__card-body">
						<div className="bl-ai__providers">
							{PROVIDERS.map((p, i) => (
								<div className={`bl-ai__provider${i === 1 ? ' is-active' : ''}`} key={p.value}>
									<span className="bl-ai__provider-mark">{p.mark}</span>
									<span className="bl-ai__provider-text">
										<span className="bl-ai__provider-name">{p.label}</span>
										<span className="bl-ai__provider-desc">{p.desc}</span>
									</span>
									<span className="bl-ai__provider-check" aria-hidden="true">
										<CheckIcon />
									</span>
								</div>
							))}
						</div>

						<div className="bl-ai__field">
							<span className="bl-ai__label">{__('API Authentication Key', 'betterlinks')}</span>
							<div className="bl-ai__key">
								<div className="bl-ai__fauxinput bl-ai__fauxinput--key">••••••••••••••••••••••••••••</div>
							</div>
							<p className="bl-ai__hint">
								{__('Get your access key from the provider’s platform.', 'betterlinks')}{' '}
								<a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
									{__('Google AI Studio', 'betterlinks')}
								</a>
							</p>
						</div>
					</div>
				</section>

				{/* ---- Model & usage ------------------------------------------ */}
				<section className="bl-ai__card">
					<div className="bl-ai__card-head">
						<div>
							<h4 className="bl-ai__card-title">{__('Model & Usage', 'betterlinks')}</h4>
							<p className="bl-ai__card-desc">{__('Pick a model and cap how many tokens a single request may spend.', 'betterlinks')}</p>
						</div>
					</div>

					<div className="bl-ai__card-body">
						<div className="bl-ai__grid">
							<div className="bl-ai__field">
								<span className="bl-ai__label">{__('Gemini Model', 'betterlinks')}</span>
								<div className="bl-ai__fauxinput">
									{__('Gemini 2.5 Flash', 'betterlinks')}
									<ChevronIcon />
								</div>
							</div>
							<div className="bl-ai__field">
								<span className="bl-ai__label">{__('Maximum Token Limit', 'betterlinks')}</span>
								<div className="bl-ai__fauxinput">
									3000
									<span>{__('tokens', 'betterlinks')}</span>
								</div>
							</div>
						</div>

						<p className="bl-ai__hint">
							<strong>gemini-2.5-flash</strong>
							{__(' uses about ', 'betterlinks')}
							<strong>2000</strong>
							{__(' tokens for every 10 URLs — raise the limit if you generate more at once.', 'betterlinks')}
						</p>
					</div>
				</section>

				{/* ---- Link Assistant ----------------------------------------- */}
				<section className="bl-ai__card bl-ai__card--assistant">
					<div className="bl-ai__card-head">
						<span className="bl-ai__card-icon">
							<SparkIcon />
						</span>
						<div>
							<h4 className="bl-ai__card-title">
								{__('AI Link Assistant', 'betterlinks')}
								<ProBadge />
							</h4>
							<p className="bl-ai__card-desc">{__('Suggestions while you write, powered by the provider above.', 'betterlinks')}</p>
						</div>
					</div>

					<div className="bl-ai__card-body">
						{ASSISTANT_ROWS.map((row) => (
							<div className="bl-ai__switch-row" key={row.title}>
								<span className="bl-ai__switch-text">
									<span className="bl-ai__switch-title">{row.title}</span>
									<span className="bl-ai__switch-desc">{row.desc}</span>
								</span>
								<span className="btl-ai-toggle">
									<span className="btl-ai-toggle__track">
										<span className="btl-ai-toggle__thumb" />
									</span>
								</span>
							</div>
						))}
					</div>
				</section>

				<div className="bl-ai__actions btl-ai-settings__button">
					<p className="bl-ai__actions-note">
						{__('Available in BetterLinks Pro.', 'betterlinks')}{' '}
						<a href="https://betterlinks.io/docs/ai-bulk-link-generator-in-betterlinks/" target="_blank" rel="noopener noreferrer">
							{__('Read the setup guide', 'betterlinks')}
						</a>
					</p>
					<button type="button" className="bl-ai__unlock" onClick={openUpgradeToProModal}>
						<LockIcon />
						{__('Unlock with BetterLinks Pro', 'betterlinks')}
					</button>
				</div>
			</div>
		</>
	);
};
