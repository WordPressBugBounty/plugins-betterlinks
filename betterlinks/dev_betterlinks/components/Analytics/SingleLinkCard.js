import { useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { copyToClipboard, site_url as site_link } from 'utils/helper';
import { ChainIcon, CopyIcon, CheckIcon, ExternalIcon } from './Icons';
import { formatNumber } from './analytics.helper';

/** A read-only URL field with a copy button, matching the mockup's pill inputs. */
const UrlField = ({ label, value, href }) => {
	const [copied, setCopied] = useState(false);

	const copy = () => {
		if (!value) return;
		copyToClipboard(value);
		setCopied(true);
		setTimeout(() => setCopied(false), 1400);
	};

	return (
		<div className="bl-slc__field">
			<span className="bl-slc__field-label">{label}</span>
			<div className="bl-slc__field-box">
				<span className="bl-slc__field-value" title={value}>
					{value || '—'}
				</span>
				<span className="bl-slc__field-actions">
					<button type="button" className="bl-slc__field-btn" onClick={copy} aria-label={__('Copy', 'betterlinks')}>
						{copied ? <CheckIcon width={15} height={15} /> : <CopyIcon width={15} height={15} />}
					</button>
					{href && (
						<a className="bl-slc__field-btn" href={href} target="_blank" rel="noopener noreferrer" aria-label={__('Open', 'betterlinks')}>
							<ExternalIcon width={15} height={15} />
						</a>
					)}
				</span>
			</div>
		</div>
	);
};

/**
 * The single-link header card: link identity + status + a clicks-logged caption,
 * with the shortened and target URLs as copyable fields.
 *
 * `link_details` only carries { link_title, short_url, target_url }; the click
 * count and range caption come from the container.
 */
const SingleLinkCard = ({ details, clicksLogged, rangeLabel, loading }) => {
	const { link_title, short_url, target_url } = details || {};
	const site = betterLinksHooks.applyFilters('site_url', site_link);
	const fullShort = short_url ? `${site}/${short_url}` : '';

	return (
		<div className={`bl-slc${loading ? ' bl-slc--loading' : ''}`}>
			<div className="bl-slc__lead">
				<span className="bl-slc__icon">
					<ChainIcon width={22} height={22} />
				</span>
				<div className="bl-slc__identity">
					<h2 className="bl-slc__title" title={link_title || ''}>
						{link_title || __('Untitled link', 'betterlinks')}
					</h2>
					<div className="bl-slc__meta">
						<span className="bl-slc__status">
							<i className="bl-slc__status-dot" />
							{__('Healthy', 'betterlinks')}
						</span>
						<span className="bl-slc__logged">
							{/* translators: 1: click count, 2: the selected range, e.g. "last 30 days". */}
							{sprintf(__('%1$s clicks logged · %2$s', 'betterlinks'), formatNumber(clicksLogged), rangeLabel)}
						</span>
					</div>
				</div>
			</div>

			<div className="bl-slc__fields">
				<UrlField label={__('Shortened URL', 'betterlinks')} value={fullShort} href={fullShort} />
				<UrlField label={__('Target URL', 'betterlinks')} value={target_url} href={target_url} />
			</div>
		</div>
	);
};

export default SingleLinkCard;
