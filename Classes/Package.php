<?php
namespace Sitegeist\TrafficLights;

use Neos\Flow\Package\Package as BasePackage;
use Neos\Flow\Core\Bootstrap;
use Neos\ContentRepository\Domain\Model\Node;
use Neos\Neos\EventLog\Integrations\ContentRepositoryIntegrationService;
use Sitegeist\TrafficLights\SignalHandler\NodeSignalHandler;
use Neos\ContentRepository\Domain\Model\Workspace;
use Neos\Neos\Service\PublishingService;

/**
 * The Flow Package
 */
class Package extends BasePackage
{
    /**
     * @param Bootstrap $bootstrap
     */
    public function boot(Bootstrap $bootstrap)
    {
        $dispatcher = $bootstrap->getSignalSlotDispatcher();

        $dispatcher->connect(
            Node::class,
            'nodeAdded',
            NodeSignalHandler::class,
            'registerNodeChange'
        );

        $dispatcher->connect(
            Node::class,
            'nodeRemoved',
            NodeSignalHandler::class,
            'registerNodeChange'
        );

        $dispatcher->connect(
            Node::class,
            'nodeUpdated',
            NodeSignalHandler::class,
            'registerNodeChange'
        );

        $dispatcher->connect(
            PublishingService::class,
            'nodeDiscarded',
            NodeSignalHandler::class,
            'nodeDiscarded'
        );

        $dispatcher->connect(
            Workspace::class,
            'beforeNodePublishing',
            NodeSignalHandler::class,
            'beforeNodePublishing'
        );
    }
}
