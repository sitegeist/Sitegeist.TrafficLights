import {createSelector} from 'reselect';
import {$get} from 'plow-js';

export const makeNodeHasForeignChangesSelector = () => createSelector(
    [
        $get('cr.nodes.byContextPath'),
        (state, contextPath) => {
            return contextPath;
        }
    ],
    (nodes, contextPath) => nodes && nodes.filter(i => $get('hasForeignChanges', i) && $get('contextPath', i) === contextPath).count() > 0
);

export const makeForeignWorkspacesWithChangesSelector = () => createSelector(
    [
        $get('cr.nodes.byContextPath'),
        (state, contextPath) => {
            return contextPath;
        }
    ],

    (nodes, contextPath) => {
		if (nodes) {
			const nodeHasForeignChanges = (nodes.filter(i => $get('hasForeignChanges', i) && $get('contextPath', i) === contextPath).count() > 0);

			return nodes.reduce((workspaces, node) => {
				if (nodeHasForeignChanges && $get('contextPath', node) === contextPath) {
					const workspaceNames = $get('foreignWorkspacesWithChanges', node)._tail.array;
					return [...workspaces, ...workspaceNames]
				}

				return workspaces;
			}, []);
		}

        return [];
    }
);
