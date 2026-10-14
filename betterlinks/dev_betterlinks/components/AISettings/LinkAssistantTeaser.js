import { __ } from '@wordpress/i18n';

// AI Link Assistant teaser shown to EXISTING Pro users running a build older than
// v2.8.0 (the release that ships the feature). It is rendered through the
// `BetterLinksAILinkAssistant` filter slot exposed by the Pro AI settings form, so the
// copy/markup is owned by the (more frequently updated) free plugin rather than Pro.
//
// Styles are intentionally inline: an old Pro build's stylesheet predates the
// `.btl-ai-assistant` classes, so we cannot rely on them being present.

const SparkIcon = () => (
	<svg width="32" height="32" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
		<path
			d="M39.531 29.6771L43.6881 28.1782C44.0636 28.0441 44.0636 27.5106 43.6881 27.3765L39.531 25.8776C34.915 24.2147 31.2823 20.5821 29.6195 15.9661L28.1205 11.809C27.9864 11.4335 27.453 11.4335 27.3189 11.809L25.82 15.9661C24.1571 20.5821 20.5245 24.2147 15.9085 25.8776L11.7513 27.3765C11.3759 27.5106 11.3759 28.0441 11.7513 28.1782L15.9085 29.6771C20.5245 31.3399 24.1571 34.9726 25.82 39.5886L27.3189 43.7457C27.453 44.1212 27.9864 44.1212 28.1205 43.7457L29.6195 39.5886C31.2823 34.9726 34.915 31.3399 39.531 29.6771Z"
			fill="#fff"
		/>
	</svg>
);

// Existing Pro user on an older build → toast prompting an update (no upsell).
const notifyUpdateRequired = () => {
	const { toastWarning, toastError } = window.betterLinksToast || {};
	const msg = __('Please update BetterLinks Pro to v2.8.0 or greater to use the AI Link Assistant.', 'betterlinks');
	if (toastWarning) {
		toastWarning(msg, { title: __('Update required', 'betterlinks'), position: 'top-right', duration: 4000 });
	} else if (toastError) {
		toastError(msg);
	}
};

const LinkAssistantTeaser = () => {
	return (
		<div style={{ marginTop: '30px', marginBottom: '30px' }} onClick={notifyUpdateRequired}>
			<div
				style={{
					padding: '24px 22px',
					borderRadius: '20px',
					background: 'linear-gradient(135deg, #EAF4FF 0%, #F1F0FE 50%, #ECEBFF 100%)',
					border: '1px solid #E6EAF7',
					cursor: 'pointer',
					maxWidth : 'max-content',
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
					<span
						style={{
							display: 'inline-flex',
							alignItems: 'center',
							justifyContent: 'center',
							width: '32px',
							height: '32px',
							borderRadius: '12px',
							background: 'linear-gradient(135deg, #9B6CF6 0%, #5C7CF0 50%, #43B0F6 100%)',
							flex: '0 0 auto',
						}}
					>
						<SparkIcon />
					</span>
					<h4 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1D2939' }}>
						{__('AI Link Assistant', 'betterlinks')}
					</h4>
				</div>

				<p style={{ 
						margin: '0 0 15px 0', 
						fontSize: '13px', 
						fontWeight: 500, 
						color: '#475569', 
						background: 'antiquewhite',
						maxWidth: 'fit-content',
						padding: '10px',
						borderRadius: '8px', 
					}}>
					{__('Requires BetterLinks Pro v2.8.0 or greater. Please update to use it.', 'betterlinks')}
				</p>

				{[
					{ text: __('Turn on smart link suggestions inside the WordPress content editor. KL', 'betterlinks'), on: false },
					{ text: __('Automatically detect untracked URLs and offer to convert them into short tracked links.', 'betterlinks'), on: false },
				].map((row, i) => (
					<div
						key={i}
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							gap: '20px',
							padding: '14px 12px',
							background: '#fff',
							borderRadius: '14px',
							boxShadow: '0 6px 18px rgba(28, 41, 92, 0.06)',
							marginBottom: i === 0 ? '14px' : 0,
							pointerEvents: 'none',
						}}
					>
						<span style={{ fontSize: '12px', fontWeight: 500, color: '#475569' }}>{row.text}</span>
						<span
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								flex: '0 0 auto',
								width: '36px',
								height: '13px',
								padding: '5px 3px 5px 5px',
								borderRadius: '999px',
								background: row.on ? '#3b6ef5' : '#cdd5e3',
								justifyContent: row.on ? 'flex-end' : 'flex-start',
							}}
						>
							<span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
						</span>
					</div>
				))}
			</div>
		</div>
	);
};

export default LinkAssistantTeaser;
