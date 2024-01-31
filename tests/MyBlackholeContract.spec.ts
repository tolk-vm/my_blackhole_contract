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
    let deployerWallet: SandboxContract<TreasuryContract>;
    let ownerWallet: SandboxContract<TreasuryContract>;
    let myBlackholeContract: SandboxContract<MyBlackholeContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        ownerWallet = await blockchain.treasury("owner")

        myBlackholeContract = blockchain.openContract(MyBlackholeContract.createFromConfig({
            counter_value: 0,
            owner_address: ownerWallet.address,
        }, code));

        deployerWallet = await blockchain.treasury('deployer');

        const deployResult = await myBlackholeContract.sendDeploy(deployerWallet.getSender(), toNano('0.003'));
        expect(deployResult.transactions).toHaveTransaction({
            from: deployerWallet.address,
            to: myBlackholeContract.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and myBlackholeContract are ready to use
    });

    it("should add 2 and 3 and return 5", async () => {
        const senderWallet = await blockchain.treasury('sender');

        await myBlackholeContract.sendIncrement(senderWallet.getSender(), toNano("0.05"), 2);
        await myBlackholeContract.sendIncrement(senderWallet.getSender(), toNano("0.15"), 3);

        const state = await myBlackholeContract.getFullState();
        expect(state.counter_value).toEqual(2 + 3);
    });

    it("should return correct sender's address", async () => {
        const senderWallet = await blockchain.treasury('sender');

        const sendResult = await myBlackholeContract.sendIncrement(senderWallet.getSender(), toNano("0.05"), 2);
        expect(sendResult.transactions).toHaveTransaction({
            from: senderWallet.address,
            to: myBlackholeContract.address,
            success: true,
        })

        const state = await myBlackholeContract.getFullState();
        expect(state.recent_inc_addr!.toString()).toBe(senderWallet.address.toString());
        expect(state.owner_addr.toString()).toBe(ownerWallet.address.toString());
    })

    it("should deposit funds", async () => {
        const senderWallet = await blockchain.treasury('sender');

        await myBlackholeContract.sendDeposit(senderWallet.getSender(), toNano("5"));

        const balance = await myBlackholeContract.getBalance();
        expect(balance).toBeGreaterThan(toNano("4.99"));

        const dump = await myBlackholeContract.getFullState();
        expect(dump.recent_deposit_addr!.toString()).toEqual(senderWallet.address.toString())
    })

    it("should withdraw 3 TON to owner", async () => {
        const senderWallet = await blockchain.treasury('sender');
        const ownerBalanceStart = await ownerWallet.getBalance()

        await myBlackholeContract.sendDeposit(senderWallet.getSender(), toNano("2"));
        await myBlackholeContract.sendIncrement(senderWallet.getSender(), toNano("2"), 100);
        const sendResult = await myBlackholeContract.sendWithdraw(ownerWallet.getSender(), toNano("0.003"), toNano(3));
        expect(sendResult.transactions).toHaveTransaction({
            from: myBlackholeContract.address,
            to: ownerWallet.address,
            success: true,
            value: toNano(3),
        })

        expect(await myBlackholeContract.getBalance()).toBeGreaterThan(toNano("0.5"))
        expect(await myBlackholeContract.getBalance()).toBeLessThan(toNano("1"))

        const ownerBalanceDelta = await ownerWallet.getBalance() - ownerBalanceStart
        expect(ownerBalanceDelta >= toNano("2.9") && ownerBalanceDelta <= toNano("3")).toBeTruthy()
    })

    it("should fail to withdraw not to an owner", async () => {
        const senderWallet = await blockchain.treasury('sender');

        await myBlackholeContract.sendDeposit(senderWallet.getSender(), toNano("2"));

        const sendResult = await myBlackholeContract.sendWithdraw(senderWallet.getSender(), toNano("0.05"), toNano(3));
        expect(sendResult.transactions).toHaveTransaction({
            from: senderWallet.address,
            to: myBlackholeContract.address,
            success: false,
            exitCode: 777,
        })
    })

    it("should fail to withdraw more than contains", async () => {
        const senderWallet = await blockchain.treasury('sender');

        await myBlackholeContract.sendDeposit(senderWallet.getSender(), toNano("2"));

        const sendResult = await myBlackholeContract.sendWithdraw(ownerWallet.getSender(), toNano("0.05"), toNano(3));
        expect(sendResult.transactions).toHaveTransaction({
            from: ownerWallet.address,
            to: myBlackholeContract.address,
            success: false,
            exitCode: 778,
        })
    })

    it("should destroy by a special opcode", async () => {
        const senderWallet = await blockchain.treasury('sender');
        const ownerBalanceStart = await ownerWallet.getBalance()

        await myBlackholeContract.sendDeposit(senderWallet.getSender(), toNano("10"));

        const sendResult = await myBlackholeContract.sendPermanentlyDestroy(senderWallet.getSender(), toNano("0.5"));
        expect(sendResult.events[sendResult.events.length - 1].type).toEqual('account_destroyed')

        const ownerBalanceDelta = await ownerWallet.getBalance() - ownerBalanceStart
        expect(ownerBalanceDelta).toBeGreaterThan(toNano("9"))
    })
});
