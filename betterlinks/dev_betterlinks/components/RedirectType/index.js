import React, { useState, useEffect } from 'react';
import { useField } from 'formik';
import Select2 from 'react-select';
import { __ } from '@wordpress/i18n';
import { is_pro_enabled } from 'utils/helper';

const RedirectType = (props) => {
	const [field, , { setValue: setThisFieldValue }] = useField(props.name);
	const [selectValue, setSelectValue] = useState(null);

	useEffect(() => {
		// Find the current selected option from the available options
		const currentOption = (props.value || []).find((item) => item.value === field.value);
		if (currentOption) {
			setSelectValue(currentOption);
		} else {
			// If current field value is not found in options (like 'cloak' when pro is disabled),
			// set it to the default value
			const defaultOption = (props.value || []).find((item) => item.value === (props.defaultValue || '307'));
			if (defaultOption) {
				setSelectValue(defaultOption);
				setThisFieldValue(defaultOption.value, false);
				props.setFieldValue(field.name, defaultOption.value);
			}
		}
	}, [field.value, props.value, props.defaultValue]);

	const onChange = (option) => {
		if (option == null) {
			return props.setFieldValue(field.name, '');
		}

		// Handle 'pro' option click (show upgrade modal)
		if (option?.value === 'pro') {
			props.setUpgradeToProModal && props.setUpgradeToProModal(true);
			return; // Don't change the value
		}

		// Update the selected value
		setSelectValue(option);

		// for quick setup wizard only
		if (!!props?.isQuickSetup) {
			props.setFieldValue(field.name, option?.value);
			props?.setSettings((prev) => ({
				...prev,
				redirect_type: props.isMulti ? option.map((item) => item.value) : option.value,
			}));
		} else {
			// for normal settings
			props.setFieldValue(field.name, props.isMulti ? option.map((item) => item.value) : option.value);
		}
	};

	return (
		<React.Fragment>
			<Select2
				className={`btl-modal-select--full ${props.value && props.value.find((item) => item.value == 'pro') ? 'btl-modal-select-need-pro-teaser' : ''}`}
				classNamePrefix="btl-react-select"
				id={field.id}
				name={field.name}
				onChange={onChange}
				options={props.value}
				value={selectValue}
				isMulti={props.isMulti}
			/>
		</React.Fragment>
	);
};
export default RedirectType;
