import { __ } from '@wordpress/i18n';
import { is_pro_enabled, is_pro_version_atleast, pro_needs_update } from 'utils/helper';
import { LinkIcon, RedirectIcon, ChartIcon, BoltIcon, SparkIcon, LayersIcon, TagIcon, DownloadIcon, GridIcon, UsersIcon, KeyIcon } from './Icons';

import GeneralSettingsForm from './GeneralSettingsForm';
import FeatureModules from './sections/FeatureModules';
import LicenseTeaser from './sections/LicenseTeaser';

import AISettings from 'components/AISettings';
import StaticProVisulaization from 'components/ShortLinkGenerator/StaticProVisulaization';
import ProUpdateRequired from 'components/Teasers/ProUpdateRequired';
import UTMTemplatesTeaser from 'components/Teasers/UTMTemplates';
import TabsTools from 'containers/TabsTools';
import AutoLinkCreate from 'components/Teasers/AutoLinkCreate';
import AutoLinkKeywords from 'components/Teasers/AutoLinkKeywords';
import AffiliateLinkDisclosure from 'components/Teasers/AffiliateLinkDisclosure';
import RoleManagement from 'components/Teasers/RoleManagement';
import ProBadge from 'components/Badge/ProBadge';

// Reused external panels are wrapped in the shell's card surface here so they
// pick up the consistent padding/background + a header. Sections that render
// their own `.bl-settings__panel` (general form, feature modules, license) are
// NOT wrapped.
const wrap = (node, title, desc) => (
	<div className="bl-settings__panel">
		{title && (
			<div className="bl-settings__panel-head">
				<h2 className="bl-settings__panel-title">{title}</h2>
				{desc && <p className="bl-settings__panel-desc">{desc}</p>}
			</div>
		)}
		{node}
	</div>
);

// Panel title for Pro-only sections, so the heading carries the same badge the
// sidebar item does. `ProBadge` returns null once Pro is active, so this is safe
// unconditionally. `.bl-settings__panel-title` is already a flex row with a gap.
const proTitle = (title) => (
	<>
		{title}
		<ProBadge />
	</>
);

// Pro release that adopts the id-keyed `betterLinksSettingsNav` hook. Older Pro
// builds don't know that hook — they still inject Role Management + License
// through the legacy index-coupled tab filters, which the redesigned nav no
// longer reads (so those panels silently vanished). Bridge is applied ONLY to
// older Pro; on the redesigned Pro the new hook handles everything and this is a
// no-op (avoids double-handling).
const NAV_REDESIGN_MIN_PRO = '3.0.0';

// Backward-compatibility bridge for Pro < NAV_REDESIGN_MIN_PRO.
//
// Old Pro's `betterLinksSettingsFilterTabPanel` keeps the first 3 entries of the
// array it's handed and appends its Pro panels — Role Management (admins only),
// then License — with matching labels via `betterLinksSettingsFilterTabList`.
// Feed 3 placeholders, read the appended extras, and slot them into the new nav
// by id so old Pro's real screens render in place of the free teasers.
const bridgeLegacyProSettings = (model) => {
	if (!is_pro_enabled || is_pro_version_atleast(NAV_REDESIGN_MIN_PRO)) return model;

	let panels;
	let labels;
	try {
		panels = betterLinksHooks.applyFilters('betterLinksSettingsFilterTabPanel', [null, null, null]);
		labels = betterLinksHooks.applyFilters('betterLinksSettingsFilterTabList', [null, null, null]);
	} catch (e) {
		return model;
	}
	if (!Array.isArray(panels)) return model;

	const extraPanels = panels.slice(3);
	const extraLabels = (Array.isArray(labels) ? labels : []).slice(3);
	if (!extraPanels.length) return model;

	const panelByLabel = (re) => {
		const i = extraLabels.findIndex((l) => typeof l === 'string' && re.test(l));
		return i >= 0 ? extraPanels[i] : undefined;
	};
	// Old Pro only appends Role Management for admins. Its own panel is rendered
	// as-is: Role Management is Pro code, so this plugin does not re-implement it.
	const rolePanel = panelByLabel(/role/i);
	const licensePanel = panelByLabel(/licen/i);
	if (!rolePanel && !licensePanel) return model;

	return model.map((group) => ({
		...group,
		items: (group.items || []).map((item) => {
			if (item.id === 'role-management' && rolePanel) {
				return { ...item, render: () => wrap(rolePanel, __('Role Management', 'betterlinks'), __('Control which user roles can view, create, edit and manage links.', 'betterlinks')) };
			}
			if (item.id === 'license' && licensePanel) {
				return { ...item, render: () => wrap(licensePanel, __('License', 'betterlinks')) };
			}
			return item;
		}),
	}));
};

// Build the id-keyed navigation model. Pro edits this by id via the
// `betterLinksSettingsNav` filter — never by index.
export const buildSettingsNav = (ctx) => {
	const general = (id) => () => (
		<GeneralSettingsForm
			activeSection={id}
			settings={ctx.settings}
			trackingSettings={ctx.trackingSettings}
			openUpgradeToProModal={ctx.openUpgradeToProModal}
		/>
	);

	const model = [
		{
			id: 'configure',
			label: __('Configure', 'betterlinks'),
			items: [
				{ id: 'link-defaults', label: __('Link Defaults', 'betterlinks'), icon: LinkIcon, section: 'general', render: general('link-defaults') },
				{ id: 'redirects', label: __('Redirects', 'betterlinks'), icon: RedirectIcon, section: 'general', render: general('redirects') },
				{
					// Parent is a disclosure only (the sidebar gives it no panel of its
					// own), so the child keeps the `tracking` id the rest of the app
					// already points at.
					id: 'tracking-group',
					label: __('Tracking', 'betterlinks'),
					icon: ChartIcon,
					children: [
						{ id: 'tracking', label: __('Tracking', 'betterlinks'), section: 'general', render: general('tracking') },
						{ id: 'external-analytics', label: __('External Analytics', 'betterlinks'), pro: true, section: 'general', render: general('external-analytics') },
					],
				},
				{
					id: 'automation',
					label: __('Automation', 'betterlinks'),
					icon: BoltIcon,
					children: [
						{
							id: 'auto-create-links',
							label: __('Auto-Create Links', 'betterlinks'),
							pro: true,
							render: () =>
								wrap(
									<AutoLinkCreate
										autoCreateLinkSettings={ctx.autoCreateLinkSettings}
										terms={ctx.terms}
										setAutoCreateLinkSettings={ctx.setAutoCreateLinkSettings}
									/>,
									proTitle(__('Auto-Create Links', 'betterlinks')),
									__('Automatically create short links for your posts, pages and custom post types.', 'betterlinks')
								),
						},
						{
							id: 'auto-link-keywords',
							label: __('Auto-Link Keywords', 'betterlinks'),
							pro: true,
							render: () =>
								wrap(
									<AutoLinkKeywords settings={ctx.settings} postdatas={ctx.postdatas} />,
									proTitle(__('Auto-Link Keywords', 'betterlinks')),
									__('Turn matching keywords across your content into short links automatically.', 'betterlinks')
								),
						},
						{
							id: 'affiliate-disclosure',
							label: __('Affiliate Link Disclosure', 'betterlinks'),
							pro: true,
							render: () =>
								wrap(
									<AffiliateLinkDisclosure settings={ctx.settings} postTypes={ctx.postdatas?.postTypes || []} />,
									proTitle(__('Affiliate Link Disclosure', 'betterlinks')),
									__('Show an FTC-style disclosure notice on posts containing affiliate links.', 'betterlinks')
								),
						},
					],
				},
				{
					id: 'ai-configuration',
					label: __('AI Configuration', 'betterlinks'),
					icon: SparkIcon,
					pro: true,
					render: () => wrap(<AISettings />),
				},
			],
		},
		{
			id: 'tools',
			label: __('Tools', 'betterlinks'),
			items: [
				{
					id: 'auto-post-generator',
					label: __('Auto Post Link Generator', 'betterlinks'),
					icon: LayersIcon,
					pro: true,
					// Implemented in BetterLinks Pro, which replaces this render through
					// `betterLinksSettingsNav`. Free shows the preview (or an update
					// note when an older Pro is active).
					render: () =>
						is_pro_enabled && pro_needs_update
							? wrap(<ProUpdateRequired feature={__('Auto Post Link Generator', 'betterlinks')} />, proTitle(__('Auto Post Link Generator', 'betterlinks')))
							: wrap(<StaticProVisulaization openUpgradeToProModal={ctx.openUpgradeToProModal} />),
				},
				{
					id: 'utm-builder',
					label: __('UTM Builder', 'betterlinks'),
					icon: TagIcon,
					pro: true,
					// The template manager is implemented in BetterLinks Pro, which
					// replaces this render through `betterLinksSettingsNav` (ctx carries
					// `settings`, `saveSettings` and `refreshLinks`).
					render: () =>
						is_pro_enabled && pro_needs_update
							? wrap(<ProUpdateRequired feature={__('UTM templates', 'betterlinks')} />, proTitle(__('UTM Builder', 'betterlinks')))
							: wrap(<UTMTemplatesTeaser openUpgradeToProModal={ctx.openUpgradeToProModal} />),
				},
				{
					id: 'import-export',
					label: __('Import & Export', 'betterlinks'),
					icon: DownloadIcon,
					render: () => wrap(<TabsTools query={ctx.query} />, __('Import & Export', 'betterlinks'), __('Move links and analytics in and out of BetterLinks.', 'betterlinks')),
				},
				{
					id: 'feature-modules',
					label: __('Feature Modules', 'betterlinks'),
					icon: GridIcon,
					render: () => <FeatureModules settings={ctx.settings} terms={ctx.terms} openUpgradeToProModal={ctx.openUpgradeToProModal} />,
				},
			],
		},
		{
			id: 'system',
			label: __('System', 'betterlinks'),
			items: [
				{ id: 'role-management', label: __('Role Management', 'betterlinks'), icon: UsersIcon, pro: true, render: () => wrap(<RoleManagement />) },
				{ id: 'license', label: __('License', 'betterlinks'), icon: KeyIcon, pro: false, render: () => <LicenseTeaser openUpgradeToProModal={ctx.openUpgradeToProModal} /> },
			],
		},
	];

	const navModel = betterLinksHooks.applyFilters('betterLinksSettingsNav', model, ctx);

	// Older Pro doesn't hook `betterLinksSettingsNav`; pull its Role Management /
	// License panels in from the legacy tab filters so they still render.
	return bridgeLegacyProSettings(navModel);
};

// Flatten the (possibly Pro-filtered) model into a lookup of leaf items by id,
// including submenu children. Used by the shell to resolve the active panel.
export const flattenNav = (model) => {
	const map = {};
	model.forEach((group) => {
		(group.items || []).forEach((item) => {
			if (item.children) {
				item.children.forEach((child) => {
					map[child.id] = child;
				});
			} else {
				map[item.id] = item;
			}
		});
	});
	return map;
};

// First selectable leaf id (default active item).
export const firstLeafId = (model) => {
	for (const group of model) {
		for (const item of group.items || []) {
			if (item.children && item.children.length) return item.children[0].id;
			if (!item.children) return item.id;
		}
	}
	return null;
};
