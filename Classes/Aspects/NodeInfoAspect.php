<?php
namespace Sitegeist\TrafficLights\Aspects;

use Neos\Flow\Annotations as Flow;
use Neos\Flow\Aop\JoinPointInterface;
use Neos\ContentRepository\Domain\Model\NodeInterface;
use Neos\ContentRepository\Domain\Model\NodeType;
use Neos\ContentRepository\Domain\Repository\WorkspaceRepository;
use Neos\ContentRepository\Domain\Repository\NodeDataRepository;
use Neos\ContentRepository\Domain\Model\NodeData;
use Neos\ContentRepository\Domain\Model\Workspace;
use Sitegeist\TrafficLights\Domain\Repository\UnpublishedChangeRepository;

/**
 * @Flow\Scope("singleton")
 * @Flow\Aspect
 */
class NodeInfoAspect
{

    /**
     * @var WorkspaceRepository
     * @Flow\Inject
     */
    protected $workspaceRepository;

    /**
     * @var NodeDataRepository
     * @Flow\Inject
     */
    protected $nodeDataRepository;

    /**
     * @var UnpublishedChangeRepository
     * @Flow\Inject
     */
    protected $unpublishedChangeRepository;

    /**
     * Doctrine's Entity Manager. Note that "ObjectManager" is the name of the related
     * interface ...
     *
     * @Flow\Inject
     * @var \Doctrine\Common\Persistence\ObjectManager
     */
    protected $entityManager;

    /**
     * @Flow\Around("method(Neos\Neos\Ui\Fusion\Helper\NodeInfoHelper->renderNode())")
     * @param JoinPointInterface $joinPoint the join point
     * @return mixed
     */
    public function addDocumentNodeInformations(JoinPointInterface $joinPoint)
    {
        /**
         * @var NodeInterface $node
         */
        $node = $joinPoint->getMethodArgument('node');

        $data = $joinPoint->getAdviceChain()->proceed($joinPoint);

        if ($node->getNodeType()->isOfType('Neos.Neos:Document')) {
            $unpublishedChanges = $this->unpublishedChangeRepository->findForForeignWorkspaces(
                $node->getIdentifier(),
                $node->getNodeData()->getDimensionsHash(),
                $node->getContext()->getWorkspaceName()
            );

            if ($unpublishedChanges && count($unpublishedChanges) > 0) {
                $data['foreignWorkspacesWithChanges'] = array_map( function($item) { return $item->getWorkspaceName(); }, $unpublishedChanges->toArray());
                $data['hasForeignChanges'] = true;
            } else {
                $data['foreignWorkspacesWithChanges'] = [];
                $data['hasForeignChanges'] = false;
            }
        }

        return $data;
    }
}