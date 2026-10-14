import { __ } from '@wordpress/i18n';

const Note = ({ note, title = __('Note', 'betterlinks') }) => {
	return (
		<span className="btl-modal-customize-link-preview--note">
			{title}: {note}
		</span>
	);
};

export default Note;
