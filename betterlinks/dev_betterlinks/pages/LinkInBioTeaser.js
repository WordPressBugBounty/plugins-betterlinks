import React, { useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { useUpgradeProModal } from 'utils/customHooks';
import { is_pro_enabled, is_pro_version_atleast } from 'utils/helper';
import { toastWarning } from 'components/Toast';
import UpgradeToPro from 'components/Teasers/UpgradeToPro';
import { UpgradeToProSpecial } from 'components/Teasers/UpgradeToProSpecial';

// Pro release that first ships the real Bio Links screen. Existing Pro users on
// an older build (< 3.0.0) can't use the feature yet, so they get an "update
// required" toast instead of the buy-Pro upsell shown to free users.
const BIO_LINKS_MIN_PRO = '3.0.0';

/**
 * Free-plugin upsell for the Bio Links screen.
 *
 * Same approach as the Promo Cards teaser (`pages/ProductDisplayTeaser`): an
 * inert replica of the real Pro screen behind the shared UpgradeToProSpecial
 * overlay, so free users see exactly what they'd get instead of a generic
 * upgrade card. The markup mirrors Pro `pages/LinkInBio/index.js` +
 * `List/BioList.js`; its `.btl-pd-*` / `.btl-lib-*` rules are ported into
 * `_bio-links-teaser.scss` scoped under `.bl-libt`, so they never collide with
 * Pro's own unscoped copies when both plugins are installed.
 *
 * BetterLinks Pro replaces this whole component through the
 * `betterLinksLinkInBioPage` filter (see pages/Dashboard.js).
 */

// Sample rows — plausible profiles, with the tint cycle the real list uses.
const SAMPLE_ROWS = [
	{ name: __('Creator Profile', 'betterlinks'), slug: 'creator', views: '4,182', clicks: '1,097', tint: 'blue', initials: 'CP' },
	{ name: __('Podcast Episodes', 'betterlinks'), slug: 'podcast', views: '2,640', clicks: '812', tint: 'purple', initials: 'PE' },
	{ name: __('Store Launch', 'betterlinks'), slug: 'store', views: '1,905', clicks: '664', tint: 'orange', initials: 'SL' },
	{ name: __('Newsletter Signup', 'betterlinks'), slug: 'news', views: '—', clicks: '—', tint: 'green', initials: 'NS', draft: true },
	{ name: __('Product Showcase', 'betterlinks'), slug: 'products', views: '5,321', clicks: '1,483', tint: 'red', initials: 'PS' },
	{ name: __('Event Registration', 'betterlinks'), slug: 'events', views: '3,157', clicks: '924', tint: 'teal', initials: 'ER' },
	{ name: __('Portfolio Gallery', 'betterlinks'), slug: 'portfolio', views: '2,874', clicks: '756', tint: 'indigo', initials: 'PG' },
	{ name: __('Course Landing Page', 'betterlinks'), slug: 'course', views: '1,428', clicks: '391', tint: 'pink', initials: 'CL' },
];

const CirclePlus = () => (
	<svg className="btl-pd-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
		<circle cx="12" cy="12" r="9" />
		<path d="M12 8.5v7M8.5 12h7" />
	</svg>
);

const CopyGlyph = () => (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
		<rect x="9" y="9" width="11" height="11" rx="2" />
		<path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
	</svg>
);

const EditGlyph = () => (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
		<path d="M4 20h4l10-10-4-4L4 16v4Z" />
		<path d="m14.5 5.5 4 4" />
	</svg>
);

const EyeGlyph = () => (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
		<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
		<circle cx="12" cy="12" r="2.6" />
	</svg>
);

const DeleteGlyph = () => (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<path d="M4 6.5h16M9.5 6.5V4.5h5v2M6.5 6.5 7.5 20h9l1-13.5" />
		<path d="M10.5 10v6M13.5 10v6" />
	</svg>
);

const CheckIcon = () => (
	<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<path d="M5 12.5 9.5 17 19 7" />
	</svg>
);

// Selling points shown inside the overlay card.
const SELL = [
	__('One shareable page that holds every link — built for social profiles', 'betterlinks'),
	__('Visual builder with layouts, fonts, colors, buttons and backgrounds', 'betterlinks'),
	__('Add social icons, rich text, images and embeds in any order', 'betterlinks'),
	__('Every link stays trackable — clicks, unique visitors and click rate', 'betterlinks'),
	__('Your own short slug, plus SEO title, description and share image', 'betterlinks'),
];

export default function LinkInBioTeaser() {
	const [isOpenUpgradeToProModal, openUpgradeToProModal, closeUpgradeToProModal] = useUpgradeProModal();

	// Existing Pro user on a build older than the one that ships Bio Links →
	// prompt them to update rather than pitch an upgrade they already own.
	const isOutdatedPro = is_pro_enabled && !is_pro_version_atleast(BIO_LINKS_MIN_PRO);

	// Shown both once on mount and whenever an outdated-Pro user clicks any of the
	// (otherwise non-functional) preview action controls.
	const notifyUpdate = () => {
		if (!isOutdatedPro) return;
		toastWarning(
			__('Please update BetterLinks Pro to v3.0.0 or greater to use Bio Links.', 'betterlinks'),
			{ title: __('Update required', 'betterlinks'), position: 'top-right', duration: 5000 }
		);
	};

	useEffect(() => {
		if (isOutdatedPro) notifyUpdate();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOutdatedPro]);

	return (
		<div className="bl-libt">
			<UpgradeToPro isOpenModal={isOpenUpgradeToProModal} closeModal={closeUpgradeToProModal} />

			<div className="bl-libt__stage">
				<UpgradeToProSpecial
					title={__('Bio Links is a PRO feature', 'betterlinks')}
					description={__(
						'Build a single, shareable landing page that brings all of your important links together — perfect for social media profiles. Designed visually, served from your own domain, and tracked link by link.',
						'betterlinks'
					)}
				>
					<ul className="bl-libt__sell">
						{SELL.map((point) => (
							<li key={point}>
								<CheckIcon />
								{point}
							</li>
						))}
					</ul>
				</UpgradeToProSpecial>

				{/*
				  * Replica of the Pro screen. For free users it stays inert behind the
				  * upgrade overlay; for outdated-Pro users it becomes interactive so any
				  * action click surfaces the "update required" toast.
				  */}
				<div
					className={`btl-lib bl-libt__preview${isOutdatedPro ? ' is-interactive' : ''}`}
					aria-hidden={isOutdatedPro ? undefined : 'true'}
				>
					<div className="btl-pd-tabs">
						<div className="btl-pd-tabs__nav">
							<button type="button" className="btl-pd-tab is-active" tabIndex={isOutdatedPro ? undefined : -1} onClick={notifyUpdate}>
								{__('Bio Links', 'betterlinks')}
							</button>
							<button type="button" className="btl-pd-tab" tabIndex={isOutdatedPro ? undefined : -1} onClick={notifyUpdate}>
								{__('Analytics', 'betterlinks')}
							</button>
						</div>
						<button type="button" className="btl-pd-btn btl-pd-btn--outline btl-pd-tabs__action" tabIndex={isOutdatedPro ? undefined : -1} onClick={notifyUpdate}>
							<CirclePlus />
							{__('New Bio Link', 'betterlinks')}
						</button>
					</div>

					<div className="btl-pd-list">
						<div className="btl-pd-card btl-pd-card--table">
							<table className="btl-pd-table">
								<thead>
									<tr>
										<th>{__('Bio Link', 'betterlinks')}</th>
										<th>{__('URL', 'betterlinks')}</th>
										<th>{__('Views', 'betterlinks')}</th>
										<th>{__('Clicks', 'betterlinks')}</th>
										<th className="btl-pd-table__actions-col">{__('Actions', 'betterlinks')}</th>
									</tr>
								</thead>
								<tbody>
									{SAMPLE_ROWS.map((row) => (
										<tr key={row.slug}>
											<td>
												<div className="btl-pd-product">
													<span className={`btl-pd-thumb btl-pd-thumb--${row.tint}`}>
														<span className="btl-lib-avatar__initials">{row.initials}</span>
													</span>
													<span className="btl-pd-table__name">
														{row.name}
														<span className={`btl-lib-badge ${row.draft ? 'is-draft' : 'is-live'}`}>
															{row.draft ? __('Draft', 'betterlinks') : __('Live', 'betterlinks')}
														</span>
													</span>
												</div>
											</td>
											<td className="btl-pd-table__template">{`bio/${row.slug}`}</td>
											<td>{row.views}</td>
											<td>{row.clicks}</td>
											<td className="btl-pd-table__actions-col">
												<div className="btl-pd-actions">
													<span className="btl-pd-iconbtn" role="button" onClick={notifyUpdate}>
														<EditGlyph />
													</span>
													<span className="btl-pd-iconbtn" role="button" onClick={notifyUpdate}>
														<EyeGlyph />
													</span>
													<span className="btl-pd-iconbtn" role="button" onClick={notifyUpdate}>
														<CopyGlyph />
													</span>
													<span className="btl-pd-iconbtn btl-pd-iconbtn--danger" role="button" onClick={notifyUpdate}>
														<DeleteGlyph />
													</span>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
