// Inline stroke icons (currentColor) for the redesigned Settings sidebar.
// Mirrors the Lucide-style stroke set used across the rest of the admin.

const base = {
	xmlns: 'http://www.w3.org/2000/svg',
	viewBox: '0 0 24 24',
	fill: 'none',
	stroke: 'currentColor',
	strokeWidth: 1.8,
	strokeLinecap: 'round',
	strokeLinejoin: 'round',
	'aria-hidden': 'true',
	focusable: 'false',
};

const Svg = ({ size = 18, children, ...rest }) => (
	<svg {...base} width={size} height={size} {...rest}>
		{children}
	</svg>
);

export const LinkIcon = (p) => (
	<Svg {...p}>
		<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
		<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
	</Svg>
);

export const RedirectIcon = (p) => (
	<Svg {...p}>
		<path d="M21 12a9 9 0 1 1-2.64-6.36" />
		<polyline points="21 3 21 9 15 9" />
	</Svg>
);

export const ChartIcon = (p) => (
	<Svg {...p}>
		<path d="M4 4v16h16" />
		<path d="m7 14 3-3 3 3 5-6" />
	</Svg>
);

export const BoltIcon = (p) => (
	<Svg {...p}>
		<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
	</Svg>
);

export const SparkIcon = (p) => (
	<Svg {...p}>
		<path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
		<path d="M12 8a4 4 0 0 0 4 4 4 4 0 0 0-4 4 4 4 0 0 0-4-4 4 4 0 0 0 4-4Z" />
	</Svg>
);

export const LayersIcon = (p) => (
	<Svg {...p}>
		<path d="m12 3 9 5-9 5-9-5 9-5Z" />
		<path d="m3 13 9 5 9-5" />
	</Svg>
);

export const TagIcon = (p) => (
	<Svg {...p}>
		<path d="M20.6 13.4 13 21a1.5 1.5 0 0 1-2.1 0L3 13V3h10l7.6 7.6a1.5 1.5 0 0 1 0 2.8Z" />
		<circle cx="8" cy="8" r="1.5" />
	</Svg>
);

export const PlusCircleIcon = (p) => (
	<Svg {...p}>
		<circle cx="12" cy="12" r="9" />
		<path d="M12 8v8M8 12h8" />
	</Svg>
);

export const DownloadIcon = (p) => (
	<Svg {...p}>
		<path d="M12 3v12" />
		<path d="m7 10 5 5 5-5" />
		<path d="M4 20h16" />
	</Svg>
);

export const GridIcon = (p) => (
	<Svg {...p}>
		<rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
		<rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
		<rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
		<rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
	</Svg>
);

export const UsersIcon = (p) => (
	<Svg {...p}>
		<path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20" />
		<circle cx="10" cy="8" r="3.2" />
		<path d="M20 20v-1.5a3.5 3.5 0 0 0-2.6-3.38" />
		<path d="M15.5 5.2a3.2 3.2 0 0 1 0 5.6" />
	</Svg>
);

export const KeyIcon = (p) => (
	<Svg {...p}>
		<circle cx="7.5" cy="15.5" r="3.5" />
		<path d="m10 13 8.5-8.5" />
		<path d="m15 7 2.5 2.5M18 4l2.5 2.5" />
	</Svg>
);

export const FieldsIcon = (p) => (
	<Svg {...p}>
		<rect x="3.5" y="5" width="17" height="5" rx="1.5" />
		<rect x="3.5" y="14" width="11" height="5" rx="1.5" />
	</Svg>
);

export const BoardIcon = (p) => (
	<Svg {...p}>
		<rect x="3.5" y="3.5" width="17" height="17" rx="2" />
		<path d="M9 4v16M15 4v10" />
	</Svg>
);

export const ChevronIcon = (p) => (
	<Svg {...p}>
		<polyline points="9 6 15 12 9 18" />
	</Svg>
);

export const MenuIcon = (p) => (
	<Svg {...p}>
		<path d="M4 7h16M4 12h16M4 17h16" />
	</Svg>
);

export const CheckIcon = (p) => (
	<Svg {...p}>
		<path d="m4 12.5 5 5L20 6.5" />
	</Svg>
);

export const CrownIcon = (p) => (
	<Svg {...p}>
		<path d="M3 7l4 4 5-7 5 7 4-4-2 12H5L3 7Z" />
	</Svg>
);

export const SaveIcon = (p) => (
	<Svg {...p}>
		<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
		<path d="M17 21v-8H7v8" />
		<path d="M7 3v5h8" />
	</Svg>
);

export const LockIcon = (p) => (
	<Svg {...p}>
		<rect x="4" y="10.5" width="16" height="10" rx="2" />
		<path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
	</Svg>
);

// Map used by the nav model so items can reference an icon by name.
export const ICONS = {
	'link-defaults': LinkIcon,
	redirects: RedirectIcon,
	tracking: ChartIcon,
	automation: BoltIcon,
	ai: SparkIcon,
	'custom-fields': FieldsIcon,
	'auto-post-generator': LayersIcon,
	'utm-builder': TagIcon,
	'quick-link-creation': PlusCircleIcon,
	'import-export': DownloadIcon,
	'feature-modules': GridIcon,
	'role-management': UsersIcon,
	license: KeyIcon,
	'fluent-boards': BoardIcon,
};
