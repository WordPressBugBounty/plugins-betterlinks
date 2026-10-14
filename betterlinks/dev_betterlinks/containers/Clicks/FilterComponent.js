import { __ } from '@wordpress/i18n';
import SearchLoader from 'components/SearchLoader';
import { useState } from 'react';
import { MultiSelect } from 'react-multi-select-component';
import { useEffect } from 'react';
import ProBadge from 'components/Badge/ProBadge';
import { route_path } from 'utils/helper';
import Select from 'react-select';
import { toastWarning } from 'components/Toast';

/**
 * Column options for the legacy click table. `disabled` + `pro` marks a locked
 * preview; BetterLinks Pro enables them through `betterLinksClickLogFilterOptions`.
 */
const FREE_OPTIONS = [
	{ label: __('Browser', 'betterlinks'), value: 'browser' },
	{ label: __('IP', 'betterlinks'), value: 'ip' },
	{
		label: (
			<div>
				{__('Country', 'betterlinks')} <ProBadge />
			</div>
		),
		value: 'country_name',
		pro: true,
		disabled: true,
	},
	{
		label: (
			<div>
				{__('User Agent', 'betterlinks')} <ProBadge />
			</div>
		),
		value: 'user_agent',
		pro: true,
		disabled: true,
	},
	{ label: __('Timestamp', 'betterlinks'), value: 'created_at' },
	{ label: __('Referer', 'betterlinks'), value: 'referer' },
	{
		label: (
			<div>
				{__('Parameters', 'betterlinks')} <ProBadge />
			</div>
		),
		value: 'query_params',
		pro: true,
		disabled: true,
	},
	{
		label: __('OS', 'betterlinks'),
		value: 'os',
	},
	{
		label: __('Device', 'betterlinks'),
		value: 'device',
	},
];

const FilterComponent = (props) => {
	const { filterText, onFilter, searchClickHandler, searchStatus, isSearching, resetSearch, analytics, update_analytics_settings, id, selectedRows, bulkAction, setBulkAction, rowDeleteHandler, warning } = props;
	const [selectedValues, setSelectedValues] = useState([]);

	// Context shared by the extension points below.
	const filterCtx = {
		table: 'legacy',
		linkId: id,
		// Whether user-agent tracking is enabled in settings.
		enableUserAgentTracking: !!(window.betterLinksGlobal && window.betterLinksGlobal.betterlinks_settings && window.betterLinksGlobal.betterlinks_settings.enable_user_agent_tracking),
		settingsUrl: `${route_path}admin.php?page=betterlinks-settings&#btl-setting-user-agent`,
		toastWarning,
	};

	/** `betterLinksClickLogFilterOptions` — (options, ctx) => options. */
	const filteredOptions = betterLinksHooks.applyFilters('betterLinksClickLogFilterOptions', FREE_OPTIONS, filterCtx);
	const options = Array.isArray(filteredOptions) ? filteredOptions : FREE_OPTIONS;
	const isDisabledValue = (value) => !!options.find((option) => option.value === value)?.disabled;
	const disabledKey = options
		.filter((option) => option.disabled)
		.map((option) => option.value)
		.join(',');

	/**
	 * `betterLinksClickLogFilterSelection` — (selected, ctx) => selected.
	 * ctx adds { source: 'load'|'change', previous }. Lets an extension veto
	 * options (e.g. User Agent while tracking is off).
	 */
	const filterSelection = (selected, source, previous) => {
		const next = betterLinksHooks.applyFilters('betterLinksClickLogFilterSelection', selected, { ...filterCtx, source, previous });
		return Array.isArray(next) ? next : selected;
	};

	useEffect(() => {
		// Never show a locked option as selected.
		const vals = Object.values(analytics || []).filter((v) => v && !isDisabledValue(v.value));
		setSelectedValues(filterSelection(vals, 'load', null));
	}, [analytics, disabledKey, filterCtx.enableUserAgentTracking]);

	const tag_id = betterLinksQuery.get('tag_id');

	/** `betterLinksClickLogBulkActions` — (actions, ctx) => actions. Action: { value, label, disabled?, pro? }. */
	const freeBulkActions = [
		{ value: 'delete', label: __('Delete', 'betterlinks') },
		...(id ? [{ value: 'fetch_country', label: __('Fetch Country', 'betterlinks'), pro: true, disabled: true }] : []),
	];
	const filteredBulkActions = betterLinksHooks.applyFilters('betterLinksClickLogBulkActions', freeBulkActions, filterCtx);
	const bulkActions = Array.isArray(filteredBulkActions) ? filteredBulkActions : freeBulkActions;
	const currentBulkAction = bulkActions.find((item) => item.value === bulkAction?.value);

	return (
		<>
			<div className="btl-click-filter">
				<div className='btl-flex'>
					<div style={{ display: 'flex', alignItems: 'center' }}>
						{id && (
							<a
								className="btl-go-back-btn dashicons dashicons-arrow-left-alt btl-white"
								onClick={() => {
									window.history.go(-1);
									return false;
								}}
								href="#"
							/>
						)}
					</div>

					<div className="btl-bulk-actions">
						<Select
							className="btl-list-view-select"
							classNamePrefix="btl-react-select"
							defaultValue={{ value: '', label: __('Bulk Actions', 'betterlinks') }}
							value={bulkAction?.value ? bulkAction : { value: '', label: __('Bulk Actions', 'betterlinks') }}
							options={bulkActions.map((item) => ({
								value: item.value,
								label: item.pro && item.disabled ? (
									<>
										{item.label} <ProBadge />
									</>
								) : (
									item.label
								),
							}))}
							onChange={(e) => setBulkAction(e)}
							isDisabled={!selectedRows || selectedRows.length === 0}
						/>
						<div className="btl-tooltip">
							<button
								className="btl-link-apply-button"
								onClick={() => {
									rowDeleteHandler();
								}}
								disabled={!selectedRows || selectedRows.length === 0 || !!currentBulkAction?.disabled}
							>
								{__('Apply', 'betterlinks')}
							</button>
							{warning && bulkAction.value !== 'delete' && bulkAction.value !== 'fetch_country' && <span className="btl-tooltiptext">Please Select Action.</span>}
						</div>
					</div>
				</div>
				<div style={{ display: 'flex' }}>
					<form onSubmit={searchClickHandler}>
						<input id="search" type="text" placeholder={__('Search...', 'betterlinks')} value={filterText} onChange={onFilter} />
						<button className="btl-search-button" type="submit" title={__('Searching', 'betterlinks')}>
							<SearchLoader searchStatus={searchStatus} />
						</button>
						{isSearching && (
							<button className="btl-search-button btl-search-reset" type="button" title={__('Reset Search', 'betterlinks')} onClick={resetSearch}>
								<span className="dashicons dashicons-image-rotate" />
							</button>
						)}
					</form>
					{id && !tag_id && (
						<MultiSelect
							options={options}
							value={selectedValues}
							onChange={(chosen) => {
								const next = filterSelection(
									chosen.filter((option) => !isDisabledValue(option.value)),
									'change',
									selectedValues
								);
								setSelectedValues(next);
								update_analytics_settings(next);
							}}
							labelledBy="Select"
							disableSearch={true}
							hasSelectAll={false}
						/>
					)}
				</div>
			</div>
		</>
	);
};

export default FilterComponent;
