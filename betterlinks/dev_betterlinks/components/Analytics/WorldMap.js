import { useEffect, useMemo, useRef, useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { getFlagEmoji } from 'utils/helper';
import { WORLD_VIEWBOX, WORLD_PATHS } from './worldMap.data';
import { CHOROPLETH_STEPS, choroplethStep, formatNumber } from './analytics.helper';

const CODES = Object.keys(WORLD_PATHS);
const [, , MAP_W, MAP_H] = WORLD_VIEWBOX.split(' ').map(Number);
const MAX_ZOOM = 8; // smallest viewBox is the full map / MAX_ZOOM

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * Choropleth world map for the Geography section.
 *
 * Geometry is static, simplified SVG paths (worldMap.data.js) keyed by ISO
 * alpha-2 — the codes the API returns — so colouring is a plain lookup with no
 * projection maths at runtime. Only the fill and the hover overlay are dynamic,
 * so re-colouring on a new range never rebuilds the ~220 base paths.
 *
 * Zoom/pan is driven by the SVG's own `viewBox` (not a CSS transform): a smaller
 * viewBox zooms in, its origin pans. Country borders keep a constant on-screen
 * width via `vector-effect: non-scaling-stroke`, so they stay crisp at any zoom.
 *
 * The hovered country is drawn a SECOND time as an overlay on top of the whole
 * map, rather than by restyling its base path in place — a base path sits under
 * its neighbours in document order, so an in-place outline would be clipped
 * where another country overlaps it; a top overlay always shows the full border.
 */
const WorldMap = ({ byCode, max, darkMode }) => {
	const emptyFill = darkMode ? '#2b3450' : '#e3e6ec';
	const border = darkMode ? '#1f2740' : '#ffffff';
	const hoverFill = darkMode ? '#39425c' : '#ccd2dc';
	const hoverStroke = darkMode ? '#8ba9ff' : '#3a4152';

	const svgRef = useRef(null);
	const panRef = useRef(null); // in-flight drag: { startX, startY, vx, vy, pxPerUnit, moved }
	const [hover, setHover] = useState(null); // { code, x, y }
	const [view, setView] = useState({ x: 0, y: 0, w: MAP_W, h: MAP_H });
	const [panning, setPanning] = useState(false);

	const fills = useMemo(() => {
		const map = {};
		CODES.forEach((code) => {
			const row = byCode[code];
			map[code] = row ? CHOROPLETH_STEPS[choroplethStep(row.value, max)] : emptyFill;
		});
		return map;
	}, [byCode, max, emptyFill]);

	const isZoomed = view.w < MAP_W - 0.5;

	// Map a client point to viewBox coordinates via the SVG's current transform,
	// which already accounts for the viewBox and letterboxing.
	const clientToView = (clientX, clientY) => {
		const svg = svgRef.current;
		if (!svg || !svg.getScreenCTM) return null;
		const ctm = svg.getScreenCTM();
		if (!ctm) return null;
		const pt = svg.createSVGPoint();
		pt.x = clientX;
		pt.y = clientY;
		const mapped = pt.matrixTransform(ctm.inverse());
		return { x: mapped.x, y: mapped.y };
	};

	// Zoom by `factor` (>1 in, <1 out) keeping `focus` (viewBox coords) fixed.
	const zoomBy = (factor, focus) => {
		setView((current) => {
			const nextW = clamp(current.w / factor, MAP_W / MAX_ZOOM, MAP_W);
			const nextH = nextW * (MAP_H / MAP_W);
			const fx = focus ? focus.x : current.x + current.w / 2;
			const fy = focus ? focus.y : current.y + current.h / 2;
			// Keep (fx,fy) under the same screen spot as the viewBox shrinks/grows.
			let nextX = fx - (fx - current.x) * (nextW / current.w);
			let nextY = fy - (fy - current.y) * (nextH / current.h);
			nextX = clamp(nextX, 0, MAP_W - nextW);
			nextY = clamp(nextY, 0, MAP_H - nextH);
			return { x: nextX, y: nextY, w: nextW, h: nextH };
		});
	};

	const resetView = () => setView({ x: 0, y: 0, w: MAP_W, h: MAP_H });

	// Wheel to zoom toward the cursor. Attached natively so preventDefault works
	// (React's onWheel is passive and cannot stop the page from scrolling).
	useEffect(() => {
		const svg = svgRef.current;
		if (!svg) return undefined;
		const onWheel = (event) => {
			event.preventDefault();
			zoomBy(event.deltaY < 0 ? 1.2 : 1 / 1.2, clientToView(event.clientX, event.clientY));
		};
		svg.addEventListener('wheel', onWheel, { passive: false });
		return () => svg.removeEventListener('wheel', onWheel);
	}, []);

	// Drag to pan while zoomed in. Window listeners so a drag that leaves the map
	// still tracks and releases.
	useEffect(() => {
		if (!panning) return undefined;
		const onMove = (event) => {
			const pan = panRef.current;
			if (!pan) return;
			const dx = (event.clientX - pan.startX) / pan.pxPerUnit;
			const dy = (event.clientY - pan.startY) / pan.pxPerUnit;
			if (Math.abs(dx) > 1 || Math.abs(dy) > 1) pan.moved = true;
			setView((current) => ({
				...current,
				x: clamp(pan.vx - dx, 0, MAP_W - current.w),
				y: clamp(pan.vy - dy, 0, MAP_H - current.h),
			}));
		};
		const onUp = () => {
			panRef.current = null;
			setPanning(false);
		};
		window.addEventListener('mousemove', onMove);
		window.addEventListener('mouseup', onUp);
		return () => {
			window.removeEventListener('mousemove', onMove);
			window.removeEventListener('mouseup', onUp);
		};
	}, [panning]);

	const startPan = (event) => {
		if (!isZoomed || event.button !== 0) return;
		const svg = svgRef.current;
		const ctm = svg?.getScreenCTM?.();
		if (!ctm) return;
		panRef.current = { startX: event.clientX, startY: event.clientY, vx: view.x, vy: view.y, pxPerUnit: ctm.a, moved: false };
		setPanning(true);
		setHover(null);
	};

	const track = (code, event) => {
		if (panRef.current) return; // don't chase the cursor mid-pan
		const host = svgRef.current?.parentNode;
		if (!host) return;
		const box = host.getBoundingClientRect();
		setHover({ code, x: event.clientX - box.left, y: event.clientY - box.top });
	};

	const hoverRow = hover ? byCode[hover.code] : null;
	const viewBox = `${view.x} ${view.y} ${view.w} ${view.h}`;

	return (
		<div className="bl-geo__map" onMouseLeave={() => setHover(null)}>
			<svg
				ref={svgRef}
				viewBox={viewBox}
				className={`bl-geo__svg${isZoomed ? ' is-zoomed' : ''}${panning ? ' is-panning' : ''}`}
				role="img"
				aria-label={__('Clicks by country', 'betterlinks')}
				preserveAspectRatio="xMidYMid meet"
				onMouseDown={startPan}
			>
				{CODES.map((code) => (
					<path
						key={code}
						d={WORLD_PATHS[code].path}
						fill={fills[code]}
						stroke={border}
						strokeWidth="0.8"
						vectorEffect="non-scaling-stroke"
						className={`bl-geo__country${byCode[code] ? ' is-active' : ''}`}
						onMouseEnter={(event) => track(code, event)}
						onMouseMove={(event) => track(code, event)}
					/>
				))}

				{hover && (
					<path
						d={WORLD_PATHS[hover.code].path}
						fill={hoverRow ? fills[hover.code] : hoverFill}
						stroke={hoverStroke}
						strokeWidth="1.6"
						vectorEffect="non-scaling-stroke"
						style={{ paintOrder: 'stroke', pointerEvents: 'none' }}
					/>
				)}
			</svg>

			<div className="bl-geo__legend" aria-hidden="true">
				<span className="bl-geo__legend-label">{__('Fewer', 'betterlinks')}</span>
				{CHOROPLETH_STEPS.slice(1).map((color, index) => (
					<span key={index} className="bl-geo__legend-swatch" style={{ background: color }} />
				))}
				<span className="bl-geo__legend-label">{__('More', 'betterlinks')}</span>
			</div>

			<div className="bl-geo__zoom">
				<button type="button" className="bl-geo__zoom-btn" aria-label={__('Zoom in', 'betterlinks')} onClick={() => zoomBy(1.6)}>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
						<path d="M12 6v12M6 12h12" />
					</svg>
				</button>
				<button type="button" className="bl-geo__zoom-btn" aria-label={__('Zoom out', 'betterlinks')} disabled={!isZoomed} onClick={() => zoomBy(1 / 1.6)}>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
						<path d="M6 12h12" />
					</svg>
				</button>
				<button type="button" className="bl-geo__zoom-btn" aria-label={__('Reset zoom', 'betterlinks')} disabled={!isZoomed} onClick={resetView}>
					<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
						<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1M3.5 4v5h5" />
					</svg>
				</button>
			</div>

			{hover && (
				<div className="bl-geo__tip" style={{ left: hover.x, top: hover.y }} role="status">
					<span className="bl-geo__tip-flag">{getFlagEmoji(hover.code)}</span>
					<span className="bl-geo__tip-name">{hoverRow?.label || WORLD_PATHS[hover.code].name}</span>
					<span className={`bl-geo__tip-clicks${hoverRow ? '' : ' is-empty'}`}>
						{hoverRow
							? sprintf(
									/* translators: 1: total clicks, 2: unique visitors. */
									__('%1$s clicks · %2$s unique', 'betterlinks'),
									formatNumber(hoverRow.value),
									formatNumber(hoverRow.unique)
							  )
							: __('No data available', 'betterlinks')}
					</span>
				</div>
			)}
		</div>
	);
};

export default WorldMap;
