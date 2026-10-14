import { __ } from '@wordpress/i18n';
import Category from 'components/Terms/Category';
import { Form, Formik } from 'formik';
import { useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { update_option } from 'redux/actions/settings.actions';
import { fetch_terms_data } from 'redux/actions/terms.actions';
import { saveSettingsHandler } from 'utils/helper';
import Select2 from 'react-select';

const FluentBoardSettings = ({ settings, terms, update_option, fetch_terms_data }) => {
	const [formSubmitText, setFormSubmitText] = useState(__('Save Settings', 'betterlinks'));
	return (
		<>
			<Formik
				enableReinitialize={true}
				initialValues={{ ...settings }}
				onSubmit={(values) => {
					saveSettingsHandler(values, update_option, setFormSubmitText);
					fetch_terms_data();
				}}
			>
				{(props) => {
					const { fbs } = props.values;
					const urlOnDeleteValue = deleteOnActions.filter((item) => item.value === (fbs?.delete_on || 'task_delete'));
					return (
						<Form className="btl-fbs">
							<span className="btl-form-group">
								<label className="btl-form-label" style={{ 'min-width': '245px' }}>
									{__('Enable Link Management', 'betterlinks')}
									<div className="btl-tooltip" style={{ marginLeft: '5px' }}>
										<span className="dashicons dashicons-info-outline" />
										<span className="btl-tooltiptext" style={tooltipStyles.tooltipText}>
											{__('Enabling this option will allow you to create short links for tasks directly within the Fluent Boards. For more info, ', 'betterlinks')}
											<a href="https://betterlinks.io/docs/fluent-boards-link-management-with-betterlinks" target="_blank" style={tooltipStyles.tooltipTextAnchor}>
												{__('Click Here', 'betterlinks')}
											</a>
										</span>
									</div>
								</label>
								<div className="btl-form-field">
									<label className="btl-checkbox-field block">
										<input
											className="btl-check"
											name="fbs.enable_fbs"
											type="checkbox"
											onChange={(e) => props.setFieldValue('fbs.enable_fbs', e.target.checked)}
											checked={fbs?.enable_fbs}
										/>
										<span className="text">{__('', 'betterlinks')}</span>
									</label>
								</div>
							</span>
							{props.values?.fbs?.enable_fbs && (
								<>
									<span className="btl-form-group">
										<label className="btl-form-label" style={{ 'min-width': '245px' }}>
											{__('Choose a Default Category', 'betterlinks')}
											<div className="btl-tooltip" style={{ marginLeft: '5px' }}>
												<span className="dashicons dashicons-info-outline" />
												<span className="btl-tooltiptext" style={tooltipStyles.tooltipText}>
													{__(
														'This category will be assigned by default when you create links inside Fluent Boards for your tasks. You can manage your links from BetterLinks Dashboard afterwards.',
														'betterlinks'
													)}
												</span>
											</div>
										</label>
										<div className="btl-form-field">
											<Category catId={parseInt(fbs?.cat_id)} data={{ terms }} fieldName="fbs.cat_id" setFieldValue={props.setFieldValue} />
										</div>
									</span>
									<span className="btl-form-group">
										<label className="btl-form-label" style={{ 'min-width': '245px' }}>
											{__('Show Category on Dashboard', 'betterlinks')}
											<div className="btl-tooltip" style={{ marginLeft: '5px' }}>
												<span className="dashicons dashicons-info-outline" />
												<span className="btl-tooltiptext" style={tooltipStyles.tooltipText}>
													{__('Enable this option to display the selected category in Manage Links.', 'betterlinks')}
												</span>
											</div>
										</label>
										<div className="btl-form-field">
											<label className="btl-checkbox-field block">
												<input
													className="btl-check"
													name="fbs.show_fbs_category"
													type="checkbox"
													onChange={(e) => props.setFieldValue('fbs.show_fbs_category', e.target.checked)}
													checked={fbs?.show_fbs_category}
												/>
												<span className="text">{__('', 'betterlinks')}</span>
											</label>
										</div>
									</span>
									<span className="btl-form-group">
										<label className="btl-form-label" style={{ 'min-width': '245px' }}>
											{__('Delete Link on', 'betterlinks')}
											<div className="btl-tooltip" style={{ marginLeft: '5px' }}>
												<span className="dashicons dashicons-info-outline" />
												<span className="btl-tooltiptext" style={tooltipStyles.tooltipText}>
													{__('By selecting these options, you can specify when to delete Fluent Board Links created by BetterLinks.', 'betterlinks')}
												</span>
											</div>
										</label>
										<div className="btl-form-field">
											<Select2
												className={`btl-modal-select--full`}
												classNamePrefix="btl-react-select"
												id={'fbs.delete_on'}
												name={'fbs.delete_on'}
												defaultValue={urlOnDeleteValue}
												onChange={(option) => {
													if (option === null) {
														return props.setFieldValue('fbs.delete_on', '');
													}
													return props.setFieldValue('fbs.delete_on', option.value);
												}}
												options={deleteOnActions}
												value={urlOnDeleteValue}
												isMulti={false}
											/>
										</div>
									</span>
								</>
							)}
							<button className="button-primary btn-save-settings" type="submit">
								{formSubmitText}
							</button>
						</Form>
					);
				}}
			</Formik>
		</>
	);
};
const mapDispatchToProps = (dispatch) => ({
	update_option: bindActionCreators(update_option, dispatch),
	fetch_terms_data: bindActionCreators(fetch_terms_data, dispatch),
});

const tooltipStyles = {
	tooltipText: {
		width: '255px',
		textAlign: 'left',
		lineHeight: '1.2em',
	},
	tooltipTextAnchor: {
		color: 'inherit',
	},
};

const deleteOnActions = [
	{
		value: 'task_delete',
		label: 'Task Delete',
	},
	{
		value: 'task_archive',
		label: 'Task Archive',
	},
];

export default connect(null, mapDispatchToProps)(FluentBoardSettings);
