import React, { useState, useEffect } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { deleteClicks, formatDate, exists_clicks_json, betterlinks_nonce, delayStatusChanged, plugin_root_url } from 'utils/helper';
import { fetchCustomClicksData, fetch_clicks_data, get_graph_data, fetch_individual_clicks } from 'redux/actions/clicks.actions';
import { dispatch_new_links_data } from 'redux/actions/links.actions';
import { toastSuccess } from 'components/Toast';
import ResetClicksModal from 'components/ResetClicksModal';
import { DateRangePicker, defaultStaticRanges } from 'react-date-range';
import { subDays } from 'date-fns';
import axios from 'axios';
import 'react-date-range/dist/styles.css'; // main css file
import 'react-date-range/dist/theme/default.css'; // theme css file
import { useLocation } from 'react-router-dom';
import { ResetIcon, RefreshIcon } from 'components/Analytics/Icons';

// Create custom static ranges including default ones plus "Delete All"
const customStaticRanges = [
	...defaultStaticRanges,
	{
		label: 'Delete All',
		range: () => ({
			startDate: new Date('2000-01-01'), // Very early date to capture all data
			endDate: new Date() // Current date
		}),
		isSelected: (range) => {
			const deleteAllRange = new Date('2000-01-01');
			const today = new Date();
			return (
				range.startDate.toDateString() === deleteAllRange.toDateString() &&
				range.endDate.toDateString() === today.toDateString()
			);
		}
	}
];


const glyphStroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };

const TrashGlyph = () => (
	<svg width="15" height="15" viewBox="0 0 24 24" {...glyphStroke} aria-hidden="true">
		<path d="M4 7h16M10 4h4a1 1 0 0 1 1 1v2H9V5a1 1 0 0 1 1-1Z" />
		<path d="m6.5 7 .7 11.1A2 2 0 0 0 9.2 20h5.6a2 2 0 0 0 2-1.9L17.5 7M10 11v5M14 11v5" />
	</svg>
);

const WarnGlyph = () => (
	<svg width="26" height="26" viewBox="0 0 24 24" {...glyphStroke} aria-hidden="true">
		<path d="M10.3 3.9 2.5 17.4A2 2 0 0 0 4.2 20.5h15.6a2 2 0 0 0 1.7-3.1L13.7 3.9a2 2 0 0 0-3.4 0Z" />
		<path d="M12 9.4v4.3M12 17.1h.01" />
	</svg>
);

const CheckGlyph = () => (
	<svg width="26" height="26" viewBox="0 0 24 24" {...glyphStroke} aria-hidden="true">
		<circle cx="12" cy="12" r="9" />
		<polyline points="8.2 12.2 11 15 15.9 9.4" />
	</svg>
);

const EmptyGlyph = () => (
	<svg width="26" height="26" viewBox="0 0 24 24" {...glyphStroke} aria-hidden="true">
		<circle cx="11" cy="11" r="7" />
		<path d="m20 20-3.6-3.6M8.4 11h5.2" />
	</svg>
);

/**
 * Reset / Refresh Stats actions for the Analytics screens.
 *
 * `onRefreshed` (optional) is called after a successful reset or stats refresh,
 * so the host view can tell extension sections (`refreshToken`) to refetch.
 */
const DeleteClicks = ({ fetchCustomClicksData, dispatch_new_links_data, fetch_clicks_data, get_graph_data, fetch_individual_clicks, propsForAnalytics, onRefreshed, ui = 'legacy' }) => {
	const notifyRefreshed = () => {
		if (typeof onRefreshed === 'function') onRefreshed();
	};
	const { customDateFilter } = propsForAnalytics || {};
	const [timeOutIdToClear, setTimeOutIdToClear] = useState(0);
	const [modalIsOpen, setModalIsOpen] = useState(false);
	const [successfulDeletedItemsCount, setSuccessfulDeletedItemsCount] = useState(0);
	const [deleteStatus, setDeleteStatus] = useState('reset_modal_step_1');
	const [resetDateFilter, setResetDateFilter] = useState([
		{
			startDate: subDays(new Date(), 30),
			endDate: new Date(),
			key: 'selection',
		},
	]);
	const [confirmationText, setConfirmationText] = useState('');
	const [clickCountToDelete, setClickCountToDelete] = useState(0);

	// Refresh Stats button states
	const [cacheButtonText, setCacheButtonText] = useState(__('Refresh Stats', 'betterlinks'));
	const [fastClicksButtonText, setFastClicksButtonText] = useState(__('Active Now', 'betterlinks'));
	const [fastClicksStatus, setFastClicksStatus] = useState(exists_clicks_json);

	useEffect(() => {
		if (modalIsOpen) {
			document?.body?.classList?.add('betterlinks-delete-clicks-modal-popup-opened');
		} else {
			document?.body?.classList?.remove('betterlinks-delete-clicks-modal-popup-opened');
		}
		return () => {
			document?.body?.classList?.remove('betterlinks-delete-clicks-modal-popup-opened');
		};
	}, [modalIsOpen]);

	const close = () => {
		clearTimeout(timeOutIdToClear);
		setDeleteStatus('reset_modal_step_1');
		setModalIsOpen(false);
		setResetDateFilter([
			{
				startDate: subDays(new Date(), 30),
				endDate: new Date(),
				key: 'selection',
			},
		]);
		setConfirmationText('');
	};

	const handleConfirmDelete = () => {
		// Check if confirmation text matches "Reset Clicks" exactly (case-sensitive)
		if (confirmationText.trim() !== 'RESET CLICKS') {
			// Focus the input field if text doesn't match
			const inputElement = document.querySelector('.btl-confirmation-input');
			if (inputElement) {
				inputElement.focus();
			}
			return;
		}

		if (!resetDateFilter || !resetDateFilter[0]) return;
		const from = formatDate(resetDateFilter[0].startDate, 'yyyy-mm-dd');
		const to = formatDate(resetDateFilter[0].endDate, 'yyyy-mm-dd');
		setDeleteStatus('deleting');

		// Use the selected date range instead of days older than
		deleteClicks(false, from, to, linkId)
			.then((res) => {
				const timeoutId = setTimeout(() => {
					close();
				}, 444000);
				setTimeOutIdToClear(timeoutId);
				if (res?.data?.success) {
					setSuccessfulDeletedItemsCount(res?.data?.data?.count);
					fetchCustomClicksData({ data: res?.data?.data?.new_clicks_data });
					dispatch_new_links_data({ data: res?.data?.data?.new_links_data });
					
					// Refresh all analytics graphs after successful delete
					if (customDateFilter && customDateFilter[0]) {
						const filterDate = {
							from: formatDate(customDateFilter[0].startDate, 'yyyy-mm-dd'),
							to: formatDate(customDateFilter[0].endDate, 'yyyy-mm-dd'),
							setLoading: () => { }
						};
						fetch_clicks_data(filterDate);
						get_graph_data(filterDate);
					} else {
						const defaultParams = { setLoading: () => { } };
						fetch_clicks_data(defaultParams);
						get_graph_data(defaultParams);
					}
					notifyRefreshed();

					setDeleteStatus('success');
				} else {
					setDeleteStatus('failed');
				}
			})
			.catch((err) => {
				console.log('---caught error on DeleteClicks', { err });
				const timeoutId = setTimeout(() => {
					close();
				}, 3000);
				setTimeOutIdToClear(timeoutId);
			});
	};

	const handleResetButtonClick1 = () => {
		setModalIsOpen(true);
		setDeleteStatus('reset_modal_step_1');
	};

	const handleResetButtonClick2 = () => {
		setDeleteStatus('reset_modal_step_2');
		setConfirmationText(''); // Clear confirmation text when moving to step 2
	};

	const handleDeleteOptionsChange = (value) => {
		setResetDateFilter([value.selection]);
	};

	const handleApplyDateRange = () => {
		// Fetch click count for the selected date range
		if (!resetDateFilter || !resetDateFilter[0]) return;
		const from = formatDate(resetDateFilter[0].startDate, 'yyyy-mm-dd');
		const to = formatDate(resetDateFilter[0].endDate, 'yyyy-mm-dd');

		// Make API call to get count
		const form_data = new FormData();
		form_data.append('action', 'betterlinks/admin/get_clicks_count');
		form_data.append('security', betterlinks_nonce);
		form_data.append('from', from);
		form_data.append('to', to);
		if (linkId !== null) {
			form_data.append('link_id', linkId);
		}

		axios.post(ajaxurl, form_data).then(
			(response) => {
				if (response.data && response.data.success) {
					setClickCountToDelete(response.data.data.count || 0);
				}
				setDeleteStatus('reset_modal_step_2');
				setConfirmationText(''); // Clear confirmation text when moving to step 2
			},
			(error) => {
				console.log(error);
				// Still proceed to step 2 even if count fetch fails
				setClickCountToDelete(0);
				setDeleteStatus('reset_modal_step_2');
				setConfirmationText('');
			}
		);
	};

	const handleConfirmationTextChange = (e) => {
		setConfirmationText(e.target.value);
	};

	const closeDatePicker = () => {
		close();
	};

	// Refresh Stats functionality
	const writeClicksJSONHandler = () => {
		setFastClicksButtonText(__('Activating...', 'betterlinks'));
		axios.post(`${ajaxurl}?action=betterlinks/admin/write_json_clicks&security=${betterlinks_nonce}`).then(
			(response) => {
				if (response.data) {
					delayStatusChanged(null, __('Activated!', 'betterlinks'), __('Active Now', 'betterlinks'), setFastClicksButtonText);
					setTimeout(() => {
						setFastClicksStatus(true);
					}, 1500);
					
					// mirror the same trick as analyticClicksHandler: refresh single-link if needed
					if (propsForAnalytics && typeof propsForAnalytics.setCustomDateFilter === 'function') {
						propsForAnalytics.setCustomDateFilter([...customDateFilter]);
					}
				}
			},
			(error) => {
				console.log(error);
			}
		);
	};

	const analyticClicksHandler = () => {
		setCacheButtonText(__('Refreshing...', 'betterlinks'));
		axios.post(`${ajaxurl}?action=betterlinks/admin/analytics&security=${betterlinks_nonce}`).then(
			(response) => {
				if (response.data) {
					delayStatusChanged(null, __('Done!', 'betterlinks'), __('Refresh Stats', 'betterlinks'), setCacheButtonText);
					toastSuccess(__('Analytics data has been refreshed successfully', 'betterlinks'), {
						title: __('Stats Refreshed', 'betterlinks'),
					});
					// update analytic data with current date filter
					const filterDate = customDateFilter && customDateFilter[0]
						? {
							from: formatDate(customDateFilter[0].startDate, 'yyyy-mm-dd'),
							to: formatDate(customDateFilter[0].endDate, 'yyyy-mm-dd'),
							setLoading: () => { }
						}
						: { setLoading: () => { } };

					if (linkId) {
						// Single-link view (SingleClicks) renders from the `individual_clicks`
						// slice, which the global fetches below never touch. Bumping
						// setCustomDateFilter can't force a re-fetch either — the spread keeps
						// the same from/to, so SingleClicks' `[id, from, to]` effect stays put.
						// Dispatch the individual fetches directly so the refreshed clicks show.
						fetch_individual_clicks({ link_id: linkId, ...filterDate });
					} else {
						fetch_clicks_data(filterDate);
						get_graph_data(filterDate);
					}
					notifyRefreshed();
				}
			},
			(error) => {
				console.log(error);
			}
		);
	};

	const location = useLocation();
	const params = new URLSearchParams(location.search);
	const linkId = params.get('id');

	const isResetButtonEnabled = confirmationText.trim() === 'RESET CLICKS';

	// One formatting of the selected window, shared by every state that names it.
	const formatRangeDate = (date) => date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
	const rangeLabel = `${formatRangeDate(resetDateFilter[0].startDate)} \u2013 ${formatRangeDate(resetDateFilter[0].endDate)}`;
	// `ui="bl"` renders the redesigned Analytics header buttons; the handlers and
	// the reset modal below are shared with the legacy TopBar rendering.
	const isRedesign = ui === 'bl';
	return (
		<div className={isRedesign ? 'bl-an__actions' : 'btl-analytic-reset-wrapeer btl-btn-groups betterlinks'}>
			{isRedesign ? (
				<>
					<button type="button" className="bl-an__btn" onClick={handleResetButtonClick1}>
						<ResetIcon width={16} height={16} />
						{linkId ? __('Reset Link Clicks', 'betterlinks') : __('Reset', 'betterlinks')}
					</button>
					<button
						type="button"
						className="bl-an__btn"
						onClick={fastClicksStatus ? analyticClicksHandler : writeClicksJSONHandler}
					>
						<RefreshIcon width={16} height={16} />
						{fastClicksStatus ? cacheButtonText : fastClicksButtonText}
					</button>
				</>
			) : (
				<>
					<button className="button-secondary-gray btl-reset-analytics-initial-button" onClick={handleResetButtonClick1}>
						{linkId ? 'Reset Link Clicks' : 'Reset'}
					</button>
					<div className="status btl-refresh-btn">
						{!fastClicksStatus ? (
							<>
								<button type="button" onClick={writeClicksJSONHandler} className="btl-refresh-btn button button-primary">
									{fastClicksButtonText}
								</button>
							</>
						) : (
							<>
								<img width={18} height={18} src={plugin_root_url + '/assets/images/icons/refresh.svg'} alt="Refresh" />
								<button type="button" onClick={analyticClicksHandler} className="btl-refresh-btn button button-primary">
									{cacheButtonText}
								</button>
							</>
						)}
					</div>
				</>
			)}

			<ResetClicksModal
				isOpen={modalIsOpen}
				onClose={close}
				labelledBy="bl-rc-title"
				className={deleteStatus === 'reset_modal_step_1' ? 'bl-rc__card--wide' : ''}
			>
				{deleteStatus === 'reset_modal_step_1' && (
					<div className="bl-rc__picker">
						<h2 className="bl-rc__title bl-rc__title--left" id="bl-rc-title">
							{linkId ? __('Select a date range for this link\u2019s clicks', 'betterlinks') : __('Pick the range of analytics you want to reset', 'betterlinks')}
						</h2>
						<div className="bl-rc__calendar">
							<DateRangePicker
								onChange={handleDeleteOptionsChange}
								showSelectionPreview={true}
								moveRangeOnFirstSelection={false}
								months={2}
								ranges={resetDateFilter}
								direction="horizontal"
								showMonthAndYearPickers={true}
								showDateDisplay={true}
								rangeColors={['#2f6bff']}
								color="#2f6bff"
								staticRanges={customStaticRanges}
								inputRanges={[]}
							/>
						</div>
						<div className="bl-rc__footer">
							<button type="button" className="bl-rc__btn bl-rc__btn--ghost" onClick={closeDatePicker}>
								{__('Cancel', 'betterlinks')}
							</button>
							<button type="button" className="bl-rc__btn bl-rc__btn--danger" onClick={handleApplyDateRange}>
								<TrashGlyph />
								{__('Reset clicks', 'betterlinks')}
							</button>
						</div>
					</div>
				)}

				{deleteStatus === 'reset_modal_step_2' && (
					<div className="bl-rc__body">
						<span className="bl-rc__mark bl-rc__mark--warn">
							<WarnGlyph />
						</span>
						<h2 className="bl-rc__title" id="bl-rc-title">{__('This action cannot be undone', 'betterlinks')}</h2>
						<p className="bl-rc__text">{__('You are about to permanently delete click analytics from', 'betterlinks')}</p>
						<p className="bl-rc__range">{rangeLabel}</p>

						<div className="bl-rc__callout">
							{/* translators: %s: number of click records. */}
							<strong>{clickCountToDelete.toLocaleString()}</strong>{' '}
							{clickCountToDelete === 1 ? __('click record will be removed.', 'betterlinks') : __('click records will be removed.', 'betterlinks')}
						</div>

						<label className="bl-rc__confirm" htmlFor="bl-rc-confirm">
							<span className="bl-rc__confirm-label">
								{__('To confirm, type', 'betterlinks')} <b>RESET CLICKS</b>
							</span>
							<input
								id="bl-rc-confirm"
								type="text"
								className="bl-rc__input"
								placeholder="RESET CLICKS"
								value={confirmationText}
								onChange={handleConfirmationTextChange}
								autoComplete="off"
							/>
						</label>

						<div className="bl-rc__footer">
							<button type="button" className="bl-rc__btn bl-rc__btn--ghost" onClick={() => setDeleteStatus('reset_modal_step_1')}>
								{__('Cancel', 'betterlinks')}
							</button>
							<button type="button" className="bl-rc__btn bl-rc__btn--danger" onClick={handleConfirmDelete} disabled={!isResetButtonEnabled}>
								<TrashGlyph />
								{__('Delete', 'betterlinks')}
							</button>
						</div>
					</div>
				)}

				{deleteStatus === 'deleting' && (
					<div className="bl-rc__body">
						<span className="bl-rc__spinner" aria-hidden="true" />
						<h2 className="bl-rc__title" id="bl-rc-title">{__('Deleting\u2026', 'betterlinks')}</h2>
						<p className="bl-rc__text">{__('Removing click analytics for', 'betterlinks')}</p>
						<p className="bl-rc__range">{rangeLabel}</p>
						<p className="bl-rc__note">{__('This may take a moment.', 'betterlinks')}</p>
					</div>
				)}

				{deleteStatus === 'success' && successfulDeletedItemsCount !== 0 && (
					<div className="bl-rc__body">
						<span className="bl-rc__mark bl-rc__mark--done">
							<CheckGlyph />
						</span>
						<h2 className="bl-rc__title" id="bl-rc-title">
							{/* translators: %s: number of deleted click records. */}
							{sprintf(__('%s click records deleted', 'betterlinks'), successfulDeletedItemsCount.toLocaleString())}
						</h2>
						<p className="bl-rc__text">{__('Click data has been removed for', 'betterlinks')}</p>
						<p className="bl-rc__range">{rangeLabel}</p>
						<div className="bl-rc__footer bl-rc__footer--single">
							<button type="button" className="bl-rc__btn bl-rc__btn--primary" onClick={closeDatePicker}>
								{__('Back to analytics', 'betterlinks')}
							</button>
						</div>
					</div>
				)}

				{deleteStatus === 'success' && successfulDeletedItemsCount === 0 && (
					<div className="bl-rc__body">
						<span className="bl-rc__mark bl-rc__mark--empty">
							<EmptyGlyph />
						</span>
						<h2 className="bl-rc__title" id="bl-rc-title">{__('Nothing to delete', 'betterlinks')}</h2>
						<p className="bl-rc__text">
							{linkId ? __('No clicks were recorded for this link in', 'betterlinks') : __('No clicks were recorded in', 'betterlinks')}
						</p>
						<p className="bl-rc__range">{rangeLabel}</p>
						<div className="bl-rc__footer bl-rc__footer--single">
							<button type="button" className="bl-rc__btn bl-rc__btn--primary" onClick={closeDatePicker}>
								{__('Back to analytics', 'betterlinks')}
							</button>
						</div>
					</div>
				)}

				{deleteStatus === 'failed' && (
					<div className="bl-rc__body">
						<span className="bl-rc__mark bl-rc__mark--warn">
							<WarnGlyph />
						</span>
						<h2 className="bl-rc__title" id="bl-rc-title">{__('Reset failed', 'betterlinks')}</h2>
						<p className="bl-rc__text">{__('The click data could not be deleted. Please try again.', 'betterlinks')}</p>
						<div className="bl-rc__footer bl-rc__footer--single">
							<button type="button" className="bl-rc__btn bl-rc__btn--ghost" onClick={close}>
								{__('Close', 'betterlinks')}
							</button>
						</div>
					</div>
				)}
			</ResetClicksModal>
		</div>
	);
};

const mapStateToProps = () => ({});
const mapDispatchToProps = (dispatch) => {
	return {
		fetchCustomClicksData: bindActionCreators(fetchCustomClicksData, dispatch),
		dispatch_new_links_data: bindActionCreators(dispatch_new_links_data, dispatch),
		fetch_clicks_data: bindActionCreators(fetch_clicks_data, dispatch),
		get_graph_data: bindActionCreators(get_graph_data, dispatch),
		fetch_individual_clicks: bindActionCreators(fetch_individual_clicks, dispatch),
	};
};

export default connect(mapStateToProps, mapDispatchToProps)(DeleteClicks);
