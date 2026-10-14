import { __ } from '@wordpress/i18n';
import { is_pro_enabled, pro_needs_update } from 'utils/helper';
import ProUpdateRequired from 'components/Teasers/ProUpdateRequired';
import ProLock from './ProLock';
import SectionHead from './SectionHead';
import GeographySection from './GeographySection';
import SourcesSection from './SourcesSection';
import TechnologySection from './TechnologySection';
import TimingSection from './TimingSection';
import AttentionSection from './AttentionSection';
import { TEASER_BROWSER, TEASER_COUNTRIES, TEASER_DEVICES, TEASER_MEDIUM, TEASER_MOVERS, TEASER_OS, TEASER_REFERER, TEASER_TIMING } from './proTeaser.data';

// The single-link view has no Attention section, so its lock card lists four
// bullets rather than the dashboard's five.
const SINGLE_LOCK_POINTS = [
	__('Geography — country-level map and top markets', 'betterlinks'),
	__('Sources — referring sites, social networks and channels', 'betterlinks'),
	__('Technology — device, operating system and browser', 'betterlinks'),
	__('Timing — 7 × 24 heatmap and this link’s busiest hour', 'betterlinks'),
];

const Section = ({ id, title, meta, children }) => (
	<section className="bl-an__section" id={id} aria-labelledby={id ? `${id}-title` : undefined} aria-label={id ? undefined : title}>
		<SectionHead id={id} title={title} meta={meta} />
		{children}
	</section>
);

/**
 * What the free plugin renders where the Pro analytics sections go, i.e. when
 * nothing answers the `betterLinksAnalyticsProSections` filter.
 *
 * The sections themselves are implemented in BetterLinks Pro. This is a static
 * preview only: the real presentational components over fixed sample data
 * (`proTeaser.data.js`) under one ProLock. It reads no store data and makes no
 * requests.
 *
 * When an older Pro is active (it does not register the filter), an update note
 * is shown instead of the upgrade pitch.
 *
 * @param {Object} props
 * @param {'dashboard'|'single'} props.view
 * @param {boolean} props.darkMode
 */
const ProSectionsTeaser = ({ view = 'dashboard', darkMode = false }) => {
	const isSingle = 'single' === view;

	if (is_pro_enabled && pro_needs_update) {
		return (
			<Section id={isSingle ? undefined : 'bl-an-geography'} title={__('Advanced analytics', 'betterlinks')}>
				<ProUpdateRequired feature={__('Advanced analytics', 'betterlinks')} />
			</Section>
		);
	}

	if (isSingle) {
		return (
			<ProLock points={SINGLE_LOCK_POINTS}>
				<Section title={__('Geography', 'betterlinks')} meta={__('where this link is clicked', 'betterlinks')}>
					<GeographySection countries={TEASER_COUNTRIES} tracked loading={false} darkMode={darkMode} />
				</Section>
				<Section title={__('Traffic sources', 'betterlinks')} meta={__('how visitors arrive', 'betterlinks')}>
					<SourcesSection referer={TEASER_REFERER} medium={TEASER_MEDIUM} tracked loading={false} />
				</Section>
				<Section title={__('Technology & devices', 'betterlinks')} meta={__('what your audience uses', 'betterlinks')}>
					<TechnologySection devices={TEASER_DEVICES} os={TEASER_OS} browser={TEASER_BROWSER} tracked loading={false} />
				</Section>
				<Section title={__('Timing', 'betterlinks')} meta={__('when this link is clicked', 'betterlinks')}>
					<TimingSection timing={TEASER_TIMING} loading={false} />
				</Section>
			</ProLock>
		);
	}

	// One ProLock for the whole run: one sticky upgrade card for the block rather
	// than the same card repeated five times.
	return (
		<ProLock>
			<Section id="bl-an-geography" title={__('Geography', 'betterlinks')} meta={__('where in the world your clicks come from', 'betterlinks')}>
				<GeographySection countries={TEASER_COUNTRIES} tracked loading={false} darkMode={darkMode} />
			</Section>
			<Section id="bl-an-sources" title={__('Sources', 'betterlinks')} meta={__('how visitors arrive', 'betterlinks')}>
				<SourcesSection referer={TEASER_REFERER} medium={TEASER_MEDIUM} tracked loading={false} />
			</Section>
			<Section id="bl-an-technology" title={__('Technology & devices', 'betterlinks')} meta={__('what your audience uses', 'betterlinks')}>
				<TechnologySection devices={TEASER_DEVICES} os={TEASER_OS} browser={TEASER_BROWSER} tracked loading={false} />
			</Section>
			<Section id="bl-an-timing" title={__('Timing', 'betterlinks')} meta={__('when clicks happen', 'betterlinks')}>
				<TimingSection timing={TEASER_TIMING} loading={false} />
			</Section>
			<Section id="bl-an-attention" title={__('Movers & Attention', 'betterlinks')} meta={__('what changed and what to fix', 'betterlinks')}>
				<AttentionSection movers={TEASER_MOVERS} hasBaseline loading={false} />
			</Section>
		</ProLock>
	);
};

export default ProSectionsTeaser;
