import { useState } from 'react';
import ProBadge from 'components/Badge/ProBadge';
import { ChevronIcon } from './Icons';

// Is `id` the active leaf, or the parent of the active submenu child?
const isBranchActive = (item, activeId) => (item.children || []).some((c) => c.id === activeId);

const SettingsSidebar = ({ model, activeId, onSelect, isOpen }) => {
	// Track which submenus are expanded; auto-open the branch holding the active id.
	const [expanded, setExpanded] = useState(() => {
		const init = {};
		model.forEach((g) => (g.items || []).forEach((it) => {
			if (it.children && isBranchActive(it, activeId)) init[it.id] = true;
		}));
		return init;
	});

	const toggleBranch = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

	return (
		<aside className={`bl-settings__sidebar${isOpen ? ' is-open' : ''}`}>
			{model.map((group) => (
				<div className="bl-settings__group" key={group.id}>
					<p className="bl-settings__group-title">{group.label}</p>
					<ul className="bl-settings__nav">
						{(group.items || []).map((item) => {
							if (item.children && item.children.length) {
								const open = !!expanded[item.id] || isBranchActive(item, activeId);
								const Icon = item.icon;
								return (
									<li className="bl-settings__navitem" key={item.id}>
										<button type="button" className={`bl-settings__navlink${isBranchActive(item, activeId) ? ' is-active' : ''}`} onClick={() => toggleBranch(item.id)}>
											{Icon && <Icon size={18} />}
											<span className="bl-settings__navlabel">{item.label}</span>
											<ChevronIcon size={16} className={`bl-settings__chev${open ? ' is-open' : ''}`} />
										</button>
										{open && (
											<ul className="bl-settings__subnav">
												{item.children.map((child) => (
													<li key={child.id}>
														<button
															type="button"
															className={`bl-settings__sublink${activeId === child.id ? ' is-active' : ''}`}
															onClick={() => onSelect(child.id)}
														>
															<span className="bl-settings__navlabel">{child.label}</span>
															{child.pro && <ProBadge />}
														</button>
													</li>
												))}
											</ul>
										)}
									</li>
								);
							}

							const Icon = item.icon;
							return (
								<li className={`bl-settings__navitem${activeId === item.id ? ' is-active' : ''}`} key={item.id}>
									<button type="button" className={`bl-settings__navlink${activeId === item.id ? ' is-active' : ''}`} onClick={() => onSelect(item.id)}>
										{Icon && <Icon size={18} />}
										<span className="bl-settings__navlabel">{item.label}</span>
										{item.pro && <ProBadge />}
									</button>
								</li>
							);
						})}
					</ul>
				</div>
			))}
		</aside>
	);
};

export default SettingsSidebar;
