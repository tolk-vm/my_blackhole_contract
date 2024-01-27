import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { MyBlackholeContract } from '../wrappers/MyBlackholeContract';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('MyBlackholeContract', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('MyBlackholeContract');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let myBlackholeContract: SandboxContract<MyBlackholeContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        myBlackholeContract = blockchain.openContract(MyBlackholeContract.createFromConfig({}, code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await myBlackholeContract.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: myBlackholeContract.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and myBlackholeContract are ready to use
    });
});
