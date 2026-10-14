/**
 * Inline line-icon set for the Manage Links redesign.
 * Stroke icons (Lucide-style) so they inherit `currentColor` and theme cleanly.
 */
const base = {
	width: 18,
	height: 18,
	viewBox: '0 0 24 24',
	fill: 'none',
	stroke: 'currentColor',
	strokeWidth: 2,
	strokeLinecap: 'round',
	strokeLinejoin: 'round',
	'aria-hidden': true,
};

const Svg = ({ size, children, ...rest }) => (
	<svg {...base} width={size || base.width} height={size || base.height} {...rest}>
		{children}
	</svg>
);

export const LinkIcon = (p) => (
	<Svg {...p}>
		<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
		<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
	</Svg>
);

export const FolderIcon = (p) => (
	<Svg {...p}>
		<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
	</Svg>
);

export const ChartIcon = (p) => (
	<Svg {...p}>
		<path d="M3 3v18h18" />
		<path d="m19 9-5 5-4-4-3 3" />
	</Svg>
);

export const CheckCircleIcon = (p) => (
	<Svg {...p}>
		<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
		<path d="m9 11 3 3L22 4" />
	</Svg>
);

export const StarIcon = ({ filled, ...p }) => (
	<Svg {...p} fill={filled ? 'currentColor' : 'none'}>
		<path d="M12 2 15.09 8.26 22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2Z" />
	</Svg>
);

export const SearchIcon = (p) => (
	<Svg {...p}>
		<circle cx="11" cy="11" r="8" />
		<path d="m21 21-4.3-4.3" />
	</Svg>
);

export const TagIcon = (p) => (
	<Svg {...p}>
		<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
		<circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
	</Svg>
);

export const SortIcon = (p) => (
	<Svg {...p}>
		<path d="M3 6h13" />
		<path d="M3 12h9" />
		<path d="M3 18h5" />
		<path d="m18 9 3-3 3 3" transform="translate(-3 0)" />
		<path d="M18 6v12" transform="translate(-3 0)" />
	</Svg>
);

export const CalendarIcon = (p) => (
	<Svg {...p}>
		<path d="M8 2v4" />
		<path d="M16 2v4" />
		<rect width="18" height="18" x="3" y="4" rx="2" />
		<path d="M3 10h18" />
	</Svg>
);

export const RefreshIcon = (p) => (
	<Svg {...p}>
		<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
		<path d="M21 3v5h-5" />
		<path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
		<path d="M3 21v-5h5" />
	</Svg>
);

export const SparkleIcon = (p) => (
	<Svg {...p}>
		<path d="M9.94 6.06 12 2l2.06 4.06L18 8l-3.94 1.94L12 14l-2.06-4.06L6 8Z" />
		<path d="M19 15l.7 1.8L21.5 17.5 19.7 18.2 19 20l-.7-1.8L16.5 17.5l1.8-.7Z" />
	</Svg>
);

export const PlusIcon = (p) => (
	<Svg {...p}>
		<path d="M12 5v14" />
		<path d="M5 12h14" />
	</Svg>
);

// Clipboard, not the two-sheets glyph: the sheets read as "duplicate" and this
// sits next to LinkDulicateIcon on the board card, where the two were
// indistinguishable at 15px.
export const CopyIcon = (p) => (
	<Svg {...p}>
		<rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
		<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
	</Svg>
);

export const ExternalIcon = (p) => (
	<Svg {...p}>
		<path d="M15 3h6v6" />
		<path d="M10 14 21 3" />
		<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
	</Svg>
);

export const GripIcon = (p) => (
	<Svg {...p} strokeWidth={1.5}>
		<circle cx="9" cy="6" r="1" fill="currentColor" />
		<circle cx="9" cy="12" r="1" fill="currentColor" />
		<circle cx="9" cy="18" r="1" fill="currentColor" />
		<circle cx="15" cy="6" r="1" fill="currentColor" />
		<circle cx="15" cy="12" r="1" fill="currentColor" />
		<circle cx="15" cy="18" r="1" fill="currentColor" />
	</Svg>
);

export const ListViewIcon = (p) => (
	<Svg {...p}>
		<path d="M8 6h13" />
		<path d="M8 12h13" />
		<path d="M8 18h13" />
		<path d="M3 6h.01" />
		<path d="M3 12h.01" />
		<path d="M3 18h.01" />
	</Svg>
);

export const BoardViewIcon = (p) => (
	<Svg {...p}>
		<rect width="7" height="18" x="3" y="3" rx="1" />
		<rect width="7" height="12" x="14" y="3" rx="1" />
	</Svg>
);

export const EyeIcon = (p) => (
	<Svg {...p}>
		<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
		<circle cx="12" cy="12" r="3" />
	</Svg>
);

export const CheckIcon = (p) => (
	<Svg {...p}>
		<path d="M20 6 9 17l-5-5" />
	</Svg>
);

export const DensityIcon = (p) => (
	<Svg {...p}>
		<rect width="18" height="5" x="3" y="4" rx="1" />
		<rect width="18" height="5" x="3" y="12" rx="1" />
	</Svg>
);
