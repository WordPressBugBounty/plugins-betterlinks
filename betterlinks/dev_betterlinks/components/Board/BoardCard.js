import { __ } from '@wordpress/i18n';
import { useState } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { Draggable } from 'utils/dnd';
import LinkQuickAction from 'components/LinkQuickAction';
import FavoriteIcon from 'components/FavoriteIcon';
import ViewLink from 'components/ViewLink';
import { copyShortUrl, site_url as site_link, route_path } from 'utils/helper';
import { CopyIcon, ExternalIcon, GripIcon } from 'components/Icons';
import { Link } from 'react-router-dom/cjs/react-router-dom.min';

// While dragging, react-beautiful-dnd gives the card `position: fixed`. Left in
// place, that puts a fixed-position element inside the board's scroll container
// (`.blb`), which Chrome handles badly: the cards left behind in the destination
// column paint on top of each other until a scroll forces a repaint. It also
// means the card is a descendant of a box that clips vertically, so it is
// cropped on its way to a neighbouring column.
//
// Rendering the card into a host outside the board avoids both. rbd positions
// it at viewport coordinates, so it lands exactly where it should once it is
// out of the column. This is the library's documented portal pattern.
//
// The host hangs off <body>, NOT off `#betterlinksbody`. rbd positions the card
// with `position: fixed` at viewport coordinates, and any ancestor carrying
// `transform`, `filter`, `perspective` or `contain` becomes the containing
// block for fixed positioning — which re-interprets those coordinates relative
// to itself and slides the drag preview sideways, over the neighbouring column.
// Hanging off <body> leaves only <html> above it, so no such ancestor can exist.
//
// It carries `betterlinks-body` because every `.blb-card` rule compiles to
// `.betterlinks-body .blb-card` — betterlinks.scss imports _board.scss inside
// `.betterlinks-body { }`. Without the class the card renders unstyled; with it
// on the host itself, the cards inside still match.
let dragHost = null;
const getDragHost = () => {
	if (!dragHost) {
		dragHost = document.createElement('div');
		dragHost.className = 'betterlinks-body bl-drag-host';
		// Zero-size; it only needs a stacking context so the card paints above
		// the board. Set here rather than in SCSS, which would scope the rule
		// under `.betterlinks-body` and so never match the host itself.
		dragHost.style.position = 'relative';
		dragHost.style.zIndex = '100001';
		document.body.appendChild(dragHost);
	}
	return dragHost;
};

const getClicks = (analytic) => {
	if (!analytic) return { total: 0, unique: 0 };
	const total = parseInt(analytic.link_count) || 0;
	const unique = Array.isArray(analytic.ip) ? analytic.ip.length : parseInt(analytic.ip) || 0;
	return { total, unique };
};

const Card = (props) => {
	const {
		catId,
		item,
		index,
		is_allow_qr,
		term_name,
		edit_link,
		delete_link,
		add_new_link,
		isDragDisabled,
		favouriteSort: { sortByFav },
	} = props;

	const [copied, setCopied] = useState(false);
	if (!item?.favorite?.favForAll && sortByFav) return null;

	const { total, unique } = getClicks(item.analytic);
	const status = item.link_status === 'broken' ? 'broken' : item.link_status || 'publish';
	const tags = Array.isArray(item.tags_data) ? item.tags_data : [];
	const shortLink = `${betterLinksHooks.applyFilters('site_url', site_link)}/${item.short_url}`;

	const copyHandler = () => {
		copyShortUrl(item.short_url);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 2000);
	};

	return (
		<Draggable
			key={`item_${item.ID}`}
			draggableId={`item_${item.ID}`}
			index={index}
			isDragDisabled={isDragDisabled}
		>
			{(provided, snapshot) => {
				const card = (
					<div className={`blb-card ${snapshot.isDragging ? 'is-dragging' : ''}`} ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
						<div className="blb-card__top">
							<span className="blb-card__grip" title={__('Drag to reorder', 'betterlinks')}>
								<GripIcon size={16} />
							</span>
							<ViewLink item={item} catName={term_name} is_allow_qr={is_allow_qr} edit_link={edit_link} delete_link={delete_link} add_new_link={add_new_link}>
								<span className="blb-card__title">{item.link_title}</span>
							</ViewLink>
							<div className="blb-card__actions">
								<FavoriteIcon data={item} />
							</div>
						</div>

						{tags.length > 0 && (
							<div className="blb-card__tags">
								{tags.map((tag, i) => (
									<span className="blb-card__tag" key={`${item.ID}-tag-${i}`}>
										#{tag.term_name}
									</span>
								))}
							</div>
						)}

						<div className="blb-card__slug">
							<span className="blb-card__slug-text btl-dark-box" title={shortLink}>
								{shortLink}
							</span>
							<div className="blb-card__slug-actions">
								<button type="button" className={`blb-card__icon-btn ${copied ? 'is-copied' : ''}`} onClick={copyHandler} title={__('Copy link', 'betterlinks')}>
									{/* <CopyIcon size={15} /> */}
									<i className="btl btl-link"></i>
								</button>
								<a className="blb-card__icon-btn" href={shortLink} target="_blank" rel="noreferrer" title={__('Visit Link', 'betterlinks')}>
									<ExternalIcon size={15} />
								</a>
							</div>
						</div>

						<div className="blb-card__foot">
							<div className="blb-card__foot-meta">
								<span className={`blb-card__dot blb-card__dot--${status}`} />
								<Link
									className="blb-card__clicks blb-card__clicks--link"
									to={route_path + 'admin.php?page=betterlinks-analytics&id=' + item.ID}
									title={__('View this link’s analytics', 'betterlinks')}
								>
									{total.toLocaleString()} <em>/ {unique.toLocaleString()}</em>
								</Link>
							</div>
							<div className="blb-card__foot-actions">
								<LinkQuickAction
									isAlowQr={is_allow_qr}
									isShowAnalytics={false}
									isShowVisitLink={false}
									isShowCopyLink={false}
									catId={parseInt(catId)}
									catName={term_name}
									submitLinkHandler={edit_link}
									deleteLinkHandler={delete_link}
									addNewLink={add_new_link}
									data={item}
									isShowEditLink={betterLinksHooks.applyFilters('betterLinksIsShowViewLink', true)}
									isShowDeleteLink={betterLinksHooks.applyFilters('betterLinksIsShowDeleteLink', true)}
								/>
							</div>
						</div>
					</div>
				);

				// Only leave the column while actually dragging — the rest of the
				// time the card must stay in the list so it occupies layout space.
				return snapshot.isDragging ? ReactDOM.createPortal(card, getDragHost()) : card;
			}}
		</Draggable>
	);
};

const mapStateToProps = (state) => ({
	favouriteSort: state.favouriteSort,
});
export default connect(mapStateToProps, null)(Card);
