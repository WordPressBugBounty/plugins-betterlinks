(function ($) {
	const copyBtn = $('.btl-short-url-copy-button');

	copyBtn.click(function () {
		const img = $(this).find('.icon img'),
			span = $(this).find('.icon span');
		new ClipboardJS('.btl-short-url-copy-button');

		img.hide();
		span.show();
		let timer = setTimeout(function () {
			img.show();
			span.hide();
			clearTimeout(timer);
		}, 2000);
	});

	// confetti
	let flakes = '',
		randomColor;
	for (let i = 0, len = 400; i < len; i++) {
		randomColor = Math.floor(Math.random() * 16777215).toString(16);
		flakes += '<div class="ball" style="background: #' + randomColor;
		flakes += '; animation-duration: ' + 3 + 's; animation-delay: ';
		flakes += Math.random() * 2 + 0 + 's;"></div>';
	}
	document.getElementById('confetti').innerHTML = flakes;
})(jQuery);
