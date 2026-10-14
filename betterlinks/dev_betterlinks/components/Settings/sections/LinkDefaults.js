import { __ } from '@wordpress/i18n';
import { Field } from 'formik';
import CategorySelect from 'components/CategorySelect';
import UrlGenerationType from 'components/UrlGenerationType';
import { urlGenerationTypes } from 'utils/data';
import { site_url } from 'utils/helper';
import { Row, ToggleLine } from '../parts';

// Defaults applied to every new link. Receives Formik props (`fp`) and shared
// extras (`ext`) from GeneralSettingsForm. Returns row fragments only — the
// panel wrapper + save footer live in GeneralSettingsForm.
const LinkDefaults = ({ fp, ext }) => {
	const { terms } = ext;
	const attr = (name) => ({ checked: !!fp.values[name], onChange: () => fp.setFieldValue(name, !fp.values[name]) });

	const categoryOptions = terms?.terms
		? [
				{ value: '1', label: __('Uncategorized', 'betterlinks') },
				...terms.terms
					.filter((t) => t.term_type === 'category' && t.ID !== '1')
					.sort((a, b) => a.term_name.localeCompare(b.term_name))
					.map((t) => ({ value: t.ID, label: t.term_name })),
		  ]
		: [{ value: 'loading', label: __('Loading...', 'betterlinks'), isDisabled: true }];

	return (
		<>
			<Row label={__('Default Category', 'betterlinks')} desc={__('New links are filed under this category unless you pick another.', 'betterlinks')}>
				<CategorySelect
					name="default_category"
					options={categoryOptions}
					defaultValue={ext.settings?.default_category || '1'}
					setFieldValue={fp.setFieldValue}
				/>
			</Row>

			<Row label={__('Link Attributes', 'betterlinks')} desc={__('Default rel attributes and behavior applied to new links.', 'betterlinks')}>
				<div className="bl-set-togglelist">
					<ToggleLine
						label={__('No Follow', 'betterlinks')}
						tooltip={__('This will add nofollow attribute to your link. (Recommended)', 'betterlinks')}
						name="nofollow"
						{...attr('nofollow')}
					/>
					<ToggleLine
						label={__('Sponsored', 'betterlinks')}
						tooltip={__('This will add sponsored attribute to your link. (Recommended for Affiliate links)', 'betterlinks')}
						name="sponsored"
						{...attr('sponsored')}
					/>
					<ToggleLine
						label={__('Parameter Forwarding', 'betterlinks')}
						tooltip={__('This will pass the parameters you have set in the target URL', 'betterlinks')}
						name="param_forwarding"
						{...attr('param_forwarding')}
					/>
					<ToggleLine
						label={__('Tracking', 'betterlinks')}
						tooltip={__('This will let you check Analytics report of your links', 'betterlinks')}
						name="track_me"
						{...attr('track_me')}
					/>
				</div>
			</Row>

			<Row label={__('URL Slug Generation', 'betterlinks')} desc={__('How the short slug is generated for new links.', 'betterlinks')}>
				<UrlGenerationType
					className="btl-modal-select--full"
					classNamePrefix="btl-react-select"
					id="url_slug_generation_type"
					name="url_slug_generation_type"
					options={urlGenerationTypes}
					defaultValue={ext.settings?.is_random_string ? 'random_number' : ext.settings?.url_slug_generation_type || 'from_title'}
					setFieldValue={fp.setFieldValue}
					isMulti={false}
				/>
			</Row>

			<Row
				label={__('Link Prefix', 'betterlinks')}
				desc={
					<>
						<b>{__('Note:', 'betterlinks')} </b>
						{__('The prefix is added before your shortened slug, e.g.', 'betterlinks')} {betterLinksHooks.applyFilters('site_url', site_url)}
						{fp.values.prefix && (
							<>
								/<strong>{fp.values.prefix}</strong>
							</>
						)}
						{__('/your-link.', 'betterlinks')}
					</>
				}
			>
				<Field className="btl-text-field" name="prefix" value={fp.values?.prefix ?? 'go'} type="text" />
			</Row>

			<Row label={__('Auto Title Suggestion', 'betterlinks')}>
				<ToggleLine
					label={__('Enable Auto Title Suggestion', 'betterlinks')}
					tooltip={__('When enabled, the Link Title will automatically be fetched from the target URL', 'betterlinks')}
					name="enable_auto_title_suggestion"
					checked={fp.values.enable_auto_title_suggestion !== false}
					onChange={() => fp.setFieldValue('enable_auto_title_suggestion', !fp.values.enable_auto_title_suggestion)}
				/>
			</Row>

			<Row label={__('Case Sensitivity', 'betterlinks')}>
				<ToggleLine
					label={__('Enable Case Sensitive Links', 'betterlinks')}
					tooltip={__('This will make your shortened URLs case sensitive', 'betterlinks')}
					name="is_case_sensitive"
					{...attr('is_case_sensitive')}
				/>
			</Row>
		</>
	);
};

export default LinkDefaults;
