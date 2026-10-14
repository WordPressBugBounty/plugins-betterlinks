import { useField } from 'formik';
import Select2 from 'react-select';
import { is_pro_enabled } from 'utils/helper';

const Select = (props) => {
	const [field, , { setValue: setThisFieldValue }] = useField(props.name);
	const isCloakDisabled = ['cloak', 'pro'].includes(field.value) && !is_pro_enabled;
	const defaultValue = isCloakDisabled ? '307' : field.value;

	if (isCloakDisabled) {
		setThisFieldValue('307');
	}

	const onChange = (option) => {
		if (option == null) {
			return props.setFieldValue(field.name, '');
		}
		if (!!props?.isQuickSetup) {
			props?.setLinkOptions((prev) => ({
				...prev,
				redirect_type: props.isMulti ? option.map((item) => item.value) : option.value,
			}));
		}
		return props.setFieldValue(field.name, props.isMulti ? option.map((item) => item.value) : option.value);
	};

	return (
		<React.Fragment>
			<Select2
				className={`btl-modal-select--full ${props.value && props.value.find((item) => item.value == 'pro') ? 'btl-modal-select-need-pro-teaser' : ''}`}
				classNamePrefix="btl-react-select"
				id={field.id}
				name={field.name}
				defaultValue={props.value && props.value.filter((item) => item.value == (defaultValue || '307'))}
				onChange={onChange}
				options={props.value}
				isMulti={props.isMulti}
				isDisabled={props.disabled}
				isOptionDisabled={(option) => option.disabled}
			/>
		</React.Fragment>
	);
};
export default Select;
