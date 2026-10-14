import { __ } from '@wordpress/i18n';
import ProBadge from 'components/Badge/ProBadge';
import RedirectType from 'components/RedirectType';
import { Field, Form, Formik } from 'formik';
import { SetupContext } from 'index';
import { useContext } from 'react';
import { redirectType } from 'utils/data';
import { is_pro_enabled, site_url } from 'utils/helper';
import { Row, ToggleLine } from 'components/Settings/parts';

const Configuration = () => {
	const { settings, setSettings, modal } = useContext(SetupContext);
	const { setUpgradeToProModal, openUpgradeToProModal } = modal;

	const handleOptions = (props, key) => {
		props.setFieldValue(key, !props.values?.[key]);
		setSettings((prev) => ({
			...prev,
			[key]: !props.values?.[key],
		}));
	};
	return (
		<>
			<div className="bl-qs__head">
				<h2 className="bl-qs__head-title">{__('Configuration', 'betterlinks')}</h2>
				<p className="bl-qs__head-desc">
					{__(
						'Adjust core settings to match your preferences — link options, redirect type and tracking — for a seamless setup experience.',
						'betterlinks'
					)}
				</p>
			</div>
			<div className="option">
				<Formik initialValues={{ ...settings }}>
					{(props) => {
						return (
							<Form>
								<div>
									<Row label={__('Link Options', 'betterlinks')} desc={__('Default attributes applied to the links you create.', 'betterlinks')}>
											<div className="bl-set-togglelist">
												<ToggleLine
													label={__('No Follow', 'betterlinks')}
													tooltip={__('This will add nofollow attribute to your link. (Recommended)', 'betterlinks')}
													name="nofollow"
													checked={!!props.values?.nofollow}
													onChange={() => handleOptions(props, 'nofollow')}
												/>
												<ToggleLine
													label={__('Sponsored', 'betterlinks')}
													tooltip={__('This will add sponsored attribute to your link. (Recommended for Affiliate links)', 'betterlinks')}
													name="sponsored"
													checked={!!props.values?.sponsored}
													onChange={() => handleOptions(props, 'sponsored')}
												/>
												<ToggleLine
													label={__('Parameter Forwarding', 'betterlinks')}
													tooltip={__('This will pass the parameters you have set in the target URL', 'betterlinks')}
													name="param_forwarding"
													checked={!!props.values?.param_forwarding}
													onChange={() => handleOptions(props, 'param_forwarding')}
												/>
												<ToggleLine
													label={__('Tracking', 'betterlinks')}
													tooltip={__('This will let you check Analytics report of your links', 'betterlinks')}
													name="track_me"
													checked={!!props.values?.track_me}
													onChange={() => handleOptions(props, 'track_me')}
												/>
											</div>
										</Row>

										<Row
											label={__('Link Prefix', 'betterlinks')}
											desc={
												<>
													{__('The prefix is added before your shortened slug, e.g.', 'betterlinks')}{' '}
													{betterLinksHooks.applyFilters('site_url', site_url)}
													{props.values.prefix && (
														<>
															/<strong>{props.values.prefix}</strong>
														</>
													)}
													{__('/your-link.', 'betterlinks')}
												</>
											}
										>
											<Field
												className="btl-text-field"
												name="prefix"
												value={props.values?.prefix ?? 'go'}
												type="text"
												onChange={(option) => {
													props.setFieldValue('prefix', option.target.value);
													setSettings((prev) => ({
														...prev,
														prefix: option.target.value,
													}));
												}}
											/>
										</Row>

										<Row label={__('Redirect Type', 'betterlinks')} desc={__('The HTTP status used when redirecting your short links.', 'betterlinks')}>
											<RedirectType
												className="btl-modal-select--full"
												classNamePrefix="btl-react-select"
												id="redirect_type"
												name="redirect_type"
												setUpgradeToProModal={setUpgradeToProModal}
												value={[
													...redirectType,
													{
														value: is_pro_enabled ? 'cloak' : 'pro',
														label: is_pro_enabled ? (
															__('Cloaked', 'betterlinks')
														) : (
															<>
																{__('Cloaked', 'betterlinks')}
																<ProBadge />
															</>
														),
													},
												]}
												defaultValue={settings.redirect_type == 'cloak' && !is_pro_enabled ? '307' : settings.redirect_type}
												setFieldValue={props.setFieldValue}
												isMulti={false}
												isQuickSetup={true}
												setSettings={setSettings}
											/>
										</Row>

										<Row label={__('Wildcards', 'betterlinks')}>
											<ToggleLine
												label={__('Use Wildcards?', 'betterlinks')}
												tooltip={__('To use wildcards, put an asterisk (*) after the folder name that you want to redirect.', 'betterlinks')}
												name="wildcards"
												checked={!!props.values?.wildcards}
												onChange={() => handleOptions(props, 'wildcards')}
											/>
										</Row>

										{/* Pro injects its real Force HTTPS control here. */}
										{betterLinksHooks.applyFilters(
											'BetterLinksQuickSetupConfig',
											<Row label={__('Force HTTPS', 'betterlinks')} badge={<ProBadge />} className="is-teaser" onClick={openUpgradeToProModal}>
												<ToggleLine
													label={__('Enable HTTPS Redirection', 'betterlinks')}
													tooltip={__('This will allow you to redirect your Target URLs in HTTPS.', 'betterlinks')}
													name="force_https"
													locked
													onLocked={openUpgradeToProModal}
												/>
											</Row>,
											{ ...props, handleOptions }
										)}
									</div>
								</Form>
							);
						}}
					</Formik>
			</div>
		</>
	);
};

export default Configuration;
