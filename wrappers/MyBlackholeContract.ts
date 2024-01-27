import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type MyBlackholeContractConfig = {};

export function myBlackholeContractConfigToCell(config: MyBlackholeContractConfig): Cell {
    return beginCell().endCell();
}

export class MyBlackholeContract implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new MyBlackholeContract(address);
    }

    static createFromConfig(config: MyBlackholeContractConfig, code: Cell, workchain = 0) {
        const data = myBlackholeContractConfigToCell(config);
        const init = { code, data };
        return new MyBlackholeContract(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
}
