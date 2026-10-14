import React from 'react';
import { __, sprintf } from '@wordpress/i18n';
import UpgradeToPro from 'components/Teasers/UpgradeToPro';
import ProBadge from 'components/Badge/ProBadge';

const ROLES = ['Editor', 'Author', 'Contributor', 'Subscriber'];

const CAPABILITIES = [
	__('Who Can View Links?', 'betterlinks'),
	__('Who Can Create Links?', 'betterlinks'),
	__('Who Can Edit Links?', 'betterlinks'),
	__('Who Can Check Analytics?', 'betterlinks'),
	__('Who Can Edit Settings?', 'betterlinks'),
	__('Who can Mark Links as Favorite/Unfavorite?', 'betterlinks'),
	__('Who can Manage Tags & Categories?', 'betterlinks'),
	__('Who can Manage Link Scanner?', 'betterlinks'),
];

// Free teaser: a static preview of the Pro Role Management screen using the same
// `bl-rm-*` design system, with every control routed to the upgrade modal.
export default class RoleManagement extends React.Component {
	constructor(props) {
		super(props);
		this.state = { isOpenModal: false };
		this.openModal = this.openModal.bind(this);
		this.closeModal = this.closeModal.bind(this);
	}
	openModal() {
		this.setState({ isOpenModal: true });
	}
	closeModal() {
		this.setState({ isOpenModal: false });
	}
	render() {
		return (
			<React.Fragment>
				<UpgradeToPro isOpenModal={this.state.isOpenModal} closeModal={this.closeModal} />
				<div className="bl-rm">
					{CAPABILITIES.map((label, i) => (
						<div className="bl-rm__section" key={i} onClick={this.openModal} style={{ cursor: 'pointer' }}>
							<div className="bl-rm__aside">
								<h3 className="bl-rm__title">
									{label} <ProBadge />
								</h3>
								<p className="bl-rm__count">
									{sprintf(
										/* translators: 1: enabled role count, 2: total role count. */
										__('%1$d of %2$d roles enabled', 'betterlinks'),
										0,
										ROLES.length
									)}
								</p>
								<button type="button" className="bl-rm__all" onClick={this.openModal}>
									{__('Enable all', 'betterlinks')}
								</button>
							</div>
							<div className="bl-rm__grid">
								{ROLES.map((role) => (
									<label className="bl-rm__role" key={`${i}_${role}`}>
										<span className="bl-rm__role-name">{role}</span>
										<input type="checkbox" className="bl-rm__switch-input" disabled />
										<span className="bl-rm__switch" aria-hidden="true">
											<span className="bl-rm__switch-thumb" />
										</span>
									</label>
								))}
							</div>
						</div>
					))}
				</div>
			</React.Fragment>
		);
	}
}
