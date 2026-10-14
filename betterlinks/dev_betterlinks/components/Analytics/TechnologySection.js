import { __ } from '@wordpress/i18n';
import BarList from './BarList';
import { BarListSkeleton } from './Skeletons';
import { MonitorIcon, SmartphoneIcon, TabletIcon, CpuIcon, AppleIcon, AndroidIcon, TerminalIcon, GlobeIcon, CompassIcon } from './Icons';
import { toDeviceRows, toOsRows, toBrowserRows } from './analytics.helper';

const TRACKING_HINT = __('Turn on extra data tracking to record what your visitors browse with.', 'betterlinks');

/** Matches on a substring so "Windows 11" / "Mac OS X" / "Chrome Mobile" all land. */
const pick = (value, table, fallback) => {
	const name = String(value || '').toLowerCase();
	const hit = Object.keys(table).find((key) => name.includes(key));
	return hit ? table[hit] : fallback;
};

const DEVICE_ICONS = {
	smartphone: SmartphoneIcon,
	phablet: SmartphoneIcon,
	phone: SmartphoneIcon,
	mobile: SmartphoneIcon,
	tablet: TabletIcon,
	desktop: MonitorIcon,
	computer: MonitorIcon,
};

const OS_ICONS = {
	mac: AppleIcon,
	ios: AppleIcon,
	android: AndroidIcon,
	linux: TerminalIcon,
	ubuntu: TerminalIcon,
	gnu: TerminalIcon,
	windows: CpuIcon,
};

/**
 * Section 3 — Technology & devices.
 *
 * OS and browser rows are aggregated by name in the helper: the endpoints group
 * by name AND version, so "Windows 10" and "Windows 11" arrive as separate rows
 * and would otherwise list as versioned duplicates.
 */
const TechnologySection = ({ devices, os, browser, tracked, loading }) => {
	if (loading) return <BarListSkeleton />;

	return (
		<div className="bl-an__grid">
			<BarList
				icon={<MonitorIcon width={16} height={16} />}
				title={__('Top devices', 'betterlinks')}
				subtitle={__('device class', 'betterlinks')}
				rows={toDeviceRows(devices)}
				rowIcon={(row) => {
					const Icon = pick(row.label, DEVICE_ICONS, MonitorIcon);
					return <Icon width={14} height={14} />;
				}}
				unavailable={!tracked}
				unavailableHint={TRACKING_HINT}
				emptyText={__('No device information was recorded in this range.', 'betterlinks')}
			/>

			<BarList
				icon={<CpuIcon width={16} height={16} />}
				title={__('Top OS', 'betterlinks')}
				subtitle={__('operating system', 'betterlinks')}
				rows={toOsRows(os)}
				rowIcon={(row) => {
					const Icon = pick(row.label, OS_ICONS, CpuIcon);
					return <Icon width={14} height={14} />;
				}}
				unavailable={!tracked}
				unavailableHint={TRACKING_HINT}
				emptyText={__('No operating system was recorded in this range.', 'betterlinks')}
			/>

			<BarList
				icon={<CompassIcon width={16} height={16} />}
				title={__('Top browser', 'betterlinks')}
				subtitle={__('browser', 'betterlinks')}
				rows={toBrowserRows(browser)}
				rowIcon={() => <GlobeIcon width={14} height={14} />}
				unavailable={!tracked}
				unavailableHint={TRACKING_HINT}
				emptyText={__('No browser was recorded in this range.', 'betterlinks')}
			/>
		</div>
	);
};

export default TechnologySection;
