import { __, sprintf } from '@wordpress/i18n';
import React, { useEffect } from 'react';
import Select2 from 'react-select';
import UpgradeToPro from '../UpgradeToPro';
import { useUpgradeProModal } from 'utils/customHooks';
import { List, ListItem, ListItemText } from '@material-ui/core';
import { ReactComponent as Link } from '../../../../assets/images/teasers/link.svg';
import { ReactComponent as Magnifer } from '../../../../assets/images/Magnifer.svg';
import { ReactComponent as BarChart } from '../../../../assets/images/bar-chart.svg';
import { ReactComponent as BrokenLinks } from '../../../../assets/images/broken-links.svg';

import { UpgradeToProSpecial } from '../UpgradeToProSpecial';
import { pro_version_check } from 'utils/helper';
import { toastWarning } from 'components/Toast';

// ---------------------------------------------------------------------------
// Inline stroke icons (mirror the Pro Scheduled Scan & Report set)
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

const HEALTH_SEGMENTS = [
	{ key: 'active', modifier: 'active', label: __('Active', 'betterlinks') },
	{ key: 'broken', modifier: 'broken', label: __('Broken', 'betterlinks') },
	{ key: 'forbidden', modifier: 'forbidden', label: __('403 Forbidden', 'betterlinks') },
	{ key: 'unauthorized', modifier: 'unauthorized', label: __('401 Unauthorized', 'betterlinks') },
];

const healthCounts = { active: 118, broken: 9, forbidden: 4, unauthorized: 2 };
const scannedLinks = HEALTH_SEGMENTS.reduce((sum, { key }) => sum + healthCounts[key], 0);
const totalLinks = 140;
const needAttention = scannedLinks - healthCounts.active;

const REQUIRED_PRO_VERSION = '2.7.0';

const Teaser = () => {
	const [isOpenUpgradeToProModal, openUpgradeToProModal, closeUpgradeToProModal] = useUpgradeProModal();
	const is_pro_updated = pro_version_check(REQUIRED_PRO_VERSION);

	useEffect(() => {
		if (!is_pro_updated) {
			toastWarning(
				__(`Please update BetterLinks Pro to v${REQUIRED_PRO_VERSION} or later to use the Scheduled Scan & Report feature.`, 'betterlinks'),
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
				description={__('Schedule automatic full-site link scans and receive detailed email reports with link status, broken links, and error codes', 'betterlinks')}
			>
				<List>
					{[
						<div className="btl-graphteaser-icon">
							<span><Magnifer /></span>
							<p>{__('Schedule automatic full-site scans', 'betterlinks')}</p>
						</div>,
						<div className="btl-graphteaser-icon">
							<span>📧</span>
							<p>{__('Receive automated email reports', 'betterlinks')}</p>
						</div>,
						<div className="btl-graphteaser-icon">
							<Link />
							<p>{__('Track link status with detailed analytics', 'betterlinks')}</p>
						</div>,
						<div className="btl-graphteaser-icon">
							<span><BarChart /></span>
							<p>{__('Monitor link health over time', 'betterlinks')}</p>
						</div>,
						<div className="btl-graphteaser-icon">
							<span><BrokenLinks /></span>
							<p>{__('Get notifications for broken links instantly', 'betterlinks')}</p>
						</div>,
					].map((item, idx) => (
						<ListItem key={idx} disableGutters>
							<ListItemText primary={item} />
						</ListItem>
					))}
				</List>
			</UpgradeToProSpecial>

			<div className="btl-tab-panel-inner btl-broken-links-panel btl-fls-panel">
				{/* --- Settings: schedule full-site scan + email report ------- */}
				<div className="btl-bls-grid">
					<div className="btl-bls-card">
						<div className="btl-bls-card__head">
							<span className="btl-bls-card__icon" aria-hidden="true">
								<IconClock />
							</span>
							<div className="btl-bls-card__heading">
								<h3 className="btl-bls-card__title">{__('Schedule Full Site Scan', 'betterlinks')}</h3>
								<p className="btl-bls-card__desc">
									{__('Enable', 'betterlinks')} <strong>{__('Automatic Scans', 'betterlinks')}</strong>{' '}
									{__('to automatically check your site’s links and receive email reports.', 'betterlinks')}
								</p>
							</div>
						</div>

						<div className="btl-bls-form">
							<div className="btl-bls-field">
								<label className="btl-bls-field__label">{__('Post Types', 'betterlinks')}</label>
								<div onClick={openUpgradeToProModal}>
									<Select2
										isMulti
										className="btl-bls-select"
										classNamePrefix="btl-react-select"
										value={[
											{ label: 'post', value: 'post' },
											{ label: 'page', value: 'page' },
											{ label: 'product', value: 'product' },
										]}
										isDisabled={true}
									/>
								</div>
								<p className="btl-bls-field__help">{__('Select which post types are checked in the scan (e.g., Pages, Posts, Products).', 'betterlinks')}</p>
							</div>

							<div className="btl-bls-row">
								<div className="btl-bls-row__text">
									<label className="btl-bls-row__label">{__('Activate Automatic Scans', 'betterlinks')}</label>
									<p className="btl-bls-row__help">{__('Run a full-site link scan on a schedule.', 'betterlinks')}</p>
								</div>
								<div className="btl-bls-row__control">
									<label className="btl-fls-toggle" onClick={openUpgradeToProModal}>
										<input type="checkbox" defaultChecked readOnly />
										<span className="btl-fls-toggle-slider" />
									</label>
								</div>
							</div>

							<div className="btl-bls-card__actions">
								<button type="button" className="btl-bls-btn btl-bls-btn--primary" onClick={openUpgradeToProModal}>
									{__('Save Settings', 'betterlinks')}
								</button>
								<button type="button" className="btl-bls-btn btl-bls-btn--outline" onClick={openUpgradeToProModal}>
									<span className="btl-bls-btn__icon" aria-hidden="true">
										<IconScan />
									</span>
									{__('Run Instant Scan', 'betterlinks')}
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
								<label className="btl-bls-field__label">{__('Reporting Email', 'betterlinks')}</label>
								<input type="text" className="btl-bls-input" placeholder={__('you@example.com', 'betterlinks')} readOnly onClick={openUpgradeToProModal} onFocus={(e) => e.target.blur()} style={{ cursor: 'pointer' }} />
							</div>

							<div className="btl-bls-field">
								<label className="btl-bls-field__label">{__('Reporting Email Subject', 'betterlinks')}</label>
								<input type="text" className="btl-bls-input" placeholder={__('Full Site Link Scan Report', 'betterlinks')} readOnly onClick={openUpgradeToProModal} onFocus={(e) => e.target.blur()} style={{ cursor: 'pointer' }} />
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

				{/* --- Scheduled scan report health card ---------------------- */}
				<div className="btl-scanhealth btl-scanhealth--results">
					<aside className="btl-scanhealth__rail">
						<div className="btl-scanhealth__brand">
							<span className="btl-scanhealth__brand-icon" aria-hidden="true">
								<IconClock />
							</span>
							<h4 className="btl-scanhealth__brand-text">{__('Scheduled Scan Report', 'betterlinks')}</h4>
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
								<span className="btl-scanhealth__fact-value">{__('Today, 09:00 AM', 'betterlinks')}</span>
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
								{__('Scan now', 'betterlinks')}
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
			</div>
		</div>
	);
};

export default Teaser;
