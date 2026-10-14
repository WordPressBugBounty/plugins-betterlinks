import { __ } from '@wordpress/i18n';
import MoverCard from './MoverCard';
import { MoversSkeleton } from './Skeletons';
import { InfoIcon } from './Icons';

/**
 * Section 6 — Attention (top movers).
 *
 * Two cards: the links that rose the most and those that fell the most versus
 * the previous, equally long period. Movers are computed in the container from
 * the current per-link clicks and the previous window's per-link clicks, so this
 * component is purely presentational.
 */
const AttentionSection = ({ movers, hasBaseline, loading }) => {
	if (loading) return <MoversSkeleton />;

	// No comparable previous period (e.g. the range reaches back before any data
	// existed), so there is nothing to measure a shift against.
	if (!hasBaseline) {
		return (
			<div className="bl-mv__note">
				<InfoIcon width={15} height={15} />
				<span>{__('Movers compare this period with the one before it — pick a range with earlier data to see what changed.', 'betterlinks')}</span>
			</div>
		);
	}

	return (
		<div className="bl-an__grid bl-an__grid--2">
			<MoverCard direction="up" rows={movers.increases} />
			<MoverCard direction="down" rows={movers.decreases} />
		</div>
	);
};

export default AttentionSection;
