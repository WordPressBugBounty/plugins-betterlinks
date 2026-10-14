const SearchLoader = ({ searchStatus }) => {
	return (
		<div className="search-wrapper">
			<div className="search loading">
				<div
					className="search__circle"
					style={{
						...(searchStatus && { animation: 'load8 1.1s infinite linear', '-webkit-animation': 'load8 1.1s infinite linear', 'border-left-color': '#ef726c' }),
					}}
				/>
				<div className="search__rectangle" />
			</div>
		</div>
	);
};

export default SearchLoader;
