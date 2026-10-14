import { __ } from '@wordpress/i18n';
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { handle_link_favorite } from 'redux/actions/links.actions';
import Tooltip from 'components/Tooltip';

function FavoriteIcon({ handle_link_favorite, data }) {
	const [isFavorite, setIsFavorite] = useState(data.favorite?.favForAll || false);
	// The icon has no text, so the visible tooltip label must also be exposed as
	// the button's accessible name (aria-label) — the Tooltip bubble alone isn't
	// announced by screen readers in strict ARIA mode.
	const favLabel = __(`${isFavorite ? 'Unmark' : 'Mark'} as Favorite`, 'betterlinks');

	return betterLinksHooks.applyFilters('betterLinksIsShowFavorite', true) ? (
		<Tooltip
			as="button"
			className={`btl-tooltip dnd-link-button btl-fav-link no-btn c-pointer ${isFavorite ? 'favorated' : 'unfavorated'}`}
			label={favLabel}
			aria-label={favLabel}
			onClick={() => {
				const newFavorite = !isFavorite;
				setIsFavorite(newFavorite);
				handle_link_favorite({
					ID: data.ID,
					favForAll: newFavorite,
				});
			}}
		>
			<svg xmlns="http://www.w3.org/2000/svg" className="favorite-svg" viewBox="0 0 512 512" xmlSpace="preserve">
				<path
					className="fav-icon-svg-path"
					d="M392.2 317.5c-3 2.9-4.4 7.1-3.7 11.3L414 477.4c1.2 7-3.5 13.6-10.5 14.9-2.8.5-5.6 0-8.1-1.3L262 420.9c-3.7-2-8.2-2-12 0L116.6 491c-3.1 1.7-6.8 1.9-10.1.8-6-2.1-9.5-8.1-8.5-14.4l25.4-148.5c.7-4.2-.7-8.4-3.7-11.4L11.9 212.4c-5.1-5-5.2-13.1-.2-18.2 2-2 4.6-3.3 7.3-3.7l149.1-21.7c4.2-.6 7.8-3.2 9.7-7l66.7-135c2.6-5.3 8.4-8.1 14.2-6.9 3.9.7 7.2 3.3 8.9 6.9l66.7 135c1.9 3.8 5.5 6.4 9.7 7l149 21.6c7 1 11.9 7.6 10.9 14.6-.4 2.7-1.7 5.3-3.7 7.2l-108 105.3z"
				/>
			</svg>
		</Tooltip>
	) : (
		<button
			className={`btl-tooltip dnd-link-button btl-fav-link no-edit no-btn ${isFavorite ? 'favorated' : 'unfavorated'}`}
			aria-label={favLabel}
			onClick={() => {
				return false;
			}}
		>
			<svg xmlns="http://www.w3.org/2000/svg" className="favorite-svg" viewBox="0 0 512 512" xmlSpace="preserve">
				<path
					className="fav-icon-svg-path"
					d="M392.2 317.5c-3 2.9-4.4 7.1-3.7 11.3L414 477.4c1.2 7-3.5 13.6-10.5 14.9-2.8.5-5.6 0-8.1-1.3L262 420.9c-3.7-2-8.2-2-12 0L116.6 491c-3.1 1.7-6.8 1.9-10.1.8-6-2.1-9.5-8.1-8.5-14.4l25.4-148.5c.7-4.2-.7-8.4-3.7-11.4L11.9 212.4c-5.1-5-5.2-13.1-.2-18.2 2-2 4.6-3.3 7.3-3.7l149.1-21.7c4.2-.6 7.8-3.2 9.7-7l66.7-135c2.6-5.3 8.4-8.1 14.2-6.9 3.9.7 7.2 3.3 8.9 6.9l66.7 135c1.9 3.8 5.5 6.4 9.7 7l149 21.6c7 1 11.9 7.6 10.9 14.6-.4 2.7-1.7 5.3-3.7 7.2l-108 105.3z"
				/>
			</svg>
		</button>
	);
}

const mapDispatchToProps = (dispatch) => {
	return {
		handle_link_favorite: bindActionCreators(handle_link_favorite, dispatch),
	};
};

export default connect(null, mapDispatchToProps)(FavoriteIcon);
