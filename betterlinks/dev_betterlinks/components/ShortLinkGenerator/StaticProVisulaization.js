//react fun component
import React from 'react';
import { __ } from '@wordpress/i18n';
import Select from 'react-select';


const StaticProVisulaization = ({ openUpgradeToProModal }) => {
    return (
        <div className="btl-pro-feature-preview">
            {/* Static Preview of the Form */}
            <div className="btl-pro-form-preview">
                <div className="btl-header bl-text-white">
                    <h2>{__('Auto Post Link Generator', 'betterlinks')}</h2>
                    <div className="btl-description">
                        {__('Generate bulk short links for any post type with advanced configuration ', 'betterlinks')}
                        <a href="https://betterlinks.io/docs/auto-post-link-generator/" target="_blank">
                            {__('Learn More.', 'betterlinks')}
                        </a>
                    </div>
                </div>

                <div className="btl-generator-form btl-pro-disabled">
                    {/* Step 1: Required Inputs */}
                    <div className="btl-form-section">
                        <h3>{__('Required Settings:', 'betterlinks')}</h3>

                        <div className="btl-form-row">
                            <div className="btl-form-col">
                                <div className="btl-bulk-link-form-group" onClick={openUpgradeToProModal}>
                                    <label>{__('Choose Your Post Type:', 'betterlinks')}*</label>
                                    <Select
                                        className="btl-custom-post-select-type"
                                        classNamePrefix="btl-react-select"
                                        value={{ value: 'post', label: 'Posts' }}
                                        options={[
                                            { value: 'post', label: 'Posts' },
                                            { value: 'page', label: 'Pages' },
                                            { value: 'product', label: 'Products' }
                                        ]}
                                        placeholder={__('Select post type...', 'betterlinks')}
                                        isDisabled={true}
                                        isClearable={false}
                                    />
                                </div>
                            </div>

                            <div className="btl-form-col">
                                <div className="btl-bulk-link-form-group" onClick={openUpgradeToProModal}>
                                    <label>{__('Category', 'betterlinks')}</label>
                                    <Select
                                        className="btl-custom-post-select-cat"
                                        classNamePrefix="btl-react-select"
                                        value={[
                                            { value: 1, label: 'Technology' },
                                            { value: 2, label: 'WordPress' }
                                        ]}
                                        options={[
                                            { value: 1, label: 'Technology' },
                                            { value: 2, label: 'WordPress' },
                                            { value: 3, label: 'Web Development' }
                                        ]}
                                        placeholder={__('Select categories...', 'betterlinks')}
                                        isMulti
                                        isDisabled={true}
                                        isClearable
                                        closeMenuOnSelect={false}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="btl-post-count" onClick={openUpgradeToProModal}>
                            {__('Post Found:', 'betterlinks')} 147
                        </div>
                    </div>

                    {/* Step 2: Short Link Configuration */}
                    <div className="btl-form-section btl-bg-white">
                        <div className="btl-accordion-header">
                            <h3>{__('Short Link Configuration', 'betterlinks')}</h3>
                            <span className="btl-accordion-arrow open">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 7.5L10 12.5L15 7.5" stroke="#19285D" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </span>
                        </div>

                        <div className="btl-accordion-content">
                            {/* Sorting */}
                            <div className="btl-subsection">
                                <div className="btl-form-row">
                                    <div className="btl-form-col">
                                        <div className="btl-bulk-link-form-group" onClick={openUpgradeToProModal}>
                                            <label>{__('Link Generation Order', 'betterlinks')}
                                                <div className="btl-tooltip">
                                                    <span className="dashicons dashicons-info-outline"></span>
                                                    <span className="btl-tooltiptext">{__('Choose your preferred order to generate short links based on post order.', 'betterlinks')}</span>
                                                </div>
                                            </label>
                                            <Select
                                                value={{ value: 'date_desc', label: __('Created Date (Newest First)', 'betterlinks') }}
                                                options={[
                                                    { value: 'date_desc', label: __('Created Date (Newest First)', 'betterlinks') },
                                                    { value: 'date_asc', label: __('Created Date (Oldest First)', 'betterlinks') },
                                                    { value: 'title_asc', label: __('Title (A-Z)', 'betterlinks') },
                                                    { value: 'title_desc', label: __('Title (Z-A)', 'betterlinks') }
                                                ]}
                                                isDisabled={true}
                                                isClearable={false}
                                                className="btl-custom-post-select-type"
                                                classNamePrefix="btl-react-select"
                                            />
                                        </div>
                                    </div>

                                    <div className="btl-form-col">
                                        <div className="btl-bulk-link-form-group btl-bulk-existing-links" onClick={openUpgradeToProModal}>
                                            <div className="btl-bulk-checkbox-field">
                                                <input
                                                    type="checkbox"
                                                    id="overwrite-utm-preview"
                                                    checked={true}
                                                    disabled={true}
                                                    readOnly
                                                />
                                                <label htmlFor="overwrite-utm-preview">{__('Overwrite Existing Short Link', 'betterlinks')}
                                                    <div className="btl-tooltip">
                                                        <span className="dashicons dashicons-info-outline"></span>
                                                        <span className="btl-tooltiptext">{__('If a post already has a short link created by BetterLinks, enabling this option will replace it with a new one using your current configuration.', 'betterlinks')}</span>
                                                    </div>
                                                </label>
                                            </div>
                                            <p className="btl-helper-text">{__('Overwrites existing short links on selected posts.', 'betterlinks')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Short Link Configuration */}
                            <div className="btl-subsection">
                                <div className="btl-form-col">
                                    <div className="btl-bulk-link-form-group" onClick={openUpgradeToProModal}>
                                        <label>{__('Redirect Type', 'betterlinks')}</label>
                                        <Select
                                            value={{ value: '301', label: __('301 (Permanent)', 'betterlinks') }}
                                            options={[
                                                { value: '301', label: __('301 (Permanent)', 'betterlinks') },
                                                { value: '302', label: __('302 (Temporary)', 'betterlinks') },
                                                { value: '307', label: __('307 (Temporary)', 'betterlinks') }
                                            ]}
                                            isDisabled={true}
                                            isClearable={false}
                                            className="btl-custom-post-select-type"
                                            classNamePrefix="btl-react-select"
                                        />
                                    </div>
                                </div>

                                <div className="btl-form-col">
                                    <div className="btl-bulk-link-form-group" onClick={openUpgradeToProModal}>
                                        <label>{__('Link Prefix', 'betterlinks')}</label>
                                        <input
                                            className="btl-text-field"
                                            type="text"
                                            value="go"
                                            readOnly
                                            placeholder="go"
                                            onClick={openUpgradeToProModal}
                                        />
                                        <p className="btl-helper-text">
                                            {__('Note: The prefix will be added before your Shortened URL\'s slug eg. https://yourdomain.com/go/your-link-name', 'betterlinks')}
                                        </p>
                                    </div>
                                </div>

                                <div className="btl-form-row">
                                    <div className="btl-form-col">
                                        <div className="btl-bulk-link-form-group" onClick={openUpgradeToProModal}>
                                            <label>{__('Permalink Structure', 'betterlinks')}
                                                <div className="btl-tooltip">
                                                    <span className="dashicons dashicons-info-outline"></span>
                                                    <span className="btl-tooltiptext">{__('Choose how your short link permalink is structured based on type.', 'betterlinks')}</span>
                                                </div>
                                            </label>
                                            <Select
                                                value={{ value: 'random_mixed', label: __('Random Mixed', 'betterlinks') }}
                                                options={[
                                                    { value: 'random_mixed', label: __('Random Mixed', 'betterlinks') },
                                                    { value: 'random_string', label: __('Random String', 'betterlinks') }
                                                ]}
                                                isDisabled={true}
                                                isClearable={false}
                                                className="btl-custom-post-select-type"
                                                classNamePrefix="btl-react-select"
                                            />
                                        </div>
                                    </div>
                                    <div className="btl-form-col">
                                        <div className="btl-bulk-link-form-group" onClick={openUpgradeToProModal}>
                                            <label>{__('BetterLinks Category', 'betterlinks')}
                                                <div className="btl-tooltip">
                                                    <span className="dashicons dashicons-info-outline"></span>
                                                    <span className="btl-tooltiptext">{__('Assign a category to organize your links.', 'betterlinks')}</span>
                                                </div>
                                            </label>
                                            <Select
                                                value={{ value: 1, label: 'Marketing Links' }}
                                                options={[
                                                    { value: 1, label: 'Marketing Links' },
                                                    { value: 2, label: 'Product Links' },
                                                    { value: 3, label: 'Social Media' }
                                                ]}
                                                placeholder={__('Select BetterLink category...', 'betterlinks')}
                                                isDisabled={true}
                                                isClearable={true}
                                                isSearchable={true}
                                                className="btl-custom-post-select-type"
                                                classNamePrefix="btl-react-select"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="btl-form-col">
                                    <div className="btl-bulk-link-form-group" onClick={openUpgradeToProModal}>
                                        <label>{__('BetterLink Tags', 'betterlinks')}
                                            <div className="btl-tooltip">
                                                <span className="dashicons dashicons-info-outline"></span>
                                                <span className="btl-tooltiptext">{__('Choose tags to label your links for reporting.', 'betterlinks')}</span>
                                            </div>
                                        </label>
                                        <Select
                                            value={[
                                                { value: 1, label: 'automated' },
                                                { value: 2, label: 'bulk-generated' }
                                            ]}
                                            options={[
                                                { value: 1, label: 'automated' },
                                                { value: 2, label: 'bulk-generated' },
                                                { value: 3, label: 'wordpress' },
                                                { value: 4, label: 'content' }
                                            ]}
                                            placeholder={__('Select BetterLink tags.....', 'betterlinks')}
                                            isDisabled={true}
                                            isClearable={true}
                                            isSearchable={true}
                                            isMulti={true}
                                            closeMenuOnSelect={false}
                                            className="btl-custom-post-select-type"
                                            classNamePrefix="btl-react-select"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="btl-form-actions">
                        <button
                            className="btl-btn btl-btn-primary"
                            onClick={openUpgradeToProModal}
                        >
                            {__('Generate Short Links', 'betterlinks')} (147)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaticProVisulaization;
