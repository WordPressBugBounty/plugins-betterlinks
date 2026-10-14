import { plugin_root_url, copyShortUrl } from 'utils/helper';
import { useState } from 'react';
import { __ } from '@wordpress/i18n';

export default function LinkCopyButton({ shortUrl }) {
	const [isCopyUrl, setCopyUrl] = useState(false);
	const copyShortUrlHandler = (url) => {
		copyShortUrl(url);
		setCopyUrl(true);
		window.setTimeout(function () {
			setCopyUrl(false);
		}, 3000);
	};
	return (
		<button className="btl-short-url-copy-button btl-tooltip" onClick={() => copyShortUrlHandler(shortUrl)}>
			<span className="icon">
				{isCopyUrl ? <span className="dashicons dashicons-yes" /> : <img width="27" src={plugin_root_url + '/assets/images/copy-icon.svg'} alt="icon" />}
			</span>
			<span className="btl-tooltiptext">{__('Copy Link', 'betterlinks')}</span>
		</button>
	);
}
