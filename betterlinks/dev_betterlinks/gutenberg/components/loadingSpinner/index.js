const { useEffect } = wp.element;

const LoadingSpinner = () => {
	useEffect(() => {
		document?.body?.classList?.add('betterlinks-loading-spinner-mounted');
		return () => {
			document?.body?.classList?.remove('betterlinks-loading-spinner-mounted');
		};
	}, []);
	return (
		<div className="betterlinks-submitted-link-for-gutenberg">
			<div className="betterlinks-round-loader"></div>
		</div>
	);
};

export default LoadingSpinner;
