import { useMemo } from 'react';

/**
 * Tiny inline trend line for the stat cards.
 *
 * Hand-rolled SVG rather than a second ApexCharts instance: four of these mount
 * alongside the main chart, and a full chart instance each would cost far more
 * than the polyline they draw.
 *
 * The viewBox is stretched to the card's width, so strokes use
 * `vector-effect="non-scaling-stroke"` to stay 1.5px however wide the card gets.
 */
const VIEW_W = 100;
const VIEW_H = 36;
const PAD = 3;

const Sparkline = ({ data = [], color = '#2f6bff', filled = false, ariaLabel }) => {
	const shape = useMemo(() => {
		const values = (data || []).map((n) => Number(n) || 0);
		if (values.length < 2) return null;

		const max = Math.max(...values);
		const min = Math.min(...values);
		const span = max - min || 1;
		const stepX = VIEW_W / (values.length - 1);
		const usableH = VIEW_H - PAD * 2;

		const points = values.map((value, index) => {
			const x = index * stepX;
			const y = PAD + (1 - (value - min) / span) * usableH;
			return `${x.toFixed(2)},${y.toFixed(2)}`;
		});

		return {
			line: points.join(' '),
			area: `${points.join(' ')} ${VIEW_W},${VIEW_H} 0,${VIEW_H}`,
		};
	}, [data]);

	if (!shape) return <div className="bl-spark bl-spark--empty" aria-hidden="true" />;

	return (
		<svg
			className="bl-spark"
			viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
			preserveAspectRatio="none"
			role={ariaLabel ? 'img' : 'presentation'}
			aria-label={ariaLabel}
			aria-hidden={ariaLabel ? undefined : 'true'}
			focusable="false"
		>
			{filled && <polygon points={shape.area} fill={color} fillOpacity="0.12" />}
			<polyline
				points={shape.line}
				fill="none"
				stroke={color}
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
				vectorEffect="non-scaling-stroke"
			/>
		</svg>
	);
};

export default Sparkline;
