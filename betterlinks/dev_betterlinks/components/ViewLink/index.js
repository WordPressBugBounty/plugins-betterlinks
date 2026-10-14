import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import Modal from 'react-modal';
import { dateI18n } from '@wordpress/date';
import FavoriteIcon from 'components/FavoriteIcon';
import LinkQuickAction from 'components/LinkQuickAction';
import Link from 'containers/Link';
import { CopyIcon, ExternalIcon } from 'components/Icons';
import { site_url as site_link, copyShortUrl, betterlinks_date_format } from 'utils/helper';

const getClicks = (analytic) => {
	if (!analytic) return { total: 0, unique: 0 };
	const total = parseInt(analytic.link_count) || 0;
	const unique = Array.isArray(analytic.ip) ? analytic.ip.length : parseInt(analytic.ip) || 0;
	return { total, unique };
};

const redirectLabel = (type) => {
	if (type === 'cloak') return __('Cloaked', 'betterlinks');
	return `${type} ${__('redirect', 'betterlinks')}`;
};

/**
 * Read-only link details drawer. Opened by clicking a link title in the board
 * or list; the "Edit link" button opens the existing edit drawer.
 */
const ViewLink = ({ item, catName, is_allow_qr, edit_link, delete_link, add_new_link, children }) => {
	const [open, setOpen] = useState(false);
	const [copied, setCopied] = useState(false);

	const site_url = betterLinksHooks.applyFilters('site_url', site_link);
	const { total, unique } = getClicks(item.analytic);
	const uniqueRate = total > 0 ? Math.round((unique / total) * 100) : 0;
	const status = item.link_status === 'broken' ? 'broken' : item.link_status || 'publish';
	const statusLabel = !item.link_status || item.link_status === 'publish' ? __('Active', 'betterlinks') : item.link_status;
	const tags = Array.isArray(item.tags_data) ? item.tags_data : [];
	const created = item.link_date ? new Date(item.link_date) : null;
	const daysAgo = created ? Math.max(0, Math.floor((Date.now() - created.getTime()) / 86400000)) : null;

	const copyHandler = () => {
		copyShortUrl(item.short_url);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 2000);
	};

	return (
		<React.Fragment>
			<span className="bl-viewlink" onClick={() => setOpen(true)}>
				{children}
			</span>
			<Modal isOpen={open} onRequestClose={() => setOpen(false)} closeTimeoutMS={300} ariaHideApp={false}>
				<div className="bl-drawer bl-view">
					<div className="bl-view__header">
						<div className="bl-view__heading">
							<h2 className="bl-view__title">{item.link_title}</h2>
							<div className="bl-view__sub">
								<span className={`bl-view__status bl-view__status--${status}`}>
									<span className="bl-view__dot" />
									{statusLabel}
								</span>
								<FavoriteIcon data={item} />
							</div>
						</div>
						<button type="button" className="bl-drawer__close" onClick={() => setOpen(false)} aria-label={__('Close', 'betterlinks')}>
							<i className="btl btl-cancel" />
						</button>
					</div>

					<div className="bl-view__body">
						<div className="bl-view__field">
							<span className="bl-view__field-label">{__('Short URL', 'betterlinks')}</span>
							<div className="bl-view__url">
								<span className="bl-view__url-text">
									{site_url}/{item.short_url}
								</span>
								<button type="button" className={`bl-view__icon-btn ${copied ? 'is-copied' : ''}`} onClick={copyHandler} title={__('Copy link', 'betterlinks')}>
									<CopyIcon size={16} />
								</button>
								<a className="bl-view__icon-btn" href={`${site_url}/${item.short_url}`} target="_blank" rel="noreferrer" title={__('Open short link', 'betterlinks')}>
									<ExternalIcon size={16} />
								</a>
							</div>
						</div>

						<div className="bl-view__stats">
							<div className="bl-view__stats-head">
								<span className="bl-view__stats-label">{__('Total Clicks', 'betterlinks')}</span>
								<span className="bl-view__stats-value">{total.toLocaleString()}</span>
							</div>
							<div className="bl-view__stats-grid">
								<div className="bl-view__stat">
									<span className="bl-view__stat-num">{unique.toLocaleString()}</span>
									<span className="bl-view__stat-lbl">{__('Unique', 'betterlinks')}</span>
								</div>
								<div className="bl-view__stat">
									<span className="bl-view__stat-num">{uniqueRate}%</span>
									<span className="bl-view__stat-lbl">{__('Unique Rate', 'betterlinks')}</span>
								</div>
							</div>
						</div>

						<div className="bl-view__field">
							<span className="bl-view__field-label">{__('Target URL', 'betterlinks')}</span>
							<div className="bl-view__url">
								<span className="bl-view__url-text">{item.target_url}</span>
								<a className="bl-view__icon-btn" href={item.target_url} target="_blank" rel="noreferrer" title={__('Open target', 'betterlinks')}>
									<ExternalIcon size={16} />
								</a>
							</div>
						</div>

						<div className="bl-view__row">
							<span className="bl-view__row-label">{__('Redirect', 'betterlinks')}</span>
							<span className="bl-view__row-value">
								<span className="bl-view__badge">{item.redirect_type}</span>
								{redirectLabel(item.redirect_type)}
							</span>
						</div>
						<div className="bl-view__row">
							<span className="bl-view__row-label">{__('Category', 'betterlinks')}</span>
							<span className="bl-view__row-value">{catName || __('Uncategorized', 'betterlinks')}</span>
						</div>
						{tags.length > 0 && (
							<div className="bl-view__row">
								<span className="bl-view__row-label">{__('Tags', 'betterlinks')}</span>
								<span className="bl-view__row-value bl-view__tags">
									{tags.map((tag, i) => (
										<span className="bl-view__tag" key={`${item.ID}-vt-${i}`}>
											#{tag.term_name}
										</span>
									))}
								</span>
							</div>
						)}
						{created && (
							<div className="bl-view__row">
								<span className="bl-view__row-label">{__('Created', 'betterlinks')}</span>
								<span className="bl-view__row-value">
									{dateI18n(betterlinks_date_format || 'F j, Y', created)} <span className="bl-view__ago">· {daysAgo}d {__('ago', 'betterlinks')}</span>
								</span>
							</div>
						)}
					</div>

					<div className="bl-view__footer">
						<div className="bl-view__foot-actions">
							<LinkQuickAction
								isAlowQr={is_allow_qr}
								isShowAnalytics={false}
								isShowVisitLink={false}
								isShowCopyLink={false}
								isShowEditLink={false}
								catId={parseInt(item.cat_id)}
								catName={catName}
								submitLinkHandler={edit_link}
								deleteLinkHandler={delete_link}
								addNewLink={add_new_link}
								data={item}
								context="view"
								isShowDeleteLink={betterLinksHooks.applyFilters('betterLinksIsShowDeleteLink', true)}
							/>
						</div>
						{betterLinksHooks.applyFilters('betterLinksIsShowEditLink', true) && (
							<span className="bl-view__edit">
								<Link catId={parseInt(item.cat_id)} catName={catName} data={item} submitHandler={edit_link}>
									<span className="bl-view__edit-inner">
										<i className="btl btl-edit" />
										{__('Edit link', 'betterlinks')}
									</span>
								</Link>
							</span>
						)}
					</div>
				</div>
			</Modal>
		</React.Fragment>
	);
};

export default ViewLink;
