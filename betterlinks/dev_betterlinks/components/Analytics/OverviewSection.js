import { __ } from '@wordpress/i18n';
import HeroCard from './HeroCard';
import StatCard, { TrendStat, RatioStat } from './StatCard';
import { OverviewSkeleton } from './Skeletons';
import { UsersIcon, BotIcon, RepeatIcon, PulseIcon } from './Icons';
import { formatCompact, formatNumber } from './analytics.helper';

const CLICKS_COLOR = '#2f6bff';

/** Whole-percent share of `part` in `part + rest`, guarding the empty case. */
const share = (part, rest) => {
	const total = part + rest;
	if (!total) return 0;
	return Math.round((part / total) * 100);
};

/**
 * Section 1 — Overview.
 *
 * Human-vs-bot and new-vs-returning come from the `clicks/get_audience` route.
 * Both read columns that only started being filled in from the release that
 * added this report, so each half reports whether it could classify anything
 * (`tracked`); clicks recorded before that carry no bot flag and no visitor id
 * and are left out rather than guessed at. When the "disable bot clicks"
 * setting is on, bot hits are never stored at all — the split would read 100%
 * human, so the card says the bots are being filtered instead.
 */
const OverviewSection = ({ overview, audience, audienceLoading, deltas, rangeLabel, compareLabel, darkMode, loading, failed, onRetry }) => {
	if (loading) return <OverviewSkeleton />;

	if (failed) {
		return (
			<div className="bl-an__error" role="alert">
				<p className="bl-an__error-title">{__('Analytics could not be loaded', 'betterlinks')}</p>
				<p className="bl-an__error-text">{__('The request for click data did not complete. Check your connection and try again.', 'betterlinks')}</p>
				<button type="button" className="bl-an__btn" onClick={onRetry}>
					{__('Retry', 'betterlinks')}
				</button>
			</div>
		);
	}

	const { series, unique, avgPerDay } = overview;
	const uniqueSeries = series.map((row) => row.unique);
	const clicksSeries = series.map((row) => row.clicks);

	const bot = audience?.bot;
	const visitors = audience?.visitors;
	const botIcon = <BotIcon width={15} height={15} />;
	const repeatIcon = <RepeatIcon width={15} height={15} />;

	let botCard;
	if (audience?.bots_blocked) {
		botCard = (
			<StatCard
				icon={botIcon}
				label={__('Human vs Bot', 'betterlinks')}
				unavailable
				naTitle={__('Bots filtered', 'betterlinks')}
				hint={__('“Disable bot clicks” is on, so bot hits are never recorded. Turn it off in Settings → Tracking to see the split.', 'betterlinks')}
			/>
		);
	} else if (bot?.tracked) {
		botCard = <RatioStat icon={botIcon} label={__('Human vs Bot', 'betterlinks')} primaryPct={share(bot.human, bot.bot)} primaryLabel={__('human', 'betterlinks')} secondaryLabel={__('bot', 'betterlinks')} />;
	} else {
		botCard = (
			<StatCard
				icon={botIcon}
				label={__('Human vs Bot', 'betterlinks')}
				unavailable
				hint={audienceLoading ? __('Loading…', 'betterlinks') : __('These clicks were recorded before bot traffic was flagged. New clicks from now on will be split here.', 'betterlinks')}
			/>
		);
	}

	let visitorCard;
	if (visitors?.tracked) {
		visitorCard = (
			<RatioStat
				icon={repeatIcon}
				label={__('New vs Returning', 'betterlinks')}
				primaryPct={share(visitors.new, visitors.returning)}
				primaryLabel={__('new', 'betterlinks')}
				secondaryLabel={__('returning', 'betterlinks')}
			/>
		);
	} else {
		visitorCard = (
			<StatCard
				icon={repeatIcon}
				label={__('New vs Returning', 'betterlinks')}
				unavailable
				hint={audienceLoading ? __('Loading…', 'betterlinks') : __('These clicks were recorded before visitors were identified. New clicks from now on will be split here.', 'betterlinks')}
			/>
		);
	}

	return (
		<div className="bl-ov">
			<HeroCard
				overview={overview}
				delta={deltas.total}
				rangeLabel={rangeLabel}
				compareLabel={compareLabel}
				darkMode={darkMode}
				audience={audience}
				audienceLoading={audienceLoading}
			/>

			<div className="bl-ov__stats">
				<TrendStat
					icon={<UsersIcon width={15} height={15} />}
					label={__('Unique visitors', 'betterlinks')}
					value={formatCompact(unique)}
					series={uniqueSeries}
					color={CLICKS_COLOR}
					filled
					delta={deltas.unique}
					deltaCaption={__('vs previous', 'betterlinks')}
				/>

				{botCard}

				{visitorCard}

				<TrendStat
					icon={<PulseIcon width={15} height={15} />}
					label={__('Avg clicks / day', 'betterlinks')}
					value={formatNumber(avgPerDay)}
					series={clicksSeries}
					color={CLICKS_COLOR}
					filled
					delta={deltas.avgPerDay}
					deltaCaption={__('pace vs previous', 'betterlinks')}
				/>
			</div>
		</div>
	);
};

export default OverviewSection;
