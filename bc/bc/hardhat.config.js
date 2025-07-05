require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.9",  // You can keep or update the version here
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,  // Adjust the number of runs for optimization (you can change this based on contract size)
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
  },
  paths: {
    artifacts: "./client/src/artifacts",  // Keep this path to store compiled artifacts for the frontend
  },
};
