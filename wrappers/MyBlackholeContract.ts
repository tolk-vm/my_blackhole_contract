import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type MyBlackholeContractConfig = {
    counter_value: number,
    owner_address: Address,
};

// see my_store_data() in my_blackhole_contract.fc
export function myBlackholeContractConfigToCell(config: MyBlackholeContractConfig): Cell {
    return beginCell()
      .storeUint(config.counter_value, 32)
      .storeAddress(null)
      .storeAddress(null)
      .storeAddress(config.owner_address)
      .endCell();
}

export class MyBlackholeContract implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromConfig(config: MyBlackholeContractConfig, code: Cell, workchain = 0) {
        const data = myBlackholeContractConfigToCell(config);
        const init = { code, data };
        return new MyBlackholeContract(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        let opcode = 2
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(opcode, 32).endCell(),
        });
    }

    async sendIncrement(provider: ContractProvider, sender: Sender, valueMoney: bigint, incBy: number) {
        let opcode = 1
        return await provider.internal(sender, {
            value: valueMoney,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(opcode, 32).storeUint(incBy, 32).endCell(),
        });
    }

    async sendDeposit(provider: ContractProvider, sender: Sender, valueMoney: bigint) {
        let opcode = 2
        return await provider.internal(sender, {
            value: valueMoney,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(opcode, 32).endCell(),
        });
    }

    async sendWithdraw(provider: ContractProvider, sender: Sender, valueMoney: bigint, toWithdraw: bigint) {
        let opcode = 3
        return await provider.internal(sender, {
            value: valueMoney,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(opcode, 32).storeCoins(toWithdraw).endCell(),
        });
    }

    async getFullState(provider: ContractProvider) {
        const { stack: r } = await provider.get("dump_full_state", []);
        return {
            counter_value: r.readNumber(),
            recent_inc_addr: r.readAddressOpt(),
            recent_deposit_addr: r.readAddressOpt(),
            owner_addr: r.readAddress(),
        };
    }

    async getBalance(provider: ContractProvider) {
        const { stack: r } = await provider.get('show_balance', [])
        return r.readNumber()
    }
}
