import React from 'react';
import { __ } from '@wordpress/i18n';
import Select, { components } from 'react-select';
import { DateRangePicker } from 'react-date-range';
import { removeOverlayElement } from 'utils/helper';
import { SearchIcon, FolderIcon, TagIcon, SortIcon, CalendarIcon, StarIcon, RefreshIcon, CheckIcon } from 'components/Icons';

const selectProps = {
	classNamePrefix: 'bl-rs',
	className: 'bl-rs',
	isSearchable: false,
	menuPlacement: 'auto',
};

// Menu row for the Category / Tag filters: name on the left, count on the
// right, and a check on the currently active option.
const CountOption = (props) => {
	const isAll = props.data.value === '__all__';
	const selected = props.isSelected || (isAll && !props.selectProps.value);
	return (
		<components.Option {...props}>
			<span className={`bl-opt ${selected ? 'is-selected' : ''}`}>
				<span className="bl-opt__check">{selected && <CheckIcon size={16} />}</span>
				<span className="bl-opt__label">{props.data.label}</span>
				{typeof props.data.count === 'number' && <span className="bl-opt__count">{props.data.count}</span>}
			</span>
		</components.Option>
	);
};

// The icon + "Category:" label live INSIDE react-select's control so the whole
// pill is the clickable control and the menu anchors under the full pill.
const FilterControl = ({ children, ...props }) => (
	<components.Control {...props}>
		<span className="bl-filter__lead">
			{props.selectProps.leadIcon}
			<span className="bl-filter__label">{props.selectProps.leadLabel}</span>
		</span>
		{children}
	</components.Control>
);

// A filter "pill" (icon + label + dropdown) — clicking anywhere on it opens the
// menu, since the whole thing is the react-select control.
const FilterSelect = ({ icon, label, ...rest }) => (
	<div className="bl-filter">
		<Select
			{...selectProps}
			{...rest}
			leadIcon={icon}
			leadLabel={label}
			components={{ Control: FilterControl, ...(rest.components || {}) }}
		/>
	</div>
);

/**
 * Board toolbar: search + category / tag / sort / date filters + favourite +
 * reset. Fully controlled — every value and handler comes from ManageLinks so
 * the board and the overview stats stay in sync with the active filters.
 */
const LinksToolbar = (props) => {
	const {
		filterText,
		onFilter,
		categoryOptions,
		selectedCategory,
		onCategory,
		tagOptions,
		selectedTag,
		onTag,
		sortOptions,
		selectedSort,
		onSort,
		dateOptions,
		selectedDate,
		onDate,
		sortByFav,
		onToggleFav,
		onReset,
		customDateFilter,
		setCustomDateFilter,
		isOpenCustomDateFilter,
		setIsOpenCustomDateFilter,
	} = props;

	const dateRangeChange = (item) => {
		setCustomDateFilter([item.selection]);
		if (item.selection.endDate != item.selection.startDate) {
			removeOverlayElement();
			setIsOpenCustomDateFilter(false);
		}
	};

	const closeDatePicker = () => {
		removeOverlayElement();
		setIsOpenCustomDateFilter(false);
		onDate(null);
	};

	return (
		<div className="bl-toolbar">
			<div className="bl-toolbar__search">
				<SearchIcon size={16} />
				<input type="text" placeholder={__('Search title, slug, target…', 'betterlinks')} value={filterText} onChange={onFilter} />
			</div>

			<div className="bl-toolbar__filters">
				<FilterSelect
					icon={<FolderIcon size={16} />}
					label={__('Category:', 'betterlinks')}
					placeholder={__('All', 'betterlinks')}
					value={selectedCategory}
					options={categoryOptions}
					onChange={onCategory}
					components={{ Option: CountOption }}
				/>

				<FilterSelect
					icon={<TagIcon size={16} />}
					label={__('Tag:', 'betterlinks')}
					placeholder={__('All', 'betterlinks')}
					value={selectedTag}
					options={tagOptions}
					onChange={onTag}
					components={{ Option: CountOption }}
				/>

				<FilterSelect
					icon={<SortIcon size={16} />}
					label={__('Sort:', 'betterlinks')}
					placeholder={__('Default', 'betterlinks')}
					value={selectedSort}
					options={sortOptions}
					onChange={onSort}
					isClearable
				/>

				<FilterSelect
					icon={<CalendarIcon size={16} />}
					label={__('Date:', 'betterlinks')}
					placeholder={__('All time', 'betterlinks')}
					value={selectedDate}
					options={dateOptions}
					onChange={onDate}
					isClearable
				/>

				<button type="button" className={`bl-toolbar__fav ${sortByFav ? 'is-active' : ''}`} onClick={() => onToggleFav(!sortByFav)} title={__('Favourites only', 'betterlinks')}>
					<StarIcon size={16} filled={sortByFav} />
				</button>

				<button type="button" className="bl-toolbar__reset" onClick={onReset}>
					<RefreshIcon size={15} />
					<span>{__('Reset', 'betterlinks')}</span>
				</button>
			</div>

			{selectedDate && selectedDate.value === 'custom' && (
				<button className="bl-toolbar__custom-date" onClick={() => onDate({ value: 'custom', label: __('Custom', 'betterlinks') })}>
					<CalendarIcon size={15} />
					{String(customDateFilter[0].startDate).slice(4, 15)} - {String(customDateFilter[0].endDate).slice(4, 15)}
				</button>
			)}

			{isOpenCustomDateFilter && (
				<div className="btl-date-range-picker-wrap">
					<div className="btl-date-range-picker">
						<button className="btn-date-range-close" onClick={closeDatePicker}>
							<span className="dashicons dashicons-no-alt"></span>
						</button>
						<DateRangePicker onChange={dateRangeChange} showSelectionPreview={true} moveRangeOnFirstSelection={false} months={2} ranges={customDateFilter} direction="horizontal" />
					</div>
				</div>
			)}
		</div>
	);
};

export default LinksToolbar;
