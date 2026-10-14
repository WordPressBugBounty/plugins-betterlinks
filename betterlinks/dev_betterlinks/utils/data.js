import { __ } from '@wordpress/i18n';
import { is_fbs_enabled } from './helper';
export const redirectType = [
	{
		value: '307',
		label: __('307 (Temporary)', 'betterlinks'),
	},
	{
		value: '302',
		label: __('302 (Temporary)', 'betterlinks'),
	},
	{
		value: '301',
		label: __('301 (Permanent)', 'betterlinks'),
	},
];

export const redirectTypeForPasswordProtection = [
	{
		value: '302',
		label: __('302 (Temporary)', 'betterlinks'),
	},
	{
		value: '301',
		label: __('301 (Permanent)', 'betterlinks'),
	},
];

export const affiliateLinkPosition = [
	{
		label: __('Top', 'betterlinks-pro'),
		value: 'top',
	},
	{
		label: __('Bottom', 'betterlinks-pro'),
		value: 'bottom',
	},
	{
		label: __('Top & Bottom', 'betterlinks-pro'),
		value: 'top-bottom',
	},
];

export const urlGenerationTypes = [
	{
		value: 'from_title',
		label: __('Generate From Link Title', 'betterlinks'),
	},
	{
		value: 'from_url',
		label: __('Generate From Target URL', 'betterlinks'),
	},
	{
		value: 'random_string',
		label: __('Random Strings', 'betterlinks'),
	},
	{
		value: 'random_number',
		label: __('Random Numbers', 'betterlinks'),
	},
	{
		value: 'random_mixed',
		label: __('Random Alphanumeric', 'betterlinks'),
	},
];

// Advanced Option Feature List
export const tabList = [
	{
		label: __('AI Configuration', 'betterlinks'),
		type: 'pro',
	},
	{
		label: __('Custom Fields', 'betterlinks'),
		type: 'free',
	},
	{
		label: __('Auto Post Link Generator', 'betterlinks'),
		type: 'pro',
	},
	{
		label: __('UTM Builder', 'betterlinks'),
		type: 'pro',
	},
	{
		label: __('Quick Link Creation', 'betterlinks'),
		type: 'free',
	},
	is_fbs_enabled && {
		label: __('Fluent Boards Settings', 'betterlinks'),
		type: 'free',
	},
	{
		label: __('Tracking', 'betterlinks'),
		type: 'pro',
	},
	{
		label: __('Auto-Create Links', 'betterlinks'),
		type: 'pro',
	},
	{
		label: __('Affiliate Link Disclosure', 'betterlinks'),
		type: 'pro',
	},
	{
		label: __('Password Protected Redirect', 'betterlinks'),
		type: 'pro',
	},
	{
		label: __('Customize Link Preview', 'betterlinks'),
		type: 'pro',
	},
	{
		label: __('Auto-Link Keywords', 'betterlinks'),
		type: 'pro',
	},
].filter(Boolean);
