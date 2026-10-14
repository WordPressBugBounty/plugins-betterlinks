import { Form, Formik } from 'formik';
import { __ } from '@wordpress/i18n';
import CheckList from '../utility/CheckList';
import UpgradeToPro from '../UpgradeToPro';
import { useUpgradeProModal } from 'utils/customHooks';
import SelectTeaser from '../utility/SelectTeaser';

export default function AutoLinkCreate({ autoCreateLinkSettings, terms, setAutoCreateLinkSettings }) {
	return betterLinksHooks.applyFilters('BetterLinksAutoCreateLinksPro', <Teaser />, {
		autoCreateLinkSettings: autoCreateLinkSettings,
		terms: terms,
		setAutoCreateLinkSettings: setAutoCreateLinkSettings,
	});
}

const Teaser = () => {
	const [isOpenUpgradeToProModal, openUpgradeToProModal, closeUpgradeToProModal] = useUpgradeProModal();
	return (
		<>
			<UpgradeToPro isOpenModal={isOpenUpgradeToProModal} closeModal={closeUpgradeToProModal} />
			<Formik>
				<Form>
					<CheckList title={__('Enable Auto-Create Links', 'betterlinks')} onClick={openUpgradeToProModal} />
					<CheckList title={__('Post Shortlinks', 'betterlinks')} onClick={openUpgradeToProModal} />
					<SelectTeaser title={__('BetterLinks Category')} onClick={openUpgradeToProModal} />
					<CheckList title={__('Page Shortlinks', 'betterlinks')} onClick={openUpgradeToProModal} />
					<SelectTeaser title={__('BetterLinks Category')} onClick={openUpgradeToProModal} />
					<CheckList title={__('Custom Post Type Shortlinks', 'betterlinks')} onClick={openUpgradeToProModal} />
					<SelectTeaser title={__('BetterLinks Category')} onClick={openUpgradeToProModal} />
					<SelectTeaser title={__('Select Custom Post Types')} onClick={openUpgradeToProModal} />
				</Form>
			</Formik>
		</>
	);
};
