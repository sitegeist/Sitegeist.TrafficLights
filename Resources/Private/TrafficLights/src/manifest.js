import manifest from '@neos-project/neos-ui-extensibility';
import {PageTree} from './TrafficLights';

manifest('Sitegeist.TrafficLights', {}, (globalRegistry) => {
    const containerRegistry = globalRegistry.get('containers');

    containerRegistry.set('LeftSideBar/Top/PageTree', PageTree);
});
