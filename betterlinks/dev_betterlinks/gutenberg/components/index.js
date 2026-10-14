import { is_pro_enabled, site_url } from 'utils/helper';

export { default as CustomSidebar } from 'gutenberg/components/sidebar/';
export { default as LoadingSpinner } from 'gutenberg/components/loadingSpinner/';
export { default as LinkSuggestion } from 'gutenberg/components/LinkSuggestion/';

export const btl_custom_domain = is_pro_enabled && localStorage.getItem('btl_custom_domain') ? localStorage.getItem('btl_custom_domain') : site_url;
