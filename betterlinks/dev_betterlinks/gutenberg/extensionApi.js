import { add_new_link, edit_link } from 'redux/actions/links.actions';
import { fetch_link_by_permalink } from 'redux/actions/gutenbergredirectlink.actions';
import { fetch_terms_by_link_id, fetch_terms_data } from 'redux/actions/terms.actions';
import { betterlinksGutenStore } from 'redux/gutenbergStore';
import { formatDate, generateRandomSlug, prefix, shortURLUniqueCheckGutenberg } from 'utils/helper';

/**
 * Link helpers handed to the block editor panels other plugins (BetterLinks Pro)
 * add through the `betterlinks.gutenberg.*` filters. Extensions cannot import
 * Free's modules or reach its Redux store, so they get these instead.
 * Documented in docs/extension-api.md.
 */
const extensionApi = {
	/** The link whose target is the post being edited, or false. */
	findLinkByPermalink: () => fetch_link_by_permalink() || Promise.resolve(false),
	/** Every BetterLinks term (categories and tags). */
	getTerms: () => {
		const read = () => betterlinksGutenStore.getState()?.terms?.terms;
		if (read()) {
			return Promise.resolve(read());
		}
		// fetch_terms_data() resolves before its admin-ajax fallback has filled the
		// store, so wait for the store instead.
		return new Promise((resolve) => {
			const done = () => {
				unsubscribe();
				clearTimeout(timer);
				resolve(read() || []);
			};
			const unsubscribe = betterlinksGutenStore.subscribe(() => read() && done());
			const timer = setTimeout(done, 15000);
			fetch_terms_data()(betterlinksGutenStore.dispatch).catch(() => {});
		});
	},
	/** The terms a link is filed under. */
	getLinkTerms: (linkId) => fetch_terms_by_link_id(linkId),
	/** Resolves true when another link already uses `shortUrl`. */
	isShortUrlTaken: (shortUrl, linkId) => shortURLUniqueCheckGutenberg(shortUrl, linkId),
	/** Create or update a link; resolves with the REST response. */
	createLink: (params) => add_new_link(params, true, false)(betterlinksGutenStore.dispatch),
	updateLink: (params) => edit_link(params, true)(betterlinksGutenStore.dispatch),
	formatDate,
	generateRandomSlug,
	prefix,
};

export default extensionApi;
