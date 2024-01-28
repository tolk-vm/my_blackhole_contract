import { toNano } from '@ton/core';
import { MyBlackholeContract } from '../wrappers/MyBlackholeContract';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    let ownerAddress = provider.sender().address;
    if (!ownerAddress) {
        throw "could not detect ownerAddress";
    }

    const myBlackholeContract = provider.open(MyBlackholeContract.createFromConfig({
        counter_value: 0,
        owner_address: ownerAddress,
    }, await compile('MyBlackholeContract')));

    console.log(`deploy::run`)
    console.log(`- ownerAddress = ${ownerAddress}`)
    console.log(`- contractAddress = ${myBlackholeContract.address}`)

    await myBlackholeContract.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(myBlackholeContract.address);

    // run methods on `myBlackholeContract`
}
