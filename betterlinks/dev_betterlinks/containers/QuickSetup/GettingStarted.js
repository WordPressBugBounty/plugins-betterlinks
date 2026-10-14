import { __ } from '@wordpress/i18n';
import { SetupContext } from 'index';
import { useContext, useState } from 'react';
import { makeRequest } from 'utils/helper';

const UsageDataIcon = () => (
	<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<path d="M4 4v16h16" />
		<path d="M9 16v-5M13 16V8M17 16v-3" />
	</svg>
);

const GettingStarted = () => {
	const { setActiveStep, setClientConsent } = useContext(SetupContext);
	const [show, setShow] = useState(false);
	const handleClientConsent = async (opt_in) => {
		const res = await makeRequest({
			action: 'betterlinks__client_consent',
			opt_in_value: opt_in,
		});
		setClientConsent(res.data?.success);
	};
	const answer = (opt_in) => {
		handleClientConsent(opt_in);
		setActiveStep(1);
	};
	return (
		<>
			<div className="bl-qs__head bl-qs__head--center">
				<h2 className="bl-qs__head-title">{__('Getting Started', 'betterlinks')}</h2>
				<p className="bl-qs__head-desc">
					{__("Easily get started with the setup wizard and streamline your website's link management strategy.", 'betterlinks')}
				</p>
			</div>

			<div className="bl-qs__video">
				<iframe
					src="https://www.youtube-nocookie.com/embed/ZJqBrFhQC1A"
					title="YouTube video player"
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
					referrerPolicy="strict-origin-when-cross-origin"
					allowFullScreen
				/>
			</div>

			<div className="bl-qs__consent">
				<p className="bl-qs__consent-text">
					{__('Help us improve BetterLinks by sharing basic site and usage data. No link, visitor or click data is sent.', 'betterlinks')}{' '}
					<button type="button" className="bl-qs__consent-link" onClick={() => setShow(!show)} aria-expanded={show}>
						{__('What we collect', 'betterlinks')}
					</button>
				</p>
				{show && (
					<div className="bl-qs__consent-more">
						<ul>
							<li>{__('Site: address, title, language, WordPress, PHP and server versions, whether it is a multisite, and where BetterLinks is installed on your server (its file path).', 'betterlinks')}</li>
							<li>{__('Plugins and theme: names and versions of active and inactive plugins, and your theme.', 'betterlinks')}</li>
							<li>{__('Admin email: we may use it to send you BetterLinks news and offers.', 'betterlinks')}</li>
							<li>{__('BetterLinks usage: number of links, redirect types and which features are turned on.', 'betterlinks')}</li>
							<li>{__('Country: looked up once from your public IP address through ip-api.com.', 'betterlinks')}</li>
						</ul>
						<p>
							{__('Sent when you allow it, then daily and when the plugin is deactivated. You can turn it off any time in BetterLinks → Settings → Tracking.', 'betterlinks')}{' '}
							<a href="https://wpdeveloper.com/privacy-policy/" target="_blank" rel="noopener noreferrer">
								{__('Privacy policy', 'betterlinks')}
							</a>
						</p>
					</div>
				)}
				<div className="bl-qs__consent-actions">
					<button type="button" className="bl-qs__btn bl-qs__btn--primary" onClick={() => answer('yes')}>
						{__('Allow & Continue', 'betterlinks')}
					</button>
					<button type="button" className="bl-qs__consent-skip" onClick={() => answer('no')}>
						{__('Skip', 'betterlinks')}
					</button>
				</div>
			</div>
		</>
	);
};

export default GettingStarted;
