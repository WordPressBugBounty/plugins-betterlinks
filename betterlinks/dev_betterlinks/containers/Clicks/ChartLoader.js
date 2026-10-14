import { plugin_root_url } from 'utils/helper';

const ChartLoader = () => (
	<div className="btl-chart-preloader">
		<img src={`${plugin_root_url}assets/images/dark-mode-loader.gif`} />
	</div>
);

export default ChartLoader;
