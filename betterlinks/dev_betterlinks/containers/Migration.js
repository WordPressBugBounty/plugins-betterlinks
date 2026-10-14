import React, { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { Formik, Field, Form } from 'formik';
import Modal from 'react-modal';
import axios from 'axios';
import { betterlinks_nonce, route_path, plugin_root_url, modalCustomStyles } from 'utils/helper';
import { useHistory } from 'react-router-dom';

const ProgressSvg = () => (
	<svg height={25} width={25} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 511.182 511.182" fill={'#F9A946'} style={{ marginLeft: '5px' }}>
		<path d="M436.623 74.482c-95.297-99.308-266.746-99.313-362.039.003-96.332 92.527-99.652 257.411-7.629 354.056a7.5 7.5 0 0 0 11.052-10.142C-63.205 265.068 47.079 13.962 255.606 14.503c129.533-2.671 243.68 111.455 240.995 241.001.961 199.912-234.049 313.784-390.303 189.182a7.5 7.5 0 1 0-9.301 11.769c97.909 80.188 251.709 71.178 339.625-19.935 99.309-95.283 99.314-266.754.001-362.038z" />
		<path d="M255.603 446.502c-42.759 0-81.317-15.354-95.577-25.033a7.5 7.5 0 0 0-8.423 12.411c131.426 78.739 311.216-18.2 309.999-178.38.002-113.586-92.41-205.998-205.998-205.998a7.5 7.5 0 0 0 0 15c253.06 9.612 252.95 372.444-.001 382z" />
		<path d="M138.579 255.562c-2.237 8.349.153 16.809 6.556 23.211l58.132 58.132c9.62 9.62 25.949 9.641 35.591 0l84.563-84.562a7.5 7.5 0 0 0 0-10.606 7.5 7.5 0 0 0-10.606 0l-84.563 84.562c-3.923 3.922-10.455 3.922-14.378 0l-58.132-58.132c-8.729-8.729 5.493-23.262 14.377-14.378l45.64 45.64a7.5 7.5 0 0 0 10.606 0l114.724-114.724c4.181-4.18 10.048-3.493 14.065.525 1.183 1.183 6.756 7.409.312 13.853l-14.612 14.612a7.5 7.5 0 0 0 0 10.606 7.5 7.5 0 0 0 10.606 0l14.612-14.612c22.664-23.515-12.121-58.017-35.59-35.591l-109.421 109.42-40.337-40.337c-13.824-13.822-37.244-5.91-42.145 12.381zM204.42 55.696c-9.652 0-9.668 15 0 15 9.652 0 9.668-15 0-15zM156.392 75.496c-9.652 0-9.668 15 0 15 9.652 0 9.668-15 0-15zM115.125 122.052c9.652 0 9.668-15 0-15-9.652 0-9.668 15 0 15zM83.431 148.213c-9.652 0-9.668 15 0 15 9.652 0 9.668-15 0-15zM63.47 196.175c-9.652 0-9.668 15 0 15 9.652 0 9.668-15 0-15zM56.603 247.669c-9.652 0-9.668 15 0 15 9.652 0 9.668-15 0-15zM63.298 314.185c9.652 0 9.668-15 0-15-9.652 0-9.668 15 0 15zM83.098 347.213c-9.652 0-9.668 15 0 15 9.651 0 9.667-15 0-15zM114.653 403.48c9.652 0 9.668-15 0-15-9.651 0-9.667 15 0 15z" />
	</svg>
);

const Migration = (props) => {
	const [migrationSubmitText, setMigrationSubmitText] = useState('Run Migration');
	const [modalIsOpen, setIsOpen] = useState(true);
	const [dataIsFetch, setDataIsFetch] = useState(false);
	const [prettyLinksRes, setPrettyLinksRes] = useState({});
	const [simple301RedirectRes, setSimple301RedirectRes] = useState({});
	const [thirstyAffiliatesRes, setThirstyAffiliatesRes] = useState({});
	const [migrateRes, setMigrateRes] = useState({});
	let history = useHistory();
	const { redirect = true } = props;
	useEffect(() => {
		if (props.mode === 'simple301redirects') {
			setDataIsFetch(true);
			axios.post(`${ajaxurl}?action=betterlinks/admin/get_simple301redirects_data&security=${betterlinks_nonce}`).then(
				(response) => {
					if (response) {
						setSimple301RedirectRes(response.data.data);
						setDataIsFetch(false);
					}
				},
				(error) => {
					console.log(error);
				}
			);
		} else if (props.mode === 'prettylinks') {
			setDataIsFetch(true);
			axios.post(`${ajaxurl}?action=betterlinks/admin/get_prettylinks_data&security=${betterlinks_nonce}`).then(
				(response) => {
					if (response.data) {
						setPrettyLinksRes(response.data.data);
						setDataIsFetch(false);
					}
				},
				(error) => {
					console.log(error);
				}
			);
		} else if (props.mode === 'thirstyaffiliates') {
			setDataIsFetch(true);
			axios.post(`${ajaxurl}?action=betterlinks/admin/get_thirstyaffiliates_data&security=${betterlinks_nonce}`).then(
				(response) => {
					if (response.data) {
						setThirstyAffiliatesRes(response.data.data);
						setDataIsFetch(false);
					}
				},
				(error) => {
					console.log(error);
				}
			);
		}
	}, []);

	const onSubmitHandler = (values) => {
		setMigrationSubmitText(__('Migration is in Progress...', 'betterlinks'));
		let form_data = new FormData();
		if (props.mode === 'prettylinks') {
			form_data.append('action', 'betterlinks/admin/run_prettylinks_migration');
		} else if (props.mode === 'simple301redirects') {
			form_data.append('action', 'betterlinks/admin/run_simple301redirects_migration');
		} else if (props.mode === 'thirstyaffiliates') {
			form_data.append('action', 'betterlinks/admin/run_thirstyaffiliates_migration');
		}
		form_data.append('security', betterlinks_nonce);
		form_data.append('type', values.checked);
		axios.post(ajaxurl, form_data).then(
			(response) => {
				if (response.data) {
					setMigrationSubmitText(__('Done!', 'betterlinks'));
					setMigrateRes(response.data.data);
				}
			},
			(error) => {
				console.log(error);
			}
		);
	};

	function closeModal() {
		setIsOpen(false);
		if (redirect) {
			history.push(route_path + 'admin.php?page=betterlinks');
			history.go(0);
		}
	}

	return (
		<React.Fragment>
			<Modal isOpen={modalIsOpen} shouldCloseOnOverlayClick={false} onRequestClose={closeModal} style={modalCustomStyles} ariaHideApp={false}>
				<span className="btl-close-modal" onClick={closeModal}>
					<i className="btl btl-cancel"></i>
				</span>
				{Object.keys(migrateRes).length === 0 ? (
					<Formik
						initialValues={{
							checked: [],
						}}
						onSubmit={(values) => onSubmitHandler(values)}
					>
						{({ values }) => (
							<Form>
								<div className="btl-modal-migration" role="group" aria-labelledby="checkbox-group">
									{dataIsFetch && <div>{__('Please Wait...', 'betterlinks')}</div>}

									{Object.keys(prettyLinksRes).length > 0 && (
										<>
											<h3 className="btl-modal-migration__title">
												{__('Pick Data that You want to Import', 'betterlinks')} <img width="25" src={plugin_root_url + 'assets/images/pointing-down.svg'} alt="icon" />
											</h3>
											<div className="btl-modal-migration__item">
												{prettyLinksRes?.links_count > 0 && (
													<>
														<Field id="links" type="checkbox" name="checked" value="links" />
														<label htmlFor="links">
															{__('Links ', 'betterlinks')}
															{`(${prettyLinksRes.links_count})`}
														</label>
													</>
												)}
											</div>
											<div className="btl-modal-migration__item">
												{prettyLinksRes?.clicks_count > 0 && (
													<>
														<Field id="clicks" type="checkbox" name="checked" value="clicks" />
														<label htmlFor="clicks">
															{__('Clicks ', 'betterlinks')}
															{`(${prettyLinksRes.clicks_count})`}
														</label>
													</>
												)}
											</div>
										</>
									)}

									{Object.keys(simple301RedirectRes).length > 0 && (
										<>
											<h3 className="btl-modal-migration__title">
												{__('Pick Data that You want to Import', 'betterlinks')} <img width="25" src={plugin_root_url + 'assets/images/pointing-down.svg'} alt="icon" />
											</h3>
											<div className="btl-modal-migration__item">
												{simple301RedirectRes && Object.keys(simple301RedirectRes).length > 0 && (
													<>
														<Field id="links" type="checkbox" name="checked" value="links" />
														<label htmlFor="links">
															{__('Links ', 'betterlinks')}
															{`(${Object.keys(simple301RedirectRes).length})`}
														</label>
													</>
												)}
											</div>
										</>
									)}

									{Object.keys(thirstyAffiliatesRes).length > 0 && (
										<>
											<h3 className="btl-modal-migration__title">
												{__('Pick Data that You want to Import', 'betterlinks')} <img width="25" src={plugin_root_url + 'assets/images/pointing-down.svg'} alt="icon" />
											</h3>
											<div className="btl-modal-migration__item">
												{thirstyAffiliatesRes && Object.keys(thirstyAffiliatesRes).length > 0 && (
													<>
														<Field id="links" type="checkbox" name="checked" value="links" />
														<label htmlFor="links">
															{__('Links ', 'betterlinks')}
															{`(${Object.keys(thirstyAffiliatesRes).length})`}
														</label>
													</>
												)}
											</div>
										</>
									)}

									{prettyLinksRes.links && prettyLinksRes.links.length == 0 && prettyLinksRes.clicks && prettyLinksRes.clicks.length == 0 ? (
										<h3>{__('Nothing Found To Import', 'betterlinks')}</h3>
									) : (
										<button className="button button-primary" type="submit">
											{migrationSubmitText}
										</button>
									)}
								</div>
							</Form>
						)}
					</Formik>
				) : (
					<div className="btl-modal-migration">
						<div id="response">
							<h3>
								{migrateRes.btl_prettylinks_migration_running_in_background ? (
									<>
										{__('Migration is running in the background ', 'betterlinks')}
										<ProgressSvg />
									</>
								) : (
									<>
										{__('Migration is Complete', 'betterlinks')}
										<img width="25" src={plugin_root_url + 'assets/images/checkmark.svg'} alt="icon" />
									</>
								)}
							</h3>
							{!migrateRes.btl_prettylinks_migration_running_in_background &&
								Object.entries(migrateRes).map(
									([index, item]) =>
										Object.entries(item).length > 0 &&
										Object.entries(item).map(([chiildIndex, childItem]) => (
											<div key={chiildIndex}>{Array.isArray(childItem) ? childItem.map((item, index) => <div key={index}>{item}</div>) : childItem}</div>
										))
								)}
						</div>
						<p style={{ textAlign: 'left' }}>
							<button className="button button-primary" type="button" onClick={closeModal}>
								{__('Ok', 'betterlinks')}
							</button>
						</p>
					</div>
				)}
			</Modal>
		</React.Fragment>
	);
};
export default Migration;
