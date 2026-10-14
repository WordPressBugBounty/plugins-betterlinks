import React, { useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { Formik, Field, Form } from 'formik';
import { __ } from '@wordpress/i18n';
import { betterlinks_nonce, generateSlug } from 'utils/helper';
import { FolderIcon } from 'components/Icons';

const propTypes = {
	catId: PropTypes.number,
	catName: PropTypes.string,
	catSlug: PropTypes.string,
	submitHandler: PropTypes.func,
	hideHandler: PropTypes.func,
};

const CloseIcon = () => (
	<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
		<path d="M13 1 1 13M1 1l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

export default function CatForm({ catId = 0, catName = '', catSlug = '', submitHandler, hideHandler }) {
	const [slugIsExists, setSlugIsExists] = useState(false);
	const catSlugUniqueCheck = (slug, ID) => {
		let form_data = new FormData();
		form_data.append('action', 'betterlinks/admin/cat_slug_unique_checker');
		form_data.append('security', betterlinks_nonce);
		form_data.append('ID', ID);
		form_data.append('slug', slug);
		return axios.post(ajaxurl, form_data).then(
			(response) => {
				if (response.data) {
					setSlugIsExists(response.data.data);
					return response.data.data;
				}
			},
			(error) => {
				console.log(error);
			}
		);
	};

	const onSubmit = (values) => {
		catSlugUniqueCheck(values.term_slug, values.ID).then((isUnique) => {
			if (!isUnique) {
				const term_name = values.term_name.trim();
				if (term_name) {
					values.term_name = term_name;
					hideHandler(false);
					return submitHandler(values);
				}
			}
		});
	};
	return (
		<React.Fragment>
			<Formik
				initialValues={{
					ID: catId,
					term_name: catName,
					term_slug: catSlug,
					term_type: 'category',
				}}
				onSubmit={(values, { setSubmitting }) => {
					setSubmitting(false);
					onSubmit(values);
				}}
			>
				{(props) => {
					const nameChangeHandler = (e) => {
						props.setFieldValue('term_name', e.target.value);
						props.setFieldValue('term_slug', generateSlug(e.target.value));
						setSlugIsExists(false);
					};

					// Edit lives in a dialog of its own, so it wears the shared
					// `bl-term-modal` chrome — the same dialog Manage Categories opens.
					// Create renders inline at the foot of a board column and keeps its
					// bare single-field layout.
					if (catId > 0) {
						return (
							<Form className="bl-term-modal">
								<div className="bl-term-modal__header">
									<div className="bl-term-modal__heading">
										<span className="bl-term-modal__badge">
											<FolderIcon size={20} />
										</span>
										<h3 className="bl-term-modal__title">{__('Edit category', 'betterlinks')}</h3>
									</div>
									<button type="button" className="bl-term-modal__close" onClick={() => hideHandler(false)} aria-label={__('Close', 'betterlinks')}>
										<CloseIcon />
									</button>
								</div>

								<div className="bl-term-modal__body">
									<div className="bl-term-modal__field">
										<label className="bl-term-modal__label" htmlFor="term_name">
											{__('Name', 'betterlinks')} <span className="bl-term-modal__req">*</span>
										</label>
										<Field
											id="term_name"
											name="term_name"
											placeholder={__('e.g. Marketing', 'betterlinks')}
											className={`bl-term-modal__input ${slugIsExists ? 'is-error' : ''}`}
											onChange={nameChangeHandler}
											autoFocus
										/>
										{slugIsExists == true && <span className="bl-term-modal__error">{__('Category already exists', 'betterlinks')}</span>}
									</div>
								</div>

								<div className="bl-term-modal__footer">
									<button type="button" className="bl-term-modal__btn bl-term-modal__btn--ghost" onClick={() => hideHandler(false)}>
										{__('Cancel', 'betterlinks')}
									</button>
									<button type="submit" className="bl-term-modal__btn bl-term-modal__btn--primary" disabled={!props.values.term_name.trim()}>
										{__('Save changes', 'betterlinks')}
									</button>
								</div>
							</Form>
						);
					}

					return (
						<Form className={slugIsExists ? 'w-100 is-invalid' : 'w-100'}>
							<span className="btl-form-group">
								<Field
									id="term_name"
									name="term_name"
									placeholder={__('* Name', 'betterlinks')}
									className="btl-form-control"
									onChange={nameChangeHandler}
									required
									autoFocus
								/>
							</span>
							{slugIsExists == true && <div className="errorlog">Already Exists</div>}
							<button className="btl-create-category-submit" type="submit">
								{__('Submit', 'betterlinks')}
							</button>
						</Form>
					);
				}}
			</Formik>
		</React.Fragment>
	);
}

CatForm.propTypes = propTypes;