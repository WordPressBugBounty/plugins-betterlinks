import { useState } from 'react';
import _ from 'lodash';
import { __ } from '@wordpress/i18n';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Formik, Form, Field, FieldArray } from 'formik';
import { update_option } from 'redux/actions/settings.actions';
import { generateSlug, saveSettingsHandler } from 'utils/helper';
import ConfirmDeleteModal from 'components/ConfirmDeleteModal';
import { FieldsIcon } from 'components/Settings/Icons';

const DOC_URL = 'https://betterlinks.io/docs/add-custom-fields-in-betterlinks/';

const stroke = {
	fill: 'none',
	stroke: 'currentColor',
	strokeWidth: 1.8,
	strokeLinecap: 'round',
	strokeLinejoin: 'round',
};

const InfoIcon = ({ size = 17 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...stroke}>
		<circle cx="12" cy="12" r="9" />
		<path d="M12 11v5M12 8h.01" />
	</svg>
);

const TrashIcon = ({ size = 17 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...stroke}>
		<path d="M4 7h16M10 4h4a1 1 0 0 1 1 1v2H9V5a1 1 0 0 1 1-1Z" />
		<path d="M6.5 7l.7 11.1A2 2 0 0 0 9.2 20h5.6a2 2 0 0 0 2-1.9L17.5 7M10 11v5M14 11v5" />
	</svg>
);

const PlusIcon = ({ size = 17 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...stroke}>
		<path d="M12 5v14M5 12h14" />
	</svg>
);

const AlertIcon = ({ size = 15 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...stroke}>
		<circle cx="12" cy="12" r="9" />
		<path d="M12 7v5M12 16h.01" />
	</svg>
);

// Rows are `{ label, value }` pairs — `value` is the generated slug that the
// REST payload and the per-link fields key off.
const emptyField = () => ({ label: '', value: '' });

const CustomFields = ({ settings, update_option }) => {
	const [formSubmitText, setFormSubmitText] = useState(__('Save Settings', 'betterlinks'));
	// Index awaiting delete confirmation; `null` means the dialog is closed.
	const [pendingDelete, setPendingDelete] = useState(null);
	// Only the row that was just added steals focus — autoFocus on every row
	// yanks the caret back on each re-render.
	const [focusIndex, setFocusIndex] = useState(null);

	const onSubmit = (values, { setFieldError }) => {
		const customFieldsValues = _.map(values?.customFields || [], 'value');
		const hasEmptyValue = _.some(customFieldsValues, (val) => !val || '' === val || val.includes(' ')); // Checks for string is valid or not.

		if (customFieldsValues.length === 0 && !settings?.customFields?.length) {
			setFieldError('customFields', __('Please create at least one Custom Field to save.', 'betterlinks'));
			return;
		}
		if (hasEmptyValue) {
			setFieldError('customFields', __('Please fill all the fields', 'betterlinks'));
			return;
		}
		const uniqueValues = [...new Set(customFieldsValues)];
		if (JSON.stringify(customFieldsValues) !== JSON.stringify(uniqueValues)) {
			setFieldError('customFields', __('Field label must be unique', 'betterlinks'));
			return;
		}
		saveSettingsHandler(values, update_option, setFormSubmitText);
	};

	return (
		<Formik initialValues={{ ...settings }} onSubmit={onSubmit}>
			{({ values }) => (
				<Form>
					<div className="bl-cf">
						<div className="bl-cf__note">
							<InfoIcon />
							<p>
								<strong>{__('Note:', 'betterlinks')} </strong>
								{__(
									'It will allow you to add Custom Text Fields to store additional information alongside BetterLinks default fields for each link. For more info, ',
									'betterlinks'
								)}
								<a href={DOC_URL} target="_blank" rel="noopener noreferrer">
									{__('Click here', 'betterlinks')}
								</a>
							</p>
						</div>

						<FieldArray
							name="customFields"
							render={(arrayHelpers) => {
								const fields = values?.customFields || [];
								const error = arrayHelpers.form?.errors?.customFields;

								const addField = () => {
									arrayHelpers.push(emptyField());
									arrayHelpers.form.setFieldError('customFields', undefined);
									setFocusIndex(fields.length);
								};

								const confirmDelete = () => {
									if (pendingDelete === null) return;
									arrayHelpers.remove(pendingDelete);
									setPendingDelete(null);
								};

								return (
									<>
										{fields.length > 0 ? (
											<div className="bl-cf__list">
												{fields.map((field, index) => (
													<div className="bl-cf__row" key={index}>
														<div className="bl-cf__field">
															<Field
																className="bl-cf__input"
																name={`customFields.${index}.label`}
																placeholder={__('e.g. Campaign Owner', 'betterlinks')}
																autoFocus={focusIndex === index}
																onChange={(e) => {
																	arrayHelpers.form.setFieldValue(`customFields.${index}.label`, e.target.value);
																	arrayHelpers.form.setFieldValue(`customFields.${index}.value`, generateSlug(e.target.value));
																}}
															/>
															{!!field?.value && (
																<span className="bl-cf__slug">
																	{__('Stored as', 'betterlinks')} <code>{field.value}</code>
																</span>
															)}
														</div>
														<button
															type="button"
															className="bl-cf__remove"
															aria-label={__('Remove this custom field', 'betterlinks')}
															title={__('Remove', 'betterlinks')}
															onClick={() => setPendingDelete(index)}
														>
															<TrashIcon />
														</button>
													</div>
												))}
											</div>
										) : (
											<div className="bl-cf__empty">
												<FieldsIcon size={26} />
												<p className="bl-cf__empty-title">{__('No custom fields yet', 'betterlinks')}</p>
												<p className="bl-cf__empty-desc">
													{__('Add your first custom text field to store extra information alongside every link.', 'betterlinks')}
												</p>
											</div>
										)}

										<button type="button" className="bl-cf__add" onClick={addField}>
											<PlusIcon />
											{__('Add Custom Field', 'betterlinks')}
										</button>

										{!!error && (
											<p className="bl-cf__error" role="alert">
												<AlertIcon />
												{error}
											</p>
										)}

										<ConfirmDeleteModal
											isOpen={pendingDelete !== null}
											onClose={() => setPendingDelete(null)}
											onConfirm={confirmDelete}
											title={__('Delete this custom field?', 'betterlinks')}
											description={__('The field will be removed from every link once you save your settings.', 'betterlinks')}
											confirmLabel={__('Delete Field', 'betterlinks')}
										/>
									</>
								);
							}}
						/>

						<div className="bl-set-footer">
							<button className="bl-set-save" type="submit">
								{formSubmitText}
							</button>
						</div>
					</div>
				</Form>
			)}
		</Formik>
	);
};

const mapDispatchToProps = (dispatch) => {
	return {
		update_option: bindActionCreators(update_option, dispatch),
	};
};

export default connect(null, mapDispatchToProps)(CustomFields);
