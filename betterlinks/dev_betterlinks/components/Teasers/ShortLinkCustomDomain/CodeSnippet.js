import { __ } from '@wordpress/i18n';
import { CopyIcon } from './Icons';

// A token reading as a hostname/path: has a dot between word characters and no
// regex metacharacters (so `example.com/$1` highlights but `(.*)$` does not).
const isHostToken = (token) => /[\w-]\.[\w-]/.test(token) && !/[*()\[\]{}]/.test(token);

const tokenClass = (token, index) => {
	if (0 === index) {
		return 'bl-cd__code-kw';
	}
	if (isHostToken(token)) {
		return 'bl-cd__code-host';
	}
	return '';
};

// Teaser variant of the Pro code block: same dark, syntax-tokenised look, but
// the copy button funnels to the upgrade modal instead of copying.
const CodeSnippet = ({ lines = [], label = '', onLocked }) => (
	<div className="bl-cd__code">
		<button type="button" className="bl-cd__code-copy" onClick={onLocked} aria-label={__('Copy to clipboard', 'betterlinks')}>
			<CopyIcon size={14} />
			<span>{__('Copy', 'betterlinks')}</span>
		</button>
		<pre className="bl-cd__code-body" aria-label={label}>
			<code>
				{lines.map((line, i) => (
					<span className="bl-cd__code-line" key={i}>
						{line.split(' ').map((token, j) => (
							<span className={tokenClass(token, j)} key={j}>
								{token}
								{j < line.split(' ').length - 1 ? ' ' : ''}
							</span>
						))}
					</span>
				))}
			</code>
		</pre>
	</div>
);

export default CodeSnippet;
