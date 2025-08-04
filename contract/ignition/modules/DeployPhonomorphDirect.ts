import { ethers } from "hardhat";

async function main() {
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", await ethers.provider.getBalance(deployer.address));
  
  // Get the network info
  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, "Chain ID:", network.chainId);
  
  // Deploy the contract
  console.log("Deploying PhonomorphDirect contract...");
  const PhonomorphDirect = await ethers.getContractFactory("PhonomorphDirect");
  const phonomorph = await PhonomorphDirect.deploy(deployer.address);
  
  console.log("Waiting for deployment...");
  await phonomorph.waitForDeployment();
  
  const deployedAddress = await phonomorph.getAddress();
  console.log("PhonomorphDirect deployed to:", deployedAddress);
  
  // Verify the deployment
  const code = await ethers.provider.getCode(deployedAddress);
  if (code === "0x") {
    throw new Error("Contract deployment failed - no code at address");
  }
  console.log("Deployment verified successfully!");
}

main().catch((error) => {
    console.error("Deployment failed:", error);
    process.exitCode = 1;
}); 