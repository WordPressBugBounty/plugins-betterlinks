/**
 * The heading row every Analytics section opens with: title, rule and a short
 * caption.
 *
 * Also handed to BetterLinks Pro through the `betterLinksAnalyticsProSections`
 * context, so sections rendered by Pro keep exactly the markup of the free ones.
 *
 * `id` is the section's element id; the title gets `${id}-title` so the section
 * can point `aria-labelledby` at it.
 */
const SectionHead = ({ id, title, meta }) => (
	<div className="bl-an__sechead">
		<h2 className="bl-an__sectitle" id={id ? `${id}-title` : undefined}>
			{title}
		</h2>
		<span className="bl-an__secrule" aria-hidden="true" />
		{meta && <span className="bl-an__secmeta">{meta}</span>}
	</div>
);

export default SectionHead;
