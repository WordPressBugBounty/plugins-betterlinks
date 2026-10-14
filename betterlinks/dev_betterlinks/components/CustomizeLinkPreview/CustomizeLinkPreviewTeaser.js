import { __ } from '@wordpress/i18n';
import { is_pro_enabled } from 'utils/helper';
import CustomizePreviewContainr from './CustomizePreviewContainer';
import { teaserDescription, teaserTitle } from './data';
import ProBadge from 'components/Badge/ProBadge';

const CustomizeLinkPreviewTeaser = ({ openUpgradeToProModal, closeModal }) => {
	if (is_pro_enabled) return null;
	return (
		<div className="bl-clp bl-clp--teaser">
			<div className="bl-clp__header">
				<div className="bl-clp__heading">
					<h3 className="bl-clp__title">
						{__('Customize Link Preview', 'betterlinks')}
						<ProBadge />
					</h3>
					<p className="bl-clp__subtitle">{__('Control the title, description and image shown when this link is shared.', 'betterlinks')}</p>
				</div>
				{closeModal && (
					<button type="button" className="bl-clp__close" onClick={closeModal} aria-label={__('Close', 'betterlinks')}>
						<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
							<path d="M13 1 1 13M1 1l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
						</svg>
					</button>
				)}
			</div>

			<div className="bl-clp__body">
				<div className="bl-clp__pane bl-clp__pane--form">
					<div className="bl-clp__field">
						<div className="bl-clp__field-head">
							<label className="bl-clp__label" htmlFor="meta_title">
								{__('Meta Title', 'betterlinks')}
							</label>
							<span className="bl-clp__counter is-good">42/60</span>
						</div>
						<textarea id="meta_title" className="bl-clp__textarea bl-clp__textarea--sm" defaultValue={teaserTitle} rows={2} disabled />
						<div className="bl-clp__meter">
							<div className="bl-clp__meter-bar is-good" style={{ width: '70%' }} />
						</div>
						<span className="bl-clp__hint">{__('Recommended 50–60 characters', 'betterlinks')}</span>
					</div>

					<div className="bl-clp__field">
						<div className="bl-clp__field-head">
							<label className="bl-clp__label" htmlFor="meta_description">
								{__('Meta Description', 'betterlinks')}
							</label>
							<span className="bl-clp__counter is-good">146/160</span>
						</div>
						<textarea id="meta_description" name="meta_description" className="bl-clp__textarea" rows={4} defaultValue={teaserDescription} disabled />
						<div className="bl-clp__meter">
							<div className="bl-clp__meter-bar is-good" style={{ width: '91%' }} />
						</div>
						<span className="bl-clp__hint">{__('Recommended 150–160 characters', 'betterlinks')}</span>
					</div>

					<div className="bl-clp__field">
						<div className="bl-clp__field-head">
							<label className="bl-clp__label">{__('Meta Image', 'betterlinks')}</label>
						</div>
						<button
							type="button"
							className="bl-clp__dropzone is-locked"
							onClick={(e) => {
								e.preventDefault();
								openUpgradeToProModal();
							}}
						>
							<span className="bl-clp__dropzone-icon" aria-hidden="true">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
									<path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
									<path d="M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
								</svg>
							</span>
							<span className="bl-clp__dropzone-text">
								<strong>{__('Upload Image', 'betterlinks')}</strong>
								{__('PNG or JPG — 1200×630px recommended', 'betterlinks')}
							</span>
						</button>
					</div>
				</div>

				<div className="bl-clp__pane bl-clp__pane--preview">
					<CustomizePreviewContainr />
				</div>
			</div>

			<div className="bl-clp__footer">
				<span className="bl-clp__footer-note">{__('Unlock link previews with BetterLinks Pro.', 'betterlinks')}</span>
				<button type="button" className="bl-clp__btn bl-clp__btn--primary" onClick={openUpgradeToProModal}>
					{__('Upgrade to Pro', 'betterlinks')}
				</button>
			</div>
		</div>
	);
};

export default CustomizeLinkPreviewTeaser;
