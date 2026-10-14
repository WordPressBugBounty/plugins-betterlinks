import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import { useField } from 'formik';
import CreatableSelect2 from 'react-select/creatable';
import { betterlinks_nonce } from 'utils/helper';

const propTypes = {
	linkId: PropTypes.number,
	data: PropTypes.object,
	fieldName: PropTypes.string,
	setFieldValue: PropTypes.func,
};

const Tags = ({ fieldName, linkId, setFieldValue, data, disabled }) => {
	const [selectedTags, setSelectedTags] = useState([]);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (linkId) {
			setIsLoading(true);
			let form_data = new FormData();
			form_data.append('action', 'betterlinks/admin/get_terms');
			form_data.append('security', betterlinks_nonce);
			form_data.append('ID', linkId);
			form_data.append('term_type', 'tags');
			axios.post(ajaxurl, form_data).then(
				(res) => {
					if (res.data.data) {
						const tags = res.data.data.map((item) => ({
							value: item.term_id,
							label: item.term_name,
						}));
						setSelectedTags(tags);
						// Also set the initial Formik value
						setFieldValue(fieldName, tags.map((item) => item.value));
					}
					setIsLoading(false);
				},
				(error) => {
					console.log(error);
					setIsLoading(false);
				}
			);
		}
	}, [linkId]);

	const [field] = useField(fieldName);

	// Initialize tags from form data when duplicating (linkId is 0 but tags_id exists in form)
	useEffect(() => {
		const formValue = field.value;

		// If linkId is 0 (new/duplicate link) but we have tags_id in form data, initialize them
		if (!linkId && formValue && (Array.isArray(formValue) ? formValue.length > 0 : formValue)) {
			const tagsArray = Array.isArray(formValue) ? formValue : [formValue];
			const tags = tagsArray
				.filter(tagId => {
					// Find the tag in the available terms
					return data?.terms?.some(term => term.ID === tagId && term.term_type === 'tags');
				})
				.map(tagId => {
					const term = data?.terms?.find(term => term.ID === tagId && term.term_type === 'tags');
					return {
						value: term.ID,
						label: term.term_name,
					};
				});

			if (tags.length > 0) {
				setSelectedTags(tags);
			}
		}
	}, [data?.terms, field.value, linkId]);
	const onChange = (option) => {
		// Update local state for UI
		setSelectedTags(option || []);
		
		// Update Formik state for form submission
		if (option == null || option.length === 0) {
			return setFieldValue(field.name, '');
		}

		return setFieldValue(
			field.name,
			option.map((item) => item.value)
		);
	};
	return (
		<React.Fragment>
			<CreatableSelect2
				// `btl-modal-form-control` is the plain-input skin (border, radius,
				// min-height, inset padding). react-select draws its own control, so
				// putting it on the wrapper nested a second box around the field —
				// see Category.js, which uses `btl-modal-select` alone.
				className="btl-modal-select"
				isClearable
				id={field.id}
				name={field.name}
				value={selectedTags}
				onChange={onChange}
				classNamePrefix="btl-react-select"
				options={
					data.terms &&
					data.terms
						.filter((item) => item.term_type == 'tags')
						.sort((a, b) => a.term_name.localeCompare(b.term_name))
						.map((item) => ({
							value: item.ID,
							label: item.term_name,
						}))
				}
				isDisabled={disabled || isLoading}
				isLoading={isLoading}
				isMulti={true}
				placeholder={isLoading ? 'Loading tags...' : 'Select or create tags...'}
			/>
		</React.Fragment>
	);
};

export default Tags;
Tags.propTypes = propTypes;