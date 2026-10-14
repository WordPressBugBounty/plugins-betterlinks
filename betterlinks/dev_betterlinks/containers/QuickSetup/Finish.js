import { __ } from '@wordpress/i18n';
import { useEffect, useState } from 'react';
import { copyToClipboard, plugin_root_url, site_url } from 'utils/helper';
import { connect } from 'react-redux';
import { update_quick_setup } from 'redux/actions/quick-setup.actions';
import { bindActionCreators } from 'redux';
import confetti from 'canvas-confetti';

const Finish = (props) => {
	const [copy, setCopy] = useState(false);
	useEffect(() => {
		window.scrollTo(0, 0);
		props.update_quick_setup({ isCreated: false, duplicateLink: false });
		let timer = setTimeout(() => {
			runConfetti();
		}, 150);

		return () => {
			clearTimeout(timer);
		};
	}, []);
	const runConfetti = () => {
		var count = 500;
		var defaults = {
			origin: { y: 0.5, x: 0.55 },
		};

		function fire(particleRatio, opts) {
			confetti({
				...defaults,
				...opts,
				particleCount: Math.floor(count * particleRatio),
			});
		}

		fire(0.25, {
			spread: 26,
			startVelocity: 55,
		});
		fire(0.2, {
			spread: 60,
		});
		fire(0.35, {
			spread: 100,
			decay: 0.91,
			scalar: 0.8,
		});
		fire(0.1, {
			spread: 120,
			startVelocity: 25,
			decay: 0.92,
			scalar: 1.2,
		});
		fire(0.1, {
			spread: 120,
			startVelocity: 45,
		});
	};
	const shortUrl = props?.createdLink?.short_url ? `${site_url}/${props.createdLink.short_url}` : '';

	return (
		<div className="bl-qs__finish">
			<div id="confetti" />
			<span className="bl-qs__finish-badge">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
					<path d="m4 12.5 5 5L20 6.5" />
				</svg>
			</span>
			<h2 className="bl-qs__finish-title">{__('Great job! You’re all set', 'betterlinks')}</h2>
			<p className="bl-qs__finish-desc">
				{__('Your setup is complete. You can now share, track, manage and optimize your links efficiently.', 'betterlinks')}
			</p>

			{shortUrl && (
				<div className="bl-qs__shorturl">
					<code>{shortUrl}</code>
					<button
						type="button"
						className={`bl-qs__shorturl-btn${copy ? ' is-copied' : ''}`}
						aria-label={__('Copy short link', 'betterlinks')}
						onClick={() => {
							setCopy(true);
							copyToClipboard(shortUrl);
							setTimeout(() => setCopy(false), 1000);
						}}
					>
						{copy ? (
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
								<path d="m4 12.5 5 5L20 6.5" />
							</svg>
						) : (
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
								<rect x="9" y="9" width="11" height="11" rx="2" />
								<path d="M15 5.5A1.5 1.5 0 0 0 13.5 4H6a2 2 0 0 0-2 2v7.5A1.5 1.5 0 0 0 5.5 15" />
							</svg>
						)}
					</button>
					<a href={shortUrl} target="_blank" rel="noreferrer" className="bl-qs__shorturl-btn" aria-label={__('Open short link', 'betterlinks')}>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
							<path d="M14 4h6v6" />
							<path d="M20 4 11 13" />
							<path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
						</svg>
					</a>
				</div>
			)}
		</div>
	);
};

const mapStateToProps = (state) => {
	return {
		isCreated: state.quickSetup?.isCreated,
		createdLink: state.quickSetup?.createdLink,
	};
};
const mapDispatchToProps = (dispatch) => ({
	update_quick_setup: bindActionCreators(update_quick_setup, dispatch),
});
export default connect(mapStateToProps, mapDispatchToProps)(Finish);
