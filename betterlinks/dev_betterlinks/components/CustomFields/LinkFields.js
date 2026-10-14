import { __ } from '@wordpress/i18n';
import { Field } from 'formik';
import { useEffect } from 'react';

/**
 * Per-link custom field inputs, shown in the Add/Edit Link drawer once at least
 * one field is defined in Settings → Custom Fields.
 *
 * The enable switch uses the drawer's `.btl-checkbox-field` + `.text` toggle-row
 * markup. That wrapper is what turns `.btl-check` into the pill switch — on its
 * own the class is unstyled, so the previous label-above-input form group
 * rendered a bare native checkbox floating under the heading.
 */
const LinkFields = ({ props, customFields }) => {
	const useCustomFields = props.values?.param_struct?.useCustomFields;

	useEffect(() => {
		if (customFields?.length > 0 && undefined === useCustomFields) {
			props.setFieldValue('param_struct.useCustomFields', true);
		}
	}, []);

	return (
		<>
			<label className="btl-checkbox-field" htmlFor="useCustomFields">
				<span className="text">
					{__('Custom Fields', 'betterlinks')}
					<div className="btl-tooltip">
						<span className="dashicons dashicons-info-outline"></span>
						<span className="btl-tooltiptext">
							{__('Store extra information alongside this link. Manage the fields in Settings → Custom Fields.', 'betterlinks')}
						</span>
					</div>
				</span>
				<Field
					id="useCustomFields"
					className="btl-check"
					name="param_struct.useCustomFields"
					type="checkbox"
					checked={!!useCustomFields}
					onChange={() => props.setFieldValue('param_struct.useCustomFields', !useCustomFields)}
				/>
			</label>

			{useCustomFields &&
				customFields.map((field, index) => (
					<div key={field?.value || index} className="btl-modal-form-group">
						{/* The label is author-defined at runtime, so it is rendered as-is —
						    passing a variable to __() cannot be extracted for translation. */}
						<label className="btl-modal-form-label" htmlFor={field.value}>
							{field.label}
						</label>
						<Field
							className="btl-modal-form-control"
							id={field.value}
							name={`param_struct[${field.value}]`}
							onChange={(e) => {
								props.setFieldValue(`param_struct[${field.value}]`, e.target.value);
							}}
						/>
					</div>
				))}
		</>
	);
};

export default LinkFields;
