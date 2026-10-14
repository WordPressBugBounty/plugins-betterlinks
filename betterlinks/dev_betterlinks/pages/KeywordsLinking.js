import React, { useEffect, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { KeywordsSkeleton } from 'components/States';
import { fetch_links_data } from 'redux/actions/links.actions';
import { fetch_keywords } from 'redux/actions/keywords.actions';
import { fetch_post_types_data } from 'redux/actions/posttypesdata.actions';
import { fetch_settings_data } from 'redux/actions/settings.actions';
import ListKeywords from 'containers/ListKeywords';
import AddNewKeywords from 'containers/AddNewKeywords';
import KeywordsImportExport from 'components/KeywordsImportExport';
import { parseLinksForKeywordsListing, parseLinksForUpdateModal } from 'utils/helper';
import { RefreshIcon, CheckCircleIcon } from 'components/Icons';

const propTypes = {};

// Icons specific to the keyword stats.
const TypeIcon = ({ size = 16 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<path d="M4 7V5h16v2M9 19h6M12 5v14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);
const DraftIcon = ({ size = 16 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<path d="M4 20h4L18.5 9.5a2.12 2.12 0 0 0-3-3L5 17v3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
		<path d="M13.5 6.5l4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
	</svg>
);

const isKeywordActive = (row) => {
	const v = row?.is_active;
	if (v === undefined || v === null) return true;
	return v === true || v === 1 || v === '1' || v === 'active';
};

const KeywordsLinking = (props) => {
	const [refreshing, setRefreshing] = useState(false);

	useEffect(() => {
		if (!props.settings) {
			props.fetch_settings_data();
		}
		if (!props.postdatas.fetchedAll) {
			props.fetch_post_types_data();
		}
		if (!props.keywords.data) {
			props.fetch_keywords();
		}
		if (!props.links.links) {
			props.fetch_links_data();
		}
	}, []);

	const linksForUpdateModal = parseLinksForUpdateModal(props.links);
	const linksListing = parseLinksForKeywordsListing(props.links);
	const postTypesProps = {
		postTypes: props.postdatas.postTypes || [],
		postTags: props.postdatas.postTags || [],
		postCategories: props.postdatas.postCategories || [],
	};

	// Also wait for links: rows resolve their title + short URL from the links
	// data, so rendering before it loads flashes "No link selected or link removed".
	const loadedAll = props.postdatas.fetchedAll && props.keywords.data && props.links.links;

	const rows = props.keywords.data || [];
	const total = rows.length;
	const active = rows.filter(isKeywordActive).length;
	const drafts = total - active;

	const refreshHandler = () => {
		setRefreshing(true);
		props.fetch_keywords();
		window.setTimeout(() => setRefreshing(false), 700);
	};

	const stats = [
		{ key: 'keywords', label: __('Keywords', 'betterlinks'), value: total, icon: <TypeIcon /> },
		{ key: 'active', label: __('Active', 'betterlinks'), value: active, icon: <CheckCircleIcon /> },
		{ key: 'drafts', label: __('Drafts', 'betterlinks'), value: drafts, icon: <DraftIcon /> },
	];

	return (
		<div className="bl-kw">
			<div className="bl-kw__header">
				<div className="bl-kw__heading">
					<h1 className="bl-kw__title">{__('Auto-Link Keywords', 'betterlinks')}</h1>
					<p className="bl-kw__subtitle">{__('Automatically hyperlink chosen keywords across your content.', 'betterlinks')}</p>
				</div>
				<div className="bl-kw__actions">
					{/* <button type="button" className={`bl-kw__icon-btn ${refreshing ? 'is-spinning' : ''}`} onClick={refreshHandler} title={__('Refresh', 'betterlinks')}>
						<RefreshIcon size={17} />
					</button> */}
					<KeywordsImportExport keywords={props.keywords} links={linksListing} />
					<AddNewKeywords postTypesProps={postTypesProps} linksForUpdateModal={linksForUpdateModal} keywords={props.keywords} settings={props?.settings?.settings || {}} />
				</div>
			</div>

			{loadedAll ? (
				<React.Fragment>
					<div className="bl-kw__stats">
						{stats.map((card) => (
							<div className="bl-kw__stat" key={card.key}>
								<div className="bl-kw__stat-head">
									<span className="bl-kw__stat-icon">{card.icon}</span>
									<span className="bl-kw__stat-label">{card.label}</span>
								</div>
								<div className="bl-kw__stat-value">{card.value}</div>
							</div>
						))}
					</div>

					<ListKeywords
						keywords={props.keywords}
						links={linksListing}
						linksForUpdateModal={linksForUpdateModal}
						postTypesProps={postTypesProps}
					/>
				</React.Fragment>
			) : (
				<KeywordsSkeleton />
			)}
		</div>
	);
};

KeywordsLinking.propTypes = propTypes;

const mapStateToProps = (state) => ({
	keywords: state.keywords,
	links: state.links,
	postdatas: state.postdatas,
	settings: state.settings,
});
const mapDispatchToProps = (dispatch) => {
	return {
		fetch_keywords: bindActionCreators(fetch_keywords, dispatch),
		fetch_links_data: bindActionCreators(fetch_links_data, dispatch),
		fetch_post_types_data: bindActionCreators(fetch_post_types_data, dispatch),
		fetch_settings_data: bindActionCreators(fetch_settings_data, dispatch),
	};
};
export default connect(mapStateToProps, mapDispatchToProps)(KeywordsLinking);
