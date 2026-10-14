import React from 'react';
import { __ } from '@wordpress/i18n';

const propTypes = {};

// Inline stroke icons (currentColor), matching the Settings icon set. These
// replace the four flat #2A62FF SVG assets so each card gets a distinct glyph
// and picks up its own accent + dark-mode colour for free.
const Svg = ({ children }) => (
	<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
		{children}
	</svg>
);

const DocIcon = () => (
	<Svg>
		<path d="M6 3h8l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
		<path d="M14 3v5h5M8.5 13h7M8.5 16.5h4" />
	</Svg>
);

const SupportIcon = () => (
	<Svg>
		<circle cx="12" cy="12" r="9" />
		<circle cx="12" cy="12" r="3.5" />
		<path d="m5.6 5.6 3.9 3.9M14.5 14.5l3.9 3.9M18.4 5.6l-3.9 3.9M9.5 14.5l-3.9 3.9" />
	</Svg>
);

const CommunityIcon = () => (
	<Svg>
		<circle cx="9" cy="8" r="3.2" />
		<path d="M3 20a6 6 0 0 1 12 0" />
		<path d="M16.5 5.6a3.2 3.2 0 0 1 0 6.3M21 20a6 6 0 0 0-3.4-5.4" />
	</Svg>
);

const HeartIcon = () => (
	<Svg>
		<path d="M12 20.3s-7.6-4.5-7.6-9.6A4.7 4.7 0 0 1 12 7.5a4.7 4.7 0 0 1 7.6 3.2c0 5.1-7.6 9.6-7.6 9.6Z" />
	</Svg>
);

const ArrowIcon = () => (
	<svg className="bl-doc__arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
		<path d="M5 12h13M13 7l5 5-5 5" />
	</svg>
);

const CARDS = [
	{
		tone: 'blue',
		icon: DocIcon,
		title: __('Documentation', 'betterlinks'),
		desc: __(
			'Get started by spending some time with the documentation to get familiar with BetterLinks. Create Shortened URLs and start cross-promoting your brands & products.',
			'betterlinks'
		),
		cta: __('Read the docs', 'betterlinks'),
		href: 'https://betterlinks.io/docs/',
	},
	{
		tone: 'violet',
		icon: SupportIcon,
		title: __('Need Help?', 'betterlinks'),
		desc: __('Stuck with something? Feel free to reach out to our Live Chat agent or create a support ticket.', 'betterlinks'),
		cta: __('Get Help', 'betterlinks'),
		href: 'https://wpdeveloper.com/support/',
	},
	{
		tone: 'green',
		icon: CommunityIcon,
		title: __('Join the Community', 'betterlinks'),
		desc: __('Join the Facebook community and discuss with fellow developers and users. Best way to connect with people and get feedback on your projects.', 'betterlinks'),
		cta: __('Join the Community', 'betterlinks'),
		href: 'https://www.facebook.com/groups/wpdeveloper.net/',
	},
	{
		tone: 'rose',
		icon: HeartIcon,
		title: __('Show Your Love', 'betterlinks'),
		desc: __(
			'We love to have you in BetterLinks family. We are making it more awesome everyday. Take your 2 minutes to review the plugin and spread the love to encourage us to keep it going.',
			'betterlinks'
		),
		cta: __('Leave a Review', 'betterlinks'),
		href: 'https://wpdeveloper.com/review-betterlinks',
	},
];

export default function Docs() {
	return (
		<div className="bl-docs">
			{CARDS.map(({ tone, icon: Icon, title, desc, cta, href }) => (
				<div className={`bl-doc bl-doc--${tone}`} key={title}>
					<span className="bl-doc__icon">
						<Icon />
					</span>
					<h3 className="bl-doc__title">{title}</h3>
					<p className="bl-doc__desc">{desc}</p>
					<a className="bl-doc__link" href={href} target="_blank" rel="noopener noreferrer">
						{cta}
						<ArrowIcon />
					</a>
				</div>
			))}
		</div>
	);
}

Docs.propTypes = propTypes;
