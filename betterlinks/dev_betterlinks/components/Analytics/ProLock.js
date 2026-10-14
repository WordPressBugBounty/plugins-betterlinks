import { useEffect, useRef } from 'react';
import { __ } from '@wordpress/i18n';
import { plugin_root_url } from 'utils/helper';
import { LockIcon, CheckIcon } from './Icons';

const UPGRADE_URL = 'https://wpdeveloper.com/in/upgrade-betterlinks';

/**
 * One card for the whole locked run of sections, so the page makes the pitch
 * once instead of five times. Each bullet names the section it stands for, in
 * the order they appear underneath.
 */
const POINTS = [
	__('Geography — country-level map and top markets', 'betterlinks'),
	__('Sources — referring sites, social networks and channels', 'betterlinks'),
	__('Technology — device, operating system and browser', 'betterlinks'),
	__('Timing — 7 × 24 heatmap and your busiest hour', 'betterlinks'),
	__('Attention — biggest risers and sharpest drops', 'betterlinks'),
];

/**
 * Wraps the entire locked run of Analytics sections for the free plugin.
 *
 * The real sections render underneath with sample data (see `proTeaser.data.js`)
 * and dimmed, with ONE upgrade card floating over the whole block — the same
 * "here is exactly what you get" approach as the Link Scanner teaser, rather
 * than an empty placeholder.
 *
 * The card is `position: sticky`, so it rides along as you scroll the tall
 * locked region instead of scrolling out of sight at the top of it. That is why
 * nothing in this subtree may set `overflow: hidden` — it would trap the sticky.
 *
 * The preview is made `inert` so none of its controls (heatmap cells, bar-list
 * rows, the map) can be hovered, clicked or reached with Tab, and so screen
 * readers announce the CTA instead of fake figures.
 */
const ProLock = ({ points = POINTS, children }) => {
	const previewRef = useRef(null);

	// `inert` is a DOM property, not a React-managed attribute in the React
	// version this bundle ships, so it is set imperatively.
	useEffect(() => {
		if (previewRef.current) previewRef.current.inert = true;
	}, []);

	return (
		<div className="bl-an-lock">
			<div className="bl-an-lock__preview" ref={previewRef} aria-hidden="true">
				{children}
			</div>

		<div className="bl-an-lock__overlay">
				{/* Same card anatomy as the Link Scanner teaser (`UpgradeToProSpecial`):
				    one pill, a big title, a short description, icon-tiled feature rows
				    and a gradient CTA. */}
				<div className="bl-an-lock__cta" role="note">
					<span className="bl-an-lock__pill">
						<LockIcon width={14} height={14} />
						{__('PRO Feature', 'betterlinks')}
					</span>

					<h3 className="bl-an-lock__title">{__('Unlock your full click analytics', 'betterlinks')}</h3>
					<p className="bl-an-lock__text">
						{__(
							'BetterLinks Pro records the detail behind every click — who clicked, from where, on what, and when — and turns it into the reports below.',
							'betterlinks'
						)}
					</p>

					<ul className="bl-an-lock__points">
						{points.map((point) => (
							<li key={point}>
								<span className="bl-an-lock__point-icon">
									<CheckIcon width={16} height={16} />
								</span>
								<p>{point}</p>
							</li>
						))}
					</ul>

					<a className="bl-an-lock__button" href={UPGRADE_URL} target="_blank" rel="noopener noreferrer">
						{/* `plugin_root_url` already ends in a slash. */}
						<img src={`${plugin_root_url}assets/images/crown.svg`} alt="" aria-hidden="true" />
						{__('Upgrade To BetterLinks PRO', 'betterlinks')}
					</a>

					<p className="bl-an-lock__note">{__('Sample data shown — your own figures appear once Pro is active.', 'betterlinks')}</p>
				</div>
			</div>
		</div>
	);
};

export default ProLock;
