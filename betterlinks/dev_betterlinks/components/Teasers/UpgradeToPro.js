import React from 'react';
import { __ } from '@wordpress/i18n';
import Modal from 'react-modal';
import { is_pro_enabled } from 'utils/helper';

// The card paints its own surface (see `_upgrade-pro-modal.scss`), so the
// react-modal content box is stripped back to a bare positioner. Without this
// the shell contributes a second white panel, padding and border around it.
const customStyles = {
	overlay: {
		background: 'rgba(15, 20, 30, 0.55)',
		zIndex: '999999',
	},
	content: {
		top: '50%',
		left: '50%',
		right: 'auto',
		bottom: 'auto',
		width: 'auto',
		maxWidth: 'calc(100vw - 40px)',
		padding: '0',
		border: '0',
		borderRadius: '16px',
		background: 'transparent',
		boxShadow: 'none',
		overflow: 'visible',
		marginRight: '-50%',
		transform: 'translate(-50%, -50%)',
	},
};

const propTypes = {};
const features = [
	__('AI Bulk Link Generator', 'betterlinks'),
	__('AI Link Assistant ', 'betterlinks'),
	__('Custom Domain', 'betterlinks'),
	__('Link Scanner', 'betterlinks'),
	__('External Tracking', 'betterlinks'),
	__('Auto-Link Creation', 'betterlinks'),
	__('Customize Link Preview', 'betterlinks'),
	__('Auto-Link Keywords', 'betterlinks'),
	__('Password Protected Redirect', 'betterlinks'),
	__('Insights with Individual Analytics', 'betterlinks'),
];

const CrownIcon = ({ size = 28 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<path
			d="M3 8.5l3.8 2.6L12 4.5l5.2 6.6L21 8.5l-1.7 9.1a1.5 1.5 0 01-1.5 1.2H6.2a1.5 1.5 0 01-1.5-1.2L3 8.5z"
			fill="currentColor"
		/>
	</svg>
);

export default function UpgradeToPro({ isOpenModal, closeModal }) {
	if (is_pro_enabled) return '';
	return (
		<Modal isOpen={isOpenModal} onRequestClose={closeModal} style={customStyles} ariaHideApp={false}>
			<div className="bl-pro">
				<button type="button" className="bl-pro__close" onClick={closeModal} aria-label={__('Close', 'betterlinks')}>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
					</svg>
				</button>

				<div className="bl-pro__header">
					<div className="bl-pro__header-inner">
						<span className="bl-pro__crown">
							<CrownIcon />
						</span>
						<h2 className="bl-pro__title">{__('Upgrade for Exclusive Benefits', 'betterlinks')}</h2>
						<p className="bl-pro__subtitle">
							{__('Explore link management capabilities with advanced features designed for peak performance.', 'betterlinks')}
						</p>
					</div>
				</div>

				<div className="bl-pro__body">
					<h3 className="bl-pro__body-title">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path d="M13 2L4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5z" fill="currentColor" />
						</svg>
						{__('Here’s what’s inside BetterLinks Pro.', 'betterlinks')}
					</h3>

					<ul className="bl-pro__features">
						{features.map((feature) => (
							<li className="bl-pro__feature" key={feature}>
								<span className="bl-pro__check">
									<svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
										<path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
									</svg>
								</span>
								<span>{feature}</span>
							</li>
						))}
					</ul>

					<a className="bl-pro__more" href="https://betterlinks.io/features/" target="_blank" rel="noopener noreferrer">
						{__('See more amazing features', 'betterlinks')}
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path d="M5 12h13M12.5 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
						</svg>
					</a>
				</div>

				<div className="bl-pro__footer">
					<p className="bl-pro__guarantee">
						<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path
								d="M12 2.5l7.5 3v6c0 4.6-3.1 8.6-7.5 10-4.4-1.4-7.5-5.4-7.5-10v-6l7.5-3z"
								stroke="currentColor"
								strokeWidth="1.8"
								strokeLinejoin="round"
							/>
							<path d="M8.8 12.2l2.2 2.2 4.2-4.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
						</svg>
						{__('14-day money-back guarantee', 'betterlinks')}
					</p>
					<a
						className="bl-pro__cta"
						href="https://wpdeveloper.com/in/upgrade-betterlinks"
						target="_blank"
						rel="noopener noreferrer"
					>
						<CrownIcon size={16} />
						{__('Upgrade to PRO', 'betterlinks')}
					</a>
				</div>
			</div>
		</Modal>
	);
}

UpgradeToPro.propTypes = propTypes;
