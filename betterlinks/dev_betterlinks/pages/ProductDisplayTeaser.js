import React, { useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { useUpgradeProModal } from 'utils/customHooks';
import { is_pro_enabled, is_pro_version_atleast } from 'utils/helper';
import { toastWarning } from 'components/Toast';
import UpgradeToPro from 'components/Teasers/UpgradeToPro';
import { UpgradeToProSpecial } from 'components/Teasers/UpgradeToProSpecial';

// Pro release that first ships the real Promo Cards screen. Existing Pro users on
// an older build (< 3.0.0) can't use the feature yet, so they get an "update
// required" toast instead of the buy-Pro upsell shown to free users.
const PROMO_CARDS_MIN_PRO = '3.0.0';

/**
 * Free-plugin upsell for the Promo Cards screen.
 *
 * Rather than a generic upgrade card, this renders an inert replica of the real
 * Pro screen (`betterlinks-pro` pages/ProductDisplay) behind the shared
 * UpgradeToProSpecial overlay, so free users see exactly what they'd get. The
 * markup mirrors `ProductDisplay/index.js` + `DisplayList.js`; the `.btl-pd-*`
 * rules are ported into the free `_promo-cards-teaser.scss`, scoped under
 * `.bl-pdt` so they never collide with Pro's own copy when both are installed.
 *
 * BetterLinks Pro replaces this whole component through the
 * `betterLinksProductDisplayPage` filter (see pages/Dashboard.js).
 */

// Sample rows — enough variety to show off the thumbnail tints and templates.
const SAMPLE_ROWS = [
	{ name: __('Wireless Noise-Cancelling Headphones', 'betterlinks'), template: 'Epsilon', id: 12, tint: 'orange' },
	{ name: __('Standing Desk Converter', 'betterlinks'), template: 'Vega', id: 13, tint: 'blue' },
	{ name: __('Mechanical Keyboard — Brown Switch', 'betterlinks'), template: 'Pollux', id: 14, tint: 'green' },
	{ name: __('4K Webcam with Ring Light', 'betterlinks'), template: 'Sirius', id: 15, tint: 'purple' },
	{ name: __('Portable Bluetooth Speaker', 'betterlinks'), template: 'Orion', id: 16, tint: 'red' },
	{ name: __('Ergonomic Office Chair', 'betterlinks'), template: 'Nova', id: 17, tint: 'teal' },
	{ name: __('USB-C Docking Station', 'betterlinks'), template: 'Altair', id: 18, tint: 'indigo' },
	{ name: __('UltraWide Curved Monitor', 'betterlinks'), template: 'Phoenix', id: 19, tint: 'pink' },
];

const CirclePlus = () => (
	<svg className="btl-pd-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
		<circle cx="12" cy="12" r="9" />
		<path d="M12 8.5v7M8.5 12h7" />
	</svg>
);

const ProductGlyph = () => (
	<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
		<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5v-9Z" />
		<path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" />
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

const DeleteGlyph = () => (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<path d="M4 6.5h16M9.5 6.5V4.5h5v2M6.5 6.5 7.5 20h9l1-13.5" />
		<path d="M10.5 10v6M13.5 10v6" />
	</svg>
);

// Selling points shown inside the overlay card.
const SELL = [
	__('Turn any tracked link into a product card with image, price & badge', 'betterlinks'),
	__('Five ready-made templates, fully restyled — colors, radius, spacing', 'betterlinks'),
	__('Two call-to-action buttons that keep cloaking, nofollow & analytics', 'betterlinks'),
	__('Insert anywhere via shortcode, Gutenberg block or Elementor widget', 'betterlinks'),
	__('Group cards into grid or list layouts for comparison round-ups', 'betterlinks'),
];

const CheckIcon = () => (
	<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<path d="M5 12.5 9.5 17 19 7" />
	</svg>
);

export default function ProductDisplayTeaser() {
	const [isOpenUpgradeToProModal, openUpgradeToProModal, closeUpgradeToProModal] = useUpgradeProModal();

	// Existing Pro user on a build older than the one that ships Promo Cards →
	// prompt them to update rather than pitch an upgrade they already own.
	const isOutdatedPro = is_pro_enabled && !is_pro_version_atleast(PROMO_CARDS_MIN_PRO);

	// Shown both once on mount and whenever an outdated-Pro user clicks any of the
	// (otherwise non-functional) preview action controls.
	const notifyUpdate = () => {
		if (!isOutdatedPro) return;
		toastWarning(
			__('Please update BetterLinks Pro to v3.0.0 or greater to use Promo Cards.', 'betterlinks'),
			{ title: __('Update required', 'betterlinks'), position: 'top-right', duration: 5000 }
		);
	};

	useEffect(() => {
		if (isOutdatedPro) notifyUpdate();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOutdatedPro]);

	return (
		<div className="bl-pdt">
			<UpgradeToPro isOpenModal={isOpenUpgradeToProModal} closeModal={closeUpgradeToProModal} />

			<div className="bl-pdt__stage">
				<UpgradeToProSpecial
					title={__('Promo Cards is a PRO feature', 'betterlinks')}
					description={__(
						'Showcase any affiliate link as a conversion-focused product card — image, price, badge, rich description, and two call-to-action buttons that keep tracking, cloaking and analytics intact.',
						'betterlinks'
					)}
				>
					<ul className="bl-pdt__sell">
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
					className={`btl-product-display-page bl-pdt__preview${isOutdatedPro ? ' is-interactive' : ''}`}
					aria-hidden={isOutdatedPro ? undefined : 'true'}
				>
					<div className="btl-pd-tabs">
						<div className="btl-pd-tabs__nav">
							<button type="button" className="btl-pd-tab is-active" tabIndex={isOutdatedPro ? undefined : -1} onClick={notifyUpdate}>
								{__('Single Cards', 'betterlinks')}
							</button>
							<button type="button" className="btl-pd-tab" tabIndex={isOutdatedPro ? undefined : -1} onClick={notifyUpdate}>
								{__('Card Groups', 'betterlinks')}
							</button>
						</div>
						<button type="button" className="btl-pd-btn btl-pd-btn--outline btl-pd-tabs__action" tabIndex={isOutdatedPro ? undefined : -1} onClick={notifyUpdate}>
							<CirclePlus />
							{__('Add Card', 'betterlinks')}
						</button>
					</div>

					<div className="btl-pd-list">
						<div className="btl-pd-card btl-pd-card--table">
							<table className="btl-pd-table">
								<thead>
									<tr>
										<th>{__('Product Name', 'betterlinks')}</th>
										<th>{__('Template', 'betterlinks')}</th>
										<th>{__('Shortcode', 'betterlinks')}</th>
										<th className="btl-pd-table__actions-col">{__('Actions', 'betterlinks')}</th>
									</tr>
								</thead>
								<tbody>
									{SAMPLE_ROWS.map((row) => (
										<tr key={row.id}>
											<td>
												<div className="btl-pd-product">
													<span className={`btl-pd-thumb btl-pd-thumb--${row.tint}`}>
														<ProductGlyph />
													</span>
													<span className="btl-pd-table__name">{row.name}</span>
												</div>
											</td>
											<td className="btl-pd-table__template">{row.template}</td>
											<td>
												<span className="btl-pd-code">
													<code className="btl-pd-code__text">{`[betterlinks_product_display id="${row.id}"]`}</code>
													<span className="btl-pd-code__copy" role="button" onClick={notifyUpdate}>
														<CopyGlyph />
													</span>
												</span>
											</td>
											<td className="btl-pd-table__actions-col">
												<div className="btl-pd-actions">
													<span className="btl-pd-iconbtn" role="button" onClick={notifyUpdate}>
														<CopyGlyph />
													</span>
													<span className="btl-pd-iconbtn" role="button" onClick={notifyUpdate}>
														<EditGlyph />
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
