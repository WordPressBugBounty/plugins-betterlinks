/**
 * Loading placeholders for the Analytics sections.
 *
 * These mirror the real markup's box model (same card padding, same grid, same
 * heights) so the layout doesn't jump when the data lands.
 */

export const SkeletonBox = ({ w, h, r = 6, className = '' }) => (
	<span className={`bl-skel ${className}`} style={{ width: w, height: h, borderRadius: r }} aria-hidden="true" />
);

const StatCardSkeleton = () => (
	<div className="bl-stat bl-stat--loading">
		<div className="bl-stat__head">
			<SkeletonBox w={16} h={16} r={4} />
			<SkeletonBox w="52%" h={10} />
		</div>
		<div className="bl-stat__body">
			<SkeletonBox w={72} h={26} r={7} />
			<SkeletonBox w={104} h={34} r={7} className="bl-skel--spark" />
		</div>
		<SkeletonBox w="64%" h={10} />
	</div>
);

export const OverviewSkeleton = () => (
	<div className="bl-ov" aria-busy="true" aria-live="polite">
		<span className="screen-reader-text">Loading analytics…</span>

		<div className="bl-hero bl-hero--loading">
			<div className="bl-hero__rail">
				<div className="bl-hero__label">
					<SkeletonBox w={16} h={16} r={4} />
					<SkeletonBox w={150} h={10} />
				</div>
				<SkeletonBox w={170} h={46} r={10} />
				<SkeletonBox w={190} h={12} />
				<div className="bl-hero__facts">
					{[0, 1, 2].map((i) => (
						<div className="bl-hero__fact" key={i}>
							<SkeletonBox w={120} h={12} />
							<SkeletonBox w={44} h={12} />
						</div>
					))}
				</div>
			</div>
			<div className="bl-hero__chart">
				<div className="bl-hero__legend">
					<SkeletonBox w={110} h={12} />
					<SkeletonBox w={110} h={12} />
				</div>
				<SkeletonBox w="100%" h={300} r={10} />
			</div>
		</div>

		<div className="bl-ov__stats">
			{[0, 1, 2, 3].map((i) => (
				<StatCardSkeleton key={i} />
			))}
		</div>
	</div>
);

const BarCardSkeleton = ({ rows }) => (
	<div className="bl-bars bl-bars--loading">
		<div className="bl-bars__head">
			<SkeletonBox w={16} h={16} r={4} />
			<SkeletonBox w={120} h={12} />
		</div>
		<ul className="bl-bars__list">
			{Array.from({ length: rows }).map((_, i) => (
				<li className="bl-bars__row" key={i}>
					<div className="bl-bars__line">
						<SkeletonBox w={22} h={22} r={6} />
						{/* Staggered widths so the placeholder reads as a ranked list. */}
						<SkeletonBox w={`${58 - i * 6}%`} h={11} />
						<SkeletonBox w={34} h={11} className="bl-skel--push" />
					</div>
					<SkeletonBox w={`${88 - i * 14}%`} h={5} r={999} />
				</li>
			))}
		</ul>
	</div>
);

export const BarListSkeleton = ({ cards = 3, rows = 5 }) => (
	<div className="bl-an__grid" aria-busy="true">
		{Array.from({ length: cards }).map((_, i) => (
			<BarCardSkeleton rows={rows} key={i} />
		))}
	</div>
);

export const SingleLinkCardSkeleton = () => (
	<div className="bl-slc bl-slc--loading" aria-busy="true">
		<div className="bl-slc__lead">
			<SkeletonBox w={48} h={48} r={12} />
			<div className="bl-slc__identity">
				<SkeletonBox w={220} h={20} r={6} />
				<div className="bl-slc__meta">
					<SkeletonBox w={70} h={14} r={999} />
					<SkeletonBox w={180} h={12} />
				</div>
			</div>
		</div>
		<div className="bl-slc__fields">
			<SkeletonBox w="100%" h={44} r={10} />
			<SkeletonBox w="100%" h={44} r={10} />
		</div>
	</div>
);

const SingleStatSkeleton = () => (
	<div className="bl-stat bl-stat--loading">
		<div className="bl-stat__head">
			<SkeletonBox w={16} h={16} r={4} />
			<SkeletonBox w="52%" h={10} />
		</div>
		<div className="bl-stat__body">
			<SkeletonBox w={90} h={26} r={7} />
		</div>
		<SkeletonBox w="60%" h={10} />
	</div>
);

export const SingleOverviewSkeleton = () => (
	<div className="bl-sov" aria-busy="true">
		<div className="bl-sov__stats">
			{[0, 1, 2, 3].map((i) => (
				<SingleStatSkeleton key={i} />
			))}
		</div>
		<div className="bl-sov__chart">
			<div className="bl-sov__chart-head">
				<SkeletonBox w={150} h={14} />
			</div>
			<SkeletonBox w="100%" h={320} r={10} />
		</div>
	</div>
);

export const GeographySkeleton = () => (
	<div className="bl-geo" aria-busy="true">
		<div className="bl-geo__panel">
			<div className="bl-geo__head">
				<SkeletonBox w={16} h={16} r={4} />
				<SkeletonBox w={140} h={12} />
			</div>
			<SkeletonBox w="100%" h={330} r={10} />
		</div>
		<div className="bl-geo__panel bl-geo__panel--list">
			<div className="bl-geo__head">
				<SkeletonBox w={16} h={16} r={4} />
				<SkeletonBox w={120} h={12} />
			</div>
			<div className="bl-geo__skel-list">
				{Array.from({ length: 7 }).map((_, i) => (
					<div className="bl-geo__skel-row" key={i}>
						<SkeletonBox w={22} h={16} r={4} />
						<SkeletonBox w={`${52 - i * 5}%`} h={11} />
						<SkeletonBox w={40} h={11} className="bl-skel--push" />
					</div>
				))}
			</div>
		</div>
	</div>
);

const MoverCardSkeleton = () => (
	<div className="bl-mv bl-mv--loading">
		<div className="bl-mv__head">
			<SkeletonBox w={16} h={16} r={4} />
			<SkeletonBox w={110} h={12} />
		</div>
		<ul className="bl-mv__list">
			{Array.from({ length: 4 }).map((_, i) => (
				<li className="bl-mv__row" key={i}>
					<SkeletonBox w={14} h={14} r={4} />
					<span className="bl-mv__meta">
						<SkeletonBox w={`${60 - i * 6}%`} h={12} />
						<SkeletonBox w={70} h={10} />
					</span>
					<SkeletonBox w={70} h={16} r={6} className="bl-skel--push" />
				</li>
			))}
		</ul>
	</div>
);

export const MoversSkeleton = () => (
	<div className="bl-an__grid bl-an__grid--2" aria-busy="true">
		<MoverCardSkeleton />
		<MoverCardSkeleton />
	</div>
);

export const TimingSkeleton = () => (
	<div className="bl-heat" aria-busy="true">
		<div className="bl-heat__head">
			<SkeletonBox w={17} h={17} r={5} />
			<SkeletonBox w={150} h={13} />
		</div>
		<div className="bl-heat__scroll">
			<div className="bl-heat__inner">
				<div className="bl-heat__hours">
					<SkeletonBox w={200} h={10} />
				</div>
				<div className="bl-heat__body">
					<div className="bl-heat__days">
						{Array.from({ length: 7 }).map((_, i) => (
							<SkeletonBox w={30} h={11} key={i} />
						))}
					</div>
					<div className="bl-heat__grid">
						{Array.from({ length: 7 * 24 }).map((_, i) => (
							<span className="bl-heat__cell bl-skel" key={i} />
						))}
					</div>
				</div>
			</div>
		</div>
		<div className="bl-heat__foot">
			<SkeletonBox w={320} h={12} />
			<SkeletonBox w={140} h={12} />
		</div>
	</div>
);

export const ClickLogSkeleton = ({ rows = 8 }) => (
	<div className="bl-tbl bl-clog bl-tbl--loading" aria-busy="true">
		<div className="bl-tbl__toolbar">
			<SkeletonBox w={280} h={40} r={10} />
			<div className="bl-clog__tools">
				<SkeletonBox w={190} h={40} r={10} />
				<SkeletonBox w={110} h={40} r={10} />
			</div>
		</div>
		<div className="bl-tbl__scroll">
			<div className="bl-tbl__skel-head" style={{ minWidth: 1100 }}>
				<SkeletonBox w={16} h={16} r={4} />
				{[12, 11, 12, 20, 12, 11, 11, 10, 10].map((w, i) => (
					<SkeletonBox w={`${w}%`} h={10} key={i} />
				))}
			</div>
			{Array.from({ length: rows }).map((_, i) => (
				<div className="bl-tbl__skel-row" key={i} style={{ minWidth: 1100 }}>
					<SkeletonBox w={16} h={16} r={4} />
					{[14, 12, 14, 22, 14, 12, 12].map((w, j) => (
						<SkeletonBox w={`${w}%`} h={12} key={j} />
					))}
				</div>
			))}
		</div>
		<div className="bl-tbl__foot">
			<SkeletonBox w={90} h={32} r={8} />
			<SkeletonBox w={210} h={32} r={8} />
		</div>
	</div>
);

export const LinksTableSkeleton = ({ rows = 8 }) => (
	<div className="bl-tbl bl-tbl--loading" aria-busy="true">
		<div className="bl-tbl__head">
			<SkeletonBox w={17} h={17} r={5} />
			<SkeletonBox w={130} h={13} />
		</div>
		<div className="bl-tbl__toolbar">
			<SkeletonBox w={260} h={40} r={10} />
			<SkeletonBox w={190} h={40} r={10} />
		</div>
		<div className="bl-tbl__scroll">
			<div className="bl-tbl__skel-head">
				<SkeletonBox w={16} h={16} r={4} />
				{[26, 20, 22, 12, 12].map((w, i) => (
					<SkeletonBox w={`${w}%`} h={10} key={i} />
				))}
			</div>
			{Array.from({ length: rows }).map((_, i) => (
				<div className="bl-tbl__skel-row" key={i}>
					<SkeletonBox w={16} h={16} r={4} />
					<SkeletonBox w="26%" h={12} />
					<SkeletonBox w="20%" h={12} />
					<SkeletonBox w="22%" h={12} />
					<SkeletonBox w="12%" h={12} />
					<SkeletonBox w="12%" h={12} />
				</div>
			))}
		</div>
		<div className="bl-tbl__foot">
			<SkeletonBox w={90} h={32} r={8} />
			<SkeletonBox w={210} h={32} r={8} />
		</div>
	</div>
);

export default OverviewSkeleton;
