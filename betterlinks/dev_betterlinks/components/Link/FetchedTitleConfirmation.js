import { __ } from '@wordpress/i18n';

const FetchedTitleConfirmation = ({ fetchedTitle, handleYes, handleNo }) => {
	return (
		<div className="btl-modal-form-label-found">
			<span className="btl-modal-fetced-title">{fetchedTitle}</span>
			<div className="btl-modal-title-overwrite-row">
				<span className="btl-modal-title-overwrite-text">
					{__('Title found from target URL. ', 'betterlinks')}
					<strong>{__('Overwrite title?', 'betterlinks')}</strong>
				</span>
				<div className="btl-modal-title-overwrite-actions">
					<button
						type="button"
						className="btl-modal-title-overwrite btl-modal-title-overwrite-yes"
						onClick={handleYes}
					>
						{__('Yes', 'betterlinks')}
					</button>
					<button
						type="button"
						className="btl-modal-title-overwrite btl-modal-title-overwrite-no"
						onClick={handleNo}
					>
						{__('No', 'betterlinks')}
					</button>
				</div>
			</div>
		</div>
	);
};

export default FetchedTitleConfirmation;
