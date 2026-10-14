import React from 'react';

/**
 * Central SVG icon set. Paste new hand-authored SVGs here as small components.
 *
 * Conventions:
 * - Icons stroke with `currentColor` so they inherit text colour + theme.
 * - Accept a `size` prop (defaults to 24) to scale; extra props are spread onto
 *   the <svg> (e.g. className, style, aria-label).
 * - Remember to convert SVG attributes to JSX/camelCase (stroke-width →
 *   strokeWidth, stroke-linecap → strokeLinecap, etc.).
 */

export const QRCodeIcon = ({ size = 24, ...props }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" {...props}  fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"> <rect x="3" y="3" width="7" height="7" rx="1" /> <rect x="14" y="3" width="7" height="7" rx="1" /> <rect x="3" y="14" width="7" height="7" rx="1" /> <path d="M14 14h3v3M21 14v3M17 17v4h4v-4M14 21h0" /> </svg>
);
export const LinkEditIcon = ({ size = 24, ...props }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" {...props} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"></path></svg>
);
export const LinkViewIcon = ({ size = 24, ...props }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" {...props} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);
export const LinkDeleteIcon = ({ size = 24, ...props }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" {...props} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path></svg>
);
// Carries a plus so it can't be mistaken for the copy-to-clipboard action that
// sits beside it on the board card.
export const LinkDulicateIcon = ({ size = 24, ...props }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" {...props} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"></rect><path d="M5 15V5a2 2 0 0 1 2-2h10"></path><path d="M14.5 12.5v4"></path><path d="M12.5 14.5h4"></path></svg>
);
export const AnalyticsIcon = ({ size = 24, ...props }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" {...props} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"></path><rect x="7" y="11" width="3" height="6" rx="1"></rect><rect x="12" y="7" width="3" height="10" rx="1"></rect><rect x="17" y="13" width="3" height="4" rx="1"></rect></svg>
);
// export const LinkDeleteIcon = ({ size = 24, ...props }) => (

// );
