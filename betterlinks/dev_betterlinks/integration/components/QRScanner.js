import { __ } from '@wordpress/i18n';
import { makeShortUrl } from 'integration/utils/helper';
import QRCode from 'qrcode.react';
import { useState } from 'react';

const QRScanner = ({ short_url }) => {
	const [openQr, setOpenQr] = useState(false);

	const download = (e) => {
		const canvas = document.querySelector('.betterlinksqrcode > canvas');
		e.target.href = canvas.toDataURL();
		e.target.download = `betterlinks-${short_url}-QR.png`;
	};
	return (
		<>
			<div className="btl-fbs-qr-section">
				<a
					href="#"
					className="btl-fbs-show-hide-qr"
					onClick={(e) => {
						e.preventDefault();
						setOpenQr(!openQr);
					}}
				>
					{openQr ? __('Hide QR Code', 'betterlinks') : __('Show QR Code', 'betterlinks')}
					<span className={`dashicons dashicons-arrow-${openQr ? 'up' : 'down'}-alt2`} />
				</a>
				{openQr && (
					<div className="betterlinksqrcode">
						<QRCode value={makeShortUrl(short_url)} size={100} level={'H'} />
						<div className="btl-fbs-qr-sidebar">
							<p>{__('Scan/Download the QR code to Share this task: ', 'betterlinks')}</p>
							<a className="btl-fbs-qr-download" onClick={download} title={__('Download', 'betterlinks')}>
								{__('Download', 'betterlinks')}
							</a>
						</div>
					</div>
				)}
			</div>
		</>
	);
};

export default QRScanner;
