const { __, sprintf, _n } = wp.i18n;
const { useState, useEffect, useRef, useMemo } = wp.element;
const { ToggleControl } = wp.components;

// Deterministic avatar background derived from the link title's first character,
// so the same link always renders the same colour across re-renders.
const AVATAR_PALETTE = ['#2563eb', '#7c3aed', '#0ea5e9', '#059669', '#db2777', '#ea580c', '#0891b2', '#4f46e5'];
const avatarColor = (str) => {
	const code = String(str || '?').toUpperCase().charCodeAt(0) || 0;
	return AVATAR_PALETTE[code % AVATAR_PALETTE.length];
};

const formatClicks = (clicks) => sprintf(_n('%d click', '%d clicks', clicks, 'betterlinks'), clicks);

// Small decorative upward-trend glyph shown next to the most-clicked link.
const Sparkline = () => (
	<svg className="btl-ls-sparkline" width="56" height="24" viewBox="0 0 56 24" aria-hidden="true" focusable="false">
		<polyline points="2,20 12,16 20,18 30,10 40,12 54,3" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

const WarningIcon = () => (
	<svg className="btl-ls-warn" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
		<path fill="currentColor" d="M12 2 1 21h22L12 2zm0 5 7.5 13h-15L12 7zm-1 4v4h2v-4h-2zm0 5v2h2v-2h-2z" />
	</svg>
);

// Brand sparkle tile (purple→blue gradient) shown in the modal header.
const BrandIcon = () => (
	<svg width="32" height="32" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
		<rect width="56" height="56" rx="8" fill="url(#paint0_linear_3802_4424)"/>
		<path d="M39.531 29.6771L43.6881 28.1782C44.0636 28.0441 44.0636 27.5106 43.6881 27.3765L39.531 25.8776C34.915 24.2147 31.2823 20.5821 29.6195 15.9661L28.1205 11.809C27.9864 11.4335 27.453 11.4335 27.3189 11.809L25.82 15.9661C24.1571 20.5821 20.5245 24.2147 15.9085 25.8776L11.7513 27.3765C11.3759 27.5106 11.3759 28.0441 11.7513 28.1782L15.9085 29.6771C20.5245 31.3399 24.1571 34.9726 25.82 39.5886L27.3189 43.7457C27.453 44.1212 27.9864 44.1212 28.1205 43.7457L29.6195 39.5886C31.2823 34.9726 34.915 31.3399 39.531 29.6771Z" fill="white"/>
		<defs>
		<linearGradient id="paint0_linear_3802_4424" x1="56" y1="0.500001" x2="5.5" y2="61" gradientUnits="userSpaceOnUse">
		<stop stop-color="#00E6FF"/>
		<stop offset="0.475839" stop-color="#AEA4FF"/>
		<stop offset="1" stop-color="#0847F9"/>
		</linearGradient>
		</defs>
	</svg>
);

// Plain close (×) glyph.
const CloseIcon = () => (
	<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
		<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
	</svg>
);

// Caret used by the footer "Options" toggle (rotates open via CSS).
const ChevronIcon = () => (
	<svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
		<path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

// Checkmark drawn inside the custom option checkboxes.
const CheckMark = () => (
	<svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
		<path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

// Square, accessible checkbox row used in the Options panel.
const CheckRow = ({ label, checked, onChange }) => (
	<label className="btl-ls-check">
		<input type="checkbox" className="btl-ls-check-input" checked={!!checked} onChange={onChange} />
		<span className="btl-ls-check-box" aria-hidden="true">
			<CheckMark />
		</span>
		<span className="btl-ls-check-label">{label}</span>
	</label>
);

// Trending-up glyph for the "Best match" badge.
const TrendIcon = () => (
	<svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
		<path d="M3 17l6-6 4 4 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
		<path d="M14 7h6v6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

// Chain-link glyph for the Insert button.
const LinkIcon = () => (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
		<path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		<path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

// Upgrade destination for the locked (free / Pro < 2.8.0) teaser state.
const UPGRADE_URL = 'https://wpdeveloper.com/in/upgrade-betterlinks';

// Static sample rows shown (dimmed) behind the locked teaser, so free users get a
// preview of what AI Link Suggestions look like before upgrading.
const LOCKED_SAMPLES = [
	{ key: 'sample-1', title: __('Best WordPress Plugins', 'betterlinks'), shortUrl: '/go/wp-plugins', clicks: 128 },
	{ key: 'sample-2', title: __('Affiliate Marketing Guide', 'betterlinks'), shortUrl: '/go/affiliate-guide', clicks: 86 },
	{ key: 'sample-3', title: __('SEO Checklist', 'betterlinks'), shortUrl: '/go/seo-checklist', clicks: 54 },
];

/**
 * "Link Suggestions" modal for the Generate Link flow. Presentational: it receives
 * already-relevance-matched BetterLinks and re-orders them by click count, surfaces
 * link health (broken links can't be inserted), and inserts the picked link via onSelect.
 *
 * @param {Object[]} suggestions  Enriched suggestion items: { key, title, shortUrl, clicks, isBroken, source, raw }.
 * @param {boolean}  isLoading    Whether the link catalogue is still being fetched/matched.
 * @param {Function} onSelect     Called with the chosen suggestion item when inserting.
 * @param {boolean}  linkNewTab    Current "open in new tab" preference.
 * @param {Function} setLinkNewTab Setter for the "open in new tab" preference.
 * @param {boolean}  noFollow      Current "mark as nofollow" preference.
 * @param {Function} setNoFollow   Setter for the "mark as nofollow" preference.
 * @param {boolean}  sponsored     Current "sponsored" preference.
 * @param {Function} setSponsored  Setter for the "sponsored" preference.
 * @param {boolean}  locked        Render a Pro-badged teaser (free / Pro < 2.8.0).
 */
const LinkSuggestion = ({
	suggestions = [],
	isLoading = false,
	onSelect,
	onClose,
	linkNewTab = false,
	setLinkNewTab,
	noFollow = false,
	setNoFollow,
	sponsored = false,
	setSponsored,
	locked = false,
}) => {
	const containerRef = useRef(null);
	const [showOptions, setShowOptions] = useState(false);

	// Broken links sink to the bottom and are never insertable; valid ones are
	// already ordered by clicks (see generateSuggestions in the format file).
	const insertable = useMemo(() => suggestions.filter((item) => !item.isBroken), [suggestions]);
	const topClicks = useMemo(() => (insertable.length ? Math.max(...insertable.map((i) => i.clicks || 0)) : 0), [insertable]);

	const [selectedKey, setSelectedKey] = useState(null);

	// Keep the highlighted row valid as the list changes; default to the best match.
	useEffect(() => {
		if (!insertable.length) {
			setSelectedKey(null);
			return;
		}
		const stillValid = insertable.some((item) => item.key === selectedKey);
		if (!stillValid) {
			setSelectedKey(insertable[0].key);
		}
	}, [insertable, selectedKey]);

	// The modal owns keyboard navigation, so grab focus when it mounts.
	useEffect(() => {
		containerRef?.current?.focus?.({ preventScroll: true });
	}, []);

	const selectedItem = insertable.find((item) => item.key === selectedKey) || null;

	const moveSelection = (direction) => {
		if (!insertable.length) return;
		const currentIndex = insertable.findIndex((item) => item.key === selectedKey);
		let nextIndex = currentIndex + direction;
		if (nextIndex < 0) nextIndex = insertable.length - 1;
		if (nextIndex > insertable.length - 1) nextIndex = 0;
		setSelectedKey(insertable[nextIndex].key);
	};

	const insertSelected = () => {
		if (selectedItem && onSelect) onSelect(selectedItem);
	};

	const handleKeyDown = (e) => {
		switch (e.key) {
			case 'ArrowUp':
				e.preventDefault();
				e.stopPropagation();
				moveSelection(-1);
				break;
			case 'ArrowDown':
				e.preventDefault();
				e.stopPropagation();
				moveSelection(1);
				break;
			case 'Enter':
				e.preventDefault();
				e.stopPropagation();
				insertSelected();
				break;
			default:
				break;
		}
	};

	// Locked teaser: free users / Pro < 2.8.0 see the modal with a Pro badge, a
	// dimmed preview of sample suggestions, and an upgrade call-to-action.
	if (locked) {
		return (
			<div ref={containerRef} className="btl-ls-modal btl-ls-modal--locked" tabIndex={-1}>
				<div className="btl-ls-header">
					<div className="btl-ls-brand">
						<span className="btl-ls-brand-icon">
							<BrandIcon />
						</span>
						<h3 className="btl-ls-title">
							{__('Link Suggestions', 'betterlinks')}
							<span className="btl-ls-pro">{__('Pro', 'betterlinks')}</span>
						</h3>
					</div>
					{onClose && (
						<button type="button" className="btl-ls-close" onClick={onClose} aria-label={__('Close', 'betterlinks')}>
							<CloseIcon />
						</button>
					)}
				</div>

				<ul className="btl-ls-list btl-ls-list--locked" aria-hidden="true">
					{LOCKED_SAMPLES.map((item) => {
						const letter = String(item.title || '?').trim().charAt(0).toUpperCase() || '?';
						return (
							<li key={item.key} className="btl-ls-item">
								<span className="btl-ls-avatar">
									<span className="btl-ls-avatar-circle" style={{ backgroundColor: avatarColor(letter) }}>
										{letter}
									</span>
								</span>
								<div className="btl-ls-body">
									<div className="btl-ls-row-title">
										<span className="btl-ls-name">{item.title}</span>
									</div>
									<div className="btl-ls-row-meta">
										<span className="btl-ls-meta">
											<span className="btl-ls-shorturl">{item.shortUrl}</span>
											<span className="btl-ls-dot-sep"> · </span>
											{formatClicks(item.clicks)}
										</span>
									</div>
								</div>
							</li>
						);
					})}
				</ul>

				<div className="btl-ls-locked-cta">
					<p className="btl-ls-locked-cta__text">
						{__('AI Link Assistant is available with BetterLinks Pro. Upgrade to unlock best‑match link suggestions.', 'betterlinks')}
					</p>
					<a className="btl-ls-upgrade" href={UPGRADE_URL} target="_blank" rel="noopener noreferrer">
						{__('Upgrade to PRO', 'betterlinks')}
					</a>
				</div>
			</div>
		);
	}

	return (
		<div ref={containerRef} className="btl-ls-modal" tabIndex={-1} onKeyDown={handleKeyDown}>
			<div className="btl-ls-header">
				<div className="btl-ls-brand">
					<span className="btl-ls-brand-icon">
						<BrandIcon />
					</span>
					<h3 className="btl-ls-title">{__('Link Suggestions', 'betterlinks')}</h3>
				</div>
				{onClose && (
					<button type="button" className="btl-ls-close" onClick={onClose} aria-label={__('Close', 'betterlinks')}>
						<CloseIcon />
					</button>
				)}
			</div>

			{isLoading ? (
				<div className="btl-ls-loading">
					<span className="btl-ls-spinner" aria-hidden="true"></span>
					<span>{__('Finding the best links…', 'betterlinks')}</span>
				</div>
			) : suggestions.length === 0 ? (
				<div className="btl-ls-empty">{__('No matching links found for this selection.', 'betterlinks')}</div>
			) : (
				<>
					<ul className="btl-ls-list">
						{suggestions.map((item) => {
							const isSelected = !item.isBroken && item.key === selectedKey;
							const isMostClicked = !item.isBroken && (item.clicks || 0) > 0 && (item.clicks || 0) === topClicks;
							const letter = String(item.title || '?').trim().charAt(0).toUpperCase() || '?';

							return (
								<li
									key={item.key}
									className={`btl-ls-item${isSelected ? ' is-selected' : ''}${item.isBroken ? ' is-broken' : ''}`}
									onClick={() => {
										if (item.isBroken) return;
										setSelectedKey(item.key);
									}}
									onDoubleClick={() => {
										if (!item.isBroken && onSelect) onSelect(item);
									}}
								>
									<span className="btl-ls-avatar">
										<span className="btl-ls-avatar-circle" style={{ backgroundColor: avatarColor(letter) }}>
											{letter}
										</span>
									</span>

									<div className="btl-ls-body">
										<div className="btl-ls-row-title">
											<span className="btl-ls-name">{item.title}</span>
											{isMostClicked && (
												<span className="btl-ls-badge">{__('Best Match', 'betterlinks')}</span>
											)}
										</div>
										<div className="btl-ls-row-meta">
											{item.isBroken ? (
												<span className="btl-ls-meta btl-ls-meta--broken">
													<WarningIcon />
													{__("broken (404) — won't insert", 'betterlinks')}
												</span>
											) : (
												<span className="btl-ls-meta">
													<span className="btl-ls-shorturl">{item.shortUrl}</span>
													<span className="btl-ls-dot-sep"> · </span>
													{formatClicks(item.clicks || 0)}
												</span>
											)}
										</div>
									</div>

									{!item.isBroken && (
										<button
											type="button"
											className={`btl-ls-enter${isSelected ? ' is-active' : ''}`}
											aria-label={__('Insert this link', 'betterlinks')}
											onClick={(e) => {
												e.stopPropagation();
												if (onSelect) onSelect(item);
											}}
										>
											↵
										</button>
									)}
								</li>
							);
						})}
					</ul>

					{showOptions && (
						<div className="btl-ls-options-panel">
							<CheckRow
								label={__('Open in new tab', 'betterlinks')}
								checked={!!linkNewTab}
								onChange={() => setLinkNewTab && setLinkNewTab(!linkNewTab)}
							/>
							<CheckRow
								label={__('Mark as nofollow', 'betterlinks')}
								checked={!!noFollow}
								onChange={() => setNoFollow && setNoFollow(!noFollow)}
							/>
							<CheckRow
								label={__('Sponsored', 'betterlinks')}
								checked={!!sponsored}
								onChange={() => setSponsored && setSponsored(!sponsored)}
							/>
						</div>
					)}

					<div className="btl-ls-footer">
						<button
							type="button"
							className={`btl-ls-options${showOptions ? ' is-open' : ''}`}
							onClick={() => setShowOptions((prev) => !prev)}
						>
							{__('Options', 'betterlinks')}
							<ChevronIcon />
						</button>
						<button type="button" className="btl-ls-insert" disabled={!selectedItem} onClick={insertSelected}>
							{__('Insert link', 'betterlinks')}
						</button>
					</div>
				</>
			)}
		</div>
	);
};

export default LinkSuggestion;
