import { getHttpEndpoint } from "@orbs-network/ton-access";
import { address, toNano } from '@ton/core';
import { TonClient, WalletContractV4 } from '@ton/ton';
import { mnemonicToWalletKey } from '@ton/crypto';
import { MyBlackholeContract } from '../wrappers/MyBlackholeContract';

const WALLET_RECOVERY_PHRASE = process.env['WALLET_MNEMONIC']!
const CONTRACT_ADDRESS = address(process.env['CONTRACT_ADDRESS']!)

export async function run() {
  // initialize ton rpc client on testnet
  const endpoint = await getHttpEndpoint({ network: "testnet" });
  const client = new TonClient({ endpoint });

  // open wallet v4 (notice the correct wallet version here)
  const key = await mnemonicToWalletKey(WALLET_RECOVERY_PHRASE.split(" "));
  const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
  if (!await client.isContractDeployed(wallet.address)) {
    return console.log("wallet is not deployed");
  }

  // open wallet and read the current seqno of the wallet
  const walletContract = client.open(wallet);
  const walletSender = walletContract.sender(key.secretKey);
  const seqno = await walletContract.getSeqno();

  const deployedContract = client.open(
    MyBlackholeContract.createFromAddress(CONTRACT_ADDRESS)
  );

  // send the increment transaction
  const INCREMENT_BY = 2
  const GAS_AMOUNT = toNano("0.05")
  await deployedContract.sendIncrement(walletSender, GAS_AMOUNT, INCREMENT_BY);

  // wait until confirmed
  let currentSeqno = seqno;
  while (currentSeqno == seqno) {
    console.log("waiting for transaction to confirm...");
    await sleep(1500);
    currentSeqno = await walletContract.getSeqno();
  }
  console.log("transaction confirmed!");
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
