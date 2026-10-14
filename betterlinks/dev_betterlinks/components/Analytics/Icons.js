/**
 * Inline stroke icons for the Analytics redesign.
 *
 * Same convention as `components/Icons` — 1.6px strokes on a 24px grid, colour
 * inherited from `currentColor` so a single icon works in light and dark mode.
 */
const base = {
	width: 18,
	height: 18,
	viewBox: '0 0 24 24',
	fill: 'none',
	stroke: 'currentColor',
	strokeWidth: 1.6,
	strokeLinecap: 'round',
	strokeLinejoin: 'round',
};

export const LockIcon = (p) => (
	<svg {...base} {...p}>
		<rect x="4.5" y="10.5" width="15" height="10" rx="2.4" />
		<path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
		<circle cx="12" cy="15.5" r="1.3" />
	</svg>
);

export const SparkIcon = (p) => (
	<svg {...base} {...p}>
		<path d="M12 3.5 13.9 9l5.6 1.9-5.6 1.9L12 18.4l-1.9-5.6-5.6-1.9L10.1 9z" />
	</svg>
);

export const CursorIcon = (p) => (
	<svg {...base} {...p}>
		<path d="M4 3l7 17 2.5-6.5L20 11z" />
	</svg>
);

export const UsersIcon = (p) => (
	<svg {...base} {...p}>
		<path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20" />
		<circle cx="9" cy="7" r="3.2" />
		<path d="M22 20v-1.5a4 4 0 0 0-3-3.85" />
		<path d="M16 4.15a4 4 0 0 1 0 7.7" />
	</svg>
);

export const BotIcon = (p) => (
	<svg {...base} {...p}>
		<rect x="4" y="8" width="16" height="12" rx="3" />
		<path d="M12 8V4.5" />
		<circle cx="12" cy="3.2" r="1.2" />
		<path d="M9 13v1.5M15 13v1.5" />
		<path d="M2 13v3M22 13v3" />
	</svg>
);
export const HumanIcon = (p) => (
	<svg {...base} {...p} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" stroke-width="3" stroke="#000000" fill="none"><circle cx="32" cy="18.14" r="11.14"/><path d="M54.55,56.85A22.55,22.55,0,0,0,32,34.3h0A22.55,22.55,0,0,0,9.45,56.85Z"/></svg>
);

export const RepeatIcon = (p) => (
	<svg {...base} {...p}>
		<path d="M17 2l3.5 3.5L17 9" />
		<path d="M3.5 11.5v-2A4 4 0 0 1 7.5 5.5h13" />
		<path d="M7 22l-3.5-3.5L7 15" />
		<path d="M20.5 12.5v2a4 4 0 0 1-4 4h-13" />
	</svg>
);

export const PulseIcon = (p) => (
	<svg {...base} {...p}>
		<path d="M2 12h4l3-8 6 16 3-8h4" />
	</svg>
);

export const TrendUpIcon = (p) => (
	<svg {...base} {...p}>
		<path d="M6 18L18 6" />
		<path d="M10 6h8v8" />
	</svg>
);

export const TrendDownIcon = (p) => (
	<svg {...base} {...p}>
		<path d="M6 6l12 12" />
		<path d="M18 10v8h-8" />
	</svg>
);

export const FilterIcon = (p) => (
	<svg {...base} {...p}>
		<path d="M3 5h18l-7 8v6l-4 2v-8z" />
	</svg>
);

export const ChevronDownIcon = (p) => (
	<svg {...base} {...p}>
		<path d="M6 9l6 6 6-6" />
	</svg>
);

export const CalendarIcon = (p) => (
	<svg {...base} {...p}>
		<rect x="3" y="5" width="18" height="16" rx="2.5" />
		<path d="M3 10h18M8 3v4M16 3v4" />
	</svg>
);

export const DownloadIcon = (p) => (
	<svg {...base} {...p}>
		<path d="M12 3v12" />
		<path d="M7.5 10.5L12 15l4.5-4.5" />
		<path d="M4 19h16" />
	</svg>
);

export const RefreshIcon = (p) => (
	<svg {...base} {...p}>
		<path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1" />
		<path d="M20.5 4v5h-5" />
	</svg>
);

export const ResetIcon = (p) => (
	<svg {...base} {...p}>
		<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
		<path d="M3.5 4v5h5" />
	</svg>
);

export const InfoIcon = (p) => (
	<svg {...base} {...p}>
		<circle cx="12" cy="12" r="9" />
		<path d="M12 11v5M12 7.8v.4" />
	</svg>
);

// ---- Sources / technology -------------------------------------------------
export const ShareIcon = (p) => (
	<svg {...base} {...p}>
		<circle cx="18" cy="5" r="2.6" />
		<circle cx="6" cy="12" r="2.6" />
		<circle cx="18" cy="19" r="2.6" />
		<path d="M8.3 10.8l7.4-4.3M8.3 13.2l7.4 4.3" />
	</svg>
);

export const MegaphoneIcon = (p) => (
	<svg {...base} {...p}>
		<path d="M3 11v2a1 1 0 0 0 1 1h3l7 4V6L7 10H4a1 1 0 0 0-1 1z" />
		<path d="M18 8.5a4 4 0 0 1 0 7" />
	</svg>
);

export const LinkOutIcon = (p) => (
	<svg {...base} {...p}>
		<path d="M14 4h6v6" />
		<path d="M20 4l-8 8" />
		<path d="M18 14v5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 19V8a1.5 1.5 0 0 1 1.5-1.5H10" />
	</svg>
);

export const MonitorIcon = (p) => (
	<svg {...base} {...p}>
		<rect x="2.5" y="4" width="19" height="12.5" rx="2" />
		<path d="M8.5 20.5h7M12 16.5v4" />
	</svg>
);

export const SmartphoneIcon = (p) => (
	<svg {...base} {...p}>
		<rect x="7" y="2.5" width="10" height="19" rx="2.5" />
		<path d="M11 18.5h2" />
	</svg>
);

export const TabletIcon = (p) => (
	<svg {...base} {...p}>
		<rect x="4.5" y="2.5" width="15" height="19" rx="2.5" />
		<path d="M11 18.5h2" />
	</svg>
);

export const CpuIcon = (p) => (
	<svg {...base} {...p}>
		<rect x="6" y="6" width="12" height="12" rx="2" />
		<path d="M10 2.5v3M14 2.5v3M10 18.5v3M14 18.5v3M2.5 10h3M2.5 14h3M18.5 10h3M18.5 14h3" />
	</svg>
);

export const GlobeIcon = (p) => (
	<svg {...base} {...p}>
		<circle cx="12" cy="12" r="9" />
		<path d="M3 12h18" />
		<path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18z" />
	</svg>
);

export const AppleIcon = (p) => (
	<svg {...base} {...p}>
		<path d="M16 12.6c0-2.2 1.8-3.2 1.9-3.3-1-1.5-2.6-1.7-3.2-1.8-1.4-.1-2.7.8-3.3.8s-1.7-.8-2.8-.8c-1.5 0-2.8.8-3.5 2.1-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.6 2.2 2.7 2.1 1.1 0 1.5-.7 2.8-.7s1.7.7 2.8.7 1.9-1 2.6-2a9 9 0 0 0 1.2-2.4c-.1 0-2.3-.9-2.3-3.3z" />
		<path d="M13.8 5.9A3.3 3.3 0 0 0 14.6 3a3.6 3.6 0 0 0-2.4 1.2 3.2 3.2 0 0 0-.8 2.8 3 3 0 0 0 2.4-1.1z" />
	</svg>
);

export const AndroidIcon = (p) => (
	<svg {...base} {...p}>
		<path d="M4 16.5V13a8 8 0 0 1 16 0v3.5" />
		<path d="M4 16.5h16" />
		<path d="M7.5 7L6 4.6M16.5 7L18 4.6" />
		<path d="M9.2 11v.4M14.8 11v.4" />
	</svg>
);

export const TerminalIcon = (p) => (
	<svg {...base} {...p}>
		<rect x="2.5" y="4" width="19" height="16" rx="2.5" />
		<path d="M6.5 9.5L9 12l-2.5 2.5M12 15h5" />
	</svg>
);

export const CompassIcon = (p) => (
	<svg {...base} {...p}>
		<circle cx="12" cy="12" r="9" />
		<path d="M15.5 8.5l-2 5-5 2 2-5z" />
	</svg>
);

// ---- Per-link performance table -------------------------------------------
export const TrophyIcon = (p) => (
	<svg {...base} {...p}>
		<path d="M7 4h10v5a5 5 0 0 1-10 0z" />
		<path d="M7 5.5H4.5v1A3.5 3.5 0 0 0 8 10M17 5.5h2.5v1A3.5 3.5 0 0 1 16 10" />
		<path d="M12 14v3M9 20h6M10 17h4" />
	</svg>
);

export const SearchIcon = (p) => (
	<svg {...base} {...p}>
		<circle cx="11" cy="11" r="6.5" />
		<path d="M16 16l4 4" />
	</svg>
);

export const EyeIcon = (p) => (
	<svg {...base} {...p}>
		<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
		<circle cx="12" cy="12" r="2.8" />
	</svg>
);

export const ChainIcon = (p) => (
	<svg {...base} {...p}>
		<path d="M10 13.5a3.5 3.5 0 0 0 5 0l2.5-2.5a3.5 3.5 0 0 0-5-5L11 7.5" />
		<path d="M14 10.5a3.5 3.5 0 0 0-5 0L6.5 13a3.5 3.5 0 0 0 5 5l1.5-1.5" />
	</svg>
);

export const SortArrowIcon = (p) => (
	<svg {...base} {...p}>
		<path d="M12 5v14" />
		<path d="M6 13l6 6 6-6" />
	</svg>
);

export const ChevronLeftIcon = (p) => (
	<svg {...base} {...p}>
		<path d="M14 6l-6 6 6 6" />
	</svg>
);

export const ChevronRightIcon = (p) => (
	<svg {...base} {...p}>
		<path d="M10 6l6 6-6 6" />
	</svg>
);

export const ChevronsLeftIcon = (p) => (
	<svg {...base} {...p}>
		<path d="M12.5 6l-6 6 6 6M19 6l-6 6 6 6" />
	</svg>
);

export const ChevronsRightIcon = (p) => (
	<svg {...base} {...p}>
		<path d="M11.5 6l6 6-6 6M5 6l6 6-6 6" />
	</svg>
);

export const ClockIcon = (p) => (
	<svg {...base} {...p}>
		<circle cx="12" cy="12" r="9" />
		<path d="M12 7.5V12l3 2" />
	</svg>
);

export const FlameIcon = (p) => (
	<svg {...base} {...p}>
		<path d="M12 3c1 3-1.5 4.5-2.5 6.5C8.2 12 9 15 12 15s3.8-3 2.5-5.5C13.8 8 15 5 12 3z" />
		<path d="M12 15c-2.2 0-4 1.6-4 3.6C8 20.5 9.8 22 12 22s4-1.5 4-3.4c0-2-1.8-3.6-4-3.6z" />
	</svg>
);

// ---- Single-link view -----------------------------------------------------
export const CopyIcon = (p) => (
	<svg {...base} {...p}>
		<rect x="9" y="9" width="11" height="11" rx="2.5" />
		<path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
	</svg>
);

export const ExternalIcon = (p) => (
	<svg {...base} {...p}>
		<path d="M14 4h6v6" />
		<path d="M20 4l-8 8" />
		<path d="M19 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
	</svg>
);

export const CheckIcon = (p) => (
	<svg {...base} {...p}>
		<path d="M20 6L9 17l-5-5" />
	</svg>
);
