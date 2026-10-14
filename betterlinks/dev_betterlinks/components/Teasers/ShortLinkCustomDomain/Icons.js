// Inline stroke icons (currentColor) for the Custom Domain teaser.
// Mirrors the icon set used by the redesigned Pro Custom Domain screen.

const base = {
	xmlns: 'http://www.w3.org/2000/svg',
	viewBox: '0 0 24 24',
	fill: 'none',
	stroke: 'currentColor',
	strokeWidth: 2,
	strokeLinecap: 'round',
	strokeLinejoin: 'round',
	'aria-hidden': 'true',
	focusable: 'false',
};

export const GlobeIcon = (props) => (
	<svg {...base} width={props?.size || 24} height={props?.size || 24}>
		<circle cx="12" cy="12" r="9" />
		<path d="M3 12h18" />
		<path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18Z" />
	</svg>
);

export const ExternalIcon = (props) => (
	<svg {...base} width={props?.size || 16} height={props?.size || 16}>
		<path d="M14 4h6v6" />
		<path d="M20 4 11 13" />
		<path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
	</svg>
);

export const CheckIcon = (props) => (
	<svg {...base} width={props?.size || 16} height={props?.size || 16}>
		<path d="m4 12.5 5 5L20 6.5" />
	</svg>
);

export const CopyIcon = (props) => (
	<svg {...base} width={props?.size || 16} height={props?.size || 16}>
		<rect x="9" y="9" width="11" height="11" rx="2" />
		<path d="M15 5.5A1.5 1.5 0 0 0 13.5 4H6a2 2 0 0 0-2 2v7.5A1.5 1.5 0 0 0 5.5 15" />
	</svg>
);

export const PlusIcon = (props) => (
	<svg {...base} width={props?.size || 16} height={props?.size || 16}>
		<path d="M12 5v14" />
		<path d="M5 12h14" />
	</svg>
);

export const BoltIcon = (props) => (
	<svg {...base} width={props?.size || 16} height={props?.size || 16}>
		<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
	</svg>
);

export const SaveIcon = (props) => (
	<svg {...base} width={props?.size || 16} height={props?.size || 16}>
		<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
		<path d="M17 21v-8H7v8" />
		<path d="M7 3v5h8" />
	</svg>
);

export const LockIcon = (props) => (
	<svg {...base} width={props?.size || 16} height={props?.size || 16}>
		<rect x="4" y="10.5" width="16" height="10" rx="2" />
		<path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
	</svg>
);

export const AlertIcon = (props) => (
	<svg {...base} width={props?.size || 16} height={props?.size || 16}>
		<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
		<path d="M12 9v4" />
		<path d="M12 17h.01" />
	</svg>
);

export const InfoIcon = (props) => (
	<svg {...base} width={props?.size || 16} height={props?.size || 16}>
		<circle cx="12" cy="12" r="9" />
		<path d="M12 16v-4" />
		<path d="M12 8h.01" />
	</svg>
);

export const ServerIcon = (props) => (
	<svg {...base} width={props?.size || 16} height={props?.size || 16}>
		<rect x="3" y="4" width="18" height="7" rx="2" />
		<rect x="3" y="13" width="18" height="7" rx="2" />
		<path d="M7 7.5h.01" />
		<path d="M7 16.5h.01" />
	</svg>
);

export const ArrowRightIcon = (props) => (
	<svg {...base} width={props?.size || 16} height={props?.size || 16}>
		<path d="M4 12h15" />
		<path d="m13 6 6 6-6 6" />
	</svg>
);

// WordPress mark — filled, so it opts out of the shared stroke config.
export const WordPressIcon = (props) => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={props?.size || 16} height={props?.size || 16} fill="currentColor" aria-hidden="true" focusable="false">
		<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 1.4a8.6 8.6 0 0 1 4.6 1.35h-.3c-.6 0-1.03.52-1.03 1.08 0 .5.3.93.6 1.43.24.4.5.92.5 1.67 0 .52-.15 1.2-.5 2.1l-.65 2.16-2.35-6.98c.4-.02.75-.06.75-.06.35-.04.3-.55-.04-.53 0 0-1.05.08-1.73.08-.64 0-1.72-.08-1.72-.08-.35-.02-.4.5-.04.53 0 0 .32.04.68.06l.98 2.7-1.38 4.14-2.3-6.84c.4-.02.75-.06.75-.06.35-.04.3-.55-.04-.53 0 0-1.05.08-1.73.08l-.4-.01A8.6 8.6 0 0 1 12 3.4ZM4.6 7.9l3.93 10.77A8.6 8.6 0 0 1 4.6 7.9Zm7.6 4.72 1.98 5.43c.02.04.04.07.06.1a8.63 8.63 0 0 1-4.6-.12l2.56-5.4Zm5.3-3.1c.13.44.2.92.2 1.44 0 .72-.13 1.52-.53 2.53l-1.75 5.05a8.6 8.6 0 0 0 2.1-9.02Z" />
	</svg>
);
