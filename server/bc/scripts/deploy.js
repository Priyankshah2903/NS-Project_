const hre = require("hardhat");

async function main() {
  const MediChain = await hre.ethers.getContractFactory("MediChain");
  const mediChain = await MediChain.deploy();

  await mediChain.deployed();

  console.log("Library deployed to:", mediChain.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
