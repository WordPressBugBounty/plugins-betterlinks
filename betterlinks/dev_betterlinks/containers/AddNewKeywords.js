import React, { useState, useEffect, useRef, useMemo } from 'react';
import Modal from 'react-modal';
import { Field, Form, Formik } from 'formik';
import PropTypes from 'prop-types';
import Select2 from 'react-select';
import { __ } from '@wordpress/i18n';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import ActionButton from 'components/ActionButton';
import { getAutoLinksInitialValues, trimmed, is_pro_enabled, pro_version_check } from 'utils/helper';
import { add_keyword, update_keyword } from 'redux/actions/keywords.actions';

const propTypes = {
	data: PropTypes.object,
};

// --- inline icons ---------------------------------------------------------
const TypeIcon = ({ size = 20 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<path d="M4 7V5h16v2M9 19h6M12 5v14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);
const CodeIcon = () => (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<path d="M9 8l-4 4 4 4M15 8l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);
const StatusIcon = () => (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<rect x="3" y="8" width="18" height="8" rx="4" stroke="currentColor" strokeWidth="1.8" />
		<circle cx="9" cy="12" r="2.4" fill="currentColor" />
	</svg>
);
const SlidersIcon = () => (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<path d="M6 4v6M6 14v6M12 4v3M12 11v9M18 4v9M18 17v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
		<circle cx="6" cy="12" r="2" stroke="currentColor" strokeWidth="1.8" />
		<circle cx="12" cy="9" r="2" stroke="currentColor" strokeWidth="1.8" />
		<circle cx="18" cy="15" r="2" stroke="currentColor" strokeWidth="1.8" />
	</svg>
);
const FlagIcon = () => (
	<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<path d="M5 21V4M5 4h11l-2 3 2 3H5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);
const CaseIcon = () => (
	<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<path d="M3 18l4-11 4 11M4.2 14.5h5.6M14 11.5a3 3 0 0 1 6 0V18M20 14.2c-1 .6-2.2.9-3.2.9-1.4 0-2.3-.7-2.3-1.8s.9-1.7 2.4-1.7H20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);
const ExternalIcon = () => (
	<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<path d="M14 4h6v6M20 4l-8 8M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);
const CloseIcon = () => (
	<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
		<path d="M13 1 1 13M1 1l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

// Toggle switch row inside the HTML Options card.
const ToggleRow = ({ icon, label, checked, onChange }) => (
	<label className="bl-kw-toggle">
		<span className="bl-kw-toggle__icon">{icon}</span>
		<span className="bl-kw-toggle__label">{label}</span>
		<span className="bl-kw-toggle__switch">
			<input type="checkbox" checked={!!checked} onChange={onChange} />
			<span className="bl-kw-toggle__slider" />
		</span>
	</label>
);

// Chips-style keyword input. Formik still stores `keywords` as a comma-joined
// string, so the existing submit/dedup logic is untouched — this only changes
// the UX: each keyword becomes a removable chip; a comma (typed OR pasted) or
// Enter commits the current text; Backspace on an empty box removes the last
// chip; and double-clicking a chip edits it inline. Editing an existing keyword
// record hydrates its stored comma string straight into chips.
const KeywordChipsInput = ({ value, onChange, placeholder }) => {
	const chips = useMemo(
		() =>
			(value || '')
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean),
		[value]
	);
	const [inputValue, setInputValue] = useState('');
	const [editIndex, setEditIndex] = useState(-1);
	const [editValue, setEditValue] = useState('');
	const inputRef = useRef(null);

	// Trim, drop empties, de-dupe case-insensitively, and write back the
	// comma-joined string Formik + the submit handler expect.
	const commit = (next) => {
		const seen = new Set();
		const cleaned = [];
		next.forEach((raw) => {
			const t = (raw || '').trim();
			if (!t) return;
			const key = t.toLowerCase();
			if (seen.has(key)) return;
			seen.add(key);
			cleaned.push(t);
		});
		onChange(cleaned.join(', '));
	};

	const addTokens = (tokens) => {
		const parts = tokens.map((s) => s.trim()).filter(Boolean);
		if (parts.length) commit([...chips, ...parts]);
	};

	const handleInputChange = (raw) => {
		// A comma anywhere (typed or pasted) auto-converts completed words to chips
		// and keeps the still-typing remainder in the box.
		if (raw.includes(',')) {
			const parts = raw.split(',');
			const trailing = parts.pop();
			addTokens(parts);
			setInputValue(trailing);
		} else {
			setInputValue(raw);
		}
	};

	const handleInputKeyDown = (e) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			if (inputValue.trim()) {
				addTokens([inputValue]);
				setInputValue('');
			}
		} else if (e.key === 'Backspace' && inputValue === '' && chips.length) {
			commit(chips.slice(0, -1));
		}
	};

	const removeChip = (i) => commit(chips.filter((_, idx) => idx !== i));

	const startEdit = (i) => {
		setEditIndex(i);
		setEditValue(chips[i]);
	};
	const commitEdit = () => {
		if (editIndex < 0) return;
		const next = chips.slice();
		const t = editValue.trim();
		if (t) next[editIndex] = t;
		else next.splice(editIndex, 1);
		setEditIndex(-1);
		setEditValue('');
		commit(next);
	};

	return (
		<div
			className="bl-kw-chips"
			onMouseDown={(e) => {
				if (e.target === e.currentTarget) inputRef.current?.focus();
			}}
		>
			{chips.map((chip, i) =>
				editIndex === i ? (
					<input
						key={`edit-${i}`}
						className="bl-kw-chips__edit"
						value={editValue}
						size={Math.max(editValue.length + 1, 4)}
						autoFocus
						onChange={(e) => setEditValue(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter' || e.key === ',') {
								e.preventDefault();
								commitEdit();
							} else if (e.key === 'Escape') {
								setEditIndex(-1);
								setEditValue('');
							}
						}}
						onBlur={commitEdit}
					/>
				) : (
					<span
						key={`chip-${i}`}
						className="bl-kw-chips__item"
						onDoubleClick={() => startEdit(i)}
						title={__('Double-click to edit', 'betterlinks')}
					>
						<span className="bl-kw-chips__text">{chip}</span>
						<button
							type="button"
							className="bl-kw-chips__remove"
							onClick={() => removeChip(i)}
							aria-label={__('Remove keyword', 'betterlinks')}
						>
							<CloseIcon />
						</button>
					</span>
				)
			)}
			<input
				ref={inputRef}
				type="text"
				className="bl-kw-chips__input"
				value={inputValue}
				placeholder={chips.length ? '' : placeholder}
				onChange={(e) => handleInputChange(e.target.value)}
				onKeyDown={handleInputKeyDown}
				onBlur={() => {
					if (inputValue.trim()) {
						addTokens([inputValue]);
						setInputValue('');
					}
				}}
			/>
		</div>
	);
};

const AddNewKeywords = (props) => {
	const { data = {}, add_keyword, update_keyword, keywords, linksForUpdateModal: allLinks, postTypesProps, children } = props;
	const [duplicate, setDuplicate] = useState([]);
	const [modalIsOpen, setIsOpen] = useState(false);
	const [openPanelType, setOpenPanelType] = useState('HTML');
	const [chooseAbleSavedLink, setChooseAbleSavedLink] = useState([]);
	const { postTypes, postTags, postCategories } = postTypesProps;
	const { settings } = props.settings;
	const isEdit = Object.keys(data).length > 0;
	const boundary = [
		{ value: '', label: 'Blank Space' },
		{ value: 'whitespace', label: 'Blank Space & point' },
		{ value: 'comma', label: 'Comma' },
		{ value: 'point', label: 'Point' },
		{ value: 'none', label: 'None' },
	];

	useEffect(() => {
		return () => {
			setDuplicate([]);
		};
	}, []);

	function openModal() {
		setIsOpen(true);
		setOpenPanelType('HTML');
		// links
		if (data.link_id) {
			setChooseAbleSavedLink(allLinks.find((item) => item.value == `${data.link_id}`) || {});
		}
	}

	function closeModal() {
		setIsOpen(false);
		setDuplicate([]);
		setChooseAbleSavedLink([]);
	}

	const __handleAutoLinkKeywordSubmit = (values, actions) => {
		const thisItemIndex = keywords.data.findIndex((item) => data === item);
		const formDuplicate = [];
		const formKeywordsArr = (values.keywords || '').trim().split(',');
		const newKeywordsArr = [];
		for (const item of formKeywordsArr) {
			const newItem = trimmed(item);
			if (newItem) newKeywordsArr.push(newItem);
			let x = 0;
			for (const keyItem of keywords.data) {
				if (x == thisItemIndex) {
					x++;
					continue;
				}
				const newKeyItemsArr = keyItem.keywords.split(',');
				for (const keyWord of newKeyItemsArr) {
					const newKeyword = trimmed(keyWord);
					if (newItem.toLowerCase() === newKeyword.toLowerCase() && !formDuplicate.includes(newKeyword)) {
						formDuplicate.push(newKeyword);
					}
				}
				x++;
			}
		}
		values.keywords = newKeywordsArr.join(', ');
		if (formDuplicate.length > 0 || newKeywordsArr.length == 0) {
			setDuplicate(formDuplicate);
			return false;
		}
		// Clear keyword before/after for 'none' and '' (White Space) boundaries
		if (values.leftBoundary === '' || values.leftBoundary === 'none' || values.keywordBefore === '') {
			values.leftBoundary = values.leftBoundary || '';
			values.keywordBefore = '';
		}
		if (values.rightBoundary === '' || values.rightBoundary === 'none' || values.keywordAfter === '') {
			values.rightBoundary = values.rightBoundary || '';
			values.keywordAfter = '';
		}
		const findLink = allLinks.find((link) => link.value == values.chooseLink);
		if (!findLink) {
			actions.setFieldError('chooseLink_error', __('Please Select a Link', 'betterlinks'));
			return;
		}
		if (values.postType.includes('page') && (values.category.length > 0 || values.tags.length > 0)) {
			actions.setFieldError('auto_link_keyword_update_error', __('Post Category & Tags is not available for page', 'betterlinks'));
			return;
		}
		if (values.chooseLink) {
			// If pro version is not 2.6.1 or higher, force status to be active
			if (!is_pro_enabled || !pro_version_check('2.6.1')) {
				values.keywordStatus = 'active';
			}

			// Convert keywordStatus to isActive (backend expects isActive as boolean/int)
			values.isActive = values.keywordStatus === 'active';

			// check Left Boundary & Keyword Before
			if (isEdit) {
				update_keyword(values);
			} else {
				add_keyword(values);
			}
			actions.setSubmitting(false);
			// reset
			actions.resetForm();
			closeModal();
		}
	};

	return (
		<React.Fragment>
			{isEdit ? (
				<ActionButton type="edit" label={__('Edit Keyword', 'betterlinks')} onClickHandler={openModal}>
					{children}
				</ActionButton>
			) : (
				<div className="btl-create-autolinks">
					<button className="btl-create-autolink-button" onClick={openModal}>
						<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
							<path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
						</svg>
						{__('Add New Keywords', 'betterlinks')}
					</button>
				</div>
			)}
			<Modal isOpen={modalIsOpen} onRequestClose={closeModal} closeTimeoutMS={300} ariaHideApp={false}>
				<Formik initialValues={getAutoLinksInitialValues(data, settings?.alk || {})} onSubmit={__handleAutoLinkKeywordSubmit}>
					{(props) => (
						<Form className="bl-drawer bl-kw-drawer" onSubmit={props.handleSubmit}>
							{/* Header */}
							<div className="bl-drawer__header">
								<span className="bl-drawer__title">
									<span className="bl-kw-drawer__badge"><TypeIcon size={20} /></span>
									{isEdit ? __('Edit keyword', 'betterlinks') : __('Add new keywords', 'betterlinks')}
								</span>
								<button type="button" className="bl-drawer__close" onClick={closeModal} aria-label={__('Close', 'betterlinks')}>
									<CloseIcon />
								</button>
							</div>

							{/* Body */}
							<div className="btl-entry-content">
								<div className="btl-entry-content-left">
									{/* Keywords */}
									<div className="btl-modal-form-group">
										<label className="btl-modal-form-label btl-required" htmlFor="keywords">
											{__('Keywords', 'betterlinks')}
										</label>
										<KeywordChipsInput
											value={props.values.keywords}
											onChange={(v) => {
												props.setFieldValue('keywords', v);
												if (duplicate.length) setDuplicate([]);
											}}
											placeholder={__('e.g. built with ai, best link shortener', 'betterlinks')}
										/>
										{duplicate.length > 0 ? (
											<div className="bl-kw-drawer__hint is-error">
												{__('Keywords', 'betterlinks')}:{' '}
												{duplicate.map((item, index) => (
													<span key={index}>
														"{item}"{index < duplicate.length - 1 ? ', ' : ''}
													</span>
												))}{' '}
												{__('already exist.', 'betterlinks')}
											</div>
										) : (
											<div className="bl-kw-drawer__hint">{__('Type and press comma or Enter to add each keyword. Double-click a keyword to edit it.', 'betterlinks')}</div>
										)}
									</div>

									{/* Choose Link */}
									<div className="btl-modal-form-group">
										<label className="btl-modal-form-label btl-required">{__('Choose Link', 'betterlinks')}</label>
										<Select2
											isClearable={true}
											name="chooseLink"
											className="btl-modal-select--full"
											classNamePrefix="btl-react-select"
											placeholder={__('Select…', 'betterlinks')}
											options={allLinks.filter((item) => item.value !== null)}
											value={chooseAbleSavedLink}
											onChange={(option) => {
												props.setFieldValue('chooseLink', option ? option.value : '');
												setChooseAbleSavedLink(option ? option : []);
											}}
											required={true}
										/>
										{props.errors.chooseLink_error && <span className="bl-kw-drawer__error">{props.errors.chooseLink_error}</span>}
									</div>

									{/* Post Type + Post Category */}
									<div className="bl-kw-drawer__row">
										<div className="btl-modal-form-group">
											<label className="btl-modal-form-label">{__('Post Type', 'betterlinks')}</label>
											<Select2
												isMulti
												name="postType"
												className="btl-modal-select--full"
												classNamePrefix="btl-react-select"
												placeholder={__('Select post types', 'betterlinks')}
												options={postTypes}
												value={postTypes.filter((item) => props.values.postType.includes(item.value.toString()))}
												onChange={(option) => {
													props.setFieldValue(
														'postType',
														option.reduce((acc, item) => {
															acc.push(item.value);
															return acc;
														}, [])
													);
												}}
											/>
											{props.errors.auto_link_keyword_update_error && <span className="bl-kw-drawer__error">{props.errors.auto_link_keyword_update_error}</span>}
										</div>
										<div className="btl-modal-form-group">
											<label className="btl-modal-form-label">{__('Post Category', 'betterlinks')}</label>
											<Select2
												isMulti
												name="category"
												className="btl-modal-select--full"
												classNamePrefix="btl-react-select"
												placeholder={__('Select categories', 'betterlinks')}
												options={postCategories}
												value={postCategories.filter((item) => props.values.category.includes(item.value.toString()))}
												onChange={(option) => {
													props.setFieldValue(
														'category',
														option.reduce((acc, item) => {
															acc.push(item.value);
															return acc;
														}, [])
													);
												}}
											/>
										</div>
									</div>

									{/* Post Tags */}
									<div className="btl-modal-form-group">
										<label className="btl-modal-form-label">{__('Post Tags', 'betterlinks')}</label>
										<Select2
											name="tags"
											isMulti
											className="btl-modal-select--full"
											classNamePrefix="btl-react-select"
											placeholder={__('Add tags', 'betterlinks')}
											options={postTags}
											value={postTags.filter((item) => props.values.tags.includes(item.value.toString()))}
											onChange={(option) => {
												props.setFieldValue(
													'tags',
													option.reduce((acc, item) => {
														acc.push(item.value);
														return acc;
													}, [])
												);
											}}
										/>
									</div>
								</div>

								<div className="btl-entry-content-right">
									{/* HTML Options */}
									<div className={`link-options ${openPanelType === 'HTML' ? 'link-options--open' : ''}`}>
										<button className="link-options__head" type="button" onClick={() => setOpenPanelType(openPanelType === 'HTML' ? '' : 'HTML')}>
											<h4 className="link-options__head--title">
												<span className="bl-kw-drawer__card-icon"><CodeIcon /></span>
												{__('HTML Options', 'betterlinks')}
											</h4>
											<i className="btl btl-angle-arrow-down"></i>
										</button>
										<div className="link-options__body bl-kw-drawer__toggles">
											<ToggleRow icon={<FlagIcon />} label={__('No Follow', 'betterlinks')} checked={props.values.useNoFollow} onChange={() => props.setFieldValue('useNoFollow', !props.values.useNoFollow)} />
											<ToggleRow icon={<CaseIcon />} label={__('Case Sensitive', 'betterlinks')} checked={props.values.caseSensitive} onChange={() => props.setFieldValue('caseSensitive', !props.values.caseSensitive)} />
											<ToggleRow icon={<ExternalIcon />} label={__('Open in new tab', 'betterlinks')} checked={props.values.openNewTab} onChange={() => props.setFieldValue('openNewTab', !props.values.openNewTab)} />
										</div>
									</div>

									{/* Keyword Status */}
									<div className={`link-options ${openPanelType === 'STATUS' ? 'link-options--open' : ''}`}>
										<button className="link-options__head" type="button" onClick={() => setOpenPanelType(openPanelType === 'STATUS' ? '' : 'STATUS')}>
											<h4 className="link-options__head--title">
												<span className="bl-kw-drawer__card-icon"><StatusIcon /></span>
												{__('Keyword Status', 'betterlinks')}
											</h4>
											<i className="btl btl-angle-arrow-down"></i>
										</button>
										<div className="link-options__body">
											{(!is_pro_enabled || !pro_version_check('2.6.1')) && (
												<span className="bl-kw-drawer__pro-note">{__('Requires BetterLinks Pro v2.6.1+', 'betterlinks')}</span>
											)}
											<div className="btl-modal-form-group">
												<label className="btl-modal-form-label" htmlFor="keywordStatus">
													{__('Status', 'betterlinks')}
												</label>
												<Select2
													id="keywordStatus"
													name="keywordStatus"
													className="btl-modal-select--mini btl-tabs-gap"
													classNamePrefix="btl-react-select"
													// The menu is portaled to <body>: this select sits inside a
													// `.link-options` accordion card, which is `overflow: hidden` to clip
													// its own rounded corners — that also clipped the open menu to a
													// sliver. The drawer is z-index 100000, so the portaled menu has to
													// sit above it.
													menuPortalTarget={document.body}
													menuPlacement="auto"
													styles={{ menuPortal: (base) => ({ ...base, zIndex: 100020 }) }}
													options={[
														{ value: 'active', label: __('Active', 'betterlinks') },
														{ value: 'draft', label: __('Draft', 'betterlinks') },
													]}
													value={
														props.values.keywordStatus === 'active' || props.values.keywordStatus == true || props.values.keywordStatus == 1 || props.values.keywordStatus == '1'
															? { value: 'active', label: __('Active', 'betterlinks') }
															: { value: 'draft', label: __('Draft', 'betterlinks') }
													}
													onChange={(option) => {
														props.setFieldValue('keywordStatus', option.value);
													}}
													isDisabled={!is_pro_enabled || !pro_version_check('2.6.1')}
												/>
											</div>
										</div>
									</div>

									{/* Advanced Settings */}
									<div className={`link-options ${openPanelType === 'ADVANCED' ? 'link-options--open' : ''} link-options--advance-keyword`}>
										<button className="link-options__head" type="button" onClick={() => setOpenPanelType(openPanelType === 'ADVANCED' ? '' : 'ADVANCED')}>
											<h4 className="link-options__head--title">
												<span className="bl-kw-drawer__card-icon"><SlidersIcon /></span>
												{__('Advanced Settings', 'betterlinks')}
											</h4>
											<i className="btl btl-angle-arrow-down"></i>
										</button>
										<div className="link-options__body">
											<div className="btl-modal-form-group">
												<label className="btl-modal-form-label" htmlFor="leftBoundary">
													{__('Left Boundary', 'betterlinks')}
												</label>
												<Select2
													id="leftBoundary"
													name="leftBoundary"
													className="btl-modal-select--mini"
													classNamePrefix="btl-react-select"
													// Portaled for the same reason as the status select above: the
													// enclosing `.link-options` card is `overflow: hidden`.
													menuPortalTarget={document.body}
													menuPlacement="auto"
													styles={{ menuPortal: (base) => ({ ...base, zIndex: 100020 }) }}
													options={boundary}
													value={boundary.filter((item) => item.value == props.values.leftBoundary)}
													onChange={(option) => {
														props.setFieldValue('leftBoundary', option.value);
													}}
												/>
											</div>
											<div className="btl-modal-form-group">
												<label className="btl-modal-form-label" htmlFor="rightBoundary">
													{__('Right Boundary', 'betterlinks')}
												</label>
												<Select2
													id="rightBoundary"
													name="rightBoundary"
													className="btl-modal-select--mini"
													classNamePrefix="btl-react-select"
													// Portaled for the same reason as the status select above: the
													// enclosing `.link-options` card is `overflow: hidden`.
													menuPortalTarget={document.body}
													menuPlacement="auto"
													styles={{ menuPortal: (base) => ({ ...base, zIndex: 100020 }) }}
													options={boundary}
													value={boundary.filter((item) => item.value == props.values.rightBoundary)}
													onChange={(option) => {
														props.setFieldValue('rightBoundary', option.value);
													}}
												/>
											</div>
											{props.values.leftBoundary != '' && props.values.leftBoundary != 'none' && (
												<div className="btl-modal-form-group">
													<label className="btl-modal-form-label" htmlFor="keywordBefore">
														{__('Keyword Before', 'betterlinks')}
													</label>
													<Field id="keywordBefore" type="text" name="keywordBefore" />
												</div>
											)}
											{props.values.rightBoundary != '' && props.values.rightBoundary != 'none' && (
												<div className="btl-modal-form-group">
													<label className="btl-modal-form-label" htmlFor="keywordAfter">
														{__('Keyword After', 'betterlinks')}
													</label>
													<Field id="keywordAfter" type="text" name="keywordAfter" />
												</div>
											)}
											<div className="btl-modal-form-group">
												<label className="btl-modal-form-label" htmlFor="limit">
													{__('Limit', 'betterlinks')}
												</label>
												<Field id="limit" type="number" name="limit" />
											</div>
										</div>
									</div>
								</div>
							</div>

							{/* Footer */}
							<div className="bl-drawer__footer">
								<button type="submit" className="bl-drawer__publish">
									{isEdit ? __('Update', 'betterlinks') : __('Publish', 'betterlinks')}
								</button>
								<button type="button" className="bl-drawer__cancel" onClick={closeModal}>
									{__('Cancel', 'betterlinks')}
								</button>
							</div>
						</Form>
					)}
				</Formik>
			</Modal>
		</React.Fragment>
	);
};

AddNewKeywords.propTypes = propTypes;

const mapStateToProps = (state) => ({
	settings: state.settings,
});

const mapDispatchToProps = (dispatch) => {
	return {
		add_keyword: bindActionCreators(add_keyword, dispatch),
		update_keyword: bindActionCreators(update_keyword, dispatch),
	};
};
export default connect(mapStateToProps, mapDispatchToProps)(AddNewKeywords);
