import { toNano } from '@ton/core';
import { MyBlackholeContract } from '../wrappers/MyBlackholeContract';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const myBlackholeContract = provider.open(MyBlackholeContract.createFromConfig({}, await compile('MyBlackholeContract')));

    await myBlackholeContract.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(myBlackholeContract.address);

    // run methods on `myBlackholeContract`
}
