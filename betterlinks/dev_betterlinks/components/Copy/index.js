import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { copyShortUrl, plugin_root_url } from 'utils/helper';
const propTypes = {
	siteUrl: PropTypes.string,
	shortUrl: PropTypes.string,
};

export default function Copy({ siteUrl, shortUrl }) {
	const [isCopyUrl, setCopyUrl] = useState(false);
	const copyShortUrlHandler = (shortUrl) => {
		copyShortUrl(shortUrl);
		setCopyUrl(true);
	};
	return (
		<button type="button" onClick={() => copyShortUrlHandler(shortUrl)} className="btl-link-copy-button">
			{isCopyUrl ? <span className="dashicons dashicons-yes"></span> :  <img src={plugin_root_url + 'assets/images/copy-icon-1.svg'} alt="" />}
		</button>
	);
}

Copy.propTypes = propTypes;