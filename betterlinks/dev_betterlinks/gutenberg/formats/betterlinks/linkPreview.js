// WordPress Imports
const { useState, useEffect, useRef } = wp.element;
const { Popover } = wp.components;

// redux import
import { betterlinksGutenStore } from 'redux/gutenbergStore';
import { is_pro_enabled, site_url as site_link } from 'utils/helper';

export const LinkPreview = ({ reset, activeAttributes, value, removeBtlFormat, setIsChangeLink, setShowLinkModal, setLinkData, close, insertedLinkData }) => {
	const site_url = is_pro_enabled && localStorage.getItem('btl_custom_domain') ? localStorage.getItem('btl_custom_domain') : site_link;
	const { url } = activeAttributes;
	const [islinkNotFound, setIslinkNotFound] = useState(false);
	const btnRef = useRef(null);

	useEffect(() => {
		const btnEl = btnRef?.current;
		if (btnEl) {
			btnEl.closest('body')?.classList?.add('betterlinks-format-link-preview-mounted');
		}
		return () => {
			reset();
			const btnEl = btnRef?.current;
			if (btnEl) {
				btnEl.closest('body')?.classList?.remove('betterlinks-format-link-preview-mounted');
			}
			setIslinkNotFound(false);
		};
	}, [value.start, value.end]);

	const handleChangeLink = () => {
		setIsChangeLink(true);
	};

	const handleEditBetterLink = () => {
		const siteUrlWithoutHttp = site_url.replace(/https?\:\/\//, '').toLowerCase();
		const siteUrlRegex = new RegExp(siteUrlWithoutHttp, 'gi');
		const link = insertedLinkData?.short_url || url;
		const justShortlink = link
			.trim()
			.replace(/https?\:\/\//gi, '')
			.replace(siteUrlRegex, '')
			.replace(/\/+$/, '')
			.replace(/^\/+/, '');
		const allLinksArr = betterlinksGutenStore?.getState()?.links?.links || [];
		const foundLink = allLinksArr.find((item) => item.short_url === justShortlink);
		if (foundLink) {
			setShowLinkModal(true);
			setLinkData(foundLink);
		} else {
			setIslinkNotFound(true);
		}
	};

	return (
		<>
			<div className="betterlinks-format-link-preview-wrapper">
				<a href={url} target="_blank">
					{url?.replace(/^https?\:\/\//gi, '')}
					<i className="btl btl-visit-url"></i>
				</a>

				<button className="betterlinks-format-change-link btl-tooltip" onClick={handleChangeLink} ref={btnRef}>
					<span className="dashicons dashicons-edit"></span>
					<span className="btl-tooltiptext">Change Link</span>
				</button>

				<button
					className="betterlinks-format-edit-link icon btl-tooltip"
					onClick={() => {
						handleEditBetterLink();
					}}
					ref={btnRef}
				>
					<span className="dashicons dashicons-admin-generic"></span>
					<span className="btl-tooltiptext">Edit Link</span>
				</button>

				<button
					className="betterlinks-format-remove-link btl-tooltip"
					onClick={() => {
						removeBtlFormat(value);
						close();
					}}
					ref={btnRef}
				>
					<span className="dashicons dashicons-editor-unlink"></span>
					<span className="btl-tooltiptext">Remove Link</span>
				</button>
			</div>

			{islinkNotFound && (
				<Popover position="left" focusOnMount={false} className="betterlinks-link-deleted-after-applying-format">
					<h5 className="no-link-warning-after-added">
						Whoops! seems like the shortened URL has been changed or removed.
						<button
							onClick={() => {
								handleChangeLink();
								setIslinkNotFound(false);
							}}
						>
							Change Link
						</button>
					</h5>
				</Popover>
			)}
		</>
	);
};
