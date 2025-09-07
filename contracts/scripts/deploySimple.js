const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting ShardFlip Simple deployment...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await deployer.getBalance();

  console.log("📋 Deployment Details:");
  console.log("├─ Deploying with account:", deployerAddress);
  console.log("├─ Account balance:", ethers.utils.formatEther(balance), "ETH");
  console.log("├─ Network:", network.name);
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
  console.log("├─ Block Number:", shardFlip.deployTransaction.blockNumber);
  console.log("└─ Gas Used:", shardFlip.deployTransaction.gasLimit?.toString());
  console.log();

  // Add initial funding to the contract
  const initialFunding = ethers.utils.parseEther("1.0"); // 1 ETH initial funding
  if (balance.gt(initialFunding.mul(2))) { // Only if deployer has enough balance
    console.log("💰 Adding initial funding to contract...");
    try {
      const fundTx = await shardFlip.depositFunds({ value: initialFunding });
      await fundTx.wait();
      console.log("✅ Initial funding added:", ethers.utils.formatEther(initialFunding), "ETH");
      console.log("└─ Transaction Hash:", fundTx.hash);
    } catch (error) {
      console.log("⚠️ Failed to add initial funding:", error.message);
    }
    console.log();
  }

  // Display contract information
  console.log("📊 Contract Information:");
  console.log("├─ MIN_BET:", ethers.utils.formatEther(await shardFlip.MIN_BET()), "ETH");
  console.log("├─ MAX_BET:", ethers.utils.formatEther(await shardFlip.MAX_BET()), "ETH");
  console.log("├─ PAYOUT_MULTIPLIER:", (await shardFlip.PAYOUT_MULTIPLIER()).toString(), "x");
  console.log("├─ Owner:", await shardFlip.owner());
  console.log("├─ Paused:", await shardFlip.paused());
  console.log("└─ Contract Balance:", ethers.utils.formatEther(await ethers.provider.getBalance(shardFlip.address)), "ETH");
  console.log();

  // Generate the ABI
  const contractABI = [
    "function flipCoin(bool choice) external payable",
    "function getPlayerStats(address player) external view returns (uint256, uint256, uint256, uint256, uint256)",
    "function getRecentGames() external view returns (tuple(address player, uint256 betAmount, bool choice, bool result, bool won, uint256 payout, uint256 timestamp)[])",
    "function getGameStats() external view returns (uint256, uint256, uint256, uint256)",
    "function getPlayerGames(address player, uint256 limit) external view returns (tuple(address player, uint256 betAmount, bool choice, bool result, bool won, uint256 payout, uint256 timestamp)[])",
    "function getTotalGames() external view returns (uint256)",
    "function getGameByIndex(uint256 index) external view returns (address, uint256, bool, bool, bool, uint256, uint256)",
    "function hasPlayerPlayed(address player) external view returns (bool)",
    "function getContractBalance() external view returns (uint256)",
    "function getTopPlayers(uint256 limit) external view returns (address[], uint256[], uint256[])",
    "function depositFunds() external payable",
    "function withdrawFunds(uint256 amount) external",
    "function emergencyWithdraw() external",
    "function setPaused(bool _paused) external",
    "function transferOwnership(address newOwner) external",
    "function owner() external view returns (address)",
    "function paused() external view returns (bool)",
    "function MIN_BET() external view returns (uint256)",
    "function MAX_BET() external view returns (uint256)",
    "function PAYOUT_MULTIPLIER() external view returns (uint256)",
    "function totalActiveUsers() external view returns (uint256)",
    "function playerStats(address) external view returns (uint256, uint256, uint256, uint256, uint256)",
    "function hasPlayed(address) external view returns (bool)",
    "event GamePlayed(address indexed player, uint256 betAmount, bool choice, bool result, bool won, uint256 payout, uint256 timestamp)",
    "event FundsDeposited(address indexed depositor, uint256 amount)",
    "event FundsWithdrawn(address indexed owner, uint256 amount)",
    "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)"
  ];

  // Contract information for frontend
  const contractInfo = {
    name: "ShardFlip",
    address: shardFlip.address,
    abi: contractABI,
    network: network.name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    deploymentTx: shardFlip.deployTransaction.hash,
    deployer: deployerAddress,
    timestamp: new Date().toISOString(),
    contractBalance: ethers.utils.formatEther(await ethers.provider.getBalance(shardFlip.address)),
    version: "1.0.0",
    constants: {
      MIN_BET: await shardFlip.MIN_BET(),
      MAX_BET: await shardFlip.MAX_BET(),
      PAYOUT_MULTIPLIER: await shardFlip.PAYOUT_MULTIPLIER()
    }
  };

  console.log("📋 Contract Information for Frontend Integration:");
  console.log("=====================================");
  console.log("Contract Address:", shardFlip.address);
  console.log("Network:", network.name);
  console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId);
  console.log();
  
  console.log("📝 Update your frontend constants.ts file:");
  console.log("contracts: {");
  console.log("  shardFlip: '" + shardFlip.address + "',");
  console.log("  token: '0x0000000000000000000000000000000000000000'");
  console.log("}");
  console.log();

  // Save deployment info to file
  const fs = require("fs");
  const path = require("path");
  
  try {
    const deploymentDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }
    
    const deploymentFile = path.join(deploymentDir, `${network.name}-deployment.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(contractInfo, null, 2));
    
    console.log("💾 Deployment information saved to:", deploymentFile);
  } catch (error) {
    console.log("⚠️ Could not save deployment file:", error.message);
  }
  console.log();

  // Test the contract
  console.log("🧪 Testing contract functions...");
  try {
    console.log("├─ Total games:", (await shardFlip.getTotalGames()).toString());
    console.log("├─ Total active users:", (await shardFlip.totalActiveUsers()).toString());
    console.log("├─ Contract owner:", await shardFlip.owner());
    console.log("└─ Contract is paused:", await shardFlip.paused());
  } catch (error) {
    console.log("⚠️ Error testing contract functions:", error.message);
  }
  console.log();

  console.log("🎉 Deployment completed successfully!");
  console.log("Ready to start flipping coins! 🪙");
  console.log();
  console.log("🔧 Next steps:");
  console.log("1. Update your frontend with the contract address above");
  console.log("2. Fund the contract with more tokens if needed");
  console.log("3. Test the flipCoin function");
  console.log("4. Share the dApp with players!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });