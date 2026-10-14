/**
 * Shared icons for the MCP screen.
 *
 * Line icons drawn on the same 24x24 grid and 1.8 stroke as the rest of the
 * BetterLinks admin (see Settings/Icons.js), so the MCP page sits in the same
 * visual family instead of importing a second icon style.
 */

const Svg = ({ size = 18, children, ...props }) => (
	<svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
		{children}
	</svg>
);

// Official Model Context Protocol mark (nested arcs), stroked to match.
export const McpIcon = ({ size = 22 }) => (
	<svg viewBox="0 0 195 195" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<path d="M25 97.85 92.88 29.97c9.37-9.37 24.57-9.37 33.94 0 9.38 9.37 9.38 24.57 0 33.94L75.56 115.18" />
		<path d="M76.27 114.47l50.55-50.56c9.37-9.37 24.57-9.37 33.95 0 9.37 9.38 9.37 24.58 0 33.95l-61.78 61.78c-2.34 2.34-2.34 6.13 0 8.47l19.34 19.35" />
		<path d="M109.85 46.94 59.29 97.5c-9.37 9.37-9.37 24.57 0 33.94 9.38 9.38 24.58 9.38 33.95 0l51.25-51.26" />
	</svg>
);

export const CheckIcon = ({ size = 13 }) => (
	<Svg size={size} strokeWidth="2.5">
		<polyline points="20 6 9 17 4 12" />
	</Svg>
);

export const ChevronIcon = ({ size = 16, open = false }) => (
	<Svg size={size} strokeWidth="2.2" style={{ transition: 'transform 150ms ease', transform: open ? 'rotate(180deg)' : 'none' }}>
		<polyline points="6 9 12 15 18 9" />
	</Svg>
);

export const CopyIcon = ({ size = 14 }) => (
	<Svg size={size}>
		<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
		<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
	</Svg>
);

export const ExternalIcon = ({ size = 13 }) => (
	<Svg size={size}>
		<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
		<polyline points="15 3 21 3 21 9" />
		<line x1="10" y1="14" x2="21" y2="3" />
	</Svg>
);

export const RefreshIcon = ({ size = 15 }) => (
	<Svg size={size}>
		<polyline points="23 4 23 10 17 10" />
		<polyline points="1 20 1 14 7 14" />
		<path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
	</Svg>
);

export const PlayIcon = ({ size = 15 }) => (
	<Svg size={size}>
		<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
		<polyline points="22 4 12 14.01 9 11.01" />
	</Svg>
);

export const PlugIcon = ({ size = 18 }) => (
	<Svg size={size}>
		<path d="M12 22v-5" />
		<path d="M9 8V2" />
		<path d="M15 8V2" />
		<path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z" />
	</Svg>
);

export const TrashIcon = ({ size = 15 }) => (
	<Svg size={size}>
		<polyline points="3 6 5 6 21 6" />
		<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
		<line x1="10" y1="11" x2="10" y2="17" />
		<line x1="14" y1="11" x2="14" y2="17" />
	</Svg>
);

export const SpinnerIcon = ({ size = 15 }) => (
	<Svg size={size} strokeWidth="2.5" className="bl-mcp-spin">
		<path d="M21 12a9 9 0 1 1-6.219-8.56" />
	</Svg>
);

/* -------------------------------------------------------------- client marks */

// Claude's radiating sunburst (Anthropic).
export const ClaudeIcon = ({ size = 18 }) => (
	<Svg size={size} strokeWidth="2">
		<path d="M12 12L20.5 12M12 12L19.15 7.4M12 12L15.53 4.26M12 12L10.79 3.58M12 12L6.44 5.57M12 12L3.85 9.59M12 12L3.85 14.41M12 12L6.44 18.43M12 12L10.79 20.42M12 12L15.53 19.74M12 12L19.15 16.6" />
	</Svg>
);

// OpenAI / ChatGPT logomark — filled, so it can't use the stroked Svg frame.
export const ChatGptIcon = ({ size = 18 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
		<path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.1419.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997z" />
	</svg>
);

export const CursorIcon = ({ size = 18 }) => (
	<Svg size={size}>
		<path d="M4 3l16 7-6.6 2.4L11 20 4 3z" />
	</Svg>
);

export const CodeIcon = ({ size = 18 }) => (
	<Svg size={size}>
		<polyline points="16 18 22 12 16 6" />
		<polyline points="8 6 2 12 8 18" />
	</Svg>
);

export const SparkIcon = ({ size = 18 }) => (
	<Svg size={size}>
		<path d="M12 3v18M3 12h18M6.3 6.3l11.4 11.4M17.7 6.3L6.3 17.7" />
	</Svg>
);
