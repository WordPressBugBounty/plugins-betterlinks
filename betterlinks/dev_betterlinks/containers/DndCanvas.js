import { useEffect, memo } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Loader from 'components/Loader';
import { fetch_links_data, onDragEnd, add_new_cat, add_new_link, edit_link, delete_link, merge_empty_categories } from 'redux/actions/links.actions';
import { fetch_settings_data, fetch_tracking_settings } from 'redux/actions/settings.actions';
import { fetch_terms_data, reorder_terms } from 'redux/actions/terms.actions';
import { DragDropContext, Droppable, Draggable } from 'utils/dnd';
import CreateCategory from 'components/CreateCategory';
import Link from 'containers/Link';
import CatHeader from 'containers/CatHeader';
import BoardCard from 'components/Board/BoardCard';
import { getFilteredLinksView } from 'utils/helper';
import { __ } from '@wordpress/i18n';
import { EmptyState, BoardSkeleton } from 'components/States';

class InnerList extends React.Component {
	shouldComponentUpdate(nextProps) {
		return nextProps.lists !== this.props.lists || nextProps.isDragDisabled !== this.props.isDragDisabled || nextProps.catName !== this.props.catName;
	}
	render() {
		const { lists, settings, edit_link, delete_link, add_new_link, catId, catName, isDragDisabled } = this.props;
		return lists.map(
			(list, index) =>
				!!list.link_title && (
					<BoardCard
						is_allow_qr={settings && settings.is_allow_qr}
						edit_link={edit_link}
						delete_link={delete_link}
						add_new_link={add_new_link}
						catId={catId}
						term_name={catName}
						isDragDisabled={isDragDisabled}
						key={`item-${list.ID}`}
						item={list}
						index={index}
					/>
				)
		);
	}
}

const Column = memo(({ ind, el, provided, dragProvided, isColumnDragging, props, isDragDisabled }) => {
	const { sortByFav } = props.favouriteSort;
	const { lists } = el;
	// `dragProvided` = the column Draggable: its ref/props go on the column root,
	// and its drag handle is passed to the header (so only the header grip drags
	// the whole column — cards and menu clicks are unaffected). `isColumnDragging`
	// lifts the column visually while it's being moved.
	return (
		<div className={`blb-col${isColumnDragging ? ' is-dragging' : ''}`} ref={dragProvided && dragProvided.innerRef} {...(dragProvided ? dragProvided.draggableProps : {})}>
			<CatHeader
				catId={parseInt(ind)}
				catName={el.term_name}
				catSlug={el.term_slug}
				count={lists.length}
				clicks={el.clicks}
				dragHandleProps={dragProvided ? dragProvided.dragHandleProps : null}
			/>
			{/*
			  The droppable grows with its cards — it is not a scroll container, so
			  the page scrolls and rbd auto-scrolls the window during a drag.
			*/}
			<div ref={provided.innerRef} className="blb-col__list" {...provided.droppableProps}>
				<InnerList
					settings={props.settings.settings}
					edit_link={props.edit_link}
					delete_link={props.delete_link}
					add_new_link={props.add_new_link}
					catId={ind}
					catName={el.term_name}
					lists={lists}
					isDragDisabled={isDragDisabled}
				/>
				{provided.placeholder}
			</div>
			<div className="blb-col__foot">
				{betterLinksHooks.applyFilters('betterLinksIsShowWriteLink', true) && !sortByFav && (
					<Link catId={parseInt(ind)} catName={el.term_name} plusIcon createLabel={__('Add link', 'betterlinks')} submitHandler={props.add_new_link} />
				)}
			</div>
		</div>
	);
});

function DndCanvas(props) {
	const { links } = props.links;
	const { settings } = props.settings;
	const { terms } = props.terms;
	const filter = props.filter || {};

	useEffect(() => {
		if (!settings) {
			props.fetch_settings_data();
			props.fetch_tracking_settings();
		}
		if (!links) {
			props.fetch_links_data();
		}
		if (!terms) {
			props.fetch_terms_data();
		}
	}, []);

	// Empty categories are omitted by the /links endpoint; add them into state
	// so their board columns become real drag-and-drop targets.
	useEffect(() => {
		if (!links || !Array.isArray(terms)) return;
		const cats = terms.filter((term) => `${term.term_type}` === 'category');
		const needsMerge = cats.some((term) => !links[term.ID] || !Array.isArray(links[term.ID].lists));
		if (needsMerge) props.merge_empty_categories(cats);
	}, [links, terms]);

	if (!(links && settings && terms)) {
		return <BoardSkeleton />;
	}

	const categoryTerms = Array.isArray(terms) ? terms.filter((term) => `${term.term_type}` === 'category') : [];
	const { groups, filtersActive } = getFilteredLinksView(links, filter, categoryTerms);

	if (groups.length === 0) {
		return <EmptyState filtered={filtersActive} onReset={props.onResetFilters} />;
	}

	// Column reordering is only meaningful on the pristine board — a filtered or
	// favourites-sorted view shows a subset in a derived order, so persisting a
	// reorder from there would be misleading.
	const reorderDisabled = filtersActive || !!filter.sortByFav;

	const handleDragEnd = (result) => {
		// Two drag types share one context: columns (type COLUMN) reorder
		// categories; everything else is a card move (existing behaviour).
		if (result.type === 'COLUMN') {
			if (!result.destination || result.destination.index === result.source.index) return;
			// Reorder the visible columns, then stitch the result back over the FULL
			// category order (so a hidden empty "uncategorized" keeps its slot).
			const fullOrder = categoryTerms.map((term) => `${term.ID}`);
			const visibleIds = groups.map(([ind]) => `${ind}`);
			const visibleSet = new Set(visibleIds);
			const newVisible = visibleIds.slice();
			const [moved] = newVisible.splice(result.source.index, 1);
			newVisible.splice(result.destination.index, 0, moved);
			let vi = 0;
			const finalOrder = fullOrder.map((id) => (visibleSet.has(id) ? newVisible[vi++] : id));
			props.reorder_terms(finalOrder);
			return;
		}
		props.onDragEnd(result);
	};

	return (
		<DragDropContext onDragEnd={handleDragEnd}>
			<Droppable droppableId="bl-board-columns" direction="horizontal" type="COLUMN" isDropDisabled={reorderDisabled}>
				{(colProvided) => (
					<div className="blb" ref={colProvided.innerRef} {...colProvided.droppableProps}>
						{groups.map(([ind, el], colIndex) => (
							<Draggable key={ind} draggableId={`col_${ind}`} index={colIndex} isDragDisabled={reorderDisabled}>
								{(dragProvided, dragSnapshot) => (
									<Droppable droppableId={ind}>
										{(provided) => (
											<Column
												ind={ind}
												el={el}
												provided={provided}
												dragProvided={dragProvided}
												isColumnDragging={dragSnapshot.isDragging}
												props={props}
												isDragDisabled={filtersActive}
											/>
										)}
									</Droppable>
								)}
							</Draggable>
						))}
						{colProvided.placeholder}
						{!filtersActive && !filter.sortByFav && betterLinksHooks.applyFilters('betterLinksIsShowWriteCat', true) && (
							<div className="blb-col blb-col--add">
								<CreateCategory createCatHandler={props.add_new_cat} />
							</div>
						)}
					</div>
				)}
			</Droppable>
		</DragDropContext>
	);
}

const mapStateToProps = (state) => ({
	links: state.links,
	settings: state.settings,
	terms: state.terms,
	favouriteSort: state.favouriteSort,
});

const mapDispatchToProps = (dispatch) => {
	return {
		fetch_links_data: bindActionCreators(fetch_links_data, dispatch),
		fetch_settings_data: bindActionCreators(fetch_settings_data, dispatch),
		fetch_tracking_settings: bindActionCreators(fetch_tracking_settings, dispatch),
		onDragEnd: bindActionCreators(onDragEnd, dispatch),
		add_new_cat: bindActionCreators(add_new_cat, dispatch),
		add_new_link: bindActionCreators(add_new_link, dispatch),
		edit_link: bindActionCreators(edit_link, dispatch),
		delete_link: bindActionCreators(delete_link, dispatch),
		merge_empty_categories: bindActionCreators(merge_empty_categories, dispatch),
		fetch_terms_data: bindActionCreators(fetch_terms_data, dispatch),
		reorder_terms: bindActionCreators(reorder_terms, dispatch),
	};
};

export default connect(mapStateToProps, mapDispatchToProps)(DndCanvas);
