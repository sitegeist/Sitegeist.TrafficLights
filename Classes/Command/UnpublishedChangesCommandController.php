<?php
namespace Sitegeist\TrafficLights\Command;

use Neos\Flow\Annotations as Flow;
use Neos\Flow\Cli\CommandController;
use Neos\Neos\Ui\ContentRepository\Service\WorkspaceService;
use Neos\ContentRepository\Domain\Repository\WorkspaceRepository;
use Neos\Neos\Domain\Service\ContentContextFactory;
use Neos\ContentRepository\Domain\Utility\NodePaths;
use Sitegeist\TrafficLights\Domain\Model\UnpublishedChange;
use Sitegeist\TrafficLights\Domain\Repository\UnpublishedChangeRepository;
use Neos\ContentRepository\Utility as CrUtility;

class UnpublishedChangesCommandController extends CommandController
{
    /**
     * @var WorkspaceService
     * @Flow\Inject
     */
    protected $workspaceService;

    /**
     * @var WorkspaceRepository
     * @Flow\Inject
     */
    protected $workspaceRepository;

    /**
     * @var ContentContextFactory
     * @Flow\Inject
     */
    protected $contextFactory;

    /**
     * @var UnpublishedChangeRepository
     * @Flow\Inject
     */
    protected $unpublishedChangeRepository;

    /**
     * Show unpublished changes in various workspaces
     *
     * @param string $workspaceName The name of workspaces to show unpublished changes for (globbing is supported)
     */
    public function showCommand(string $workspaceName = null) {
        $workspaces = $this->workspaceRepository->findAll();

        foreach ($workspaces as $workspace) {
            if ($workspace->getName() == 'live' ) {
                continue;
            }
            if ($workspaceName != null && fnmatch($workspaceName, $workspace->getName()) == false ) {
                continue;
            }
            $publishableNodeInfos = $this->workspaceService->getPublishableNodeInfo($workspace);
            if (count($publishableNodeInfos) > 0) {
                $this->outputLine('There are %s unpublished documents in workspace %s', [count($publishableNodeInfos), $workspace->getName()]);

                $documentPathChanges = array_reduce(
                    $publishableNodeInfos,
                    function($carry, $item) {
                        $documentContextPath = $item['documentContextPath'];
                        if (array_key_exists($documentContextPath, $carry)) {
                            $carry[$documentContextPath] += 1;
                        } else {
                            $carry[$documentContextPath] = 1;
                        }
                        return $carry;
                    },
                    []
                );

                foreach ($documentPathChanges as $documentContextPath => $changeNumber) {
                    $pathParts = NodePaths::explodeContextPath($documentContextPath);
                    $context = $this->contextFactory->create(['workspaceName' => $pathParts['workspaceName'], 'dimensions ' => $pathParts['dimensions']]);
                    $documentNode = $context->getNode($pathParts['nodePath']);

                    if ($documentNode !== null) {
                        $title = $documentNode->getProperty('title');
                    } else {
                        $title = '';
                    }

                    $this->outputLine(' - %s changes on document "%s"', [$changeNumber, $title]);
                }
            } else {
                $this->outputLine('No unpublished documents in workspace %s', [$workspace->getName()]);
            }
        }
    }

    /**
     * Recalculate the pending changes for be visualisation
     */
    public function updateCommand()
    {
        $workspaces = $this->workspaceRepository->findAll();
        $this->unpublishedChangeRepository->removeAll();

        foreach ($workspaces as $workspace) {
            if ($workspace->getName() == 'live') {
                continue;
            }

            $publishableNodeInfos = $this->workspaceService->getPublishableNodeInfo($workspace);

            if (count($publishableNodeInfos) == 0) {
                continue;
            }

            $documentPathChanges = array_reduce(
                $publishableNodeInfos,
                function($carry, $item) {
                    $documentContextPath = $item['documentContextPath'];
                    if (array_key_exists($documentContextPath, $carry)) {
                        $carry[$documentContextPath] += 1;
                    } else {
                        $carry[$documentContextPath] = 1;
                    }
                    return $carry;
                },
                []
            );


            foreach ($documentPathChanges as $documentContextPath => $changeNumber) {

                $pathParts = NodePaths::explodeContextPath($documentContextPath);
                $context = $this->contextFactory->create([
                    'workspaceName' => $pathParts['workspaceName'],
                    'dimensions ' => $pathParts['dimensions'],
                    'invisibleContentShown' => TRUE,
                    'removedContentShown' => TRUE,
                    'inaccessibleContentShown' => TRUE
                ]);
                $documentNode = $context->getNode($pathParts['nodePath']);

                $change = new UnpublishedChange();
                $change->setWorkspaceName($pathParts['workspaceName']);
                $change->setNodeIdentifier($documentNode->getIdentifier());
                $change->setDimensionsHash(CrUtility::sortDimensionValueArrayAndReturnDimensionsHash( $pathParts['dimensions']));

                $this->unpublishedChangeRepository->add($change);
            }
        }
    }
}
