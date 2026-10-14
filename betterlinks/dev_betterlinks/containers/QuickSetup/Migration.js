import { __ } from '@wordpress/i18n';
import { SetupContext } from 'index';
import { useContext, useEffect } from 'react';
import { migratable_plugins } from 'utils/helper';
import ToggleSwitch from 'components/Settings/ToggleSwitch';
import { MigrationStatusIcon } from './icons';
import ConfirmationModal from './ConfirmationModal';

const Migration = () => {
	const { migrationSettings, setMigrationSettings, migrationStatus } = useContext(SetupContext);
	const { simple301redirects, thirstyaffiliates, prettylinks } = migrationSettings;
	const handleShowHide = (type) => {
		setMigrationSettings((prev) => {
			return {
				...prev,
				[type]: !prev[type],
			};
		});
	};
	return (
		<>
			<ConfirmationModal />
			<div className="bl-qs__head">
				<h2 className="bl-qs__head-title">{__('Migration', 'betterlinks')}</h2>
				<p className="bl-qs__head-desc">
					{__('Already using another link management tool? Import your existing links and data into BetterLinks without any hassle.', 'betterlinks')}
				</p>
			</div>
			<div className="bl-qs__plugins">
				{migratable_plugins.simple301redirects && (
					<Plugin
						title={__('Simple 301 Redirects', 'betterlinks')}
						show={simple301redirects}
						onClick={() => handleShowHide('simple301redirects')}
						status={migrationStatus.simple301redirects}
					/>
				)}
				{migratable_plugins.thirstyaffiliates && (
					<Plugin
						title={__('ThirstyAffiliates', 'betterlinks')}
						show={thirstyaffiliates}
						onClick={() => handleShowHide('thirstyaffiliates')}
						status={migrationStatus.thirstyaffiliates}
					/>
				)}
				{migratable_plugins.prettylinks && (
					<Plugin title={__('Pretty Links', 'betterlinks')} show={prettylinks} onClick={() => handleShowHide('prettylinks')} status={migrationStatus.prettylinks} />
				)}
			</div>
		</>
	);
};

export default Migration;

const Plugin = ({ title, show = false, onClick, status = '' }) => {
	const buttonText = {
		complete: __('Complete', 'betterlinks'),
		'in-progress': __('In Progress', 'betterlinks'),
		failed: __('Failed', 'betterlinks'),
	};
	return (
		<label className={`bl-qs__plugin${show ? ' is-on' : ''}`}>
			<span className="bl-qs__plugin-main">
				<ToggleSwitch checked={show} onChange={onClick} ariaLabel={title} />
				<span className="bl-qs__plugin-name">{title}</span>
				{'' !== status && (
					<span className={`bl-qs__badge bl-qs__badge--${status}`}>
						<MigrationStatusIcon status={status} />
						{buttonText[status]}
					</span>
				)}
			</span>
			{'failed' === status && (
				<button type="button" className="bl-qs__retry">
					<MigrationStatusIcon status="in-progress" />
					{__('Retry', 'betterlinks')}
				</button>
			)}
		</label>
	);
};
