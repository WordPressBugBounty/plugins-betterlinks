import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import queryString from 'query-string';
import UpgradeToPro from 'components/Teasers/UpgradeToPro';
import { plugin_root_url } from 'utils/helper';

const propTypes = {};

/**
 * The link form's UTM builder: five campaign fields applied to the target URL.
 *
 * Saved UTM templates are a BetterLinks Pro feature. Pro replaces this component
 * through `linksUTMBuilderField`; here the template picker and "Save New
 * Template" are locked previews that only open the upgrade modal.
 */
export default function UTMBuilder({ targetUrl, saveValueHandler, closeModalHandler }) {
	const [isOpenUpgradeToProModal, setUpgradeToProModal] = useState(false);
	const parseUrl = queryString.parseUrl(targetUrl, { parseFragmentIdentifier: true });

	const [UTMBuilderState, setUTMBuilderState] = useState({
		utm_source: parseUrl.query.utm_source || '',
		utm_medium: parseUrl.query.utm_medium || '',
		utm_campaign: parseUrl.query.utm_campaign || '',
		utm_term: parseUrl.query.utm_term || '',
		utm_content: parseUrl.query.utm_content || '',
	});

	const UTMSaveValueHandler = () => {
		const rawURL = queryString.exclude(targetUrl, ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']);
		saveValueHandler(
			'target_url',
			queryString.stringifyUrl({ url: rawURL, query: Object.entries(UTMBuilderState).reduce((a, [k, v]) => (!v || v == '' ? a : ((a[k] = v), a)), {}) })
		);
		closeModalHandler();
	};
	const openUpgradeToProModal = () => {
		setUpgradeToProModal(true);
	};
	const closeUpgradeToProModal = () => {
		setUpgradeToProModal(false);
	};

	// Text fields rendered in the same order as the design.
	const fields = [
		{ key: 'utm_campaign', label: __('Campaign', 'betterlinks'), placeholder: __('e.g: Example-campaign', 'betterlinks'), autoFocus: true },
		{ key: 'utm_medium', label: __('Medium', 'betterlinks'), placeholder: __('e.g: cpc, banner, email', 'betterlinks') },
		{ key: 'utm_source', label: __('Source', 'betterlinks'), placeholder: __('e.g: Twitter, Facebook', 'betterlinks') },
		{ key: 'utm_term', label: __('Term', 'betterlinks'), placeholder: __('e.g: paid keywords', 'betterlinks') },
		{ key: 'utm_content', label: __('Content', 'betterlinks'), placeholder: __('e.g: text AD name', 'betterlinks') },
	];

	return (
		<React.Fragment>
			<UpgradeToPro isOpenModal={isOpenUpgradeToProModal} closeModal={closeUpgradeToProModal} />
			<div className="bl-utm">
				<div className="bl-utm__header">
					<div className="bl-utm__heading">
						<span className="bl-utm__badge" aria-hidden="true">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
								<circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
								<circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
								<circle cx="12" cy="12" r="1.6" fill="currentColor" />
							</svg>
						</span>
						<h3 className="bl-utm__title">{__('UTM Builder', 'betterlinks')}</h3>
						<div className="btl-tooltip">
							<span className="dashicons dashicons-info-outline"></span>
							<span className="btl-tooltiptext" style={{ width: '220px' }}>
								{__('Add Campaign Parameters to Track Custom Campaigns', 'betterlinks')}
							</span>
						</div>
					</div>
					<button type="button" className="bl-utm__close" onClick={closeModalHandler} aria-label={__('Close', 'betterlinks')}>
						<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
							<path d="M13 1 1 13M1 1l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
						</svg>
					</button>
				</div>

				<div className="bl-utm__body">
					<div className="bl-utm__field">
						<label htmlFor="savedtemplate">{__('Template', 'betterlinks')}</label>
						<div className="bl-utm__locked-select" id="savedtemplate" role="button" tabIndex={0} onClick={() => openUpgradeToProModal()}>
							{__('Pick a Template', 'betterlinks')}
							<img src={plugin_root_url + 'assets/images/locked.svg'} alt="locked" />
						</div>
					</div>

					{fields.map((field) => (
						<div className="bl-utm__field" key={field.key}>
							<label htmlFor={`bl-${field.key}`}>{field.label}</label>
							<input
								id={`bl-${field.key}`}
								className="bl-utm__input"
								type="text"
								name={field.key}
								value={UTMBuilderState[field.key]}
								placeholder={field.placeholder}
								autoFocus={!!field.autoFocus}
								onChange={(e) => setUTMBuilderState({ ...UTMBuilderState, [field.key]: e.target.value })}
							/>
						</div>
					))}
				</div>

				<div className="bl-utm__footer">
					<div className="bl-utm__actions">
						<button type="button" className="bl-utm__btn bl-utm__btn--primary" onClick={() => UTMSaveValueHandler()}>
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
								<path d="M3 8.5l3.2 3.2L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
							{__('Apply UTM', 'betterlinks')}
						</button>
						<button type="button" className="bl-utm__btn bl-utm__btn--ghost" onClick={() => openUpgradeToProModal()}>
							{__('Save New Template', 'betterlinks')}
							<img src={plugin_root_url + 'assets/images/locked.svg'} alt="locked" />
						</button>
					</div>
				</div>
			</div>
		</React.Fragment>
	);
}

UTMBuilder.propTypes = propTypes;
