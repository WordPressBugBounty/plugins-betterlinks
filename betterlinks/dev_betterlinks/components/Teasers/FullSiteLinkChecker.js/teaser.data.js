import { __ } from '@wordpress/i18n';
import { plugin_root_url } from 'utils/helper';

export const teaserFLCLinks = [
	{
		link: 'http://example.com',
		title: 'Example',
		status: 200,
		post_name: 'Hello World',
		edit_link: '#',
		post_link: '#',
		post_type: 'post',
	},
	{
		link: 'https://testsite.org/',
		title: 'Test Site',
		status: 200,
		post_name: 'Sample Page',
		edit_link: '#',
		post_link: '#',
		post_type: 'page',
	},
	{
		link: 'http://trialweb.org/',
		title: 'Trial Web',
		status: 404,
		post_name: 'Trial Web',
		edit_link: '#',
		post_link: '#',
		post_type: 'page',
	},
	{
		link: 'https://demo-page.net',
		title: 'Demo Page',
		status: 200,
		post_name: 'Demo Page',
		edit_link: '#',
		post_link: '#',
		post_type: 'page',
	},
	{
		link: 'http://genericdemo.org/',
		title: 'Generic Demo',
		status: 403,
		post_name: 'Sample Product',
		edit_link: '#',
		post_link: '#',
		post_type: 'product',
	},
];

export const columns = [
	{
		name: __('Link', 'betterlinks'),
		selector: 'link',
		sortable: false,
		width: '300px',
		cell: (row) => {
			return (
				<div className="btl-short-url-wrapper">
					<span className="btl-short-url btl-truncate" title={row.link}>
						{row.link}
					</span>
					<a className="dnd-link-button" href={row.link} target="_blank" style={{ marginLeft: '5px' }}>
						<span className="btl btl-visit-url" />
					</a>
				</div>
			);
		},
	},
	{
		name: __('Link Label', 'betterlinks'),
		selector: 'title',
		sortable: false,
		width: '200px',
		cell: (row) => {
			return (
				<div title={row.title}>
					<span>{row.title}</span>
					<button onClick={() => {}} className="btl-short-url-copy-button btl-tooltip">
						<span className="icon">{<img width="20" src={plugin_root_url + '/assets/images/copy-icon.svg'} alt="icon" />}</span>
						<span className="btl-tooltiptext">{__('Copy Label', 'betterlinks')}</span>
					</button>
				</div>
			);
		},
	},
	{
		name: __('Status', 'betterlinks'),
		selector: 'status',
		width: '150px',
		sortable: false,
		cell: (row) => {
			let label = 'Broken Link';
			let className = 'danger';
			if ((row.status >= 200 && row.status <= 299) || row.status == true) {
				label = 'Active';
				className = 'success';
			} else if (row.status === 403) {
				label = '403 Forbidden';
				className = 'danger2';
			} else if (row.status === 401) {
				label = '401 Unauthorized';
				className = 'danger2';
			}

			return (
				<div className={`betterlinks-broken-links-status-column btl-${className}`}>
					<span>{label}</span>
				</div>
			);
		},
	},
	{
		name: __('Post Title', 'betterlinks'),
		selector: 'post_name',
		width: '300px',
		sortable: false,
		cell: (row) => {
			return (
				<div style={{ display: 'flex', alignItems: 'center', columnGap: '15px' }}>
					<span title={row.post_name}>{row.post_name.length > 50 ? row.post_name.slice(0, 50) + '[...]' : row.post_name}</span>
				</div>
			);
		},
	},
	{
		name: __('Post Type', 'betterlinks'),
		selector: 'post_type',
		width: '100px',
		sortable: false,
	},
	{
		name: __('Actions', 'betterlinks'),
		selector: 'actions',
		width: '100px',
		sortable: false,
		cell: (row) => {
			const preventClick = (e) => e.preventDefault();
			return (
				<div className="btl-action-btns">
					<a title={`Edit - ${row.post_name}`} onClick={preventClick} style={{ cursor: 'not-allowed' }}>
						<span className="btl btl-edit" />
					</a>
					&nbsp;
					<a title={`Preview - ${row.post_name}`} style={{ marginLeft: '5px', cursor: 'not-allowed' }} onClick={preventClick}>
						<span className="btl btl-visit-url" />
					</a>
				</div>
			);
		},
	},
];
