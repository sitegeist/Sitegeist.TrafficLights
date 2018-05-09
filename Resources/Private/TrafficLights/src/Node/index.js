import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {$get} from 'plow-js';
import {connect} from 'react-redux';

import flowright from 'lodash.flowright';
import Tree from '../Tree/';

import {selectors} from '@neos-project/neos-ui-redux-store';
import {makeNodeHasForeignChangesSelector, makeForeignWorkspacesWithChangesSelector} from './../selectors';
import {neos} from '@neos-project/neos-ui-decorators';

import animate from 'amator';
import hashSum from 'hash-sum';
import * as he from 'he';

const getContextPath = $get('contextPath');


const isNodeCollapsed = (node, isToggled, rootNode, loadingDepth) => {
    const isCollapsedByDefault = loadingDepth === 0 ? false : $get('depth', node) - $get('depth', rootNode) >= loadingDepth;
    return (isCollapsedByDefault && !isToggled) || (!isCollapsedByDefault && isToggled);
};

const stripTags = string => string && string.replace(/<\/?[^>]+(>|$)/g, '');

const decodeHtml = he.decode;

//
// Finds the first parent element that has a scrollbar
//
const findScrollingParent = parentElement => {
    if (parentElement.scrollHeight > parentElement.offsetHeight) {
        return parentElement;
    }
    if (parentElement.parentElement) {
        return findScrollingParent(parentElement.parentElement);
    }
    return null;
};

const getOrDefault = defaultValue => value => value || defaultValue;

const decodeLabel = flowright(
    decodeHtml,
    stripTags,
    getOrDefault('')
);

export default class Node extends PureComponent {
    state = {
        shouldScrollIntoView: false
    };

    static propTypes = {
        isContentTreeNode: PropTypes.bool,
        rootNode: PropTypes.object,
        loadingDepth: PropTypes.number,
        ChildRenderer: PropTypes.func.isRequired,
        node: PropTypes.object,
        nodeDndType: PropTypes.string.isRequired,
        nodeTypeRole: PropTypes.string,
        currentlyDraggedNode: PropTypes.object,
        hasChildren: PropTypes.bool,
        isLastChild: PropTypes.bool,
        childNodes: PropTypes.object,
        level: PropTypes.number.isRequired,
        isActive: PropTypes.bool,
        isFocused: PropTypes.bool,
        toggledNodeContextPaths: PropTypes.object,
        hiddenContextPaths: PropTypes.object,
        intermediateContextPaths: PropTypes.object,
        loadingNodeContextPaths: PropTypes.object,
        errorNodeContextPaths: PropTypes.object,
        canBeInsertedAlongside: PropTypes.bool,
        canBeInsertedInto: PropTypes.bool,
        isNodeDirty: PropTypes.bool.isRequired,
        nodeHasForeignChanges: PropTypes.bool,
        foreignWorkspacesWithChanges: PropTypes.array,

        nodeTypesRegistry: PropTypes.object.isRequired,
        i18nRegistry: PropTypes.object.isRequired,

        getTreeNode: PropTypes.func,
        onNodeToggle: PropTypes.func,
        onNodeClick: PropTypes.func,
        onNodeFocus: PropTypes.func,
        onNodeDrag: PropTypes.func,
        onNodeDrop: PropTypes.func
    };

    componentDidMount() {
        // Always request scroll on first render if given node is focused
        if (this.props.isFocused) {
            this.setState({
                shouldScrollIntoView: true
            });
        }
    }

    componentWillReceiveProps(nextProps) {
        // If focused node changed
        if (this.props.isFocused !== nextProps.isFocused) {
            // And it is the current node
            if (nextProps.isFocused) {
                // Request scrolling itself into view
                this.setState({
                    shouldScrollIntoView: true
                });
            }
        }
    }

    componentDidUpdate() {
        this.scrollFocusedNodeIntoView();
    }

    scrollFocusedNodeIntoView() {
        if (this.state.shouldScrollIntoView && this.domNode) {
            const scrollingElement = findScrollingParent(this.domNode);
            if (scrollingElement) {
                const nodeTopPosition = this.domNode.getBoundingClientRect().top;
                const offset = 50;
                const scrollingElementPosition = scrollingElement.getBoundingClientRect();
                const nodeIsNotInView = nodeTopPosition < scrollingElementPosition.top + offset || nodeTopPosition > scrollingElementPosition.bottom - offset;
                if (nodeIsNotInView) {
                    const scrollTop = nodeTopPosition - scrollingElement.firstElementChild.getBoundingClientRect().top - offset;
                    animate({scrollTop: scrollingElement.scrollTop}, {scrollTop}, {
                        step: ({scrollTop}) => {
                            scrollingElement.scrollTop = scrollTop;
                        }
                    });
                }
                this.setState({
                    shouldScrollIntoView: false
                });
            }
        }
    }

    accepts = mode => {
        const {node, currentlyDraggedNode, canBeInsertedAlongside, canBeInsertedInto} = this.props;
        const canBeInserted = mode === 'into' ? canBeInsertedInto : canBeInsertedAlongside;

        return canBeInserted && (getContextPath(currentlyDraggedNode) !== getContextPath(node));
    }

    handleNodeDrag = () => {
        const {node, onNodeDrag} = this.props;

        onNodeDrag(node);
    }

    handleNodeDrop = position => {
        const {node, onNodeDrop} = this.props;

        onNodeDrop(node, position);
    }

    getIcon() {
        const {node, nodeTypesRegistry} = this.props;
        const nodeType = $get('nodeType', node);

        return $get('ui.icon', nodeTypesRegistry.get(nodeType));
    }

    getNodeTypeLabel() {
        const {node, nodeTypesRegistry, i18nRegistry} = this.props;
        const nodeType = $get('nodeType', node);
        const nodeTypeLabel = $get('ui.label', nodeTypesRegistry.get(nodeType));
        return i18nRegistry.translate(nodeTypeLabel, nodeTypeLabel);
    }

    isFocused() {
        const {isFocused} = this.props;

        return isFocused;
    }

    isActive() {
        const {isActive, isContentTreeNode} = this.props;
        if (isContentTreeNode) {
            return this.isFocused();
        }
        return isActive;
    }

    isCollapsed() {
        const {node, toggledNodeContextPaths, rootNode, loadingDepth} = this.props;

        const isToggled = toggledNodeContextPaths.includes($get('contextPath', node));
        return isNodeCollapsed(node, isToggled, rootNode, loadingDepth);
    }

    isHidden() {
        const {node, hiddenContextPaths} = this.props;
        return hiddenContextPaths && hiddenContextPaths.includes($get('contextPath', node));
    }

    isIntermediate() {
        const {node, intermediateContextPaths} = this.props;
        return intermediateContextPaths && intermediateContextPaths.includes($get('contextPath', node));
    }

    isLoading() {
        const {node, loadingNodeContextPaths} = this.props;

        return loadingNodeContextPaths ? loadingNodeContextPaths.includes($get('contextPath', node)) : false;
    }

    hasError() {
        const {node, errorNodeContextPaths} = this.props;

        return errorNodeContextPaths ? errorNodeContextPaths.includes($get('contextPath', node)) : false;
    }

    getDragAndDropContext() {
        return {
            onDrag: this.handleNodeDrag,
            onDrop: this.handleNodeDrop,
            accepts: this.accepts
        };
    }

    render() {
        const {
            ChildRenderer,
            node,
            nodeDndType,
            nodeTypeRole,
            childNodes,
            hasChildren,
            isLastChild,
            level,
            onNodeToggle,
            onNodeClick,
            onNodeFocus,
            onNodeDrag,
            onNodeDrop,
            currentlyDraggedNode,
            isContentTreeNode,
            nodeHasForeignChanges,
            foreignWorkspacesWithChanges
        } = this.props;

        if (this.isHidden()) {
            return null;
        }
        const refHandler = div => {
            this.domNode = div;
        };
        const childNodesCount = childNodes.count();

        const labelIdentifier = (isContentTreeNode ? 'content-' : '') + 'treeitem-' + hashSum($get('contextPath', node)) + '-label';

        return (
            <Tree.Node aria-expanded={this.isCollapsed() ? 'false' : 'true'} aria-labelledby={labelIdentifier}>
                <span ref={refHandler}/>
                <Tree.Node.Header
                    labelIdentifier={labelIdentifier}
                    id={$get('contextPath', node)}
                    hasChildren={hasChildren}
                    nodeDndType={nodeDndType}
                    isLastChild={isLastChild}
                    isCollapsed={this.isCollapsed()}
                    isActive={this.isActive()}
                    isFocused={this.isFocused()}
                    isLoading={this.isLoading()}
                    isDirty={this.props.isNodeDirty}
                    nodeHasForeignChanges={nodeHasForeignChanges}
                    foreignWorkspacesWithChanges={foreignWorkspacesWithChanges}
                    isHidden={$get('properties._hidden', node)}
                    isHiddenInIndex={$get('properties._hiddenInIndex', node) || this.isIntermediate()}
                    hasError={this.hasError()}
                    label={decodeLabel($get('label', node))}
                    icon={this.getIcon()}
                    iconLabel={this.getNodeTypeLabel()}
                    level={level}
                    onToggle={this.handleNodeToggle}
                    onClick={this.handleNodeClick}
                    dragAndDropContext={this.getDragAndDropContext()}
                    dragForbidden={$get('isAutoCreated', node)}
                    />
                {this.isCollapsed() ? null : (
                    <Tree.Node.Contents>
                        {childNodes.filter(n => n).map((node, index) =>
                            <ChildRenderer
                                ChildRenderer={ChildRenderer}
                                key={$get('contextPath', node)}
                                node={node}
                                nodeDndType={nodeDndType}
                                nodeTypeRole={nodeTypeRole}
                                onNodeToggle={onNodeToggle}
                                onNodeClick={onNodeClick}
                                onNodeFocus={onNodeFocus}
                                onNodeDrag={onNodeDrag}
                                onNodeDrop={onNodeDrop}
                                currentlyDraggedNode={currentlyDraggedNode}
                                isLastChild={index + 1 === childNodesCount}
                                level={level + 1}
                                />
                        )}
                    </Tree.Node.Contents>
                )}
            </Tree.Node>
        );
    }

    handleNodeToggle = () => {
        const {node, onNodeToggle} = this.props;
        onNodeToggle($get('contextPath', node));
    }

    handleNodeClick = e => {
        const {node, onNodeFocus, onNodeClick} = this.props;
        const openInNewWindow = e.metaKey || e.shiftKey || e.ctrlKey;
        onNodeFocus($get('contextPath', node), openInNewWindow);
        onNodeClick($get('uri', node), $get('contextPath', node), openInNewWindow);
    }
}

const withNodeTypeRegistryAndI18nRegistry = neos(globalRegistry => ({
    nodeTypesRegistry: globalRegistry.get('@neos-project/neos-ui-contentrepository'),
    i18nRegistry: globalRegistry.get('i18n')
}));

export const PageTreeNode = withNodeTypeRegistryAndI18nRegistry(connect(
    (state, {neos, nodeTypesRegistry}) => {
        const allowedNodeTypes = nodeTypesRegistry.getSubTypesOf(nodeTypesRegistry.getRole('document'));

        const childrenOfSelector = selectors.CR.Nodes.makeChildrenOfSelector(allowedNodeTypes);
        const hasChildrenSelector = selectors.CR.Nodes.makeHasChildrenSelector(allowedNodeTypes);
        const canBeMovedAlongsideSelector = selectors.CR.Nodes.makeCanBeMovedAlongsideSelector(nodeTypesRegistry);
        const canBeMovedIntoSelector = selectors.CR.Nodes.makeCanBeMovedIntoSelector(nodeTypesRegistry);
        const isDocumentNodeDirtySelector = selectors.CR.Workspaces.makeIsDocumentNodeDirtySelector();
        const nodeHasForeignChangesSelector = makeNodeHasForeignChangesSelector();
        const foreignWorkspacesWithChangesSelector = makeForeignWorkspacesWithChangesSelector();

        return (state, {node, currentlyDraggedNode}) => ({
            isContentTreeNode: false,
            rootNode: selectors.CR.Nodes.siteNodeSelector(state),
            loadingDepth: neos.configuration.nodeTree.loadingDepth,
            childNodes: childrenOfSelector(state, getContextPath(node)),
            hasChildren: hasChildrenSelector(state, getContextPath(node)),
            isActive: selectors.UI.ContentCanvas.getCurrentContentCanvasContextPath(state) === $get('contextPath', node),
            isFocused: selectors.UI.PageTree.getFocused(state) === $get('contextPath', node),
            toggledNodeContextPaths: selectors.UI.PageTree.getToggled(state),
            hiddenContextPaths: selectors.UI.PageTree.getHidden(state),
            intermediateContextPaths: selectors.UI.PageTree.getIntermediate(state),
            loadingNodeContextPaths: selectors.UI.PageTree.getLoading(state),
            errorNodeContextPaths: selectors.UI.PageTree.getErrors(state),
            isNodeDirty: isDocumentNodeDirtySelector(state, $get('contextPath', node)),
            nodeHasForeignChanges: nodeHasForeignChangesSelector(state, $get('contextPath', node)),
            foreignWorkspacesWithChanges: foreignWorkspacesWithChangesSelector(state, $get('contextPath', node)),
            canBeInsertedAlongside: canBeMovedAlongsideSelector(state, {
                subject: getContextPath(currentlyDraggedNode),
                reference: getContextPath(node)
            }),
            canBeInsertedInto: canBeMovedIntoSelector(state, {
                subject: getContextPath(currentlyDraggedNode),
                reference: getContextPath(node)
            })
        });
    }
)(Node));

export const ContentTreeNode = withNodeTypeRegistryAndI18nRegistry(connect(
    (state, {neos, nodeTypesRegistry}) => {
        const allowedNodeTypes = [].concat(
            nodeTypesRegistry.getSubTypesOf(nodeTypesRegistry.getRole('content')),
            nodeTypesRegistry.getSubTypesOf(nodeTypesRegistry.getRole('contentCollection'))
        );

        const childrenOfSelector = selectors.CR.Nodes.makeChildrenOfSelector(allowedNodeTypes);
        const hasChildrenSelector = selectors.CR.Nodes.makeHasChildrenSelector(allowedNodeTypes);
        const canBeMovedAlongsideSelector = selectors.CR.Nodes.makeCanBeMovedAlongsideSelector(nodeTypesRegistry);
        const canBeMovedIntoSelector = selectors.CR.Nodes.makeCanBeMovedIntoSelector(nodeTypesRegistry);
        const isContentNodeDirtySelector = selectors.CR.Workspaces.makeIsContentNodeDirtySelector();

        return (state, {node, currentlyDraggedNode}) => ({
            isContentTreeNode: true,
            rootNode: selectors.UI.ContentCanvas.documentNodeSelector(state),
            loadingDepth: neos.configuration.structureTree.loadingDepth,
            childNodes: childrenOfSelector(state, getContextPath(node)),
            hasChildren: hasChildrenSelector(state, getContextPath(node)),
            isActive: selectors.UI.ContentCanvas.getCurrentContentCanvasContextPath(state) === $get('contextPath', node),
            isFocused: $get('cr.nodes.focused.contextPath', state) === $get('contextPath', node),
            toggledNodeContextPaths: selectors.UI.ContentTree.getToggled(state),
            isNodeDirty: isContentNodeDirtySelector(state, $get('contextPath', node)),
            canBeInsertedAlongside: canBeMovedAlongsideSelector(state, {
                subject: getContextPath(currentlyDraggedNode),
                reference: getContextPath(node)
            }),
            canBeInsertedInto: canBeMovedIntoSelector(state, {
                subject: getContextPath(currentlyDraggedNode),
                reference: getContextPath(node)
            })
        });
    }
)(Node));

