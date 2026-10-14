import React from 'react';
import { Droppable as BaseDroppable } from 'react-beautiful-dnd';

/**
 * react-beautiful-dnd attaches defaultProps to its connected Droppable, and
 * react-redux wraps connected components in React.memo — a pairing React 18.3
 * warns about on every render of the links board:
 *
 *   Connect(Component): Support for defaultProps will be removed from memo
 *   components in a future major release.
 *
 * The library was last released in 2022, so the warning cannot be fixed at
 * source. Take its defaults over instead: read them off the component, remove
 * the property React objects to, and apply the same values here as ordinary
 * default parameters. Behaviour is unchanged — these are the library's own
 * defaults, and a caller's prop still wins.
 *
 * Delete this file and import Droppable directly again if the project moves to
 * @hello-pangea/dnd, the maintained fork, which fixed this upstream.
 */
const libraryDefaults = { ...(BaseDroppable.defaultProps || {}) };

if (BaseDroppable.defaultProps) {
	delete BaseDroppable.defaultProps;
}

export const Droppable = (props) => {
	// Mirrors defaultProps semantics: an explicitly-passed `undefined` falls
	// back to the default rather than overriding it with undefined.
	const merged = { ...libraryDefaults };
	Object.keys(props).forEach((key) => {
		if (props[key] !== undefined) {
			merged[key] = props[key];
		}
	});

	return <BaseDroppable {...merged} />;
};

export { DragDropContext, Draggable } from 'react-beautiful-dnd';
