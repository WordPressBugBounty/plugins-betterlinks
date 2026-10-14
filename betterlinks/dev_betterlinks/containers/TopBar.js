import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { __ } from '@wordpress/i18n';
import { plugin_root_url } from 'utils/helper';
import { linksView } from 'redux/actions/activity.actions';
import { sortFavourite } from 'redux/actions/favouritesort.actions';
import DeleteClicks from 'containers/DeleteClicks';

import PropTypes from 'prop-types';
import ProBadge from 'components/Badge/ProBadge';

const propTypes = {
	label: PropTypes.string,
	render: PropTypes.func,
};

const TopBar = ({ is_pro = false, render = () => {}, ...props }) => {
	const { propsForAnalytics } = props;
	// Theme toggle now lives in the global AppNavbar; TopBar only reads the mode
	// to swap its logo to the light variant.
	const { darkMode: isDarkMode } = props.activity;
	const currentPage = betterLinksQuery.get('page');
	const { sortByFav } = props.favouriteSort;

	return (
		<div className="topbar">
			<div className="topbar__logo_container">
				<div className="topbar__logo">
					<img src={plugin_root_url + `assets/images/logo-large${isDarkMode ? '-white' : ''}.svg`} alt="logo" />
					<span className="topbar__logo__text">{props.label}</span>
					{is_pro && <ProBadge />}
				</div>

				{render()}
			</div>
			<div className="topbar-inner">
				{currentPage === 'betterlinks' && (
					<React.Fragment>
						<div className="btl-view-control">
							<button
								title={__('Favorite Links', 'betterlinks')}
								className={`btl-link-view-toggler btl-sortby-fav ${sortByFav ? 'active' : ''}`}
								onClick={() => props.sortFavourite(!sortByFav)}
							>
								<svg xmlns="http://www.w3.org/2000/svg" className="favorite-svg" viewBox="0 0 512 512" xmlSpace="preserve">
									<path
										className="fav-icon-svg-path"
										d="M392.2 317.5c-3 2.9-4.4 7.1-3.7 11.3L414 477.4c1.2 7-3.5 13.6-10.5 14.9-2.8.5-5.6 0-8.1-1.3L262 420.9c-3.7-2-8.2-2-12 0L116.6 491c-3.1 1.7-6.8 1.9-10.1.8-6-2.1-9.5-8.1-8.5-14.4l25.4-148.5c.7-4.2-.7-8.4-3.7-11.4L11.9 212.4c-5.1-5-5.2-13.1-.2-18.2 2-2 4.6-3.3 7.3-3.7l149.1-21.7c4.2-.6 7.8-3.2 9.7-7l66.7-135c2.6-5.3 8.4-8.1 14.2-6.9 3.9.7 7.2 3.3 8.9 6.9l66.7 135c1.9 3.8 5.5 6.4 9.7 7l149 21.6c7 1 11.9 7.6 10.9 14.6-.4 2.7-1.7 5.3-3.7 7.2l-108 105.3z"
									/>
								</svg>
							</button>
							<button
								title={__('List View', 'betterlinks')}
								className={`btl-link-view-toggler ${props.activity.linksView == 'list' ? 'active' : ''}`}
								onClick={() => props.linksView('list')}
							>
								<i className="btl btl-list"></i>
							</button>
							<button
								title={__('Grid View', 'betterlinks')}
								className={`btl-link-view-toggler ${props.activity.linksView == 'grid' ? 'active' : ''}`}
								onClick={() => props.linksView('grid')}
							>
								<i className="btl btl-grid"></i>
							</button>
						</div>
					</React.Fragment>
				)}
				{propsForAnalytics?.isResetAnalytics && <DeleteClicks propsForAnalytics={propsForAnalytics} />}
			</div>
		</div>
	);
};

TopBar.propTypes = propTypes;
// TopBar.defaultProps = defaultProps;

const mapStateToProps = (state) => ({
	activity: state.activity,
	favouriteSort: state.favouriteSort,
});

const mapDispatchToProps = (dispatch) => {
	return {
		linksView: bindActionCreators(linksView, dispatch),
		sortFavourite: bindActionCreators(sortFavourite, dispatch),
	};
};

export default connect(mapStateToProps, mapDispatchToProps)(TopBar);
