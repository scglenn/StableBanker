
require("@matterlabs/hardhat-zksync-deploy");
require("@matterlabs/hardhat-zksync-solc");
require("@matterlabs/hardhat-zksync-verify");
require("@nomiclabs/hardhat-etherscan");

// dynamically changes endpoints for local tests
const zkSyncTestnet =
  process.env.NODE_ENV == "test"
    ? {
        url: "https://zksync2-testnet.zksync.dev",
        ethNetwork: "goerli",
        zksync: true,
        // Verification endpoint for Goerli
        verifyURL:
          "https://zksync2-testnet-explorer.zksync.dev/contract_verification",
      }
    : {
        url: "https://mainnet.era.zksync.io",
        ethNetwork: "mainnet",
        zksync: true,
        // Verification endpoint for Goerli
        verifyURL:
          "https://mainnet.era.zksync.io/contract_verification",
      };

const config = {
  zksolc: {
    version: "latest", // can be defined like 1.3.x
    settings: {},
  },
  defaultNetwork: "zkSyncTestnet",
  networks: {
    hardhat: {
      zksync: false,
    },
    zkSyncTestnet,
  },
  solidity: {
    version: "0.8.17",
  },
};

module.exports = config;
