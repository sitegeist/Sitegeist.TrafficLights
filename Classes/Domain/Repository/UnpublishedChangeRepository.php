<?php
namespace Sitegeist\TrafficLights\Domain\Repository;

use Neos\Flow\Annotations as Flow;
use Neos\Flow\Persistence\Repository;
use Sitegeist\TrafficLights\Domain\Model\UnpublishedChange;

/**
 * @Flow\Scope("singleton")
 */
class UnpublishedChangeRepository extends Repository
{

    /**
     * @param string $nodeIdentifier
     * @param string $dimensionsHash
     * @param string $workspaceName
     * @return UnpublishedChange|Null
     */
    public function findOneForWorkspace(string $nodeIdentifier, string $dimensionsHash, string $workspaceName){
        $query = $this->createQuery();
        $constraints = [
            $query->logicalAnd(
                $query->equals('nodeIdentifier', $nodeIdentifier),
                $query->equals('dimensionsHash', $dimensionsHash)
            ),
            $query->equals('workspaceName', $workspaceName)
        ];

        $result = $query->matching($query->logicalAnd($constraints))->execute();

        if (count($result) > 0) {
            return $result->getFirst();
        } else {
            return null;
        }
    }

    /**
     * @param string $nodeIdentifier
     * @param string $dimensionsHash
     * @param string $workspaceName
     * @return \Neos\Flow\Persistence\QueryResultInterface
     */
    public function findForForeignWorkspaces(string $nodeIdentifier, string $dimensionsHash, string $workspaceName = null){
        $query = $this->createQuery();
        $constraints = [
            $query->logicalAnd(
                $query->equals('nodeIdentifier', $nodeIdentifier),
                $query->equals('dimensionsHash', $dimensionsHash)
            ),
            $query->logicalNot(
                $query->equals('workspaceName', $workspaceName)
            )
        ];
        return $query->matching($query->logicalAnd($constraints))->execute();

    }

}

