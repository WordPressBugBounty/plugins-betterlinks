// wordpress imports
const { __ } = wp.i18n;
const { applyFormat, removeFormat, create, insert, isCollapsed } = wp.richText;
const { useState, useEffect, useRef, useMemo } = wp.element;
const { Popover, ToggleControl, ToolbarGroup, ToolbarDropdownMenu } = wp.components;
const { BlockControls, URLPopover, RichTextShortcut } = wp.blockEditor;
const { UP, DOWN, ENTER } = wp.keycodes;

// external library imports
import reactStringReplace from 'react-string-replace';
import { Provider } from 'react-redux';

// redux imports
import { betterlinksGutenStore } from 'redux/gutenbergStore';
import { fetch_links_data, add_new_link, edit_link } from 'redux/actions/links.actions';
import { fetch_terms_data } from 'redux/actions/terms.actions';
import { fetch_settings_data } from 'redux/actions/settings.actions';

// local imports
import { LoadingSpinner, LinkSuggestion } from 'gutenberg/components';
import { betterlinksIcon } from './icon';
import { is_pro_enabled, pro_version_check, makeLinkFormat, site_url as site_link } from 'utils/helper';
import { LinkPreview } from './linkPreview';
import { Link } from 'containers/Link';

const name = 'betterlinks/link-format';
const title = __('BetterLinks');

const site_url = is_pro_enabled && localStorage.getItem('btl_custom_domain') ? localStorage.getItem('btl_custom_domain') : site_link;

// The in-editor "Generate Link" → AI Link Suggestions feature ships in BetterLinks
// Pro 2.8.0+. Free users and older Pro builds see a locked, Pro-badged teaser.
const LINK_GENIUS_MIN_PRO = '2.8.0';
const linkGeniusUnlocked = is_pro_enabled && pro_version_check(LINK_GENIUS_MIN_PRO);

// Returns the bounding rectangle of the current text selection in top-window
// (viewport) coordinates. The block editor canvas is rendered inside an iframe in
// WP 6.3+, so the live selection lives in the iframe's document — reading only
// `window.getSelection()` from the top frame returns nothing and the popover ends up
// mis-positioned (centered). We probe same-origin iframes first and offset their
// rect by the iframe's own position, then fall back to the top window.
const getEditorSelectionRect = () => {
	const frames = [];
	const docFrames = (() => {
		try {
			return Array.from(document.querySelectorAll('iframe'));
		} catch (e) {
			return [];
		}
	})();
	for (const iframe of docFrames) {
		try {
			if (iframe.contentWindow && iframe.contentDocument) {
				frames.push({ win: iframe.contentWindow, iframe });
			}
		} catch (e) {
			// cross-origin iframe — not accessible, skip
		}
	}
	frames.push({ win: window, iframe: null });

	for (const { win, iframe } of frames) {
		const selection = win.getSelection && win.getSelection();
		if (!selection || selection.rangeCount < 1) continue;
		const range = selection.getRangeAt(0);
		if (!range || range.collapsed) continue;
		const rect = range.getBoundingClientRect();
		if (!rect || (!rect.width && !rect.height && !rect.top && !rect.left)) continue;
		if (iframe) {
			const fr = iframe.getBoundingClientRect();
			return {
				top: rect.top + fr.top,
				bottom: rect.bottom + fr.top,
				left: rect.left + fr.left,
				right: rect.right + fr.left,
				width: rect.width,
				height: rect.height,
				x: rect.left + fr.left,
				y: rect.top + fr.top,
			};
		}
		return rect;
	}
	return null;
};

// Captures the current non-collapsed editor selection as a *live* anchor: a cloned
// Range plus the iframe it lives in. Unlike a frozen rectangle, a Range keeps
// reporting its real viewport position via getBoundingClientRect() as the editor
// scrolls, so a popover anchored to it follows the selected text. Mirrors the
// iframe-probing of getEditorSelectionRect (WP 6.3+ canvas is iframed).
const captureSelectionRange = () => {
	const docFrames = (() => {
		try {
			return Array.from(document.querySelectorAll('iframe'));
		} catch (e) {
			return [];
		}
	})();
	const frames = [];
	for (const iframe of docFrames) {
		try {
			if (iframe.contentWindow && iframe.contentDocument) {
				frames.push({ win: iframe.contentWindow, iframe });
			}
		} catch (e) {
			// cross-origin iframe — skip
		}
	}
	frames.push({ win: window, iframe: null });

	for (const { win, iframe } of frames) {
		const selection = win.getSelection && win.getSelection();
		if (!selection || selection.rangeCount < 1) continue;
		const range = selection.getRangeAt(0);
		if (!range || range.collapsed) continue;
		const rect = range.getBoundingClientRect();
		if (!rect || (!rect.width && !rect.height && !rect.top && !rect.left)) continue;
		return { range: range.cloneRange(), iframe };
	}
	return null;
};

// Wraps a captured selection range in a virtual element for Popover's `anchor`
// prop. getBoundingClientRect() is read live by floating-ui every frame
// (autoUpdate animationFrame), so the popover tracks the text while scrolling.
// Coordinates are returned in top-window space (this Popover build applies no
// iframe frame-offset), with a frozen-rect fallback if the range goes stale.
const buildRangeAnchor = (captured, fallbackRect) => {
	if (!captured || !captured.range) return null;
	const { range, iframe } = captured;
	return {
		getBoundingClientRect() {
			const r = range.getBoundingClientRect();
			const empty = !r || (!r.width && !r.height && !r.top && !r.left);
			if (empty && fallbackRect) {
				const left = fallbackRect.left != null ? fallbackRect.left : fallbackRect.x || 0;
				const top = fallbackRect.top != null ? fallbackRect.top : fallbackRect.y || 0;
				return new window.DOMRect(left, top, fallbackRect.width || 0, fallbackRect.height || 0);
			}
			if (iframe) {
				const fr = iframe.getBoundingClientRect();
				return new window.DOMRect(r.left + fr.left, r.top + fr.top, r.width, r.height);
			}
			return new window.DOMRect(r.left, r.top, r.width, r.height);
		},
	};
};

export const betterlinksFormat = {
	name,
	title,
	tagName: 'a',
	className: 'betterlinks-linked-text',
	attributes: {
		url: 'href',
		target: 'target',
		rel: 'rel',
		dataLinkId: 'data-link-id',
	},
	edit: (props) => {
		const { isActive, value, onChange, activeAttributes } = props;
		const [isVisible, setIsVisible] = useState(false);
		const [searchedText, setSearchedText] = useState('');
		const [matchedLinks, setMatchedLinks] = useState([]);
		const [wpResults, setWpResults] = useState([]);
		const [isGenerateLinkMode, setIsGenerateLinkMode] = useState(false);
		const [isGenerating, setIsGenerating] = useState(false);
		const [isSearchingWp, setIsSearchingWp] = useState(false);
		const [selectedIndex, setSelectedIndex] = useState(null);
		const [regex, setRegex] = useState(false);
		const [linkNewTab, setLinkNewTab] = useState(false);
		// Link Suggestions modal options — applied to the inserted link's rel attribute.
		const [noFollow, setNoFollow] = useState(false);
		const [sponsored, setSponsored] = useState(false);
		const [submitDone, setSubmitDone] = useState(false);
		const [isLinkInvalid, setIsLinkInvalid] = useState(false);
		const [showLinkModal, setShowLinkModal] = useState(false);
		const [isChangeLink, setIsChangeLink] = useState(false);
		const [linkData, setLinkData] = useState(null);
		//👇 this state is only for the '<Link />' component's gutenberg implementation
		const [isSubmittingForGutenberg, setIsSubmittingForGutenberg] = useState(false);
		const [insertedLinkData, setInsertedLinkData] = useState(null);

		const matchedLinksUl = useRef(null);
		const searchFieldRef = useRef(null);
		// Holds the selection rectangle frozen at the moment Generate Link is clicked,
		// so the suggestions modal stays anchored below the originally-selected text
		// even after focus moves into the modal (which clears the DOM text selection).
		const generateRectRef = useRef(null);
		// Live-anchor counterparts of the rect refs above: cloned selection Ranges that
		// keep reporting their viewport position so the popover follows the text on scroll.
		const generateRangeRef = useRef(null);
		const lastSelectionRangeRef = useRef(null);
		// Continuously remembers the rectangle of the current non-collapsed editor
		// selection. By the time Generate Link is clicked the toolbar dropdown has already
		// taken focus and the live DOM selection is gone, so we rely on this last-known
		// good rectangle (captured while the text was still actively selected).
		const lastSelectionRectRef = useRef(null);

		useEffect(() => {
			if (isCollapsed(value)) return;
			const rect = getEditorSelectionRect();
			if (rect) {
				lastSelectionRectRef.current = rect;
			}
			const captured = captureSelectionRange();
			if (captured) {
				lastSelectionRangeRef.current = captured;
			}
		}, [value.start, value.end]);

		useEffect(() => {
			const matchedLinksDomUl = matchedLinksUl?.current;
			if (!matchedLinksDomUl && selectedIndex === null) return () => {};

			const allLi = matchedLinksDomUl.querySelectorAll(`li`);
			for (const item of allLi) {
				item.classList.remove('active');
			}
			const selectedLi = matchedLinksDomUl.querySelector(`li.betterlinks-suggessted-link-li-${selectedIndex}`);
			if (!selectedLi) return () => {};
			selectedLi.classList.add('active');

			// to scroll to the selected item
			// when number of matched items are
			// too much to fit inside the screen
			// ---start---
			const scrollableFoundItems = matchedLinksDomUl.closest('.betterlinks-suggession-popover .components-popover__content');
			if (!scrollableFoundItems) return () => {};
			const offsetTopOfTheLi = selectedLi?.offsetTop;
			scrollableFoundItems.scrollTop = offsetTopOfTheLi;
			// ---END---
		}, [selectedIndex]);

		useEffect(() => {
			if ((isVisible && !isActive) || isChangeLink) {
				searchFieldRef?.current?.focus({ preventScroll: true });
			}
			if (isVisible || isActive) {
				document.body.classList.add('betterlinks-formatting-enabled');
			} else {
				document.body.classList.remove('betterlinks-formatting-enabled');
			}
			return () => {
				document.body.classList.remove('betterlinks-formatting-enabled');
			};
		}, [isVisible, isActive, isChangeLink]);

		useEffect(() => {
			setSelectedIndex(null);
		}, [matchedLinks]);

		useEffect(() => {
			return () => {
				close();
			};
		}, [value.start, value.end]);

		useEffect(() => {
			const { dataLinkId, url = '' } = activeAttributes;
			let foundLink = (betterlinksGutenStore?.getState()?.links?.links || []).find((item) => item.ID === dataLinkId);

			if (!foundLink && !url.startsWith(site_url)) {
				foundLink = (betterlinksGutenStore?.getState()?.links?.links || []).find((item) => item.target_url === url);
			}
			setInsertedLinkData(foundLink);

			return () => {
				setInsertedLinkData(null);
			};
		}, [activeAttributes]);

		const onClick = () => {
			setIsVisible(true);
			if (!betterlinksGutenStore?.getState()?.links?.links) {
				fetch_links_data(true)(betterlinksGutenStore.dispatch)
					.then(() => {})
					.catch((err) => console.log('error!! failed fetching links', err));
			}
			const settings = betterlinksGutenStore?.getState()?.settings?.settings;
			if (!settings) {
				fetch_settings_data()(betterlinksGutenStore.dispatch)
					.then(() => {})
					.catch((err) => console.log('error!! failed fetching betterlinks Settings data', err));
			}
			if (!betterlinksGutenStore?.getState()?.terms?.terms) {
				fetch_terms_data()(betterlinksGutenStore.dispatch)
					.then(() => {})
					.catch((err) => console.log('error!! failed fetching betterlinks terms data', err));
			}
		};

		const searchLinksByText = (text) => {
			const trimmed = (text || '').trim();
			setSearchedText(trimmed);

			// Tokenize: lowercase, strip punctuation, drop stopwords and very short tokens.
			const stopwords = new Set([
				'a','an','and','are','as','at','be','but','by','can','for','from','had','has','have','he','her','his','how','if','in','is','it','its','of','on','or','our','so','than','that','the','their','then','there','they','this','to','was','we','were','what','when','where','which','who','why','will','with','you','your',
			]);
			const rawWords = trimmed
				.toLowerCase()
				.replace(/[^\w\s]/g, ' ')
				.split(/\s+/)
				.filter((w) => w.length > 1 && !stopwords.has(w));

			if (rawWords.length === 0) {
				setMatchedLinks([]);
				setWpResults([]);
				setRegex(false);
				setIsLinkInvalid(false);
				return;
			}

			// Crude English stem: strip common plural suffixes so "environments" matches "environment".
			const stems = Array.from(new Set(rawWords.map((w) => w.replace(/(ies|es|s)$/i, ''))));
			const escapedStems = stems.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
			const matcherPattern = escapedStems.map((s) => `\\b${s}\\w*`).join('|');
			const highlightRegex = new RegExp(`(${matcherPattern})`, 'gi');

			// Score BetterLinks by number of distinct stem matches and sort by relevance.
			const allLinks = betterlinksGutenStore?.getState()?.links?.links || [];
			const scored = [];
			for (const item of allLinks) {
				const haystack = `${item.link_title || ''} ${item.target_url || ''} ${item.short_url || ''}`;
				let score = 0;
				for (const s of escapedStems) {
					if (new RegExp(`\\b${s}`, 'i').test(haystack)) score++;
				}
				if (score > 0) scored.push({ item, score });
			}
			scored.sort((a, b) => b.score - a.score);
			const matched = scored.map((s) => s.item);

			setRegex(highlightRegex);
			setMatchedLinks(matched);

			// Query each stem against /wp/v2/search separately, then merge by id.
			// This guarantees any post matching ANY token appears, even if the original phrase wouldn't match as a whole.
			if (wp?.apiFetch) {
				setIsSearchingWp(true);
				const queries = stems.slice(0, 5);
				Promise.all(
					queries.map((q) =>
						wp
							.apiFetch({ path: `/wp/v2/search?search=${encodeURIComponent(q)}&per_page=10` })
							.catch(() => [])
					)
				)
					.then((all) => {
						const seen = new Map();
						all.forEach((arr) => {
							if (Array.isArray(arr)) {
								arr.forEach((r) => {
									if (r && r.id != null && !seen.has(r.id)) seen.set(r.id, r);
								});
							}
						});
						const list = Array.from(seen.values());
						setWpResults(list);
						setIsSearchingWp(false);
						setIsLinkInvalid(matched.length === 0 && list.length === 0);
					})
					.catch(() => {
						setWpResults([]);
						setIsSearchingWp(false);
						setIsLinkInvalid(matched.length === 0);
					});
			} else {
				setIsLinkInvalid(matched.length === 0);
			}
		};

		const onGenerateLinkClick = () => {
			const selectedText = (value?.text || '').slice(value.start, value.end).trim();
			if (!selectedText) return;

			// Existing Pro users on an older build (< 2.8.0) already own Pro, so an
			// "Upgrade" upsell is the wrong message — just toast them to update, and
			// don't open the modal at all.
			if (!linkGeniusUnlocked && is_pro_enabled) {
				wp.data
					?.dispatch?.('core/notices')
					?.createNotice?.(
						'warning',
						__('Link Suggestions requires BetterLinks Pro 2.8.0 or greater. Please update BetterLinks Pro to use it.', 'betterlinks'),
						{ type: 'snackbar', isDismissible: true }
					);
				return;
			}

			// Anchor the modal below the selected text. Prefer the rectangle captured while
			// the text was actively selected (the dropdown has since taken focus and cleared
			// the DOM selection); fall back to a live read only if that isn't available.
			generateRectRef.current = lastSelectionRectRef.current || getEditorSelectionRect();
			// Live range anchor so the modal tracks the selection as the editor scrolls.
			generateRangeRef.current = lastSelectionRangeRef.current || captureSelectionRange();

			setIsGenerateLinkMode(true);
			setIsVisible(true);

			// Locked free users (no Pro): open the modal as a Pro-badged teaser — no
			// search, no real suggestions; the modal shows the upsell instead.
			if (!linkGeniusUnlocked) {
				setIsGenerating(false);
				return;
			}

			setIsGenerating(true);

			const runSearch = () => {
				searchLinksByText(selectedText);
				setIsGenerating(false);
			};
			if (!betterlinksGutenStore?.getState()?.links?.links) {
				fetch_links_data(true)(betterlinksGutenStore.dispatch)
					.then(runSearch)
					.catch((err) => {
						console.log('error!! failed fetching links', err);
						runSearch();
					});
			} else {
				runSearch();
			}

			const settings = betterlinksGutenStore?.getState()?.settings?.settings;
			if (!settings) {
				fetch_settings_data()(betterlinksGutenStore.dispatch)
					.then(() => {})
					.catch((err) => console.log('error!! failed fetching betterlinks Settings data', err));
			}
			if (!betterlinksGutenStore?.getState()?.terms?.terms) {
				fetch_terms_data()(betterlinksGutenStore.dispatch)
					.then(() => {})
					.catch((err) => console.log('error!! failed fetching betterlinks terms data', err));
			}
		};

		const insertBetterLinkDirect = (foundLink) => {
			const inputUrl = '1' === foundLink?.uncloaked ? foundLink.target_url : `${site_url}/${foundLink.short_url}`;
			const withHttp = /^https?\:\/\//i.test(inputUrl) ? inputUrl : `http://${inputUrl}`;
			setInsertedLinkData(foundLink);
			const linkFormat = makeLinkFormat({
				url: withHttp,
				linkNewTab,
				// Honor the modal toggles, falling back to the link's own saved settings.
				sponsored: sponsored || !!foundLink?.sponsored,
				noFollow: noFollow || !!foundLink?.nofollow,
				linkId: foundLink?.ID,
			});
			onChange(applyFormat(value, linkFormat));
			reset();
			setSubmitDone(true);
			setIsChangeLink(false);
		};

		const insertWpLinkDirect = (item) => {
			const url = item?.url;
			if (!url) return;
			const attributes = { url };
			let rel = '';
			if (linkNewTab) {
				attributes.target = '_blank';
				rel += 'noopener ';
			}
			if (sponsored) rel += 'sponsored ';
			if (noFollow) rel += 'nofollow noindex ';
			if (rel) attributes.rel = rel.trim();
			onChange(applyFormat(value, { type: 'core/link', attributes }));
			reset();
			setSubmitDone(true);
			setIsChangeLink(false);
		};

		const removeBtlFormat = (value) => {
			onChange(removeFormat(value, name));
		};

		const reset = () => {
			setSearchedText('');
			setMatchedLinks([]);
			setWpResults([]);
			setSelectedIndex(null);
			setIsLinkInvalid(false);
		};

		const close = () => {
			reset();
			setIsVisible(false);
			setSubmitDone(false);
			setIsChangeLink(false);
			setLinkNewTab(false);
			setNoFollow(false);
			setSponsored(false);
			setIsSubmittingForGutenberg(false);
			setLinkData(null);
			setIsGenerateLinkMode(false);
			setIsGenerating(false);
			setIsSearchingWp(false);
			generateRectRef.current = null;
			generateRangeRef.current = null;
		};

		const handleSubmit = (e) => {
			e.preventDefault();
			const newText = searchedText.trim();
			//👇 if statement scenario: the search filed is empty then return
			if (!newText) {
				return false;
			}
			const siteUrlWithoutHttp = site_url.replace(/https?\:\/\//, '').toLowerCase();
			const siteUrlRegex = new RegExp(siteUrlWithoutHttp, 'gi');
			const justShortlink = newText
				.replace(/https?\:\/\//g, '')
				.replace(siteUrlRegex, '')
				.replace(/\/+$/, '')
				.replace(/^\/+/, '');
			const foundLink = (betterlinksGutenStore?.getState()?.links?.links || []).find((item) => item.short_url === justShortlink);
			if (!foundLink) {
				setIsLinkInvalid(true);
				return false;
			}
			setInsertedLinkData(foundLink);
			const link = '1' === foundLink?.uncloaked ? foundLink.target_url : newText;
			const withHttp = /^https?\:\/\//i.test(link) ? link : `http://${link}`;
			const linkFormat = makeLinkFormat({ url: withHttp, linkNewTab, sponsored: !!foundLink?.sponsored, noFollow: !!foundLink?.nofollow, linkId: foundLink?.ID });
			if (isCollapsed(value) && !isActive) {
				// Scenario: we don't have any selected text && even the cursor isn't on
				const toInsert = applyFormat(create({ text: withHttp }), linkFormat, 0, withHttp.length);
				onChange(insert(value, toInsert));
			} else {
				onChange(applyFormat(value, linkFormat));
			}
			reset();
			setSubmitDone(true);
			setIsChangeLink(false);
		};

		const handleMatchedLiClick = (shortUrl) => {
			setSearchedText(`${site_url}/${shortUrl}`);
			setMatchedLinks([]);
			const searchFieldDomRef = searchFieldRef?.current;
			if (!searchFieldDomRef?.focus) return false;
			searchFieldDomRef.focus({ preventScroll: true });
		};

		const handleUrlInputChange = (e) => {
			const value = e?.target?.value;
			setSearchedText(value || '');
			// Typing exits generate-link mode and clears WP REST suggestions
			setIsGenerateLinkMode(false);
			setWpResults([]);
			const spacesRemoved = value.replace(/\s+/g, '');

			if (spacesRemoved.length < 2) {
				setMatchedLinks([]);
				setRegex(false);
				setIsLinkInvalid(false);
				return false;
			}
			const regex = new RegExp(`(${value})`, 'gi');

			const siteUrlWithoutHttp = site_url.replace(/https?\:\/\//, '').toLowerCase();
			const siteUrlRegex = new RegExp(siteUrlWithoutHttp, 'gi');
			const matchedLinks = betterlinksGutenStore?.getState()?.links?.links.filter((item) => regex.test(item.link_title));

			const bool1 = (spacesRemoved || '').replace(/\s+/g, '').length < 2;
			const bool2 = siteUrlRegex.test(spacesRemoved);
			const bool3 = (spacesRemoved || '').toLowerCase().includes(siteUrlWithoutHttp);
			const bool4 = matchedLinks.length > 0;

			if (bool1 || bool2 || bool3 || bool4) {
				setIsLinkInvalid(false);
			} else {
				setIsLinkInvalid(true);
			}

			setRegex(regex);
			setMatchedLinks(matchedLinks);
		};

		const anchorRect = useMemo(() => {
			// In Generate Link mode use the rectangle frozen at click time, since the
			// modal steals focus and the live DOM selection is no longer reliable.
			if (isGenerateLinkMode && generateRectRef.current) {
				return generateRectRef.current;
			}

			if (isVisible || isActive) {
				// iframe-aware read so the popover anchors to the selection even when the
				// block canvas is iframed (WP 6.3+); fall back to the last tracked rect.
				return getEditorSelectionRect() || lastSelectionRectRef.current || false;
			}
		}, [isVisible, isActive, value.start, value.end, isGenerateLinkMode]);

		// A *live* anchor (virtual element) for the popover so it follows the selected
		// text while scrolling, instead of staying pinned to the frozen anchorRect.
		// Takes priority over anchorRect in Popover; anchorRect remains the fallback.
		const popoverAnchor = useMemo(() => {
			const captured = isGenerateLinkMode
				? generateRangeRef.current
				: isVisible || isActive
				? captureSelectionRange() || lastSelectionRangeRef.current
				: null;
			const fallbackRect = isGenerateLinkMode ? generateRectRef.current : lastSelectionRectRef.current;
			return buildRangeAnchor(captured, fallbackRect) || undefined;
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [isVisible, isActive, value.start, value.end, isGenerateLinkMode]);

		const handleOnKeyDown = (e) => {
			e.stopPropagation();
			const matchedLinksCount = matchedLinks.length;
			if (matchedLinksCount < 1) return setSelectedIndex(null);

			switch (e.keyCode) {
				case UP: {
					const prevIndex = typeof selectedIndex === 'number' ? selectedIndex - 1 : matchedLinksCount - 1;
					setSelectedIndex(prevIndex === -1 ? matchedLinksCount - 1 : prevIndex);
					break;
				}

				case DOWN: {
					const prevIndex = typeof selectedIndex === 'number' ? selectedIndex + 1 : 0;
					setSelectedIndex(prevIndex > matchedLinksCount - 1 ? 0 : prevIndex);
					break;
				}

				case ENTER: {
					if (typeof selectedIndex === 'number') {
						const shortUrl = matchedLinks[selectedIndex].short_url;
						const url = `${site_url}/${shortUrl}`;
						const attributes = { url };

						if (linkNewTab) {
							attributes.target = '_blank';
						}
						setSearchedText(url);
					}

					break;
				}
			}
		};

		// BetterLinks recommendations for the Generate Link modal, enriched with click
		// counts and link health, ranked by clicks (broken links sink to the bottom and
		// are flagged as non-insertable). Mirrors the "Analyze Content" suggestion logic.
		const generateSuggestions = useMemo(() => {
			const decode = (str) => new DOMParser().parseFromString(String(str || ''), 'text/html').documentElement.textContent;
			const items = (matchedLinks || []).map((item) => {
				const clicks = parseInt(item?.analytic?.link_count, 10) || 0;
				return {
					key: `btl-${item.ID}`,
					title: decode(item.link_title) || item.short_url,
					shortUrl: `/${(item.short_url || '').replace(/^\/+/, '')}`,
					clicks,
					isBroken: item?.link_status === 'broken',
					source: 'betterlinks',
					raw: item,
				};
			});
			const valid = items.filter((item) => !item.isBroken).sort((a, b) => b.clicks - a.clicks);
			const broken = items.filter((item) => item.isBroken);
			return [...valid, ...broken];
		}, [matchedLinks]);

		const handleSuggestionSelect = (item) => {
			if (item.source === 'betterlinks') {
				insertBetterLinkDirect(item.raw);
			} else {
				insertWpLinkDirect(item.raw);
			}
		};

		const hasSelection = !isCollapsed(value);
		const dropdownControls = [
			{
				title: isActive ? __('Edit Link') : __('Insert Link'),
				icon: betterlinksIcon,
				isActive: isActive,
				onClick: onClick,
			},
			{
				title: __('Generate Link'),
				icon: betterlinksIcon,
				isDisabled: !hasSelection || isActive,
				onClick: onGenerateLinkClick,
			},
			{
				title: __('Remove Link'),
				icon: 'editor-unlink',
				isDisabled: !isActive,
				onClick: () => isActive && removeBtlFormat(value),
			},
		];

		return (
			<>
				{isActive ? (
					<RichTextShortcut type="primaryShift" character="j" onUse={() => removeBtlFormat(value)} />
				) : (
					<RichTextShortcut type="primary" character="j" onUse={onClick} />
				)}

				<BlockControls group="block">
					<ToolbarGroup>
						<ToolbarDropdownMenu icon={betterlinksIcon} label={title} controls={dropdownControls} />
					</ToolbarGroup>
				</BlockControls>

				{(isVisible || isActive) && (
					<div className="betterlinks-links-popover-wrapper">
						<URLPopover
							className="btl-url-popover-slot"
							anchor={popoverAnchor}
							anchorRect={anchorRect}
							onClose={close}
							focusOnMount={!isActive && !submitDone && !isGenerateLinkMode ? true : false}
							// renderSettings={
							// 	!isActive && !submitDone && !isSubmittingForGutenberg
							// 		? () => (
							// 				<div className="betterlinks-expanded-format-options">
							// 					<ToggleControl label={__(`Open in new tab`)} checked={linkNewTab} onChange={() => setLinkNewTab(!linkNewTab)} />
							// 				</div>
							// 		  )
							// 		: undefined
							// }
						>
							{isSubmittingForGutenberg ? (
								<LoadingSpinner />
							) : (
								<>
									{((!isActive && !submitDone) || isChangeLink) &&
										(isGenerateLinkMode ? (
											<LinkSuggestion
												suggestions={generateSuggestions}
												isLoading={isGenerating}
												onSelect={handleSuggestionSelect}
												onClose={close}
												linkNewTab={linkNewTab}
												setLinkNewTab={setLinkNewTab}
												noFollow={noFollow}
												setNoFollow={setNoFollow}
												sponsored={sponsored}
												setSponsored={setSponsored}
												locked={!linkGeniusUnlocked}
											/>
										) : (
										<>
											<form className="btl-links-search-form" onSubmit={handleSubmit}>
												<input
													type="text"
													ref={searchFieldRef}
													placeholder="Paste URL or type to search"
													onChange={handleUrlInputChange}
													value={searchedText}
													className="btl-url-search-field"
													onKeyDown={handleOnKeyDown}
												/>

												{isLinkInvalid && (
													<Popover position="left" focusOnMount={false} className="betterlinks-invalid-link-popover">
														<div className="betterlinks_format_invalid_link_warning">
															No Links Found
															<button
																onClick={() => {
																	setShowLinkModal(true);
																	setIsLinkInvalid(false);
																}}
															>
																Create a New Link
															</button>
														</div>
													</Popover>
												)}

												{(matchedLinks.length > 0 || wpResults.length > 0) && regex && (
													<Popover position="left" focusOnMount={false} className="betterlinks-suggession-popover">
														<ul ref={matchedLinksUl} className="betterlinks-suggessions-wrapper-ul">
															{matchedLinks.map((item, index) => {
																const title = reactStringReplace(
																	// used DomPersar to convert the html entities back to the unescaped actual value & show it to preview
																	new DOMParser().parseFromString(item.link_title, 'text/html').documentElement.textContent,
																	regex,
																	(match, i) => {
																		return (
																			<span key={i} className="hl">
																				{match}
																			</span>
																		);
																	}
																);

																return (
																	<li
																		key={`btl-${item.ID}`}
																		onClick={() => {
																			if (isGenerateLinkMode) {
																				insertBetterLinkDirect(item);
																			} else {
																				handleMatchedLiClick(item.short_url);
																			}
																		}}
																		className={`betterlinks-suggessted-link-li betterlinks-suggessted-link-li-${index}`}
																	>
																		<span className="betterlinks-suggestion-title">{title}</span>
																		<span className="betterlinks-suggestion-type">{__('BetterLink')}</span>
																	</li>
																);
															})}
															{wpResults.map((item) => {
																const rawTitle = new DOMParser().parseFromString(String(item.title || ''), 'text/html').documentElement.textContent;
																const titleHighlighted = reactStringReplace(rawTitle, regex, (match, i) => (
																	<span key={i} className="hl">
																		{match}
																	</span>
																));
																const typeLabel = (item.subtype || item.type || 'page').toString().replace(/^\w/, (c) => c.toUpperCase());
																const slug = String(item.url || '').replace(/^https?:\/\/[^/]+/, '');
																return (
																	<li
																		key={`wp-${item.id}`}
																		onClick={() => insertWpLinkDirect(item)}
																		className="betterlinks-suggessted-link-li betterlinks-suggessted-wp-link-li"
																	>
																		<span className="betterlinks-suggestion-title">
																			{titleHighlighted}
																			{slug ? <span className="betterlinks-suggestion-slug"> {slug}</span> : null}
																		</span>
																		<span className="betterlinks-suggestion-type">{typeLabel}</span>
																	</li>
																);
															})}
														</ul>
													</Popover>
												)}

												<button type="submit" className="components-button btl-submit-button">
													<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 24 24" aria-hidden="true" focusable="false">
														<path d="M6.734 16.106l2.176-2.38-1.093-1.028-3.846 4.158 3.846 4.157 1.093-1.027-2.176-2.38h2.811c1.125 0 2.25.03 3.374 0 1.428-.001 3.362-.25 4.963-1.277 1.66-1.065 2.868-2.906 2.868-5.859 0-2.479-1.327-4.896-3.65-5.93-1.82-.813-3.044-.8-4.806-.788l-.567.002v1.5c.184 0 .368 0 .553-.002 1.82-.007 2.704-.014 4.21.657 1.854.827 2.76 2.657 2.76 4.561 0 2.472-.973 3.824-2.178 4.596-1.258.807-2.864 1.04-4.163 1.04h-.02c-1.115.03-2.229 0-3.344 0H6.734z"></path>
													</svg>
												</button>
											</form>
										</>
									))}

									{isActive && !isChangeLink && (
										<LinkPreview
											reset={reset}
											activeAttributes={activeAttributes}
											value={value}
											removeBtlFormat={removeBtlFormat}
											setIsChangeLink={setIsChangeLink}
											setShowLinkModal={setShowLinkModal}
											setLinkData={setLinkData}
											close={close}
											insertedLinkData={insertedLinkData}
										/>
									)}
								</>
							)}

							{showLinkModal && (
								<Provider store={betterlinksGutenStore}>
									<Link
										searchFieldRef={linkData ? null : searchFieldRef}
										linkNewTab={linkData ? activeAttributes.target == '_blank' : linkNewTab || activeAttributes.target == '_blank'}
										betterlinksGutenStore={betterlinksGutenStore}
										isShowIcon={false}
										setShowLinkModal={setShowLinkModal}
										isSubmittingForGutenberg={isSubmittingForGutenberg}
										setIsSubmittingForGutenberg={setIsSubmittingForGutenberg}
										data={linkData || undefined}
										catId={linkData ? linkData.cat_id : undefined}
										submitHandler={async (values) => {
											const linkNewTab = !!values.openInNewTab;
											delete values.openInNewTab;

											if (linkData) {
												return edit_link(
													values,
													true
												)(betterlinksGutenStore.dispatch)
													.then((res) => {
														const inputUrl = '1' === insertedLinkData?.uncloaked ? insertedLinkData.target_url : `${site_url}/${values.short_url}`;
														setLinkNewTab(linkNewTab);
														const withHttp = /^https?\:\/\//i.test(inputUrl) ? inputUrl : `http://${inputUrl}`;
														setInsertedLinkData(values);
														const linkFormat = makeLinkFormat({ url: withHttp, linkNewTab, sponsored: !!values.sponsored, noFollow: !!values.nofollow, linkId: values?.ID });
														onChange(applyFormat(value, linkFormat));
														reset();
														setIsSubmittingForGutenberg(false);
														setShowLinkModal(false);
														return res;
													})
													.catch((error) => {
														console.log('error!! editing link failed', error);
													});
											} else {
												return add_new_link(
													values,
													true
												)(betterlinksGutenStore.dispatch)
													.then((res) => {
														setLinkNewTab(linkNewTab);
														setSearchedText(`${site_url}/${values.short_url}`);
														setShowLinkModal(false);
														setIsSubmittingForGutenberg(false);

														const searchFieldDomRef = searchFieldRef?.current;
														if (!(searchFieldDomRef?.classList && searchFieldDomRef?.focus)) return false;
														searchFieldDomRef.classList.add('temporary-focus');
														setTimeout(() => {
															if (searchFieldDomRef?.classList) {
																searchFieldDomRef.classList.remove('temporary-focus');
															}
														}, 5000);
														searchFieldDomRef.focus({ preventScroll: true });
														return res;
													})
													.catch((error) => {
														console.log('error!! aading new link failed', error);
													});
											}
										}}
									/>
								</Provider>
							)}
						</URLPopover>
					</div>
				)}
			</>
		);
	},
};