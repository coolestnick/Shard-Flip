require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");

// Replace with your private key (never commit this to version control!)
const PRIVATE_KEY = process.env.PRIVATE_KEY || "your-private-key-here";
const REMIC_RPC_URL = process.env.REMIC_RPC_URL || "https://rpc.remic.network";

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 31337
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    remic: {
      url: REMIC_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 1234, // Replace with actual Remic chain ID
      gas: 2100000,
      gasPrice: 8000000000
    }
  },
  paths: {
    sources: "./",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};