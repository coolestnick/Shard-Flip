const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ShardFlip Simple Contract", function () {
  let ShardFlip;
  let shardFlip;
  let owner;
  let player1;
  let player2;

  const MIN_BET = ethers.utils.parseEther("0.01");
  const MAX_BET = ethers.utils.parseEther("10");
  const INITIAL_FUNDING = ethers.utils.parseEther("5");

  beforeEach(async function () {
    [owner, player1, player2] = await ethers.getSigners();

    // Deploy the contract
    ShardFlip = await ethers.getContractFactory("ShardFlip");
    shardFlip = await ShardFlip.deploy();
    await shardFlip.deployed();

    // Add initial funding
    await shardFlip.depositFunds({ value: INITIAL_FUNDING });
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await shardFlip.owner()).to.equal(owner.address);
    });

    it("Should have correct constants", async function () {
      expect(await shardFlip.MIN_BET()).to.equal(MIN_BET);
      expect(await shardFlip.MAX_BET()).to.equal(MAX_BET);
      expect(await shardFlip.PAYOUT_MULTIPLIER()).to.equal(2);
    });

    it("Should start unpaused", async function () {
      expect(await shardFlip.paused()).to.be.false;
    });

    it("Should have initial funding", async function () {
      expect(await ethers.provider.getBalance(shardFlip.address)).to.equal(INITIAL_FUNDING);
    });
  });

  describe("Basic Functionality", function () {
    it("Should accept valid bets", async function () {
      const betAmount = ethers.utils.parseEther("1");

      await expect(shardFlip.connect(player1).flipCoin(true, { value: betAmount }))
        .to.emit(shardFlip, "GamePlayed");

      // Check stats
      const stats = await shardFlip.getPlayerStats(player1.address);
      expect(stats[0]).to.equal(1); // totalGames
      expect(stats[2]).to.equal(betAmount); // totalWagered
    });

    it("Should reject bets below minimum", async function () {
      const betAmount = ethers.utils.parseEther("0.005");
      
      await expect(
        shardFlip.connect(player1).flipCoin(true, { value: betAmount })
      ).to.be.revertedWith("Bet amount too low");
    });

    it("Should reject bets above maximum", async function () {
      const betAmount = ethers.utils.parseEther("15");
      
      await expect(
        shardFlip.connect(player1).flipCoin(true, { value: betAmount })
      ).to.be.revertedWith("Bet amount too high");
    });

    it("Should reject bets when paused", async function () {
      await shardFlip.setPaused(true);
      
      await expect(
        shardFlip.connect(player1).flipCoin(true, { value: MIN_BET })
      ).to.be.revertedWith("Contract is paused");
    });
  });

  describe("Game Logic", function () {
    it("Should handle game results correctly", async function () {
      const betAmount = ethers.utils.parseEther("1");
      const initialBalance = await player1.getBalance();
      
      const tx = await shardFlip.connect(player1).flipCoin(true, { value: betAmount });
      const receipt = await tx.wait();
      
      // Get gas cost
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      
      // Check if game was recorded
      expect(await shardFlip.getTotalGames()).to.equal(1);
      
      // Get the game result
      const game = await shardFlip.getGameByIndex(0);
      expect(game[0]).to.equal(player1.address); // player
      expect(game[1]).to.equal(betAmount); // betAmount
      expect(game[2]).to.equal(true); // choice
    });

    it("Should track player statistics", async function () {
      const betAmount = ethers.utils.parseEther("0.5");
      
      // Play 3 games
      for (let i = 0; i < 3; i++) {
        await shardFlip.connect(player1).flipCoin(i % 2 === 0, { value: betAmount });
      }

      const stats = await shardFlip.getPlayerStats(player1.address);
      expect(stats[0]).to.equal(3); // totalGames
      expect(stats[2]).to.equal(betAmount.mul(3)); // totalWagered
    });

    it("Should track new players", async function () {
      expect(await shardFlip.totalActiveUsers()).to.equal(0);
      expect(await shardFlip.hasPlayerPlayed(player1.address)).to.be.false;
      
      await shardFlip.connect(player1).flipCoin(true, { value: MIN_BET });
      
      expect(await shardFlip.totalActiveUsers()).to.equal(1);
      expect(await shardFlip.hasPlayerPlayed(player1.address)).to.be.true;
      
      // Playing again shouldn't increase count
      await shardFlip.connect(player1).flipCoin(false, { value: MIN_BET });
      expect(await shardFlip.totalActiveUsers()).to.equal(1);
    });
  });

  describe("Data Retrieval", function () {
    it("Should return recent games", async function () {
      const betAmount = ethers.utils.parseEther("0.1");
      
      // Play some games
      for (let i = 0; i < 5; i++) {
        await shardFlip.connect(player1).flipCoin(i % 2 === 0, { value: betAmount });
      }
      
      const recentGames = await shardFlip.getRecentGames();
      expect(recentGames.length).to.equal(5);
    });

    it("Should return game statistics", async function () {
      const betAmount = ethers.utils.parseEther("1");
      
      await shardFlip.connect(player1).flipCoin(true, { value: betAmount });
      await shardFlip.connect(player2).flipCoin(false, { value: betAmount });
      
      const gameStats = await shardFlip.getGameStats();
      expect(gameStats[0]).to.equal(2); // totalGames
      expect(gameStats[1]).to.equal(betAmount.mul(2)); // totalVolume
      expect(gameStats[3]).to.equal(2); // activeUsers
    });

    it("Should return player-specific games", async function () {
      const betAmount = ethers.utils.parseEther("0.5");
      
      // Player 1 plays 2 games
      await shardFlip.connect(player1).flipCoin(true, { value: betAmount });
      await shardFlip.connect(player1).flipCoin(false, { value: betAmount });
      
      // Player 2 plays 1 game
      await shardFlip.connect(player2).flipCoin(true, { value: betAmount });
      
      const player1Games = await shardFlip.getPlayerGames(player1.address, 10);
      const player2Games = await shardFlip.getPlayerGames(player2.address, 10);
      
      expect(player1Games.length).to.equal(2);
      expect(player2Games.length).to.equal(1);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to deposit funds", async function () {
      const depositAmount = ethers.utils.parseEther("2");
      
      await expect(shardFlip.depositFunds({ value: depositAmount }))
        .to.emit(shardFlip, "FundsDeposited");
    });

    it("Should allow owner to withdraw funds", async function () {
      const withdrawAmount = ethers.utils.parseEther("1");
      
      await expect(shardFlip.withdrawFunds(withdrawAmount))
        .to.emit(shardFlip, "FundsWithdrawn");
    });

    it("Should not allow non-owner to withdraw", async function () {
      const withdrawAmount = ethers.utils.parseEther("1");
      
      await expect(
        shardFlip.connect(player1).withdrawFunds(withdrawAmount)
      ).to.be.revertedWith("Only owner can call this function");
    });

    it("Should allow owner to pause/unpause", async function () {
      await shardFlip.setPaused(true);
      expect(await shardFlip.paused()).to.be.true;
      
      await shardFlip.setPaused(false);
      expect(await shardFlip.paused()).to.be.false;
    });

    it("Should allow owner to transfer ownership", async function () {
      await expect(shardFlip.transferOwnership(player1.address))
        .to.emit(shardFlip, "OwnershipTransferred")
        .withArgs(owner.address, player1.address);
      
      expect(await shardFlip.owner()).to.equal(player1.address);
    });

    it("Should allow emergency withdraw", async function () {
      const contractBalance = await ethers.provider.getBalance(shardFlip.address);
      
      await expect(shardFlip.emergencyWithdraw())
        .to.emit(shardFlip, "FundsWithdrawn");
      
      expect(await ethers.provider.getBalance(shardFlip.address)).to.equal(0);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle insufficient balance for payout", async function () {
      // Withdraw most funds, leaving less than 2x max bet
      const contractBalance = await ethers.provider.getBalance(shardFlip.address);
      const withdrawAmount = contractBalance.sub(ethers.utils.parseEther("1"));
      
      await shardFlip.withdrawFunds(withdrawAmount);
      
      const betAmount = ethers.utils.parseEther("1");
      
      await expect(
        shardFlip.connect(player1).flipCoin(true, { value: betAmount })
      ).to.be.revertedWith("Insufficient contract balance for potential payout");
    });

    it("Should handle zero amount withdrawal rejection", async function () {
      await expect(
        shardFlip.withdrawFunds(0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should handle excessive withdrawal amount", async function () {
      const excessiveAmount = ethers.utils.parseEther("100");
      
      await expect(
        shardFlip.withdrawFunds(excessiveAmount)
      ).to.be.revertedWith("Insufficient contract balance");
    });
  });

  describe("Leaderboard", function () {
    it("Should return top players", async function () {
      const betAmount = ethers.utils.parseEther("0.5");
      
      // Multiple players play
      await shardFlip.connect(player1).flipCoin(true, { value: betAmount });
      await shardFlip.connect(player2).flipCoin(false, { value: betAmount });
      
      const [players, wins, wagered] = await shardFlip.getTopPlayers(10);
      
      expect(players.length).to.be.at.most(2);
      expect(wins.length).to.equal(players.length);
      expect(wagered.length).to.equal(players.length);
    });
  });
});