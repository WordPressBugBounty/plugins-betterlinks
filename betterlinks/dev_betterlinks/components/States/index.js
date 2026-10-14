import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { SearchIcon, LinkIcon } from 'components/Icons';

// Keep in sync with `.blb-col` width + `.blb` gap in _board.scss.
const BL_COL_WIDTH = 265;
const BL_COL_GAP = 14;

// How many board columns fit (plus the partially-visible one) in a given width.
const columnsForWidth = (width) => {
	if (!width) return 4;
	// Round up so a partly-visible trailing column is shown, mirroring the real board.
	const count = Math.ceil((width + BL_COL_GAP) / (BL_COL_WIDTH + BL_COL_GAP));
	return Math.max(1, count);
};

// Measures its own rendered width and re-computes as the viewport/container resizes.
const useResponsiveColumns = () => {
	const ref = useRef(null);
	const [columns, setColumns] = useState(0);

	useLayoutEffect(() => {
		const el = ref.current;
		if (!el) return;

		const measure = () => setColumns(columnsForWidth(el.clientWidth));
		measure();

		let observer;
		if (typeof ResizeObserver !== 'undefined') {
			observer = new ResizeObserver(measure);
			observer.observe(el);
		} else {
			window.addEventListener('resize', measure);
		}
		return () => {
			if (observer) observer.disconnect();
			else window.removeEventListener('resize', measure);
		};
	}, []);

	return [ref, columns];
};

export const EmptyState = ({ filtered, onReset }) => (
	<div className="bl-empty">
		<span className="bl-empty__icon">{filtered ? <SearchIcon size={28} /> : <LinkIcon size={28} />}</span>
		<h3 className="bl-empty__title">{filtered ? __('No links match your filters', 'betterlinks') : __('No links yet', 'betterlinks')}</h3>
		<p className="bl-empty__text">
			{filtered
				? __('Try adjusting your search or filters to find what you’re looking for.', 'betterlinks')
				: __('Create your first short link to start organizing and tracking.', 'betterlinks')}
		</p>
		{filtered && onReset && (
			<button type="button" className="bl-empty__reset" onClick={onReset}>
				{__('Reset filters', 'betterlinks')}
			</button>
		)}
	</div>
);

// Board loading placeholder — mirrors the column/card layout.
// Column count is derived from the available width so it matches how many
// real columns the screen can show (4 on a laptop, 6+ on a wide monitor).
export const BoardSkeleton = ({ columns, cards = 3 }) => {
	const [ref, autoColumns] = useResponsiveColumns();
	// Explicit prop wins; otherwise use the measured count (fall back to 4 pre-measure).
	const colCount = columns || autoColumns || 4;
	return (
		<div className="blb bl-skeleton" ref={ref}>
			{Array.from({ length: colCount }).map((_, c) => (
				<div className="blb-col bl-skeleton__col" key={c}>
					<div className="bl-skeleton__col-head">
						<span className="bl-skeleton__bar bl-skeleton__bar--50" />
					</div>
					<div className="blb-col__list">
						{Array.from({ length: cards }).map((_, i) => (
							<div className="bl-skeleton__card" key={i}>
								<span className="bl-skeleton__bar bl-skeleton__bar--65" />
								<span className="bl-skeleton__bar bl-skeleton__bar--40" />
								<span className="bl-skeleton__block" />
							</div>
						))}
					</div>
				</div>
			))}
		</div>
	);
};

// List loading placeholder — mirrors the table rows.
export const ListSkeleton = ({ rows = 8 }) => (
	<div className="bl-list bl-skeleton">
		<div className="bl-skeleton__list">
			{Array.from({ length: rows }).map((_, i) => (
				<div className="bl-skeleton__row" key={i}>
					<span className="bl-skeleton__check" />
					<span className="bl-skeleton__bar" />
					<span className="bl-skeleton__bar bl-skeleton__bar--70" />
					<span className="bl-skeleton__bar bl-skeleton__bar--70" />
					<span className="bl-skeleton__bar bl-skeleton__bar--40" />
					<span className="bl-skeleton__bar bl-skeleton__bar--60" />
				</div>
			))}
		</div>
	</div>
);

// Auto-Link Keywords loading placeholder — mirrors the new stats + table layout.
export const KeywordsSkeleton = ({ rows = 6 }) => (
	<div className="bl-kw-skel">
		<div className="bl-kw__stats">
			{Array.from({ length: 3 }).map((_, i) => (
				<div className="bl-kw__stat" key={i}>
					<span className="bl-kw-skel__stat-label" />
					<span className="bl-kw-skel__stat-value" />
				</div>
			))}
		</div>

		<div className="bl-kw__toolbar">
			<span className="bl-kw-skel__search" />
			<div className="bl-kw__toolbar-right">
				<span className="bl-kw-skel__filter" />
				<span className="bl-kw-skel__reset" />
			</div>
		</div>

		<div className="bl-kw__table-wrap">
			<div className="bl-kw-skel__row bl-kw-skel__row--head">
				<span className="bl-kw-skel__h" />
				<span className="bl-kw-skel__h" />
				<span className="bl-kw-skel__h" />
				<span className="bl-kw-skel__h" />
				<span className="bl-kw-skel__h" />
			</div>
			{Array.from({ length: rows }).map((_, i) => (
				<div className="bl-kw-skel__row" key={i}>
					<span className="bl-kw-skel__check" />
					<div className="bl-kw-skel__kw">
						<span className="bl-kw-skel__badge" />
						<div className="bl-kw-skel__kw-lines">
							<span className="bl-kw-skel__name" />
							<span className="bl-kw-skel__sub" />
						</div>
					</div>
					<span className="bl-kw-skel__pill" />
					<div className="bl-kw-skel__url-cell">
						<span className="bl-kw-skel__url" />
						<span className="bl-kw-skel__icon" />
						<span className="bl-kw-skel__icon" />
					</div>
					<div className="bl-kw-skel__actions">
						<span className="bl-kw-skel__icon" />
						<span className="bl-kw-skel__icon" />
					</div>
				</div>
			))}
		</div>
	</div>
);

export default EmptyState;
