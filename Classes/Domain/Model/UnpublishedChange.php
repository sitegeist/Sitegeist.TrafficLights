<?php
namespace Sitegeist\TrafficLights\Domain\Model;

use Doctrine\ORM\Mapping as ORM;
use Neos\Flow\Annotations as Flow;

use Neos\ContentRepository\Domain\Model\Workspace;
use Neos\ContentRepository\Domain\Model\NodeData;

/**
 * @Flow\Entity
 */
class UnpublishedChange
{
    /**
     * @var string
     */
    protected $workspaceName;

    /**
     * @var string
     */
    protected $nodeIdentifier;

    /**
     * MD5 hash of the content dimensions
     * The hash is generated in buildDimensionValues().
     *
     * @var string
     * @ORM\Column(length=32)
     */
    protected $dimensionsHash;

    /**
     * @return string
     */
    public function getWorkspaceName()
    {
        return $this->workspaceName;
    }

    /**
     * @param string $workspaceName
     */
    public function setWorkspaceName($workspaceName)
    {
        $this->workspaceName = $workspaceName;
    }

    /**
     * @return string
     */
    public function getNodeIdentifier()
    {
        return $this->nodeIdentifier;
    }

    /**
     * @param string $nodeIdentifier
     */
    public function setNodeIdentifier($nodeIdentifier)
    {
        $this->nodeIdentifier = $nodeIdentifier;
    }

    /**
     * @return string
     */
    public function getDimensionsHash()
    {
        return $this->dimensionsHash;
    }

    /**
     * @param string $dimensionsHash
     */
    public function setDimensionsHash($dimensionsHash)
    {
        $this->dimensionsHash = $dimensionsHash;
    }

}