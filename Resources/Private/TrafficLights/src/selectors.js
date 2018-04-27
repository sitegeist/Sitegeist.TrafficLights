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
            return nodes.reduce((workspaces, node) => {
                if (nodes.filter(i => $get('hasForeignChanges', i) && $get('contextPath', i) === contextPath).count() > 0) {
                    if ($get('hasForeignChanges', node)) {
                        workspaces.push($get('foreignWorkspacesWithChanges', node)._tail.array);
                    }
                }

                return workspaces;
            }, []);
        }

        return [];
    }
);
