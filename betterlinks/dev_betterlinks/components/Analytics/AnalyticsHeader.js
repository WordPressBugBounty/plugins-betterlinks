import { useEffect, useRef, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { DateRangePicker } from 'react-date-range';
import { CalendarIcon, FilterIcon, ChevronDownIcon, DownloadIcon } from './Icons';
import { QUICK_RANGES, FILTER_RANGES } from './analytics.helper';

/** Closes a popover when the user clicks anywhere outside of it. */
const useDismiss = (ref, onDismiss, active) => {
	useEffect(() => {
		if (!active) return undefined;
		const handler = (event) => {
			if (ref.current && !ref.current.contains(event.target)) onDismiss();
		};
		const escape = (event) => {
			if (event.key === 'Escape') onDismiss();
		};
		document.addEventListener('mousedown', handler);
		document.addEventListener('keydown', escape);
		return () => {
			document.removeEventListener('mousedown', handler);
			document.removeEventListener('keydown', escape);
		};
	}, [ref, onDismiss, active]);
};

/**
 * Page header for Analytics: title block on the left, the range + action
 * toolbar on the right.
 *
 * Reset and Refresh Stats are not owned here — they are passed in as `actions`
 * (the existing DeleteClicks container) so the reset modal and the cache-refresh
 * request keep their single source of truth.
 */
const AnalyticsHeader = ({ range, activeDays, onSelectDays, onSelectRange, onExport, actions, lead }) => {
	const [isPickerOpen, setPickerOpen] = useState(false);
	const [isFilterOpen, setFilterOpen] = useState(false);
	// The half-finished range lives here rather than in the page's applied range.
	// react-date-range emits a change on the FIRST click too (with start === end),
	// so committing every change would refetch the whole page for a 1-day window
	// and flash a one-point chart before the user has picked their end date.
	const [draft, setDraft] = useState(null);
	const clickCount = useRef(0);
	const pickerRef = useRef(null);
	const filterRef = useRef(null);

	const closePicker = () => {
		setPickerOpen(false);
		setDraft(null);
		clickCount.current = 0;
	};

	useDismiss(pickerRef, closePicker, isPickerOpen);
	useDismiss(filterRef, () => setFilterOpen(false), isFilterOpen);

	const openPicker = () => {
		setDraft(null);
		clickCount.current = 0;
		setPickerOpen(true);
	};

	const pickDays = (days) => {
		onSelectDays(days);
		setFilterOpen(false);
	};

	// Commit on the second click, which is what closes the range. Counting clicks
	// rather than comparing start/end also lets a deliberate single-day range
	// (both clicks on the same date) commit and close.
	const handlePickerChange = (item) => {
		const selection = item.selection;
		clickCount.current += 1;

		if (clickCount.current < 2) {
			setDraft([selection]);
			return;
		}
		onSelectRange([selection]);
		closePicker();
	};

	return (
		<header className="bl-an__head">
			{lead || (
				<div className="bl-an__titles">
					<h1 className="bl-an__title">{__('Analytics', 'betterlinks')}</h1>
					<p className="bl-an__subtitle">{__('How your links are performing — and what needs your attention.', 'betterlinks')}</p>
				</div>
			)}

			<div className="bl-an__tools">
				<div className="bl-an__range" role="group" aria-label={__('Date range', 'betterlinks')}>
					{QUICK_RANGES.map((preset) => (
						<button
							type="button"
							key={preset.days}
							className={`bl-an__range-btn${activeDays === preset.days ? ' is-active' : ''}`}
							aria-pressed={activeDays === preset.days}
							onClick={() => onSelectDays(preset.days)}
						>
							{preset.label}
						</button>
					))}

					<div className="bl-an__picker" ref={pickerRef}>
						<button
							type="button"
							className={`bl-an__range-icon${isPickerOpen || activeDays === null ? ' is-active' : ''}`}
							aria-label={__('Pick a custom date range', 'betterlinks')}
							aria-expanded={isPickerOpen}
							onClick={() => (isPickerOpen ? closePicker() : openPicker())}
						>
							<CalendarIcon width={17} height={17} />
						</button>

						{isPickerOpen && (
							<div className="bl-an__pop bl-an__pop--calendar">
								<DateRangePicker
									onChange={handlePickerChange}
									showSelectionPreview
									moveRangeOnFirstSelection={false}
									months={2}
									ranges={draft || range}
									direction="horizontal"
									maxDate={new Date()}
									rangeColors={['#2f6bff']}
									color="#2f6bff"
								/>
							</div>
						)}
					</div>
				</div>

				<div className="bl-an__filter" ref={filterRef}>
					<button
						type="button"
						className={`bl-an__btn${isFilterOpen ? ' is-active' : ''}`}
						aria-haspopup="menu"
						aria-expanded={isFilterOpen}
						onClick={() => setFilterOpen((open) => !open)}
					>
						<FilterIcon width={16} height={16} />
						{__('Filter', 'betterlinks')}
						<ChevronDownIcon width={15} height={15} className="bl-an__caret" />
					</button>

					{isFilterOpen && (
						<div className="bl-an__pop bl-an__pop--menu" role="menu">
							{FILTER_RANGES.map((preset) => (
								<button
									type="button"
									role="menuitem"
									key={preset.days}
									className={`bl-an__menu-item${activeDays === preset.days ? ' is-active' : ''}`}
									onClick={() => pickDays(preset.days)}
								>
									{preset.label}
								</button>
							))}
							<span className="bl-an__menu-sep" role="separator" />
							<button
								type="button"
								role="menuitem"
								className="bl-an__menu-item"
								onClick={() => {
									setFilterOpen(false);
									openPicker();
								}}
							>
								{__('Custom range…', 'betterlinks')}
							</button>
						</div>
					)}
				</div>

				{actions}

				<button type="button" className="bl-an__btn" onClick={onExport}>
					<DownloadIcon width={16} height={16} />
					{__('Export', 'betterlinks')}
				</button>
			</div>
		</header>
	);
};

export default AnalyticsHeader;
