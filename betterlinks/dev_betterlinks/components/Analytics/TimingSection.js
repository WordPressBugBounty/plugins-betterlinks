import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { __, sprintf } from '@wordpress/i18n';
import { TimingSkeleton } from './Skeletons';
import { ClockIcon, InfoIcon } from './Icons';
import { WEEKDAYS, HEAT_STEPS, buildTimingGrid, formatHour, formatHourRange, formatNumber } from './analytics.helper';

// Hours labelled along the top axis, matching the reference (0, 6, 12, 18).
const HOUR_TICKS = [0, 6, 12, 18];

/**
 * Section 5 — Timing.
 *
 * A weekday × hour heatmap of when clicks happen. Each cell's colour scales with
 * its click volume; hovering shows that hour's clicks AND unique visitors. A
 * footer calls out the single busiest hour so it's actionable at a glance.
 *
 * The grid is 7×24 = 168 cells, so the tooltip is a SINGLE element positioned
 * over the hovered cell rather than one tooltip per cell.
 *
 * That element is portaled to <body> and positioned in VIEWPORT coordinates:
 * `.bl-heat__scroll` scrolls horizontally, and a box that scrolls on one axis
 * clips the other, so a tip anchored inside the grid was cropped above the top
 * row (and at the first/last hour columns).
 */
const TimingSection = ({ timing, loading }) => {
	const [hover, setHover] = useState(null); // { day, hour, top, left }

	const { grid, peak, total } = useMemo(() => buildTimingGrid(timing), [timing]);

	// A fixed tip can't follow the grid, so drop it if anything scrolls beneath
	// it (the page, or the heatmap's own horizontal strip). Keyed on whether a
	// cell is hovered at all — `hover` itself changes on every mousemove, which
	// would re-subscribe the listeners continuously.
	const isHovering = hover !== null;
	useEffect(() => {
		if (!isHovering) return undefined;
		const clear = () => setHover(null);
		window.addEventListener('scroll', clear, true);
		window.addEventListener('resize', clear);
		return () => {
			window.removeEventListener('scroll', clear, true);
			window.removeEventListener('resize', clear);
		};
	}, [isHovering]);

	if (loading) return <TimingSkeleton />;

	const hoverCell = hover ? grid[hover.day][hover.hour] : null;

	const enter = (cell, event) => {
		const rect = event.currentTarget.getBoundingClientRect();
		// Keep the tip clear of the viewport edges — hour 0 and hour 23 would
		// otherwise push half of it off-screen.
		const margin = 130;
		const centre = rect.left + rect.width / 2;
		setHover({
			day: cell.day,
			hour: cell.hour,
			left: Math.min(Math.max(centre, margin), window.innerWidth - margin),
			top: rect.top,
		});
	};

	return (
		<div className="bl-heat">
			<div className="bl-heat__head">
				<span className="bl-heat__icon">
					<ClockIcon width={17} height={17} />
				</span>
				<h3 className="bl-heat__title">{__('Peak click hours', 'betterlinks')}</h3>
				<span className="bl-heat__subtitle">{__('day × hour · when your audience clicks', 'betterlinks')}</span>
			</div>

			{!total ? (
				<div className="bl-heat__state">
					<span className="bl-heat__state-badge">
						<ClockIcon width={20} height={20} />
					</span>
					<p className="bl-heat__state-title">{__('No data yet', 'betterlinks')}</p>
					<p className="bl-heat__state-text">{__('No clicks were recorded in this range.', 'betterlinks')}</p>
				</div>
			) : (
				<>
					<div className="bl-heat__scroll">
						<div className="bl-heat__inner">
							{/* Hour axis */}
							<div className="bl-heat__hours" aria-hidden="true">
								{Array.from({ length: 24 }, (_, hour) => (
									<span className="bl-heat__hour" key={hour}>
										{HOUR_TICKS.includes(hour) ? hour : ''}
									</span>
								))}
							</div>

							<div className="bl-heat__body">
								<div className="bl-heat__days" aria-hidden="true">
									{WEEKDAYS.map((day) => (
										<span className="bl-heat__day" key={day}>
											{day}
										</span>
									))}
								</div>

								<div className="bl-heat__grid" onMouseLeave={() => setHover(null)}>
									{grid.map((rowCells, day) =>
										rowCells.map((cell) => {
											const isPeak = peak && cell.day === peak.day && cell.hour === peak.hour;
											return (
												<div
													key={`${day}-${cell.hour}`}
													className={`bl-heat__cell${isPeak ? ' is-peak' : ''}${hover && hover.day === day && hover.hour === cell.hour ? ' is-hover' : ''}`}
													style={{ background: HEAT_STEPS[cell.step] }}
													onMouseEnter={(event) => enter(cell, event)}
													onMouseMove={(event) => enter(cell, event)}
												/>
											);
										})
									)}

									{hoverCell &&
										createPortal(
											<div className="bl-heat__tip" style={{ left: hover.left, top: hover.top }} role="status">
											<span className="bl-heat__tip-when">{`${WEEKDAYS[hover.day]} ${formatHour(hover.hour)}`}</span>
											<span className="bl-heat__tip-row">
												<i className="bl-heat__tip-dot bl-heat__tip-dot--clicks" />
												{sprintf(
													/* translators: %s: number of clicks. */
													__('%s clicks', 'betterlinks'),
													formatNumber(hoverCell.clicks)
												)}
											</span>
											<span className="bl-heat__tip-row">
												<i className="bl-heat__tip-dot bl-heat__tip-dot--unique" />
												{sprintf(
													/* translators: %s: number of unique visitors. */
													__('%s unique', 'betterlinks'),
													formatNumber(hoverCell.unique)
												)}
											</span>
											</div>,
											document.body
										)}
								</div>
							</div>
						</div>
					</div>

					<div className="bl-heat__foot">
						<div className="bl-heat__insight">
							{peak && peak.clicks > 0 && (
								<>
									<InfoIcon width={15} height={15} />
									<span>
										{/* translators: 1: weekday + hour range, e.g. "Tue 21:00–22:00". */}
										{__('Peak traffic is', 'betterlinks')} <strong>{`${WEEKDAYS[peak.day]} ${formatHourRange(peak.hour)}`}</strong>{' '}
										{__('— schedule launches and sends around it.', 'betterlinks')}
									</span>
								</>
							)}
						</div>

						<div className="bl-heat__legend" aria-hidden="true">
							<span className="bl-heat__legend-label">{__('Less', 'betterlinks')}</span>
							{HEAT_STEPS.map((color, index) => (
								<span key={index} className="bl-heat__legend-swatch" style={{ background: color }} />
							))}
							<span className="bl-heat__legend-label">{__('More', 'betterlinks')}</span>
						</div>
					</div>
				</>
			)}
		</div>
	);
};

export default TimingSection;
