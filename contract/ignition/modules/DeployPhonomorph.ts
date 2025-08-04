import { ethers, upgrades } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  const Phonomorph = await ethers.getContractFactory("Phonomorph");
  const phonomorph = await upgrades.deployProxy(Phonomorph, [deployer.address]);
  await phonomorph.waitForDeployment();
  console.log("Phonomorph deployed to:", phonomorph.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});