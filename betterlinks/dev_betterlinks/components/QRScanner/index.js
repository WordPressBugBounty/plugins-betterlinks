import React, { useState, useRef, useEffect } from 'react';
import Modal from 'react-modal';
import QRCode from 'qrcode.react';
import { makeShortUrl, copyShortUrl, is_pro_enabled } from 'utils/helper';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';
import { QRCodeIcon } from 'components/SvgIcons';
import Tooltip from 'components/Tooltip';
import ProBadge from 'components/Badge/ProBadge';
import UpgradeToPro from 'components/Teasers/UpgradeToPro';
import { useUpgradeProModal } from 'utils/customHooks';

const propTypes = {
	shortUrl: PropTypes.string,
};

// Portaled to <body> like the other redesigned dialogs; the `.bl-qr-modal`
// card carries all the visuals, so react-modal's content box is transparent.
const centeredModalStyles = {
	overlay: {
		background: 'rgba(15, 20, 30, 0.5)',
		zIndex: '100000',
	},
	content: {
		top: '50%',
		left: '50%',
		right: 'auto',
		bottom: 'auto',
		marginRight: '-50%',
		transform: 'translate(-50%, -50%)',
		padding: 0,
		border: 'none',
		background: 'transparent',
		overflow: 'visible',
		borderRadius: 0,
		maxHeight: 'calc(100vh - 40px)',
	},
};

// Inline icons match the `bl-*` redesign convention (currentColor strokes).
const CloseIcon = () => (
	<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
		<path d="M13 1 1 13M1 1l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);
const QrGlyph = () => (
	<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<path d="M4 4h6v6H4V4ZM14 4h6v6h-6V4ZM4 14h6v6H4v-6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
		<path d="M14 14h2m4 0h-2m0 0v2m0 4v-2m0 0h-2m-2 0v2m0-6v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);
const DownloadGlyph = () => (
	<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
		<path d="M8 2v8m0 0 3-3m-3 3L5 7M2.5 12.5h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);
const CopyGlyph = () => (
	<svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
		<rect x="5.5" y="5.5" width="8" height="8" rx="1.6" stroke="currentColor" strokeWidth="1.5" />
		<path d="M10.5 5.5V4a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
	</svg>
);
const CheckGlyph = () => (
	<svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
		<path d="m3 8.5 3 3 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);
const BrushGlyph = () => (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<path d="M4 20s1-4 4-4 4 3 4 3-2 2-5 2-3-1-3-1Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
		<path d="m9 15 8.5-8.5a2.12 2.12 0 0 1 3 3L12 18" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
	</svg>
);

export default function QRScanner({ shortUrl }) {
	const [open, setOpen] = useState(false);
	const [copied, setCopied] = useState(false);
	// Bumped whenever branding is saved so the canvas re-mounts with the new config.
	const [qrVersion, setQrVersion] = useState(0);
	const refreshQR = () => setQrVersion((v) => v + 1);
	// Upsell modal for the "Customize" action when Pro isn't active.
	const [isUpgradeOpen, openUpgrade, closeUpgrade] = useUpgradeProModal();
	const downloadRef = useRef(null);
	const shortLink = makeShortUrl(shortUrl);

	// Render props for the QR canvas. Pro extends this via `betterLinksQRCodeProps`
	// to inject brand colors and a center logo (`fgColor` / `bgColor` / `imageSettings`).
	const qrProps = betterLinksHooks.applyFilters('betterLinksQRCodeProps', { value: shortLink, size: 220, level: 'H', renderAs: 'canvas' }, { shortUrl });

	// Once the canvas has painted, wire the download anchor to its PNG data URL.
	// A branded logo loads asynchronously, so we wait a touch longer before
	// snapshotting and re-run whenever the QR is re-rendered (qrVersion).
	useEffect(() => {
		if (!open) return;
		const timer = window.setTimeout(() => {
			const canvas = document.querySelector('.bl-qr-modal__canvas canvas');
			if (canvas && downloadRef.current) {
				downloadRef.current.href = canvas.toDataURL('image/png');
				downloadRef.current.download = `betterlinks-${shortUrl}-QR.png`;
			}
		}, 120);
		return () => window.clearTimeout(timer);
	}, [open, shortUrl, qrVersion]);

	const closeModal = () => setOpen(false);
	const copyHandler = () => {
		copyShortUrl(shortUrl);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 2000);
	};

	return (
		<React.Fragment>
			<Tooltip as="button" className="dnd-link-button btl-tooltip" label={__('QR Code', 'betterlinks')} onClick={() => setOpen(true)}>
				<span className="icon">
					<QRCodeIcon size={18} />
				</span>
			</Tooltip>

			<Modal isOpen={open} onRequestClose={closeModal} closeTimeoutMS={200} style={centeredModalStyles} ariaHideApp={false}>
				<div className="bl-qr-modal">
					<div className="bl-qr-modal__header">
						<div className="bl-qr-modal__heading">
							<span className="bl-qr-modal__badge">
								<QrGlyph />
							</span>
							<div className="bl-qr-modal__heading-text">
								<h3 className="bl-qr-modal__title">{__('QR Code', 'betterlinks')}</h3>
								<p className="bl-qr-modal__subtitle">{__('Scan or download to share this link', 'betterlinks')}</p>
							</div>
						</div>
						<button type="button" className="bl-qr-modal__close" onClick={closeModal} aria-label={__('Close', 'betterlinks')}>
							<CloseIcon />
						</button>
					</div>

					<div className="bl-qr-modal__body">
						<div className="bl-qr-modal__canvas">
							{/* Pro can replace the whole renderer (e.g. pattern-styled modules)
							    via `betterLinksQRCodeRender`; it must still output a <canvas> so
							    Download PNG keeps working. Free falls back to qrcode.react. */}
							{betterLinksHooks.applyFilters('betterLinksQRCodeRender', <QRCode key={qrVersion} {...qrProps} />, { value: shortLink, size: 220, level: 'H', qrVersion, qrProps })}
						</div>

						<div className="bl-qr-modal__url">
							<span className="bl-qr-modal__url-text" title={shortLink}>
								{shortLink}
							</span>
							<button type="button" className={`bl-qr-modal__copy ${copied ? 'is-copied' : ''}`} onClick={copyHandler}>
								{copied ? <CheckGlyph /> : <CopyGlyph />}
								<span>{copied ? __('Copied', 'betterlinks') : __('Copy', 'betterlinks')}</span>
							</button>
						</div>

						<p className="bl-qr-modal__note">{__('Point a camera at the code, or download the PNG to use it anywhere.', 'betterlinks')}</p>
					</div>

					<div className="bl-qr-modal__footer">
						{/* Pro replaces this with the real "Customize" branding drawer via
						    `betterLinksQRCustomizeAction`. On free the same button is a Pro
						    upsell (badge + upgrade modal). */}
						{betterLinksHooks.applyFilters(
							'betterLinksQRCustomizeAction',
							<button type="button" className="bl-qr-modal__btn bl-qr-modal__btn--ghost bl-qr-modal__customize" onClick={openUpgrade}>
								<BrushGlyph />
								{__('Customize', 'betterlinks')}
								<ProBadge />
							</button>,
							{ shortUrl, refreshQR, closeModal }
						)}
						<a className="bl-qr-modal__btn bl-qr-modal__btn--primary" ref={downloadRef}>
							<DownloadGlyph />
							{__('Download PNG', 'betterlinks')}
						</a>
					</div>
					{!is_pro_enabled && <UpgradeToPro isOpenModal={isUpgradeOpen} closeModal={closeUpgrade} />}
				</div>
			</Modal>
		</React.Fragment>
	);
}

QRScanner.propTypes = propTypes;
