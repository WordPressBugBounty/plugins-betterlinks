import { __ } from '@wordpress/i18n';
import GettingStarted from './GettingStarted';
import Configuration from './Configuration';
import Migration from './Migration';
import CreateLink from './CreateLinks';
import Finish from './Finish';
import { Fragment, useCallback, useContext, useEffect, useState } from 'react';
import { SetupContext } from 'index';
import { migratePluginsData } from './quicksetup.helper';
import { generateSlug, makeRequest, migratable_plugins, route_path, shortURLUniqueCheck } from 'utils/helper';
import { connect } from 'react-redux';
import { update_migration_result, update_quick_setup } from 'redux/actions/quick-setup.actions';
import { bindActionCreators } from 'redux';
import { add_new_link } from 'redux/actions/links.actions';
import { useHistory } from 'react-router-dom';

const CheckIcon = () => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<path d="m4 12.5 5 5L20 6.5" />
	</svg>
);

const ArrowIcon = ({ dir = 'right' }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		width="16"
		height="16"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
		style={'left' === dir ? { transform: 'rotate(180deg)' } : undefined}
	>
		<path d="M4 12h15" />
		<path d="m13 6 6 6-6 6" />
	</svg>
);

function getSteps() {
	const isMigrationExists = Object.values(migratable_plugins).some((plugin) => plugin);
	if (!isMigrationExists) {
		return [__('Getting Started', 'betterlinks'), __('Configuration', 'betterlinks'), __('Create Link', 'betterlinks'), __('Finish', 'betterlinks')];
	}
	return [__('Getting Started', 'betterlinks'), __('Configuration', 'betterlinks'), __('Migration', 'betterlinks'), __('Create Link', 'betterlinks'), __('Finish', 'betterlinks')];
}

const getSetupStepComponents = (component) => {
	const isMigrationExists = Object.values(migratable_plugins).some((plugin) => plugin);
	if (!isMigrationExists) {
		const components = {
			0: <GettingStarted />,
			1: <Configuration />,
			2: <CreateLink />,
			3: <Finish />,
		};
		return components[component];
	}
	const components = {
		0: <GettingStarted />,
		1: <Configuration />,
		2: <Migration />,
		3: <CreateLink />,
		4: <Finish />,
	};
	return components[component];
};

const SetupCanvas = (props) => {
	const history = useHistory();
	const steps = getSteps();
	const {
		activeStep,
		setActiveStep,
		clientConsent,
		update_option,
		settings,
		linkOptions,
		setLinkOptions,
		setErrors,
		terms,
		migrationSettings,
		setModalIsOpen,
		modalConfirm,
		setModalConfirm,
		setMigrationStatus,
	} = useContext(SetupContext);
	const [isNextDisabled, setNextDisabled] = useState(false);

	const isMigrationExists = Object.values(migratable_plugins).some((plugin) => plugin);
	useEffect(() => {
		if (props.isCreated) {
			setActiveStep(4);
		}
		if (modalConfirm) {
			migratePluginsData(migrationSettings, setMigrationStatus, props.update_migration_result);
		}
	}, [props.isCreated, activeStep, modalConfirm]);

	// Refactored to handle different steps with a switch-case for clarity
	const handleStepChange = () => {
		switch (activeStep) {
			case 1:
				update_option(settings);
				setLinkOptions({
					...settings,
					...linkOptions,
				});
				setActiveStep(2);
				break;
			case 2: {
				if (isMigrationExists) {
					setModalIsOpen(true);
					setModalConfirm(true);
				} else {
					submitLinkHandler(linkOptions, setErrors);
				}
				break;
			}
			case 3:
				if (isMigrationExists) {
					submitLinkHandler(linkOptions, setErrors);
				} else {
					completeSetup();
				}
				break;
			case 4:
				completeSetup();
				break;
			default:
				break;
		}
	};

	// Extracted submit logic into a separate function for better readability
	const submitLinkHandler = (values, setErrorCallback) => {
		const regex = /<script\b[^>]*>[\s\S]*?<\/script\b[^>]*>/;
		if (regex.test(values.link_title)) {
			setErrorCallback((prev) => ({
				...prev,
				link_title: __('Please ensure the link title does not contain any script.', 'betterlinks'),
			}));
			return;
		}
		onSubmit(values);
	};
	const onSubmit = (values) => {
		const { short_url } = values;
		values.short_url = short_url.substring(0, short_url.length - +(short_url.lastIndexOf('/') == short_url.length - 1));
		shortURLUniqueCheck(values?.short_url, values?.ID, () => {}).then((isDuplicate) => {
			if (!isDuplicate) {
				if (!values.cat_id) {
					const cat = terms?.terms?.find((item) => item?.term_slug == 'uncategorized');
					values.cat_id = cat?.ID || 1;
				}
				if (!values.link_slug) {
					values.link_slug = generateSlug(values.link_title);
				}
				if (isNaN(values?.cat_id)) {
					values.cat_slug = generateSlug(values.cat_id);
				}
				values.wildcards = Number(values.short_url.includes('*'));
				if (values.cat_id) {
					const link_title = values.link_title.trim();
					if (link_title) {
						values.link_title = link_title;

						props
							.add_new_link(values)
							.then((response) => {
								if (response?.data) {
									props.update_quick_setup({ isCreated: true, createdLink: response.data?.data || null });
									setActiveStep(isMigrationExists ? 4 : 3);
								}
							})
							.catch((error) => console.log('---error (submitHandler)--', { error }));
					}
				}
			}
			props.update_quick_setup({ duplicateLink: isDuplicate });
		});
	};

	const completeSetup = async () => {
		const res = await makeRequest({
			action: 'betterlinks__complete_setup',
		});
		const data = res.data?.data;
		if (data?.result === 'complete') {
			history.push(route_path + 'admin.php?page=betterlinks');
			history.go(0);
		}
	};

	useEffect(() => {
		if (isMigrationExists && 2 == activeStep) {
			const isNextDisabled = !Object.keys(migratable_plugins)
				.filter((item) => migratable_plugins[item])
				.some((item) => migrationSettings[item]);
			setNextDisabled(isNextDisabled);
		} else if ((isMigrationExists && 3 == activeStep) || (!isMigrationExists && 2 == activeStep)) {
			setNextDisabled('' == linkOptions.link_title || '' == linkOptions.target_url);
		} else {
			setNextDisabled(false);
		}
	}, [activeStep, migrationSettings, linkOptions.link_title, linkOptions.target_url]);

	const isLastStep = activeStep === steps.length - 1;

	return (
		<div className="bl-qs">
			{/* <div className="bl-qs__masthead">
				<h1 className="bl-qs__title">{__('Welcome to BetterLinks', 'betterlinks')}</h1>
				<p className="bl-qs__subtitle">{__('A few quick steps and your link management is ready to go.', 'betterlinks')}</p>
			</div> */}

			{/* Progress stepper */}
			<div className="bl-qs__steps" role="list" aria-label={__('Setup progress', 'betterlinks')}>
				{steps.map((label, index) => (
					<Fragment key={label}>
						{index > 0 && <span className={`bl-qs__step-line${index <= activeStep ? ' is-done' : ''}`} />}
						<div className={`bl-qs__step${index === activeStep ? ' is-active' : ''}${index < activeStep ? ' is-done' : ''}`} role="listitem">
							<span className="bl-qs__step-dot">{index < activeStep ? <CheckIcon /> : index + 1}</span>
							<span className="bl-qs__step-label">{label}</span>
						</div>
					</Fragment>
				))}
			</div>

			<div className="bl-qs__panel">{getSetupStepComponents(activeStep)}</div>

			<div className="bl-qs__footer">
				{[2, 3].includes(activeStep) && (activeStep != 3 || isMigrationExists) && (
					<button type="button" className="bl-qs__skip" onClick={() => setActiveStep(activeStep + 1)}>
						{__('Skip this step', 'betterlinks')}
					</button>
				)}
				{activeStep > 0 && (
					<div className="bl-qs__actions">
						{(activeStep !== 1 || !clientConsent) && (
							<button type="button" className="bl-qs__btn bl-qs__btn--ghost" onClick={() => setActiveStep(activeStep - 1)}>
								<ArrowIcon dir="left" />
								{__('Back', 'betterlinks')}
							</button>
						)}
						<button type="button" className="bl-qs__btn bl-qs__btn--primary" onClick={handleStepChange} disabled={isNextDisabled}>
							{isLastStep ? (
								__('Finish', 'betterlinks')
							) : (
								<>
									{__('Next', 'betterlinks')}
									<ArrowIcon dir="right" />
								</>
							)}
						</button>
					</div>
				)}
			</div>
		</div>
	);
};
const mapStateToProps = (state) => {
	return {
		isCreated: state.quickSetup?.isCreated,
		duplicateLink: state.quickSetup?.duplicateLink,
		ta: state.quickSetup?.ta,
		pl: state.quickSetup?.pl,
		s3r: state.quickSetup?.s3r,
	};
};
const mapDispatchToProps = (dispatch) => ({
	update_quick_setup: bindActionCreators(update_quick_setup, dispatch),
	update_migration_result: bindActionCreators(update_migration_result, dispatch),
	add_new_link: bindActionCreators(add_new_link, dispatch),
});
export default connect(mapStateToProps, mapDispatchToProps)(SetupCanvas);
// export default SetupCanvas;
