import React, { useState, useEffect } from 'react';
import { useField } from 'formik';
import Select2 from 'react-select';
import { __ } from '@wordpress/i18n';

const CategorySelect = (props) => {
    const [field, , { setValue: setThisFieldValue }] = useField(props.name);
    const [selectValue, setSelectValue] = useState(null);

    useEffect(() => {
        // Ensure we have options before proceeding
        if (!props.options || props.options.length === 0) {
            return;
        }

        // Skip if we only have loading option
        if (props.options.length === 1 && props.options[0].value === 'loading') {
            return;
        }

        // If field value exists, find the current selected option
        if (field.value) {
            const currentOption = props.options.find((item) => item.value === field.value);
            if (currentOption) {
                setSelectValue(currentOption);
                return;
            }
        }

        // If no field value or field value not found in options, set default to "Uncategorized" (ID: 1)
        const defaultValue = props.defaultValue || '1';
        const defaultOption = props.options.find((item) => item.value === defaultValue);

        if (defaultOption) {
            setSelectValue(defaultOption);
            setThisFieldValue(defaultValue, false);
            props.setFieldValue(field.name, defaultValue);
        } else {
            // Fallback: if "Uncategorized" option is not found, select the first available option
            const firstOption = props.options[0];
            if (firstOption && firstOption.value !== 'loading') {
                setSelectValue(firstOption);
                setThisFieldValue(firstOption.value, false);
                props.setFieldValue(field.name, firstOption.value);
            }
        }
    }, [field.value, props.options, props.defaultValue]);

    const onChange = (option) => {
        // Prevent selecting the loading option
        if (option && option.value === 'loading') {
            return;
        }

        if (option == null) {
            // When option is cleared, default to 'Uncategorized' (ID: 1)
            const defaultValue = '1';
            const defaultOption = (props.options || []).find((item) => item.value === defaultValue);

            if (defaultOption) {
                setSelectValue(defaultOption);
                props.setFieldValue(field.name, defaultValue);
            } else {
                // Fallback if "Uncategorized" is not found
                props.setFieldValue(field.name, defaultValue);
            }
            return;
        }

        // Update the selected value
        setSelectValue(option);

        // Update form field value
        props.setFieldValue(field.name, option.value);
    };

    return (
        <React.Fragment>
            <Select2
                className="btl-modal-select--full"
                classNamePrefix="btl-react-select"
                id={field.id}
                name={field.name}
                onChange={onChange}
                options={props.options}
                value={selectValue}
                isMulti={false}
                placeholder={
                    props.options && props.options.length === 1 && props.options[0].value === 'loading'
                        ? __('Loading...', 'betterlinks')
                        : __('Select a category...', 'betterlinks')
                }
                isLoading={props.options && props.options.length === 1 && props.options[0].value === 'loading'}
            />
        </React.Fragment>
    );
};

export default CategorySelect;
