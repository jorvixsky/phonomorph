import { ethers, upgrades } from "hardhat";

const PHONOMORPH_ADDRESS = "0x0000000000000000000000000000000000000000";

async function main() {
  const Phonomorph = await ethers.getContractFactory("Phonomorph");
  const phonomorph = await upgrades.upgradeProxy(PHONOMORPH_ADDRESS, Phonomorph);
  console.log("Phonomorph upgraded to:", phonomorph.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});