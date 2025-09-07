const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting ShardFlip deployment...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await deployer.getBalance();

  console.log("📋 Deployment Details:");
  console.log("├─ Deploying with account:", deployerAddress);
  console.log("├─ Account balance:", ethers.utils.formatEther(balance), "ETH");
  console.log("├─ Network:", hre.network.name);
  console.log("└─ Chain ID:", (await ethers.provider.getNetwork()).chainId);
  console.log();

  // Deploy the ShardFlip contract
  console.log("📦 Deploying ShardFlip contract...");
  const ShardFlip = await ethers.getContractFactory("ShardFlip");
  const shardFlip = await ShardFlip.deploy();

  await shardFlip.deployed();

  console.log("✅ ShardFlip deployed successfully!");
  console.log("├─ Contract Address:", shardFlip.address);
  console.log("├─ Transaction Hash:", shardFlip.deployTransaction.hash);
  console.log("└─ Block Number:", shardFlip.deployTransaction.blockNumber);
  console.log();

  // Add initial funding to the contract (optional)
  const initialFunding = ethers.utils.parseEther("1.0"); // 1 ETH/SHM initial funding
  if (balance.gt(initialFunding.mul(2))) { // Only if deployer has enough balance
    console.log("💰 Adding initial funding to contract...");
    const fundTx = await shardFlip.depositFunds({ value: initialFunding });
    await fundTx.wait();
    console.log("✅ Initial funding added:", ethers.utils.formatEther(initialFunding), "ETH/SHM");
    console.log("└─ Transaction Hash:", fundTx.hash);
    console.log();
  }

  // Display contract information
  console.log("📊 Contract Information:");
  console.log("├─ MIN_BET:", ethers.utils.formatEther(await shardFlip.MIN_BET()), "ETH/SHM");
  console.log("├─ MAX_BET:", ethers.utils.formatEther(await shardFlip.MAX_BET()), "ETH/SHM");
  console.log("├─ PAYOUT_MULTIPLIER:", (await shardFlip.PAYOUT_MULTIPLIER()).toString(), "x");
  console.log("├─ HOUSE_EDGE:", (await shardFlip.HOUSE_EDGE()).toString(), "%");
  console.log("└─ Contract Balance:", ethers.utils.formatEther(await ethers.provider.getBalance(shardFlip.address)), "ETH/SHM");
  console.log();

  // Generate ABI and deployment info
  const contractInfo = {
    address: shardFlip.address,
    abi: ShardFlip.interface.format("json"),
    bytecode: ShardFlip.bytecode,
    network: hre.network.name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    deploymentTx: shardFlip.deployTransaction.hash,
    deployer: deployerAddress,
    timestamp: new Date().toISOString(),
    contractBalance: ethers.utils.formatEther(await ethers.provider.getBalance(shardFlip.address)),
    version: "1.0.0"
  };

  console.log("📋 Contract ABI and Information:");
  console.log("=====================================");
  console.log(JSON.stringify(contractInfo, null, 2));
  console.log("=====================================");
  console.log();

  // Save deployment info to file
  const fs = require("fs");
  const path = require("path");
  
  const deploymentDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }
  
  const deploymentFile = path.join(deploymentDir, `${hre.network.name}-deployment.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(contractInfo, null, 2));
  
  console.log("💾 Deployment information saved to:", deploymentFile);
  console.log();

  // Verification instructions
  console.log("🔍 To verify the contract, run:");
  console.log(`npx hardhat verify --network ${hre.network.name} ${shardFlip.address}`);
  console.log();

  // Frontend integration instructions
  console.log("🌐 Frontend Integration:");
  console.log("├─ Update src/utils/constants.ts with the contract address:");
  console.log(`├─ shardFlip: '${shardFlip.address}'`);
  console.log("├─ Update CONTRACT_ABI with the generated ABI");
  console.log("└─ Ensure network configuration matches deployment network");
  console.log();

  console.log("🎉 Deployment completed successfully!");
  console.log("Ready to start flipping coins! 🪙");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });