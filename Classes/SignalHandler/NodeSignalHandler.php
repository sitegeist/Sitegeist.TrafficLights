<?php
namespace Sitegeist\TrafficLights\SignalHandler;

use Neos\Flow\Annotations as Flow;
use Neos\ContentRepository\Domain\Model\Workspace;
use Neos\ContentRepository\Domain\Model\NodeInterface;
use Sitegeist\TrafficLights\Domain\Model\UnpublishedChange;
use Sitegeist\TrafficLights\Domain\Repository\UnpublishedChangeRepository;
use Neos\Neos\Ui\ContentRepository\Service\WorkspaceService;
use Neos\Eel\FlowQuery\FlowQuery;

class NodeSignalHandler
{
    /**
     * @var WorkspaceService
     * @Flow\Inject
     */
    protected $workspaceService;

    /**
     * @var UnpublishedChangeRepository
     * @Flow\Inject
     */
    protected $unpublishedChangeRepository;

    /**
     * @param NodeInterface $node
     */
    public function registerNodeChange(NodeInterface $node){
        $documentNode = $this->getClosestDocument($node);

        if ($documentNode) {
            $workspaceName = $node->getWorkspace()->getName();
            $dimensionsHash = $node->getNodeData()->getDimensionsHash();
            $identifier = $documentNode->getIdentifier();

            $change = $this->unpublishedChangeRepository->findOneForWorkspace($identifier, $dimensionsHash, $workspaceName);
            if ($change) {
                return;
            } else {
                $change = new UnpublishedChange();
                $change->setNodeIdentifier($identifier);
                $change->setDimensionsHash($dimensionsHash);
                $change->setWorkspaceName($workspaceName);
                $this->unpublishedChangeRepository->add($change);
            }
        }
    }

    /**
     * @param NodeInterface $node
     */
    public function beforeNodePublishing(NodeInterface $node, Workspace $targetWorkspace){
        $documentNode = $this->getClosestDocument($node);
        if ($documentNode) {
            $workspaceName = $node->getWorkspace()->getName();
            $dimensionsHash = $node->getNodeData()->getDimensionsHash();
            $identifier = $documentNode->getIdentifier();

            $change = $this->unpublishedChangeRepository->findOneForWorkspace($identifier, $dimensionsHash, $workspaceName);
            if ($change) {
                $this->unpublishedChangeRepository->remove($change);
            }
        }
    }

    /**
     * @param NodeInterface $node
     */
    public function nodeDiscarded (NodeInterface $node) {
        $documentNode = $this->getClosestDocument($node);
        if ($documentNode) {
            $workspaceName = $node->getWorkspace()->getName();
            $dimensionsHash = $node->getNodeData()->getDimensionsHash();
            $identifier = $documentNode->getIdentifier();

            $change = $this->unpublishedChangeRepository->findOneForWorkspace($identifier, $dimensionsHash, $workspaceName);
            if ($change) {
                $this->unpublishedChangeRepository->remove($change);
            }
        }
    }

    /**
     * Helper method to retrieve the closest document for a node
     *
     * @param NodeInterface $node
     * @return NodeInterface
     */
    protected function getClosestDocument(NodeInterface $node)
    {
        if ($node->getNodeType()->isOfType('Neos.Neos:Document')) {
            return $node;
        }

        $flowQuery = new FlowQuery(array($node));
        return $flowQuery->closest('[instanceof Neos.Neos:Document]')->get(0);
    }

}