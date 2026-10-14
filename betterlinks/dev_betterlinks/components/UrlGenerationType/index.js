import React, { useState, useEffect, useRef } from 'react';
import { useField } from 'formik';
import Select from 'react-select';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';

const propTypes = {
    name: PropTypes.string,
    options: PropTypes.array,
    defaultValue: PropTypes.string,
    setFieldValue: PropTypes.func,
    className: PropTypes.string,
    classNamePrefix: PropTypes.string,
    isMulti: PropTypes.bool,
    placeholder: PropTypes.string,
};

const UrlGenerationType = (props) => {
    const [field, , { setValue: setThisFieldValue }] = useField(props.name);
    const [selectValue, setSelectValue] = useState(null);
    const isInitialized = useRef(false);
    const userHasChanged = useRef(false);

    useEffect(() => {
        // If user has manually changed the selection, just sync with field value
        if (userHasChanged.current) {
            const currentOption = (props.options || []).find((item) => item.value === field.value);
            if (currentOption && selectValue?.value !== currentOption.value) {
                setSelectValue(currentOption);
            }
            return;
        }

        // Only run initialization once
        if (isInitialized.current) {
            return;
        }

        // First, try to use the defaultValue prop (which handles backward compatibility)
        const defaultOption = (props.options || []).find((item) => item.value === props.defaultValue);
        
        // Then check if field.value exists and is valid in options
        const currentOption = (props.options || []).find((item) => item.value === field.value);
        
        if (defaultOption) {
            // Use the defaultValue first (handles backward compatibility with is_random_string)
            setSelectValue(defaultOption);
            setThisFieldValue(defaultOption.value, false);
            props.setFieldValue(field.name, defaultOption.value);
        } else if (currentOption) {
            // Field value is valid and exists in options
            setSelectValue(currentOption);
        } else {
            // Fallback to 'from_title' if nothing else works
            const fallbackOption = (props.options || []).find((item) => item.value === 'from_title');
            if (fallbackOption) {
                setSelectValue(fallbackOption);
                setThisFieldValue(fallbackOption.value, false);
                props.setFieldValue(field.name, fallbackOption.value);
            }
        }
        
        isInitialized.current = true;
    }, [field.value, props.options, props.defaultValue]);


    const handleChange = (option) => {
        if (option == null) {
            return props.setFieldValue(field.name, '');
        }

        // Mark that user has manually changed the selection
        userHasChanged.current = true;

        // Update the selected value
        setSelectValue(option);

        // Update field value
        setThisFieldValue(option.value, false);
        props.setFieldValue(field.name, option.value);
    };

    return (
        <Select
            name={props.name}
            options={props.options || []}
            value={selectValue}
            onChange={handleChange}
            className={props.className}
            classNamePrefix={props.classNamePrefix}
            isMulti={props.isMulti}
            placeholder={props.placeholder || __('Select option...', 'betterlinks')}
            /* Use default CSS-based styling (no inline style overrides) so appearance matches RedirectType */
            isSearchable={false}
        />
    );
};

UrlGenerationType.propTypes = propTypes;
UrlGenerationType.defaultProps = {
    className: '',
    classNamePrefix: 'btl-react-select',
    isMulti: false,
    placeholder: '',
};

export default UrlGenerationType;
