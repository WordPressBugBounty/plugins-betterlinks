import { copyToClipboard } from 'utils/helper';
import { useState } from 'react';
import { CopyIcon } from './Icons';

// Backward-compatibility component for Pro < the redesign.
//
// Old Pro's Custom Domain screen (`BetterLinksCustomDomain` filter → its own
// ShortLinkCustomDomain → ARecordConfig / ApacheConfig / NginxConfig) renders a
// `CodeBlock` that the free plugin passes down through the filter props. The
// redesigned free teaser no longer uses it, but dropping it left old Pro
// rendering `<CodeBlock>` as `undefined` (React error #130). It is still handed
// to the filter so old Pro keeps working; the free teaser uses CodeSnippet.
const CodeBlock = ({ enableCopy = true, code, copyCode }) => {
	const [copyStatus, setCopyStatus] = useState(false);
	return (
		<div className="btl-code-block" style={{ position: 'relative' }}>
			{enableCopy && (
				<span
					className="copy-btn"
					// The old free-plugin `.copy-btn` positioning CSS was removed in the
					// redesign (leaving the icon stranded above the box), so keep this
					// self-contained: absolutely pinned to the right of the code box,
					// vertically centred, subtle, and sized to match the redesign's other
					// copy icons rather than the raw 24px asset. Wrapper is position:relative.
					style={{
						position: 'absolute',
						top: '50%',
						right: '10px',
						transform: 'translateY(-50%)',
						display: 'inline-flex',
						alignItems: 'center',
						cursor: 'pointer',
						color: '#6b7280',
						zIndex: 1,
					}}
					onClick={() => {
						copyToClipboard(copyCode || code);
						setCopyStatus(true);
						let timer = setTimeout(() => {
							setCopyStatus(false);
							clearTimeout(timer);
						}, 1000);
					}}
				>
					{copyStatus ? <span className="dashicons dashicons-yes" style={{ marginRight: '2px' }} /> : <CopyIcon size={16} />}
				</span>
			)}
			<code style={{ paddingRight: '34px' }} dangerouslySetInnerHTML={{ __html: code }} />
		</div>
	);
};

export default CodeBlock;
