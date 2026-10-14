import { is_pro_enabled } from 'utils/helper';
import { LockIcon } from './Icons';
import { SECTIONS } from './analytics.helper';

/**
 * The seven-section nav.
 *
 * Sections that have not been built yet still appear, so the page's full shape
 * is legible, but they are inert until their `ready` flag flips in
 * `analytics.helper.js`.
 */
const AnalyticsNav = ({ active, onSelect }) => (
	<nav className="bl-an__nav" aria-label="Analytics sections">
		<ul className="bl-an__nav-list">
			{SECTIONS.map((section) => {
				const isActive = active === section.id;
				return (
					<li key={section.id}>
						<button
							type="button"
							className={`bl-an__tab${isActive ? ' is-active' : ''}${section.ready ? '' : ' is-pending'}`}
							aria-current={isActive ? 'true' : undefined}
							aria-disabled={section.ready ? undefined : 'true'}
							disabled={!section.ready}
							onClick={() => section.ready && onSelect(section.id)}
						>
							{section.label}
							{/* Locked sections stay clickable — they scroll to a full sample
							    preview with the upgrade card, so blocking the jump would hide
							    exactly what the pill is advertising. */}
							{section.pro && !is_pro_enabled && (
								<span className="bl-an__tab-pro">
									<LockIcon width={11} height={11} />
									{'PRO'}
								</span>
							)}
						</button>
					</li>
				);
			})}
		</ul>
	</nav>
);

export default AnalyticsNav;
