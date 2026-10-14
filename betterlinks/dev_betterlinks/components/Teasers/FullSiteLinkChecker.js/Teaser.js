import { __, sprintf } from '@wordpress/i18n';
import React, { useEffect } from 'react';
import Select2 from 'react-select';
import UpgradeToPro from '../UpgradeToPro';
import { useUpgradeProModal } from 'utils/customHooks';
import { pro_version_check } from 'utils/helper';
import { toastWarning } from 'components/Toast';

import { List, ListItem, ListItemText } from '@material-ui/core';
import { ReactComponent as Link } from '../../../../assets/images/teasers/link.svg';
import { ReactComponent as Magnifer } from '../../../../assets/images/Magnifer.svg';
import { ReactComponent as BarChart } from '../../../../assets/images/bar-chart.svg';
import { ReactComponent as BrokenLinks } from '../../../../assets/images/broken-links.svg';

import { teaserFLCLinks } from './teaser.data';
import { UpgradeToProSpecial } from '../UpgradeToProSpecial';

// ---------------------------------------------------------------------------
// Inline stroke icons (mirror the Pro Full-Site Scanner icon set)
// ---------------------------------------------------------------------------
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };

const IconShield = () => (
	<svg viewBox="0 0 24 24" {...stroke} strokeWidth={1.8}>
		<path d="M12 3 20 6v5.5c0 4.6-3.3 8.2-8 9.5-4.7-1.3-8-4.9-8-9.5V6l8-3Z" />
		<polyline points="8.75 12 11 14.25 15.5 9.75" />
	</svg>
);
const IconChain = () => (
	<svg viewBox="0 0 24 24" {...stroke}>
		<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
		<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
	</svg>
);
const IconDoc = () => (
	<svg viewBox="0 0 24 24" {...stroke}>
		<rect x="3.5" y="4.5" width="17" height="16" rx="2.5" />
		<path d="M3.5 9.5h17M8 3v3M16 3v3" />
	</svg>
);
const IconClock = () => (
	<svg viewBox="0 0 24 24" {...stroke}>
		<circle cx="12" cy="12" r="8.5" />
		<path d="M12 7.5V12l3 1.8" />
	</svg>
);
const IconScan = () => (
	<svg viewBox="0 0 24 24" {...stroke} strokeWidth={1.8}>
		<path d="M12 3a9 9 0 1 0 9 9" />
		<path d="M12 12 19 5" />
		<circle cx="12" cy="12" r="1.6" />
	</svg>
);
const IconSearch = () => (
	<svg viewBox="0 0 24 24" {...stroke} strokeWidth={1.8}>
		<circle cx="11" cy="11" r="7" />
		<path d="m20 20-3.5-3.5" />
	</svg>
);
const IconFunnel = () => (
	<svg viewBox="0 0 24 24" {...stroke} strokeWidth={1.8}>
		<path d="M3 5h18l-7 8v6l-4-2v-4L3 5Z" />
	</svg>
);
const IconSort = () => (
	<svg viewBox="0 0 24 24" {...stroke} strokeWidth={1.8}>
		<path d="M7 4v16M7 4 4 7m3-3 3 3M17 20V4m0 16 3-3m-3 3-3-3" />
	</svg>
);
const IconChevron = () => (
	<svg viewBox="0 0 24 24" {...stroke} strokeWidth={2}>
		<polyline points="6 9 12 15 18 9" />
	</svg>
);
const IconRefresh = () => (
	<svg viewBox="0 0 24 24" {...stroke} strokeWidth={1.8}>
		<path d="M20 11a8 8 0 1 0-.9 4.5" />
		<polyline points="20 5 20 11 14 11" />
	</svg>
);
const IconTrash = () => (
	<svg viewBox="0 0 24 24" {...stroke} strokeWidth={1.8}>
		<path d="M4 7h16M9 7V5h6v2m-8 0 1 13h8l1-13" />
	</svg>
);
const IconExternal = () => (
	<svg viewBox="0 0 24 24" {...stroke} strokeWidth={1.8}>
		<path d="M14 5h5v5M19 5l-9 9" />
		<path d="M19 14v4a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 18V7a1.5 1.5 0 0 1 1.5-1.5H10" />
	</svg>
);
const IconEdit = () => (
	<svg viewBox="0 0 24 24" {...stroke} strokeWidth={1.8}>
		<path d="M4 20h4l10-10-4-4L4 16v4Z" />
		<path d="m13.5 6.5 4 4" />
	</svg>
);
const IconBrokenLink = () => (
	<svg viewBox="0 0 24 24" {...stroke}>
		<path d="M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 0 1 0 10h-2M8 12h2m4 0h2" />
		<path d="M12 2v3m0 14v3" />
	</svg>
);

// ---------------------------------------------------------------------------
// Sample figures (static — the free preview mirrors a completed scan)
// ---------------------------------------------------------------------------
const HEALTH_SEGMENTS = [
	{ key: 'active', modifier: 'active', label: __('Active', 'betterlinks') },
	{ key: 'broken', modifier: 'broken', label: __('Broken', 'betterlinks') },
	{ key: 'forbidden', modifier: 'forbidden', label: __('403 Forbidden', 'betterlinks') },
	{ key: 'unauthorized', modifier: 'unauthorized', label: __('401 Unauthorized', 'betterlinks') },
];

const linkStatusCount = { active: 105, broken: 12, forbidden: 8, unauthorized: 3 };
const checkedLinks = HEALTH_SEGMENTS.reduce((sum, { key }) => sum + linkStatusCount[key], 0);
const needAttention = checkedLinks - linkStatusCount.active;
const healthPercent = Math.round((linkStatusCount.active / checkedLinks) * 100);

const statusVariant = (status) => {
	if (status >= 200 && status < 300) return 'active';
	if (403 === status) return 'forbidden';
	if (401 === status) return 'unauthorized';
	return 'broken';
};

const STATUS_LABELS = {
	active: __('Active', 'betterlinks'),
	broken: __('Broken', 'betterlinks'),
	forbidden: __('403 Forbidden', 'betterlinks'),
	unauthorized: __('401 Unauthorized', 'betterlinks'),
};

const CheckedAt = ['2 hours ago', '2 hours ago', '5 hours ago', '1 day ago', '1 day ago'];

const Teaser = () => {
	const [isOpenUpgradeToProModal, openUpgradeToProModal, closeUpgradeToProModal] = useUpgradeProModal();
	const is_pro_updated = pro_version_check('2.2');

	// Show toast warning if Pro version is outdated
	useEffect(() => {
		if (!is_pro_updated) {
			toastWarning(
				__('Please update BetterLinks Pro to version 2.2 or later to use the Full Site Link Scanner feature.', 'betterlinks'),
				{
					title: __('Update Required', 'betterlinks'),
					duration: 6000,
				}
			);
		}
	}, [is_pro_updated]);

	return (
		<div style={{ position: 'relative' }}>
			<UpgradeToPro isOpenModal={isOpenUpgradeToProModal} closeModal={closeUpgradeToProModal} />
			<UpgradeToProSpecial
				description={__('Scan your entire website’s Links in posts and pages to get real-time link status-active links, Broken Links, 403 forbidden and more', 'betterlinks')}
			>
				<List>
					{[
						<div className="btl-graphteaser-icon">
							<span>
								<Magnifer />
							</span>
							<p>{__("Conduct a thorough scan of your website's links", 'betterlinks')}</p>
						</div>,
						<div className="btl-graphteaser-icon">
							<Link />
							<p>{__('Pinpoint active and broken links with precision', 'betterlinks')}</p>
						</div>,
						<div className="btl-graphteaser-icon">
							<span>🚫</span>
							<p>{__('Identify 403 forbidden and other error codes', 'betterlinks')}</p>
						</div>,
						<div className="btl-graphteaser-icon">
							<span>
								<BarChart />
							</span>
							<p>{__('Keep track of all website link status in real time', 'betterlinks')}</p>
						</div>,
						<div className="btl-graphteaser-icon">
							<span>
								<BrokenLinks />
							</span>
							<p>{__('Update broken links & maintain website integrity', 'betterlinks')}</p>
						</div>,
					].map((item) => (
						<ListItem disableGutters>
							<ListItemText primary={item} />
						</ListItem>
					))}
				</List>
			</UpgradeToProSpecial>

			{/* --- Health card: setup + health breakdown ----------------------- */}
			<div className="btl-tab-panel-inner btl-broken-links-panel btl-broken-links-panel-disabled">
				<div className="btl-scanhealth">
					{/* Left rail — health summary */}
					<aside className="btl-scanhealth__rail">
						<div className="btl-scanhealth__brand">
							<span className="btl-scanhealth__brand-icon" aria-hidden="true">
								<IconShield />
							</span>
							<h4 className="btl-scanhealth__brand-text">{__('Full-Site Link Health', 'betterlinks')}</h4>
						</div>

						<div className="btl-scanhealth__score">
							<strong className="btl-scanhealth__score-value">{healthPercent}</strong>
							<span className="btl-scanhealth__score-unit">{__('% healthy', 'betterlinks')}</span>
						</div>

						<p className="btl-scanhealth__attention is-warning">
							<span className="btl-scanhealth__attention-dot" aria-hidden="true" />
							{sprintf(
								/* translators: %d: number of links that need attention. */
								__('%d links need attention', 'betterlinks'),
								needAttention
							)}
						</p>

						<ul className="btl-scanhealth__facts">
							<li>
								<span className="btl-scanhealth__fact-label">
									<IconChain />
									{__('Links crawled', 'betterlinks')}
								</span>
								<span className="btl-scanhealth__fact-value">{checkedLinks}</span>
							</li>
							<li>
								<span className="btl-scanhealth__fact-label">
									<IconDoc />
									{__('Posts & pages', 'betterlinks')}
								</span>
								<span className="btl-scanhealth__fact-value">42</span>
							</li>
							<li>
								<span className="btl-scanhealth__fact-label">
									<IconClock />
									{__('Last scan', 'betterlinks')}
								</span>
								<span className="btl-scanhealth__fact-value">{__('2 hours ago', 'betterlinks')}</span>
							</li>
						</ul>
					</aside>

					{/* Right pane — scan controls + health breakdown */}
					<div className="btl-scanhealth__main">
						<Settings openUpgradeToProModal={openUpgradeToProModal} />

						<div className="btl-scanhealth__meter">
							<div className="btl-scanhealth__meter-head">
								<span className="btl-scanhealth__meter-title">{__('Link health', 'betterlinks')}</span>
								<span className="btl-scanhealth__meter-meta">
									{sprintf(
										/* translators: 1: healthy link count, 2: total scanned link count. */
										__('%1$s of %2$s healthy', 'betterlinks'),
										linkStatusCount.active,
										checkedLinks
									)}
								</span>
							</div>

							<div className="btl-scanhealth__bar" role="img" aria-label={__('Link health breakdown', 'betterlinks')}>
								{HEALTH_SEGMENTS.map(({ key, modifier }) => {
									const width = (linkStatusCount[key] / checkedLinks) * 100;
									if (!width) return null;
									return <span key={key} className={`btl-scanhealth__bar-seg btl-scanhealth__bar-seg--${modifier}`} style={{ width: `${width}%` }} />;
								})}
							</div>

							<div className="btl-scanhealth__chips">
								{HEALTH_SEGMENTS.map(({ key, modifier, label }) => (
									<span key={key} className={`btl-scanhealth__chip btl-scanhealth__chip--${modifier}`}>
										<span className="btl-scanhealth__chip-dot" aria-hidden="true" />
										<strong>{linkStatusCount[key]}</strong>
										{label}
									</span>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* --- Report table ----------------------------------------------- */}
			<div className="btl-flc-card">
				<div className="btl-flc-toolbar">
					<div className="btl-flc-search">
						<span className="btl-flc-search__icon" aria-hidden="true">
							<IconSearch />
						</span>
						<input type="text" value="" placeholder={__('Search links, labels, posts…', 'betterlinks')} onChange={() => {}} disabled />
					</div>

					<div className="btl-flc-dropdown">
						<button type="button" className="btl-flc-dropdown__trigger" onClick={openUpgradeToProModal}>
							<span className="btl-flc-dropdown__icon">
								<IconShield />
							</span>
							<span className="btl-flc-dropdown__value">{__('All statuses', 'betterlinks')}</span>
							<span className="btl-flc-dropdown__chevron">
								<IconChevron />
							</span>
						</button>
					</div>

					<div className="btl-flc-dropdown">
						<button type="button" className="btl-flc-dropdown__trigger" onClick={openUpgradeToProModal}>
							<span className="btl-flc-dropdown__icon">
								<IconFunnel />
							</span>
							<span className="btl-flc-dropdown__value">{__('All types', 'betterlinks')}</span>
							<span className="btl-flc-dropdown__chevron">
								<IconChevron />
							</span>
						</button>
					</div>

					<div className="btl-flc-dropdown">
						<button type="button" className="btl-flc-dropdown__trigger" onClick={openUpgradeToProModal}>
							<span className="btl-flc-dropdown__icon">
								<IconSort />
							</span>
							<span className="btl-flc-dropdown__label">{__('Sort:', 'betterlinks')}</span>
							<span className="btl-flc-dropdown__value">{__('Link (A–Z)', 'betterlinks')}</span>
							<span className="btl-flc-dropdown__chevron">
								<IconChevron />
							</span>
						</button>
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
							{__('Clear logs', 'betterlinks')}
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
								<th className="btl-flc-table__post">{__('Post', 'betterlinks')}</th>
								<th className="btl-flc-table__checked">{__('Last checked', 'betterlinks')}</th>
								<th className="btl-flc-table__actions">{__('Actions', 'betterlinks')}</th>
							</tr>
						</thead>
						<tbody>
							{teaserFLCLinks.map((row, index) => {
								const variant = statusVariant(row.status);
								const isProblem = 'active' !== variant;
								return (
									<tr key={index}>
										<td className="btl-flc-table__pick">
											<span className="btl-flc-check" aria-hidden="true">
												<span className="btl-flc-check__box" />
											</span>
										</td>
										<td className="btl-flc-table__link" data-label={__('Link', 'betterlinks')}>
											<div className="btl-flc-link-cell">
												<span className={`btl-flc-link-icon btl-flc-link-icon--${variant}`}>{isProblem ? <IconBrokenLink /> : <IconChain />}</span>
												<span className="btl-flc-link-cell__body">
													<span className="btl-flc-link-cell__title">{row.title || __('Link Label Not Found', 'betterlinks')}</span>
													<span className="btl-flc-link-cell__url" title={row.link}>
														{row.link}
													</span>
												</span>
											</div>
										</td>
										<td className="btl-flc-table__status" data-label={__('Status', 'betterlinks')}>
											<span className={`btl-flc-status btl-flc-status--${variant}`}>
												<span className="btl-flc-status__dot" aria-hidden="true" />
												{STATUS_LABELS[variant]}
											</span>
										</td>
										<td className="btl-flc-table__post" data-label={__('Post', 'betterlinks')}>
											<div className="btl-flc-post-cell">
												<span className="btl-flc-posttitle" title={row.post_name}>
													{row.post_name}
												</span>
												{row.post_type && <span className="btl-flc-posttype">{row.post_type}</span>}
											</div>
										</td>
										<td className="btl-flc-table__checked" data-label={__('Last checked', 'betterlinks')}>
											<span className="btl-flc-checked">{CheckedAt[index] || '—'}</span>
										</td>
										<td className="btl-flc-table__actions" data-label={__('Actions', 'betterlinks')}>
											<div className="btl-flc-actions">
												<button type="button" className="btl-flc-icon-btn" onClick={openUpgradeToProModal} aria-label={__('Open link', 'betterlinks')}>
													<IconExternal />
												</button>
												<button type="button" className="btl-flc-icon-btn" onClick={openUpgradeToProModal} aria-label={__('Edit post', 'betterlinks')}>
													<IconEdit />
												</button>
												<button type="button" className="btl-flc-icon-btn" onClick={openUpgradeToProModal} aria-label={__('Re-check link', 'betterlinks')}>
													<IconRefresh />
												</button>
											</div>
										</td>
									</tr>
								);
							})}
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
							1&ndash;{teaserFLCLinks.length} {__('of', 'betterlinks')} {teaserFLCLinks.length}
						</div>

						<div className="btl-flc-pagination__nav">
							<button type="button" disabled aria-label={__('First page', 'betterlinks')}>
								<svg viewBox="0 0 24 24" {...stroke} strokeWidth={2}>
									<polyline points="11 18 5 12 11 6" />
									<polyline points="18 18 12 12 18 6" />
								</svg>
							</button>
							<button type="button" disabled aria-label={__('Previous page', 'betterlinks')}>
								<svg viewBox="0 0 24 24" {...stroke} strokeWidth={2}>
									<polyline points="15 18 9 12 15 6" />
								</svg>
							</button>
							<button type="button" disabled aria-label={__('Next page', 'betterlinks')}>
								<svg viewBox="0 0 24 24" {...stroke} strokeWidth={2}>
									<polyline points="9 18 15 12 9 6" />
								</svg>
							</button>
							<button type="button" disabled aria-label={__('Last page', 'betterlinks')}>
								<svg viewBox="0 0 24 24" {...stroke} strokeWidth={2}>
									<polyline points="13 18 19 12 13 6" />
									<polyline points="6 18 12 12 6 6" />
								</svg>
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Teaser;

// Post-type picker + scan buttons, laid out to match the Pro health card.
const Settings = ({ openUpgradeToProModal }) => {
	return (
		<div className="btl-scanhealth__settings">
			<form onSubmit={(e) => e.preventDefault()}>
				<span className="btl-form-group btl-general-tab-settings-react-select">
					<label className="btl-form-label" style={{ display: 'flex', alignItems: 'center' }}>
						{__('Post Types', 'betterlinks')}
						<div className="btl-tooltip">
							<span className="dashicons dashicons-info-outline" style={{ display: 'inline', fontSize: '16px', lineHeight: '1.6' }} />
							<span className="btl-tooltiptext">{__('Select the post types on which you want to perform the Link Scan', 'betterlinks')}</span>
						</div>
					</label>
					<div className="btl-form-field btl-scanhealth__field">
						<label className="btl-checkbox-field">
							<Select2
								isMulti
								name="fullsite_scanner_post_types"
								className="btl-modal-select--full"
								classNamePrefix="btl-react-select"
								value={[
									{ label: 'post', value: 'post' },
									{ label: 'page', value: 'page' },
									{ label: 'product', value: 'product' },
								]}
								isDisabled={true}
							/>
						</label>

						<div className="btl-scanhealth__actions">
							<button
								type="button"
								className="btl-scanhealth__btn btl-scanhealth__btn--primary btl-link-scan-btn"
								onClick={openUpgradeToProModal}
							>
								<span className="btl-scanhealth__btn-icon" aria-hidden="true">
									<IconScan />
								</span>
								{__('Start New Scan', 'betterlinks')}
							</button>

							<button type="button" className="btl-scanhealth__btn btl-scanhealth__btn--ghost btl-resume-link-scan-btn" disabled>
								{__('Resume Scan', 'betterlinks')}
							</button>
						</div>
					</div>
				</span>
			</form>
		</div>
	);
};
