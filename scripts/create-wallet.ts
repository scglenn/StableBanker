import { ethers } from "ethers";
import * as zksync from "zksync";

async function createWallet() {
  const ethersProvider = ethers.getDefaultProvider("goerli");
  const syncProvider = await zksync.getDefaultProvider("goerli");

  // Create ethereum wallet using ethers.js
  const createdWallet = ethers.Wallet.fromMnemonic(
    ethers.utils.entropyToMnemonic(ethers.utils.randomBytes(32))
  );

  console.log("wallet.address:", createdWallet.address);
  console.log("wallet.mnemonic.phrase:", createdWallet.mnemonic.phrase);
  console.log("wallet.privateKey:", createdWallet.privateKey);

  const ethWallet = createdWallet.connect(ethersProvider);

  // Derive zksync.Signer from ethereum wallet.
  const syncWallet = await zksync.Wallet.fromEthSigner(ethWallet, syncProvider);

  const state = await syncWallet.getAccountState();
  console.log(state);
}

createWallet();
