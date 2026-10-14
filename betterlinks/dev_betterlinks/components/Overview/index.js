import { __ } from '@wordpress/i18n';
import { LinkIcon, FolderIcon, ChartIcon, CheckCircleIcon, StarIcon } from 'components/Icons';

/**
 * Small analytics summary shown above the board. Values are derived from the
 * currently filtered link set so the numbers stay in sync with the toolbar.
 */
const Overview = ({ stats }) => {
	const cards = [
		{ key: 'links', label: __('Links', 'betterlinks'), value: stats.links, icon: <LinkIcon /> },
		{ key: 'categories', label: __('Categories', 'betterlinks'), value: stats.categories, icon: <FolderIcon /> },
		{ key: 'clicks', label: __('Clicks', 'betterlinks'), value: stats.clicks.toLocaleString(), icon: <ChartIcon /> },
		{ key: 'active', label: __('Active', 'betterlinks'), value: stats.active, sub: `/ ${stats.links}`, icon: <CheckCircleIcon /> },
		{ key: 'favorites', label: __('Favorites', 'betterlinks'), value: stats.favorites, icon: <StarIcon /> },
	];

	return (
		<div className="bl-overview">
			{cards.map((card) => (
				<div className="bl-overview__card" key={card.key}>
					<div className="bl-overview__head">
						<span className="bl-overview__icon">{card.icon}</span>
						<span className="bl-overview__label">{card.label}</span>
					</div>
					<div className="bl-overview__value">
						{card.value}
						{card.sub && <span className="bl-overview__sub">{card.sub}</span>}
					</div>
				</div>
			))}
		</div>
	);
};

export default Overview;
