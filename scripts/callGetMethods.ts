import { getHttpV4Endpoint } from "@orbs-network/ton-access";
import { address, fromNano } from '@ton/core';
import { TonClient4 } from '@ton/ton';
import { MyBlackholeContract } from '../wrappers/MyBlackholeContract';

const CONTRACT_ADDRESS = address(process.env['CONTRACT_ADDRESS']!)

export async function run() {
  const endpoint = await getHttpV4Endpoint({
    network: "testnet",
  });
  const client4 = new TonClient4({ endpoint });

  const latestBlock = await client4.getLastBlock();
  let status = await client4.getAccount(latestBlock.last.seqno, CONTRACT_ADDRESS);

  if (status.account.state.type !== "active") {
    console.log("Contract is not active");
    return;
  }

  console.log(`calling dump_full_state...`)
  let respState = await client4.runMethod(latestBlock.last.seqno, CONTRACT_ADDRESS, "dump_full_state");
  if (respState.exitCode !== 0) {
    console.error(`exitCode = ${respState.exitCode}`);
    return;
  }
  console.log(`state = `, MyBlackholeContract.parseGetFullState(respState.reader))

  console.log(`calling show_balance...`)
  let respBalance = await client4.runMethod(latestBlock.last.seqno, CONTRACT_ADDRESS, "show_balance");
  if (respBalance.exitCode !== 0) {
    console.error(`exitCode = ${respBalance.exitCode}`);
    return;
  }
  console.log(`balance = `, fromNano(MyBlackholeContract.parseGetBalance(respBalance.reader)))
}
