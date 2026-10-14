import { useUpgradeProModal } from 'utils/customHooks';
import SelectTeaser from '../utility/SelectTeaser';
import UpgradeToPro from '../UpgradeToPro';
import { __ } from '@wordpress/i18n';
import CheckList from '../utility/CheckList';

const CreateLinkExternallyTeaser = ({ props }) => {
	if (!props.values?.cle?.enable_cle || !props.values?.cle?.advanced_options) return;
	const [isOpenUpgradeToProModal, openUpgradeToProModal, closeUpgradeToProModal] = useUpgradeProModal();
	return (
		<>
			<UpgradeToPro isOpenModal={isOpenUpgradeToProModal} closeModal={closeUpgradeToProModal} />
			<div className="btl-cle-teaser" onClick={openUpgradeToProModal}>
				<CheckList title={__('No Follow', 'betterlinks')} />
				<CheckList title={__('Sponsored', 'betterlinks')} />
				<CheckList title={__('Parameter Forwarding', 'betterlinks')} />
				<CheckList title={__('Tracking', 'betterlinks')} />
				<CheckList title={__('Social Share', 'betterlinks')} />
				<div className="btl-cle-select-teaser">
					<SelectTeaser title={__('BetterLink Category')} />
					<SelectTeaser title={__('Redirect Type')} />
				</div>
			</div>
		</>
	);
};

export default CreateLinkExternallyTeaser;
