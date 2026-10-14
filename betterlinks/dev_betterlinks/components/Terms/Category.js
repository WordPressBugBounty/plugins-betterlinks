import React from 'react';
import PropTypes from 'prop-types';
import { useField } from 'formik';
import CreatableSelect2 from 'react-select/creatable';

const propTypes = {
	catId: PropTypes.number,
	data: PropTypes.object,
	fieldName: PropTypes.string,
	setFieldValue: PropTypes.func,
};

const Category = ({ catId, data, fieldName, setFieldValue, disabled }) => {
	const [field] = useField(fieldName);

	const onChange = (option) => {
		if (option == null) {
			return setFieldValue(field.name, '');
		}
		return setFieldValue(field.name, option.value);
	};

	const defaultValue = () => {
		if (catId) {
			const termData = data.terms.filter((item) => item.ID == catId);
			if (termData.length > 0) {
				const { ID, term_name } = termData[0];
				return { value: ID, label: term_name };
			}
		} else {
			const { ID, term_name } = data.terms.filter((item) => item.term_slug == 'uncategorized')[0];
			return { value: ID, label: term_name };
		}
	};
	return (
		<React.Fragment>
			{data.terms ? (
				<CreatableSelect2
					className="btl-modal-select"
					id={field.id}
					name={field.name}
					defaultValue={defaultValue()}
					classNamePrefix="btl-react-select"
					onChange={onChange}
					options={data.terms
						.filter((item) => item.term_type == 'category' && item.term_slug != 'uncategorized')
						.sort((a, b) => a.term_name.localeCompare(b.term_name))
						.map((item) => ({
							value: item.ID,
							label: item.term_name,
						}))}
					isDisabled={disabled}
				/>
			) : (
				<div>
					<CreatableSelect2 className="btl-modal-select" id={field.id} classNamePrefix="btl-react-select" isDisabled={disabled} />
				</div>
			)}
		</React.Fragment>
	);
};
Category.propTypes = propTypes;
export default Category;
