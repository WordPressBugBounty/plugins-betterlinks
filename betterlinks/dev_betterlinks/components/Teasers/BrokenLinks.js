import React from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { pro_version_check } from 'utils/helper';
import UpgradeToPro from 'components/Teasers/UpgradeToPro';
import { useUpgradeProModal } from 'utils/customHooks';
import { List, ListItem, ListItemText } from '@material-ui/core';
import Note from 'components/CustomizeLinkPreview/Note';
import { UpgradeToProSpecial } from './UpgradeToProSpecial';

const propTypes = {};

const weekOption = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ---------------------------------------------------------------------------
// Inline stroke icons (mirror the Pro Broken Link Scanner set)
// ---------------------------------------------------------------------------
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };

const IconClock = () => (
	<svg viewBox="0 0 24 24" {...stroke}>
		<circle cx="12" cy="12" r="8.5" />
		<path d="M12 7.5V12l3 1.8" />
	</svg>
);
const IconMail = () => (
	<svg viewBox="0 0 24 24" {...stroke}>
		<rect x="3" y="5" width="18" height="14" rx="2.5" />
		<path d="m3.5 7 8.5 6 8.5-6" />
	</svg>
);
const IconScan = () => (
	<svg viewBox="0 0 24 24" {...stroke}>
		<path d="M12 3a9 9 0 1 0 9 9" />
		<path d="M12 12 19 5" />
		<circle cx="12" cy="12" r="1.6" />
	</svg>
);
const IconSend = () => (
	<svg viewBox="0 0 24 24" {...stroke}>
		<path d="M21.5 2.5 10.5 13.5" />
		<path d="M21.5 2.5 14.5 21.5l-4-8-8-4Z" />
	</svg>
);
const IconRefresh = () => (
	<svg viewBox="0 0 24 24" {...stroke}>
		<path d="M21 12a9 9 0 1 1-2.64-6.36" />
		<polyline points="21 3 21 9 15 9" />
	</svg>
);
const IconBrand = () => (
	<svg viewBox="0 0 24 24" {...stroke}>
		<path d="M9.5 13.5 8 15a4 4 0 0 1-5.66-5.66l1.5-1.5" />
		<path d="M14.5 10.5 16 9a4 4 0 0 1 5.66 5.66l-1.5 1.5" />
		<line x1="4" y1="4" x2="20" y2="20" />
	</svg>
);
const IconChain = () => (
	<svg viewBox="0 0 24 24" {...stroke}>
		<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
		<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
	</svg>
);
const IconShield = () => (
	<svg viewBox="0 0 24 24" {...stroke}>
		<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
	</svg>
);
const IconSearch = () => (
	<svg viewBox="0 0 24 24" {...stroke}>
		<circle cx="11" cy="11" r="7" />
		<path d="m20 20-3.5-3.5" />
	</svg>
);
const IconTrash = () => (
	<svg viewBox="0 0 24 24" {...stroke}>
		<path d="M4 7h16M9 7V5h6v2m-8 0 1 13h8l1-13" />
	</svg>
);
const IconBrokenLink = () => (
	<svg viewBox="0 0 24 24" {...stroke}>
		<path d="M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 0 1 0 10h-2M8 12h2m4 0h2" />
		<path d="M12 2v3m0 14v3" />
	</svg>
);
const IconExternal = () => (
	<svg viewBox="0 0 24 24" {...stroke}>
		<path d="M14 5h5v5M19 5l-9 9" />
		<path d="M19 14v4a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 18V7a1.5 1.5 0 0 1 1.5-1.5H10" />
	</svg>
);

// ---------------------------------------------------------------------------
// Sample figures + rows (static — the free preview mirrors a completed scan)
// ---------------------------------------------------------------------------
const HEALTH_SEGMENTS = [
	{ key: 'active', modifier: 'active', label: __('Active', 'betterlinks') },
	{ key: 'broken', modifier: 'broken', label: __('Broken', 'betterlinks') },
	{ key: 'forbidden', modifier: 'forbidden', label: __('403 Forbidden', 'betterlinks') },
	{ key: 'unauthorized', modifier: 'unauthorized', label: __('401 Unauthorized', 'betterlinks') },
];

const healthCounts = { active: 36, broken: 5, forbidden: 2, unauthorized: 1 };
const scannedLinks = HEALTH_SEGMENTS.reduce((sum, { key }) => sum + healthCounts[key], 0);
const totalLinks = 44;
const needAttention = scannedLinks - healthCounts.active;

const teaserRows = [
	{ title: 'Documentation', link: 'https://example.com/docs', variant: 'broken', label: __('Broken', 'betterlinks'), target: 'https://example.com/docs', checked: '30 mins ago' },
	{ title: 'Pricing Page', link: 'https://old-partner.io/pricing', variant: 'broken', label: __('Broken', 'betterlinks'), target: 'https://old-partner.io/pricing', checked: '30 mins ago' },
	{ title: 'Members Area', link: 'https://app.example.com/portal', variant: 'unauthorized', label: __('401 Unauthorized', 'betterlinks'), target: 'https://app.example.com/portal', checked: '1 hour ago' },
	{ title: 'Download Asset', link: 'https://cdn.example.net/file.zip', variant: 'forbidden', label: __('403 Forbidden', 'betterlinks'), target: 'https://cdn.example.net/file.zip', checked: '1 hour ago' },
	{ title: 'Blog Reference', link: 'http://legacy-blog.org/post', variant: 'broken', label: __('Broken', 'betterlinks'), target: 'http://legacy-blog.org/post', checked: '3 hours ago' },
];

export default function BrokenLinks() {
	return betterLinksHooks.applyFilters('betterLinksSettingsBrokenLinkChecker', <Teaser />);
}

function Teaser() {
	const [isOpenUpgradeToProModal, openUpgradeToProModal, closeUpgradeToProModal] = useUpgradeProModal();
	const is_pro_updated = pro_version_check('2.2');

	return (
		<React.Fragment>
			{!is_pro_updated && (
				<div className="btl-notes notice notice-warning" style={{ marginLeft: 0, padding: '5px', fontSize: '12px' }}>
					<Note note="In this update, we've relocated the BetterLinks Broken Link Checker. To access it from the new location, please update the BetterLinks Pro plugin to at least v2.2. If you haven’t updated yet, you can still find the Broken Link Checker on the settings page." />
				</div>
			)}
			<UpgradeToPro isOpenModal={isOpenUpgradeToProModal} closeModal={closeUpgradeToProModal} />

			<div style={{ position: 'relative' }}>
				<UpgradeToProSpecial
					description={__('Automatically scan your links for broken URLs, 403 forbidden and 401 unauthorized errors, and get email reports on a schedule', 'betterlinks')}
				>
					<List>
						{[
							<div className="btl-graphteaser-icon">
								<span><IconBrokenLink /></span>
								<p>{__('Automatically scan your links for broken URLs', 'betterlinks')}</p>
							</div>,
							<div className="btl-graphteaser-icon">
								<span>🚫</span>
								<p>{__('Detect 403 forbidden & 401 unauthorized errors', 'betterlinks')}</p>
							</div>,
							<div className="btl-graphteaser-icon">
								<span><IconClock /></span>
								<p>{__('Schedule automatic broken-link scans', 'betterlinks')}</p>
							</div>,
							<div className="btl-graphteaser-icon">
								<span><IconMail /></span>
								<p>{__('Receive email reports of broken links', 'betterlinks')}</p>
							</div>,
							<div className="btl-graphteaser-icon">
								<span><IconRefresh /></span>
								<p>{__('Re-check & fix links to maintain site integrity', 'betterlinks')}</p>
							</div>,
						].map((item, idx) => (
							<ListItem key={idx} disableGutters>
								<ListItemText primary={item} />
							</ListItem>
						))}
					</List>
				</UpgradeToProSpecial>

				<div className="btl-tab-panel-inner btl-broken-links-panel btl-fls-panel">
					{/* --- Settings: schedule + email report ------------------- */}
					<div className="btl-bls-grid">
						<div className="btl-bls-card">
							<div className="btl-bls-card__head">
								<span className="btl-bls-card__icon" aria-hidden="true">
									<IconClock />
								</span>
								<div className="btl-bls-card__heading">
									<h3 className="btl-bls-card__title">{__('Scheduled Scan', 'betterlinks')}</h3>
									<p className="btl-bls-card__desc">
										{__('Enable', 'betterlinks')} <strong>{__('Scheduled Scan', 'betterlinks')}</strong>{' '}
										{__('to automatically scan broken links on your website.', 'betterlinks')}
									</p>
								</div>
							</div>

							<div className="btl-bls-form">
								<div className="btl-bls-row">
									<div className="btl-bls-row__text">
										<label className="btl-bls-row__label">{__('Activate Automatic Scans', 'betterlinks')}</label>
										<p className="btl-bls-row__help">{__('Run a broken-link scan on a schedule.', 'betterlinks')}</p>
									</div>
									<div className="btl-bls-row__control">
										<label className="btl-fls-toggle" onClick={openUpgradeToProModal}>
											<input type="checkbox" readOnly />
											<span className="btl-fls-toggle-slider" />
										</label>
									</div>
								</div>

								<div className="btl-bls-row">
									<div className="btl-bls-row__text">
										<label className="btl-bls-row__label">{__('Scan Day', 'betterlinks')}</label>
										<p className="btl-bls-row__help">{__('Pick the weekday BetterLinks re-checks your links.', 'betterlinks')}</p>
									</div>
									<div className="btl-bls-row__control">
										<div className="btl-bls-weekdays" onClick={openUpgradeToProModal}>
											{weekOption.map((day, index) => (
												<span key={index} className={index === 0 ? 'is-active' : ''}>
													{day.slice(0, 3)}
												</span>
											))}
										</div>
									</div>
								</div>

								<div className="btl-bls-card__actions">
									<button type="button" className="btl-bls-btn btl-bls-btn--primary" onClick={openUpgradeToProModal}>
										<span className="btl-bls-btn__icon" aria-hidden="true">
											<IconScan />
										</span>
										{__('Start New Scan', 'betterlinks')}
									</button>
								</div>
							</div>
						</div>

						<div className="btl-bls-card">
							<div className="btl-bls-form">
								<div className="btl-bls-card__head btl-bls-card__head--toggle">
									<span className="btl-bls-card__icon" aria-hidden="true">
										<IconMail />
									</span>
									<div className="btl-bls-card__heading">
										<h3 className="btl-bls-card__title">{__('Enable Email Report', 'betterlinks')}</h3>
										<p className="btl-bls-card__desc">{__('Receive a summary of scan results in your inbox.', 'betterlinks')}</p>
									</div>
									<label className="btl-fls-toggle" onClick={openUpgradeToProModal}>
										<input type="checkbox" defaultChecked readOnly />
										<span className="btl-fls-toggle-slider" />
									</label>
								</div>

								<div className="btl-bls-field">
									<label className="btl-bls-field__label">{__('Your Email', 'betterlinks')}</label>
									<input type="text" className="btl-bls-input" placeholder={__('you@example.com', 'betterlinks')} readOnly onClick={openUpgradeToProModal} onFocus={(e) => e.target.blur()} style={{ cursor: 'pointer' }} />
								</div>

								<div className="btl-bls-field">
									<label className="btl-bls-field__label">{__('Report Subject', 'betterlinks')}</label>
									<input type="text" className="btl-bls-input" placeholder={__('Summarized Report Of Broken Links On Your Site.', 'betterlinks')} readOnly onClick={openUpgradeToProModal} onFocus={(e) => e.target.blur()} style={{ cursor: 'pointer' }} />
								</div>

								<div className="btl-bls-card__actions">
									<button type="button" className="btl-bls-btn btl-bls-btn--outline" onClick={openUpgradeToProModal}>
										<span className="btl-bls-btn__icon" aria-hidden="true">
											<IconSend />
										</span>
										{__('Send Test Email', 'betterlinks')}
									</button>
								</div>
							</div>
						</div>
					</div>

					{/* --- Scan results health card ---------------------------- */}
					<div className="btl-scanhealth btl-scanhealth--results">
						<aside className="btl-scanhealth__rail">
							<div className="btl-scanhealth__brand">
								<span className="btl-scanhealth__brand-icon" aria-hidden="true">
									<IconBrand />
								</span>
								<h4 className="btl-scanhealth__brand-text">{__('Broken Link Scan Results', 'betterlinks')}</h4>
							</div>

							<div className="btl-scanhealth__score">
								<strong className="btl-scanhealth__score-value">{needAttention}</strong>
								<span className="btl-scanhealth__score-unit">{__('need attention', 'betterlinks')}</span>
							</div>

							<p className="btl-scanhealth__attention is-warning">
								<span className="btl-scanhealth__attention-dot" aria-hidden="true" />
								{sprintf(
									/* translators: 1: scanned link count, 2: total link count. */
									__('%1$s of %2$s links scanned', 'betterlinks'),
									scannedLinks,
									totalLinks
								)}
							</p>

							<ul className="btl-scanhealth__facts">
								<li>
									<span className="btl-scanhealth__fact-label">
										<IconChain />
										{__('Total links', 'betterlinks')}
									</span>
									<span className="btl-scanhealth__fact-value">{totalLinks}</span>
								</li>
								<li>
									<span className="btl-scanhealth__fact-label">
										<IconRefresh />
										{__('Last run', 'betterlinks')}
									</span>
									<span className="btl-scanhealth__fact-value">{__('40 mins ago', 'betterlinks')}</span>
								</li>
							</ul>
						</aside>

						<div className="btl-scanhealth__main">
							<div className="btl-scanhealth__topbar">
								<span className="btl-scanhealth__pill">
									<IconShield />
									<strong>{healthCounts.active}</strong>
									{__('resolving', 'betterlinks')}
								</span>

								<button type="button" className="btl-bls-btn btl-bls-btn--outline" onClick={openUpgradeToProModal}>
									<span className="btl-bls-btn__icon" aria-hidden="true">
										<IconRefresh />
									</span>
									{__('Re-check all', 'betterlinks')}
								</button>
							</div>

							<div className="btl-scanhealth__meter">
								<div className="btl-scanhealth__meter-head">
									<span className="btl-scanhealth__meter-title">{__('Link health', 'betterlinks')}</span>
									<span className="btl-scanhealth__meter-meta">
										{sprintf(
											/* translators: 1: healthy link count, 2: total scanned link count. */
											__('%1$s of %2$s healthy', 'betterlinks'),
											healthCounts.active,
											scannedLinks
										)}
									</span>
								</div>

								<div className="btl-scanhealth__bar" role="img" aria-label={__('Link health breakdown', 'betterlinks')}>
									{HEALTH_SEGMENTS.map(({ key, modifier }) => {
										const width = (healthCounts[key] / scannedLinks) * 100;
										if (!width) return null;
										return <span key={key} className={`btl-scanhealth__bar-seg btl-scanhealth__bar-seg--${modifier}`} style={{ width: `${width}%` }} />;
									})}
								</div>

								<div className="btl-scanhealth__chips">
									{HEALTH_SEGMENTS.map(({ key, modifier, label }) => (
										<span key={key} className={`btl-scanhealth__chip btl-scanhealth__chip--${modifier}`}>
											<span className="btl-scanhealth__chip-dot" aria-hidden="true" />
											<strong>{healthCounts[key]}</strong>
											{label}
										</span>
									))}
								</div>
							</div>
						</div>
					</div>

					<p className="btl-fls-note">
						<strong>{__('401 Unauthorised', 'betterlinks')}</strong> {__('and', 'betterlinks')} <strong>{__('403 Forbidden', 'betterlinks')}</strong>{' '}
						{__('links may not always be broken. You will have to check them manually to determine that.', 'betterlinks')}
					</p>
				</div>

				{/* --- Broken links report table ------------------------------ */}
				<div className="btl-flc-card">
					<div className="btl-flc-toolbar">
						<div className="btl-flc-search">
							<span className="btl-flc-search__icon" aria-hidden="true">
								<IconSearch />
							</span>
							<input type="text" value="" placeholder={__('Search broken links…', 'betterlinks')} onChange={() => {}} disabled />
						</div>

						<div className="btl-flc-toolbar__actions">
							<button type="button" className="btl-flc-btn btl-flc-btn--outline" disabled>
								<span className="btl-flc-btn__icon">
									<IconRefresh />
								</span>
								{__('Re-check all', 'betterlinks')}
							</button>
							<button type="button" className="btl-flc-btn btl-flc-btn--danger" disabled>
								<span className="btl-flc-btn__icon">
									<IconTrash />
								</span>
								{__('Delete logs', 'betterlinks')}
							</button>
						</div>
					</div>

					<div className="btl-flc-table-scroll">
						<table className="btl-flc-table">
							<thead>
								<tr>
									<th className="btl-flc-table__pick">
										<span className="btl-flc-check" aria-hidden="true">
											<span className="btl-flc-check__box" />
										</span>
									</th>
									<th className="btl-flc-table__link">{__('Link', 'betterlinks')}</th>
									<th className="btl-flc-table__status">{__('Status', 'betterlinks')}</th>
									<th className="btl-flc-table__post">{__('Target URL', 'betterlinks')}</th>
									<th className="btl-flc-table__checked">{__('Last checked', 'betterlinks')}</th>
									<th className="btl-flc-table__actions">{__('Actions', 'betterlinks')}</th>
								</tr>
							</thead>
							<tbody>
								{teaserRows.map((row, index) => (
									<tr key={index}>
										<td className="btl-flc-table__pick">
											<span className="btl-flc-check" aria-hidden="true">
												<span className="btl-flc-check__box" />
											</span>
										</td>
										<td className="btl-flc-table__link" data-label={__('Link', 'betterlinks')}>
											<div className="btl-flc-link-cell">
												<span className={`btl-flc-link-icon btl-flc-link-icon--${row.variant}`}>
													<IconBrokenLink />
												</span>
												<span className="btl-flc-link-cell__body">
													<span className="btl-flc-link-cell__title">{row.title}</span>
													<span className="btl-flc-link-cell__url" title={row.link}>
														{row.link}
													</span>
												</span>
											</div>
										</td>
										<td className="btl-flc-table__status" data-label={__('Status', 'betterlinks')}>
											<span className={`btl-flc-status btl-flc-status--${row.variant}`}>
												<span className="btl-flc-status__dot" aria-hidden="true" />
												{row.label}
											</span>
										</td>
										<td className="btl-flc-table__post" data-label={__('Target URL', 'betterlinks')}>
											<span className="btl-flc-link-cell__url" title={row.target}>
												{row.target}
											</span>
										</td>
										<td className="btl-flc-table__checked" data-label={__('Last checked', 'betterlinks')}>
											<span className="btl-flc-checked">{row.checked}</span>
										</td>
										<td className="btl-flc-table__actions" data-label={__('Actions', 'betterlinks')}>
											<div className="btl-flc-actions">
												<button type="button" className="btl-flc-icon-btn" onClick={openUpgradeToProModal} aria-label={__('Open link', 'betterlinks')}>
													<IconExternal />
												</button>
												<button type="button" className="btl-flc-icon-btn" onClick={openUpgradeToProModal} aria-label={__('Re-check link', 'betterlinks')}>
													<IconRefresh />
												</button>
												<button type="button" className="btl-flc-icon-btn btl-flc-icon-btn--danger" onClick={openUpgradeToProModal} aria-label={__('Delete log', 'betterlinks')}>
													<IconTrash />
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					<div className="btl-flc-pagination">
						<div className="btl-flc-pagination__rows">
							<span>{__('Rows:', 'betterlinks')}</span>
							<select value={50} onChange={() => {}} disabled>
								<option value={50}>50</option>
							</select>
						</div>
						<div className="btl-flc-pagination-left">
							<div className="btl-flc-pagination__info">
								1&ndash;{teaserRows.length} {__('of', 'betterlinks')} {teaserRows.length}
							</div>
						</div>
					</div>
				</div>
			</div>
		</React.Fragment>
	);
}

BrokenLinks.propTypes = propTypes;
