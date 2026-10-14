// wordpress dependecies
const { registerFormatType } = wp.richText;
const { registerPlugin } = wp.plugins;

// redux imports
import { betterlinksGutenStore } from 'redux/gutenbergStore';
import { fetch_links_data } from 'redux/actions/links.actions';
import { fetch_terms_data } from 'redux/actions/terms.actions';
import { fetch_settings_data } from 'redux/actions/settings.actions';

// local imports
import { CustomSidebar } from 'gutenberg/components';
import { betterlinksFormat } from 'gutenberg/formats';
import LinkGeniusTeaser from 'gutenberg/components/LinkGeniusTeaser';

// helpers
import { betterlinks_settings, post_type, is_pro_enabled, pro_version_check } from 'utils/helper';

// The AI Link Assistant ships in BetterLinks Pro 2.8.0+. When it's unavailable
// (free or older Pro), show the locked, Pro-badged teaser panel instead — the
// real Pro panel registers itself, so the two never collide.
const linkGeniusUnlocked = is_pro_enabled && pro_version_check('2.8.0');

const { is_allow_gutenberg = false, affiliate_link_disclosure = false, enable_auto_link = false } = betterlinks_settings;
const requests = [];

if ([is_allow_gutenberg, affiliate_link_disclosure].some(Boolean)) {
	requests.push(fetch_links_data(true)(betterlinksGutenStore.dispatch), fetch_terms_data()(betterlinksGutenStore.dispatch), fetch_settings_data()(betterlinksGutenStore.dispatch));
}

// Auto-Create Links (BetterLinks Pro) renders inside this sidebar, so it also
// needs the sidebar mounted. Pro merges its settings into betterlinks_settings.
const autoCreateLinksOn = enable_auto_link && betterlinks_settings?.[`${post_type}_shortlinks`];

if (requests.length > 0 || autoCreateLinksOn) {
	Promise.all(requests)
		.then(() => {
			document?.body?.classList?.remove('betterlinks-guten-store-initial-data-still-fetching');
		})
		.catch((err) => {
			document?.body?.classList?.remove('betterlinks-guten-store-initial-data-still-fetching');
			console.log('---error while fetching betterlinks gutenberg store datas', { err });
		});

	(() => {
		if (
			betterlinksGutenStore?.getState()?.links?.links &&
			betterlinksGutenStore?.getState()?.terms?.terms &&
			betterlinksGutenStore?.getState()?.settings?.settings
		) {
			document?.body?.classList?.remove('betterlinks-guten-store-initial-data-still-fetching');
		} else {
			document?.body?.classList?.add('betterlinks-guten-store-initial-data-still-fetching');
		}
	})();

	if (is_allow_gutenberg) {
		betterlinksGutenStore.subscribe(() => {
			if (betterlinksGutenStore?.getState()?.gutenbergredirectlink?.linkData?.ID) {
				document?.body?.classList?.add('betterlinks-guten-instant-redirect-has-link');
			} else {
				document?.body?.classList?.remove('betterlinks-guten-instant-redirect-has-link');
			}
		});
	}

	// Sidebar Panel in Gutenberg Edit 'page/post'
	if (['post', 'page'].includes(post_type)) {
		registerPlugin('betterlinks-sidebar', {
			render: CustomSidebar,
			icon: '',
		});

		// Locked "AI Link Assistant" upsell panel for free / Pro < 2.8.0 users.
		if (!linkGeniusUnlocked) {
			registerPlugin('betterlinks-link-genius-teaser', {
				render: LinkGeniusTeaser,
				icon: '',
			});
		}
	}

	// Betterlinks Formatting option for rich text. This option wil show up in the formats options when selecting some text from rich-text
	const { name, ...settings } = betterlinksFormat;
	registerFormatType(name, settings);
}
