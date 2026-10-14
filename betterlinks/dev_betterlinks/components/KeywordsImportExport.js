import React, { useState } from 'react';
import Modal from 'react-modal';
import { __ } from '@wordpress/i18n';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { export_keywords, import_keywords } from 'redux/actions/keywords.actions';
import { plugin_root_url, is_pro_enabled, pro_version_check } from 'utils/helper';
import { toastWarning } from 'components/Toast';

const importModalStyles = {
    overlay: {
        background: 'rgba(35, 40, 45, 0.62)',
        zIndex: '99999',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        position: 'relative',
        top: 'auto',
        left: 'auto',
        right: 'auto',
        bottom: 'auto',
        maxWidth: '639px',
        width: '90%',
        margin: '0',
        padding: '0',
        border: 'none',
        borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        transform: 'none',
        maxHeight: '90vh',
        overflow: 'hidden',
    },
};

const KeywordsImportExport = ({ export_keywords, import_keywords, keywords, links }) => {
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [csvFile, setCsvFile] = useState(null);
    const [rewriteExisting, setRewriteExisting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [importProgress, setImportProgress] = useState(0);
    const [importStep, setImportStep] = useState('upload'); // 'upload', 'uploading', 'progress', 'success', 'error'
    const [fileError, setFileError] = useState(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    const handleExport = () => {

        if (!is_pro_enabled || !pro_version_check('2.6.5')) {
            toastWarning(
                __('Please update BetterLinks Pro to version 2.6.5 or later to use the Keywords Import/Export feature.', 'betterlinks'),
                {
                    title: __('Update Required', 'betterlinks'),
                }
            );
            return;
        }
        
        if (!keywords.data || keywords.data.length === 0) {
            toastWarning(
                __('No keywords available to export.', 'betterlinks'),
                {
                    title: __('No Keywords', 'betterlinks'),
                }
            );
            return;
        }
        export_keywords();
    };

    const handleSampleDownload = () => {
        const sampleData = [
            ['Keyword ID', 'Keywords', 'Shortened URL', 'Post Types', 'Categories', 'Tags', 'Open New Tab', 'Use No Follow', 'Case Sensitive', 'Left Boundary', 'Right Boundary', 'Keyword Before', 'Keyword After', 'Limit', 'Status'],
            ['', 'WordPress, hosting', 'wp-hosting', 'post;page', 'hosting;web-services', 'wordpress;hosting;cloud', '1', '0', '0', '', '', '', '', '10', '1'],
            ['', 'digital, marketing, tools', 'marketing-tools', 'post', 'marketing;tools', 'seo;analytics;social-media', '0', '1', '1', 'best', 'available', 'top', 'in 2024', '5', '1'],
            ['', 'learn programming', 'coding-course', 'page', 'education;technology', 'programming;coding;tutorial', '1', '0', '0', '', '', '', '', '3', '0']
        ];

        const csvContent = sampleData.map(row =>
            row.map(field => `"${field}"`).join(',')
        ).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'keywords_sample.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        processFile(file);
    };

    const processFile = async (file) => {
        setFileError(null);

        if (file) {
            // Check file size (5MB limit)
            const maxSizeInBytes = 5 * 1024 * 1024; // 5 MB
            if (file.size > maxSizeInBytes) {
                setFileError(__('Error: Upload failed due to incorrect format/size, etc.', 'betterlinks'));
                setCsvFile(null);
                return;
            }

            if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
                setCsvFile(file);
                setImportResult(null);
                setImportStep('upload');
                
                // Start upload simulation
                setIsUploading(true);
                setUploadProgress(0);

                // Simulate upload progress
                const uploadDuration = 1500; // 1.5 seconds
                const intervalTime = 50; // Update every 50ms
                const totalSteps = uploadDuration / intervalTime;
                let currentStep = 0;

                const progressInterval = setInterval(() => {
                    currentStep++;
                    const progress = Math.min((currentStep / totalSteps) * 100, 100);
                    setUploadProgress(progress);

                    if (progress >= 100) {
                        clearInterval(progressInterval);
                        setTimeout(() => {
                            setIsUploading(false);
                        }, 200);
                    }
                }, intervalTime);
            } else {
                setFileError(__('Error: Upload failed due to incorrect format/size, etc.', 'betterlinks'));
                setCsvFile(null);
            }
        }
    };

    const handleDragEnter = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (event) => {
        event.preventDefault();
        event.stopPropagation();
        
        // Only set isDragOver to false if we're leaving the drop zone entirely
        if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsDragOver(false);
        }
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragOver(true);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragOver(false);
        
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            processFile(file);
            
            // Update the file input element
            const fileInput = document.getElementById('csv-file-input');
            if (fileInput) {
                // Create a new FileList-like object
                const dt = new DataTransfer();
                dt.items.add(file);
                fileInput.files = dt.files;
            }
        }
    };

    const handleImport = async () => {
        if (!csvFile) {
            alert(__('Please select a CSV file to import.', 'betterlinks'));
            return;
        }

        setIsImporting(true);
        setImportResult(null);
        setImportStep('progress');
        setImportProgress(0);

        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const csvContent = e.target.result;
                    setImportProgress(20);

                    const parsedData = parseCSVContent(csvContent);
                    setImportProgress(40);

                    if (parsedData.length === 0) {
                        setImportResult({
                            success: false,
                            message: __('No valid data found in the CSV file.', 'betterlinks')
                        });
                        setIsImporting(false);
                        setImportStep('error');
                        return;
                    }

                    setImportProgress(60);
                    const result = await import_keywords({ csv_data: parsedData }, rewriteExisting);
                    setImportProgress(100);

                    setTimeout(() => {
                        setImportResult(result);
                        setIsImporting(false);
                        setImportStep(result.success ? 'success' : 'error');

                        if (result.success) {
                            setCsvFile(null);
                            // Reset file input
                            const fileInput = document.getElementById('csv-file-input');
                            if (fileInput) fileInput.value = '';
                        }
                    }, 500);
                } catch (parseError) {
                    console.error('Parsing error:', parseError);
                    setImportResult({
                        success: false,
                        message: parseError.message || __('Failed to parse CSV file.', 'betterlinks'),
                        errorDetails: parseError.stack || parseError
                    });
                    setIsImporting(false);
                    setImportStep('error');
                }
            };
            reader.readAsText(csvFile);
        } catch (error) {
            console.error('Import error:', error);
            setImportResult({
                success: false,
                message: error.message || error.toString() || __('An error occurred while importing the file.', 'betterlinks'),
                errorDetails: error.stack || error
            });
            setIsImporting(false);
            setImportStep('error');
        }
    };

    const parseCSVContent = (csvContent) => {
        try {
            const lines = csvContent.split('\n');
            if (lines.length === 0) {
                throw new Error(__('CSV file is empty.', 'betterlinks'));
            }
            
            // Parse header line properly using parseCSVLine to handle quoted headers
            const headerLine = lines[0];
            const headers = parseCSVLine(headerLine).map(header => header.replace(/"/g, '').trim());
            const data = [];
            
            // Validate required columns
            const requiredColumns = ['keywords', 'shortened url'];
            const missingColumns = [];
            
            requiredColumns.forEach(required => {
                const found = headers.some(header => header.toLowerCase() === required.toLowerCase());
                if (!found) {
                    missingColumns.push(required);
                }
            });
            
            if (missingColumns.length > 0) {
                throw new Error(__('Missing required columns: ', 'betterlinks') + missingColumns.join(', ') + '. ' + __('Please check your CSV file format.', 'betterlinks'));
            }

        // Build a quick map of short_url -> ID from provided links state (if available)
        const shortUrlMap = {};
        if (links) {
            // try multiple shapes
            if (links.links && typeof links.links === 'object') {
                Object.values(links.links).forEach(group => {
                    if (group && group.lists) {
                        group.lists.forEach(link => {
                            shortUrlMap[link.short_url] = link.ID;
                        });
                    }
                });
            } else if (Array.isArray(links)) {
                links.forEach(link => {
                    shortUrlMap[link.short_url] = link.ID;
                });
            } else if (links.lists && Array.isArray(links.lists)) {
                links.lists.forEach(link => {
                    shortUrlMap[link.short_url] = link.ID;
                });
            }
        }

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = parseCSVLine(line);
            if (values.length < headers.length) continue;

            const item = {};
            headers.forEach((header, index) => {
                let value = values[index] || '';
                // Remove quotes
                value = value.replace(/^"(.*)"$/, '$1');

                switch (header.toLowerCase()) {
                    case 'keyword id':
                        item.meta_id = parseInt(value) || 0;
                        break;
                    case 'keywords':
                        item.keywords = value;
                        break;
                    case 'link id':
                        item.link_id = parseInt(value) || 0;
                        break;
                    case 'shortened url':
                        // Accept either full URL or just slug; try to resolve to link_id using links state
                        let slug = value;
                        try {
                            // if it looks like a URL, extract the path
                            const urlObj = new URL(value);
                            slug = urlObj.pathname.replace(/^\/+|\/+$/g, ''); // trim leading/trailing slashes only
                        } catch (e) {
                            // not a full URL — trim leading/trailing slashes
                            slug = slug.replace(/^\/+|\/+$/g, '');
                        }
                        item.short_url = slug;

                        // Try to map to an internal ID using available links data
                        // Try exact match first (handles prefixed slugs like "go/my-link")
                        if (shortUrlMap[slug]) {
                            item.link_id = shortUrlMap[slug];
                        } else {
                            // Try matching without prefix (slug might be "my-link" but stored as "go/my-link")
                            const matchWithPrefix = Object.keys(shortUrlMap).find(key => {
                                const parts = key.split('/');
                                return parts.length > 1 && parts.slice(1).join('/') === slug;
                            });
                            if (matchWithPrefix) {
                                item.link_id = shortUrlMap[matchWithPrefix];
                                item.short_url = matchWithPrefix; // use the full prefixed slug
                            } else if (slug.indexOf('/') !== -1) {
                                // Slug has a prefix (e.g., "go/my-link"), try matching just the last part
                                const slugWithoutPrefix = slug.split('/').slice(1).join('/');
                                if (shortUrlMap[slugWithoutPrefix]) {
                                    item.link_id = shortUrlMap[slugWithoutPrefix];
                                    item.short_url = slugWithoutPrefix;
                                }
                            }
                        }

                        break;
                    case 'post types':
                        if (value) {
                            item.post_type = value.split(';').map(v => v.trim()).filter(v => v);
                        } else {
                            item.post_type = [];
                        }
                        break;
                    case 'categories':
                        if (value) {
                            item.category = value.split(';').map(v => v.trim()).filter(v => v);
                        } else {
                            item.category = [];
                        }
                        break;
                    case 'tags':
                        if (value) {
                            item.tags = value.split(';').map(v => v.trim()).filter(v => v);
                        } else {
                            item.tags = [];
                        }
                        break;
                    case 'open new tab':
                        item.open_new_tab = parseInt(value) || 0;
                        break;
                    case 'use no follow':
                        item.use_no_follow = parseInt(value) || 0;
                        break;
                    case 'case sensitive':
                        item.case_sensitive = parseInt(value) || 0;
                        break;
                    case 'left boundary':
                        item.left_boundary = value;
                        break;
                    case 'right boundary':
                        item.right_boundary = value;
                        break;
                    case 'keyword before':
                        item.keyword_before = value;
                        break;
                    case 'keyword after':
                        item.keyword_after = value;
                        break;
                    case 'limit':
                        item.limit = parseInt(value) || 100;
                        break;
                     case 'status':
                        // Handle both numeric (1/0) and text (active/draft/inactive) formats
                        if (value === '1' || value.toLowerCase() === 'active') {
                            item.is_active = 1;
                        } else if (value === '0' || value.toLowerCase() === 'draft' || value.toLowerCase() === 'inactive') {
                            item.is_active = 0;
                        } else {
                            item.is_active = parseInt(value) || 1; // default to active
                        }
                        break;
                }
            });

            // Accept if we have keywords AND short_url
            if (item.keywords && item.short_url) {
                // Map the imported data to the format expected by prepare_keyword_item_for_db
                const mappedItem = {
                    meta_id: item.meta_id || 0, // Unique keyword identifier for update detection
                    keywords: item.keywords,
                    chooseLink: item.link_id || 0, // Use link_id if available, otherwise 0 (will be resolved via short_url)
                    shortUrl: item.short_url, // Primary identifier for the link
                    postType: item.post_type || [], // Already an array
                    category: item.category || [], // Already an array  
                    tags: item.tags || [], // Already an array
                    openNewTab: item.open_new_tab || 0, // Map open_new_tab to openNewTab
                    useNoFollow: item.use_no_follow || 0, // Map use_no_follow to useNoFollow
                    caseSensitive: item.case_sensitive || 0, // Map case_sensitive to caseSensitive
                    leftBoundary: item.left_boundary || '', // Map left_boundary to leftBoundary
                    rightBoundary: item.right_boundary || '', // Map right_boundary to rightBoundary
                    keywordBefore: item.keyword_before || '', // Map keyword_before to keywordBefore
                    keywordAfter: item.keyword_after || '', // Map keyword_after to keywordAfter
                    limit: item.limit || 100,
                    isActive: item.is_active !== undefined ? item.is_active : 1 // Map is_active to isActive, default to active
                };
                data.push(mappedItem);
            }
        }

        return data;
        } catch (error) {
            console.error('CSV parsing error:', error);
            throw new Error(__('Failed to parse CSV file. Please check the file format and column names.', 'betterlinks') + ' ' + error.message);
        }
    };

    const parseCSVLine = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    current += '"';
                    i++; // Skip next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }

        result.push(current); // Push the last field
        return result;
    };

    const closeImportModal = () => {
        setImportModalOpen(false);
        setCsvFile(null);
        setRewriteExisting(false);
        setImportResult(null);
        setImportProgress(0);
        setImportStep('upload');
        setFileError(null);
        setIsImporting(false);
        setIsDragOver(false);
        setUploadProgress(0);
        setIsUploading(false);
        // Reset file input
        const fileInput = document.getElementById('csv-file-input');
        if (fileInput) fileInput.value = '';
    };

    return (
        <div className="btl-keywords-import-export">
            <div className="btl-import-export-buttons">
                <button
                    className="btl-btn btl-btn-secondary"
                    onClick={handleExport}
                    // disabled={!keywords.data || keywords.data.length === 0}
                    title={__('Export Keywords to CSV', 'betterlinks')}
                >
                    <i className="btl btl-download"></i>
                    {__('Export', 'betterlinks')}
                </button>
                <button
                    className="btl-import-button btl-btn btl-btn-primary"
                    onClick={() => {
                        if (!is_pro_enabled || !pro_version_check('2.6.5')) {
                            toastWarning(
                                __('Please update BetterLinks Pro to version 2.6.5 or later to use the Keywords Import/Export feature.', 'betterlinks'),
                                {
                                    title: __('Update Required', 'betterlinks'),
                                }
                            );
                            return;
                        }
                        setImportModalOpen(true);
                    }}
                    title={__('Import Keywords from CSV', 'betterlinks')}
                >
                    <i className="btl btl-upload"></i>
                    {__('Import', 'betterlinks')}
                </button>
            </div>

            <Modal
                isOpen={importModalOpen}
                onRequestClose={closeImportModal}
                style={importModalStyles}
                ariaHideApp={false}
                overlayClassName="btl-import-modal-overlay"
                className="btl-import-modal-content"
            >
                <div className="btl-import-modal-wrapper">
                    <div className="btl-import-modal-header">
                        <div className="btl-import-modal-title">{__('Auto-Link Keyword Import', 'betterlinks')}</div>
                        <button className="btl-close-modal" onClick={closeImportModal}>
                            <i className="btl btl-cancel" />
                        </button>
                    </div>

                    <div className="btl-import-modal-body">
                        {importStep === 'upload' && (
                        <>
                         <div className='btl-file-note'>{__('Make sure the CSV file follows the proper format before uploading ', 'betterlinks')} <a target='_blank' href="https://betterlinks.io/docs/auto-link-keywords-import-export-betterlinks">{__('Learn More.', 'betterlinks')}</a> </div>
                            <div className="btl-import-upload-step">
                                <div 
                                    className={`btl-file-drop-zone ${isDragOver ? 'btl-drag-over' : ''} ${fileError ? 'btl-error-state' : ''}`}
                                    onDragEnter={handleDragEnter}
                                    onDragLeave={handleDragLeave}
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                >
                                    <input
                                        id="csv-file-input"
                                        type="file"
                                        accept=".csv"
                                        onChange={handleFileSelect}
                                        className="btl-file-input"
                                        style={{ display: 'none' }}
                                    />
                                    <label htmlFor="csv-file-input" className="btl-file-drop-label">
                                        {
                                            ! isUploading && (
                                            <div className="btl-file-icon">
                                                <img src={plugin_root_url + 'assets/images/tabler-icon-file-upload.svg'} alt="" />
                                            </div>
                                            )
                                        }
                                        {/* <div className="btl-file-icon">
                                            <img src={plugin_root_url + 'assets/images/tabler-icon-file-upload.svg'} alt="" />
                                        </div> */}
                                        {csvFile ? (
                                            <div className="btl-file-selected">
                                                <span className="btl-file-name">{csvFile.name}</span>
                                                {fileError ? (
                                                    <div className="btl-file-error-inline">
                                                        <span className="btl-error-text">{fileError}</span>
                                                    </div>
                                                ) : null}
                                                {isUploading ? ( //isUploading
                                                    <div className="btl-upload-progress-inline">
                                                       
                                                        <div className="btl-upload-message">
                                                            {__('Please wait as the file is processed.', 'betterlinks')}
                                                        </div>
                                                        <div className="btl-upload-progress-container">
                                                            <div className="btl-upload-progress-bar">
                                                                <div 
                                                                    className="btl-upload-progress-fill"
                                                                    style={{ width: `${uploadProgress}%` }}
                                                                ></div>
                                                            </div>
                                                            <div className="btl-upload-progress-percentage">
                                                                {Math.round(uploadProgress)}%
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button type="button" className="btl-change-file" onClick={() => {
                                                        setCsvFile(null);
                                                        setFileError(null);
                                                        const fileInput = document.getElementById('csv-file-input');
                                                        if (fileInput) fileInput.value = '';
                                                    }}>
                                                        {__('Remove File', 'betterlinks')}
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <>
                                                <div className="btl-file-placeholder">
                                                    <span className="btl-file-text">
                                                        {isDragOver 
                                                            ? __('Drop CSV file here', 'betterlinks') 
                                                            : (
                                                                <>
                                                                    {__('Drag & Drop or ', 'betterlinks')}
                                                                    <span className='btl-file-c-text'>{__('Click to Upload File', 'betterlinks')}</span>
                                                                </>
                                                            )
                                                        }
                                                    </span>
                                                </div>
                                                <div className="btl-file-info">
                                                    <span>{__('Supported file format: CSV (Max file size: 5 MB)', 'betterlinks')}</span>
                                                </div>
                                            </>
                                        )}
                                    </label>
                                </div>

                                <div className="btl-sample-format">
                                    <div className="btl-sample-icon">
                                        <img src={plugin_root_url + 'assets/images/sample-csv.svg'} alt="" />
                                    </div>
                                    <div className="btl-sample-content">
                                        <h4>{__('Sample CSV', 'betterlinks')}</h4>
                                        <p>{__('Download this CSV file to ensure proper formatting.', 'betterlinks')}</p>
                                    </div>
                                    <button className="btl-sample-download" onClick={handleSampleDownload}>
                                        <i className="btl btl-download-arrow"></i>
                                    </button>
                                </div>

                                <div className="btl-import-options">
                                    <label className="btl-checkbox-field">
                                        <input
                                            type="checkbox"
                                            checked={rewriteExisting}
                                            onChange={(e) => setRewriteExisting(e.target.checked)}
                                            className="btl-check"
                                        />
                                        <span className="text">
                                            {__('Overwrite Existing Keywords', 'betterlinks')}
                                        </span>
                                         <div className="btl-tooltip">
                                            <span className="dashicons dashicons-info-outline" />
                                            <span className="btl-tooltiptext" style={{ width: '255px', textAlign: 'left', lineHeight: '1.2em' }}>
                                                {__('If unchecked, duplicate keywords will be skipped during the import process.', 'betterlinks')}
                                            </span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </>
                        )}

                        {/* {importStep === 'progress' && ( */}
                        {importStep === 'progress' && (
                            <>
                                <div className='btl-file-note'>{__('Your file import is in progress...Please wait.', 'betterlinks')}</div>
                                <div className="btl-import-progress-step">
                                    <div className="btl-progress-arc-container">
                                        <svg className="btl-progress-arc" width="100" height="60" viewBox="0 0 160 80">
                                            <path
                                                className="btl-progress-arc-background"
                                                d="M 10 70 A 70 70 0 0 1 150 70"
                                                stroke="#e5e7eb"
                                                strokeWidth="12"
                                                fill="transparent"
                                            />
                                            <path
                                                className="btl-progress-arc-progress"
                                                d="M 10 70 A 70 70 0 0 1 150 70"
                                                stroke="#3b82f6"
                                                strokeWidth="12"
                                                fill="transparent"
                                                strokeDasharray="219.91"
                                                strokeDashoffset={`${219.91 * (1 - importProgress / 100)}`}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="btl-progress-percentage">{importProgress}%</div>
                                    </div>
                                    <div className="btl-ie-progress-message">
                                        <span>{__('Importing CSV...', 'betterlinks')}</span>
                                    </div>
                                    <div className="btl-ie-progress-warning">{__('Do not close this window.')}</div>
                                </div>
                            </>
                        )}

                        {importStep === 'success' && importResult && (
                            <div className="btl-import-success-step">
                                <div className="btl-success-icon">
                                    {/* <i className="btl btl-checkbox-checked"></i> */}
                                    <img src={plugin_root_url + 'assets/images/success-blue.svg'} alt="" />
                                </div>
                                <div className="btl-success-content">
                                    <div className='btl-success-title'>{__('Import Completed Successfully', 'betterlinks')}</div>
                                    <div className='btl-success-sub-title'>{__('Processing finished. Here’s the summary:', 'betterlinks')}</div>
                                    <div className="btl-import-summary">
                                        <div className="btl-summary-item">
                                            <span className="btl-summary-label">{__('Successful:', 'betterlinks')}</span>
                                            <span className="btl-summary-value">{importResult.details?.imported || 0}</span>
                                        </div>
                                        <div className="btl-summary-item">
                                            <span className="btl-summary-label">{__('Skipped:', 'betterlinks')}</span>
                                            <span className="btl-summary-value">{importResult.details?.skipped || 0}</span>
                                        </div>
                                    </div>
                                     {/* <div className="btl-success-details">
                                        {__('Skipped keywords were not linked (due to duplicates or other issues).', 'betterlinks')}
                                    </div> */}
                                </div>
                            </div>
                        )}

                        {importStep === 'error' && importResult && (
                            <div className="btl-import-error-step">
                                <div className="btl-error-file-display">
                                    <div className="btl-error-file-info">
                                        <div className="btl-error-message">
                                            {importResult.message || __('Error: Upload failed due to incorrect format/size, etc.', 'betterlinks')}
                                        </div>
                                    </div>
                                </div>
                                {importResult.errorDetails && (
                                    <details className="btl-error-details">
                                        <summary className="btl-error-details-toggle">{__('Show Error Details', 'betterlinks')}</summary>
                                        <pre className="btl-error-log">{typeof importResult.errorDetails === 'string' ? importResult.errorDetails : JSON.stringify(importResult.errorDetails, null, 2)}</pre>
                                    </details>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="btl-import-modal-footer">
                        {importStep === 'upload' && (
                            <>
                                <button
                                    className="btl-btn btl-btn-secondary"
                                    onClick={closeImportModal}
                                >
                                    {__('Cancel', 'betterlinks')}
                                </button>
                                <button
                                    className="btl-btn btl-btn-primary"
                                    onClick={handleImport}
                                    disabled={!csvFile || isUploading}
                                >
                                    {isUploading ? __('Uploading...', 'betterlinks') : __('Import File', 'betterlinks')}
                                </button>
                            </>
                        )}

                        {importStep === 'progress' && (
                            <button
                                className="btl-btn btl-btn-secondary"
                                onClick={closeImportModal}
                            >
                                {__('Cancel', 'betterlinks')}
                            </button>
                        )}

                        {(importStep === 'success' || importStep === 'error') && (
                            <button
                                className="btl-btn btl-btn-primary"
                                onClick={closeImportModal}
                            >
                                {__('Finish', 'betterlinks')}
                            </button>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
};

const mapStateToProps = (state) => ({
    keywords: state.keywords,
    // provide links data so CSV import can resolve short_url -> link_id
    links: state.links || (state.link && state.link.links) || state.links_reducer || null,
});

const mapDispatchToProps = (dispatch) => {
    return {
        export_keywords: bindActionCreators(export_keywords, dispatch),
        import_keywords: bindActionCreators(import_keywords, dispatch),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(KeywordsImportExport);
