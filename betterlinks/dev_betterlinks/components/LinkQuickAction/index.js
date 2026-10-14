import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';
import Link from 'containers/Link';
import QRScanner from 'components/QRScanner';
import ViewLink from 'components/ViewLink';
import ConfirmDeleteModal from 'components/ConfirmDeleteModal';
import { LinkViewIcon, LinkDeleteIcon } from 'components/SvgIcons';
import { site_url as site_link, copyShortUrl, analytic, is_pro_enabled } from 'utils/helper';
import { Link as ReactLink } from 'react-router-dom/cjs/react-router-dom.min';
import Tooltip from 'components/Tooltip';

const propTypes = {
	isShowAnalytics: PropTypes.bool,
	isShowVisitLink: PropTypes.bool,
	isShowCopyLink: PropTypes.bool,
	isShowEditLink: PropTypes.bool,
	isShowDeleteLink: PropTypes.bool,
	catId: PropTypes.number,
	catName: PropTypes.string,
	submitLinkHandler: PropTypes.func,
	deleteLinkHandler: PropTypes.func,
	data: PropTypes.object,
	handle_link_favorite: PropTypes.func,
	// Where this action row renders: 'card' (board), 'list' (table row) or 'view'
	// (the preview/quick-view drawer). Passed through to the `linkQuickActionNewField`
	// filter so extensions can render context-specific actions (e.g. Pro's Split
	// Test Analytics shows only in the view drawer, not on card hover).
	context: PropTypes.string,
};

const LinkQuickAction = ({
	isAlowQr,
	isShowCopyLink = true,
	isShowAnalytics = false,
	isShowVisitLink = true,
	isShowEditLink = true,
	isShowDeleteLink = true,
	isShowQuickView = false,
	data,
	catId,
	catName,
	submitLinkHandler,
	deleteLinkHandler,
	addNewLink,
	context = 'card',
}) => {
	const [isCopyUrl, setCopyUrl] = useState(false);
	const [isDeleteConfirm, setDeleteConfrim] = useState(false);
	const deleteHandler = () => {
		setDeleteConfrim(true);
	};
	const confirmDelete = () => {
		setDeleteConfrim(false);
		deleteLinkHandler({
			ID: data.ID,
			short_url: data.short_url,
			term_id: catId,
		});
	};
	const noDelete = () => {
		setDeleteConfrim(false);
	};
	const copyShortUrlHandler = (url) => {
		copyShortUrl(url);
		setCopyUrl(true);
		window.setTimeout(function () {
			setCopyUrl(false);
		}, 3000);
	};
	const site_url = betterLinksHooks.applyFilters('site_url', site_link);
	return (
		<React.Fragment>
			{betterLinksHooks.applyFilters('linkQuickActionNewField', '', { data, ReactLink, context })}
			{isShowAnalytics && data.analytic && (
				<Tooltip
					as="button"
					className="dnd-link-button btl-tooltip"
					label={__('Clicks: ', 'betterlinks') + +data.analytic.link_count + ' / ' + __('Unique Clicks: ', 'betterlinks') + +data.analytic.ip}
				>
					<span className="icon">{analytic(data.analytic, data.ID)}</span>
				</Tooltip>
			)}
			<>
				{isShowQuickView && (
						<Tooltip className="btl-tooltip" label={__('Quick View', 'betterlinks')}>
							<ViewLink item={data} catName={catName} is_allow_qr={isAlowQr} edit_link={submitLinkHandler} delete_link={deleteLinkHandler} add_new_link={addNewLink}>
								<button type="button" className="dnd-link-button" aria-label={__('Quick View', 'betterlinks')}>
									<span className="icon">
										<LinkViewIcon size={15} />
									</span>
								</button>
							</ViewLink>
						</Tooltip>
					)}
					{/* {isShowVisitLink && (
						<div className="btl-tooltip">
							<a className="dnd-link-button" href={site_url + '/' + data.short_url} target="_blank">
								<i className="btl btl-visit-url"></i>
							</a>
							<span className="btl-tooltiptext">{__('Visit Link', 'betterlinks')}</span>
						</div>
					)} */}
					{isAlowQr && <QRScanner shortUrl={data.short_url} />}
					{isShowCopyLink && (
						<Tooltip as="button" className="dnd-link-button btl-tooltip" label={__('Copy Link', 'betterlinks')} aria-label={__('Copy Link', 'betterlinks')} onClick={() => copyShortUrlHandler(data.short_url)}>
							<span className="icon">{isCopyUrl ? <span className="dashicons dashicons-yes"></span> : <i className="btl btl-link"></i>}</span>
						</Tooltip>
					)}
					{isShowEditLink && (
						<Tooltip className="btl-tooltip" label={__('Edit Link', 'betterlinks')}>
							<Link catId={parseInt(catId)} catName={catName} data={data} submitHandler={submitLinkHandler} />
						</Tooltip>
					)}
					{isShowDeleteLink && (
						<Tooltip as="button" type="button" className="dnd-link-button delete-button btl-tooltip" label={__('Delete', 'betterlinks')} aria-label={__('Delete', 'betterlinks')} onClick={() => deleteHandler()}>
							<span className="icon">
								<LinkDeleteIcon size={15} />
							</span>
						</Tooltip>
					)}
					<Tooltip className="btl-tooltip" label={__('Create Duplicate', 'betterlinks')}>
						<Link catId={parseInt(catId)} catName={catName} data={data} submitHandler={addNewLink} type="duplicate" />
					</Tooltip>
				</>

			<ConfirmDeleteModal
				isOpen={isDeleteConfirm}
				onClose={noDelete}
				onConfirm={confirmDelete}
				title={__('Delete link?', 'betterlinks')}
				description={
					<>
						{__('This permanently deletes the short link', 'betterlinks')} <strong>{data.link_title}</strong>. {__("This can't be undone.", 'betterlinks')}
					</>
				}
			/>
		</React.Fragment>
	);
};
LinkQuickAction.propTypes = propTypes;

export default LinkQuickAction;
