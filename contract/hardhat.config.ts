import "dotenv/config";
import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@openzeppelin/hardhat-upgrades";

const config: HardhatUserConfig = {
  solidity: "0.8.30",
  networks: {
    morphTestnet: {
      url: "https://rpc-quicknode-holesky.morphl2.io",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    }
  },
  etherscan: {
    apiKey: "anything",
    customChains: [
      {
        network: 'morphTestnet',
        chainId: 2810,
        urls: {
          apiURL: 'https://explorer-api-holesky.morphl2.io/api? ',
          browserURL: 'https://explorer-holesky.morphl2.io/',
        },
      },
    ],
  },
};

export default config;
