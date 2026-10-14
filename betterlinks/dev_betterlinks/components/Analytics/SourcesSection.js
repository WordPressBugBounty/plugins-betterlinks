import { __, sprintf, _n } from '@wordpress/i18n';
import BarList from './BarList';
import { BarListSkeleton } from './Skeletons';
import { ShareIcon, MegaphoneIcon, FilterIcon, GlobeIcon, CompassIcon } from './Icons';
import { toRefererRows, toSocialRows, toMediumRows, otherReferrerCount } from './analytics.helper';

const TRACKING_HINT = __('Turn on extra data tracking to record where your clicks come from.', 'betterlinks');

/**
 * Section 2 — Sources.
 *
 * All three lists come from the Pro chart/medium routes, which return empty
 * arrays unless `betterlinks/is_extra_data_tracking_compatible` passes. That is
 * why `tracked` is threaded in: without it an untracked site and a site with no
 * referral traffic would look identical.
 */
const SourcesSection = ({ referer, medium, tracked, loading }) => {
	if (loading) return <BarListSkeleton />;

	const others = otherReferrerCount(medium);

	return (
		<div className="bl-an__grid">
			<BarList
				icon={<ShareIcon width={16} height={16} />}
				title={__('Top referrers', 'betterlinks')}
				subtitle={__('referring sites', 'betterlinks')}
				rows={toRefererRows(referer)}
				rowIcon={() => <GlobeIcon width={14} height={14} />}
				unavailable={!tracked}
				unavailableHint={TRACKING_HINT}
				emptyText={__('No clicks arrived from a referring site in this range.', 'betterlinks')}
			/>

			<BarList
				icon={<MegaphoneIcon width={16} height={16} />}
				title={__('Top social media', 'betterlinks')}
				subtitle={__('social networks', 'betterlinks')}
				rows={toSocialRows(medium)}
				rowIcon={() => <ShareIcon width={14} height={14} />}
				unavailable={!tracked}
				unavailableHint={TRACKING_HINT}
				emptyText={__('No clicks came from social networks in this range.', 'betterlinks')}
			/>

			{/* Labelled "channels" rather than utm_medium: BetterLinks does not
			    aggregate UTM parameters — get_top_medium() buckets referring
			    domains into search / social / ecommerce. */}
			<BarList
				icon={<FilterIcon width={16} height={16} />}
				title={__('Top channels', 'betterlinks')}
				subtitle={__('grouped referrers', 'betterlinks')}
				rows={toMediumRows(medium)}
				rowIcon={() => <CompassIcon width={14} height={14} />}
				unavailable={!tracked}
				unavailableHint={TRACKING_HINT}
				emptyText={__('No clicks were grouped into a channel in this range.', 'betterlinks')}
				footnote={
					others
						? sprintf(
								/* translators: %s: number of referring domains that fell outside the known channels. */
								_n('%s other referring domain outside these channels.', '%s other referring domains outside these channels.', others, 'betterlinks'),
								others.toLocaleString()
						  )
						: null
				}
			/>
		</div>
	);
};

export default SourcesSection;
