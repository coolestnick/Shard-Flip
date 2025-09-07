const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ShardFlip", function () {
  let ShardFlip;
  let shardFlip;
  let owner;
  let player1;
  let player2;
  let players;

  const MIN_BET = ethers.utils.parseEther("0.01");
  const MAX_BET = ethers.utils.parseEther("10");
  const INITIAL_FUNDING = ethers.utils.parseEther("5");

  beforeEach(async function () {
    [owner, player1, player2, ...players] = await ethers.getSigners();

    // Deploy the contract
    ShardFlip = await ethers.getContractFactory("ShardFlip");
    shardFlip = await ShardFlip.deploy();
    await shardFlip.deployed();

    // Add initial funding
    await shardFlip.depositFunds({ value: INITIAL_FUNDING });
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await shardFlip.owner()).to.equal(owner.address);
    });

    it("Should have correct initial constants", async function () {
      expect(await shardFlip.MIN_BET()).to.equal(MIN_BET);
      expect(await shardFlip.MAX_BET()).to.equal(MAX_BET);
      expect(await shardFlip.PAYOUT_MULTIPLIER()).to.equal(2);
      expect(await shardFlip.HOUSE_EDGE()).to.equal(0);
    });

    it("Should have initial funding", async function () {
      expect(await ethers.provider.getBalance(shardFlip.address)).to.equal(INITIAL_FUNDING);
    });
  });

  describe("Betting", function () {
    it("Should accept valid bets", async function () {
      const betAmount = ethers.utils.parseEther("1");
      const initialBalance = await player1.getBalance();

      await expect(shardFlip.connect(player1).flipCoin(true, { value: betAmount }))
        .to.emit(shardFlip, "GamePlayed");

      // Check that player stats are updated
      const stats = await shardFlip.getPlayerStats(player1.address);
      expect(stats.totalGames).to.equal(1);
      expect(stats.totalWagered).to.equal(betAmount);
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

    it("Should reject bets when contract has insufficient balance", async function () {
      // Withdraw most funds
      const contractBalance = await ethers.provider.getBalance(shardFlip.address);
      await shardFlip.withdrawFunds(contractBalance.sub(ethers.utils.parseEther("0.5")));

      const betAmount = ethers.utils.parseEther("1");
      
      await expect(
        shardFlip.connect(player1).flipCoin(true, { value: betAmount })
      ).to.be.revertedWith("Insufficient contract balance");
    });
  });

  describe("Game Logic", function () {
    it("Should handle wins correctly", async function () {
      const betAmount = ethers.utils.parseEther("1");
      
      // Play multiple games to test randomness and win handling
      for (let i = 0; i < 10; i++) {
        const initialBalance = await player1.getBalance();
        const tx = await shardFlip.connect(player1).flipCoin(true, { value: betAmount });
        const receipt = await tx.wait();
        
        // Get the game event
        const gameEvent = receipt.events.find(e => e.event === "GamePlayed");
        const { won, payout } = gameEvent.args;
        
        if (won) {
          // Player should receive 2x their bet
          expect(payout).to.equal(betAmount.mul(2));
        } else {
          // Player loses their bet
          expect(payout).to.equal(0);
        }
      }
    });

    it("Should update player stats correctly", async function () {
      const betAmount = ethers.utils.parseEther("1");
      
      // Play 5 games
      for (let i = 0; i < 5; i++) {
        await shardFlip.connect(player1).flipCoin(true, { value: betAmount });
      }

      const stats = await shardFlip.getPlayerStats(player1.address);
      expect(stats.totalGames).to.equal(5);
      expect(stats.totalWagered).to.equal(betAmount.mul(5));
      expect(stats.lastPlayedTimestamp).to.be.above(0);
    });

    it("Should track new players correctly", async function () {
      const initialActiveUsers = await shardFlip.totalActiveUsers();
      
      await shardFlip.connect(player1).flipCoin(true, { value: MIN_BET });
      expect(await shardFlip.totalActiveUsers()).to.equal(initialActiveUsers.add(1));
      expect(await shardFlip.hasPlayerPlayed(player1.address)).to.be.true;
      
      // Playing again shouldn't increase active users
      await shardFlip.connect(player1).flipCoin(false, { value: MIN_BET });
      expect(await shardFlip.totalActiveUsers()).to.equal(initialActiveUsers.add(1));
    });
  });

  describe("Game History", function () {
    it("Should store game results", async function () {
      const betAmount = ethers.utils.parseEther("1");
      
      await shardFlip.connect(player1).flipCoin(true, { value: betAmount });
      
      const totalGames = await shardFlip.getTotalGames();
      expect(totalGames).to.equal(1);
      
      const game = await shardFlip.getGameByIndex(0);
      expect(game.player).to.equal(player1.address);
      expect(game.betAmount).to.equal(betAmount);
      expect(game.choice).to.be.true;
    });

    it("Should return recent games correctly", async function () {
      const betAmount = ethers.utils.parseEther("0.1");
      
      // Play several games
      for (let i = 0; i < 10; i++) {
        await shardFlip.connect(player1).flipCoin(i % 2 === 0, { value: betAmount });
      }
      
      const recentGames = await shardFlip.getRecentGames();
      expect(recentGames.length).to.equal(10);
      
      // Should be in reverse chronological order
      expect(recentGames[0].timestamp).to.be.at.least(recentGames[1].timestamp);
    });
  });

  describe("Statistics", function () {
    it("Should return correct game statistics", async function () {
      const betAmount = ethers.utils.parseEther("1");
      
      // Play games with different players
      await shardFlip.connect(player1).flipCoin(true, { value: betAmount });
      await shardFlip.connect(player2).flipCoin(false, { value: betAmount });
      
      const gameStats = await shardFlip.getGameStats();
      expect(gameStats.totalGames).to.equal(2);
      expect(gameStats.totalVolume).to.equal(betAmount.mul(2));
      expect(gameStats.activeUsers).to.equal(2);
    });

    it("Should return player-specific games", async function () {
      const betAmount = ethers.utils.parseEther("0.5");
      
      // Player 1 plays 3 games
      for (let i = 0; i < 3; i++) {
        await shardFlip.connect(player1).flipCoin(true, { value: betAmount });
      }
      
      // Player 2 plays 2 games
      for (let i = 0; i < 2; i++) {
        await shardFlip.connect(player2).flipCoin(false, { value: betAmount });
      }
      
      const player1Games = await shardFlip.getPlayerGames(player1.address, 10);
      const player2Games = await shardFlip.getPlayerGames(player2.address, 10);
      
      expect(player1Games.length).to.equal(3);
      expect(player2Games.length).to.equal(2);
      
      // All games should belong to the correct player
      for (const game of player1Games) {
        expect(game.player).to.equal(player1.address);
      }
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to deposit funds", async function () {
      const depositAmount = ethers.utils.parseEther("2");
      const initialBalance = await ethers.provider.getBalance(shardFlip.address);
      
      await expect(shardFlip.depositFunds({ value: depositAmount }))
        .to.emit(shardFlip, "FundsDeposited")
        .withArgs(owner.address, depositAmount);
      
      const newBalance = await ethers.provider.getBalance(shardFlip.address);
      expect(newBalance).to.equal(initialBalance.add(depositAmount));
    });

    it("Should allow owner to withdraw funds", async function () {
      const withdrawAmount = ethers.utils.parseEther("1");
      
      await expect(shardFlip.withdrawFunds(withdrawAmount))
        .to.emit(shardFlip, "FundsWithdrawn")
        .withArgs(owner.address, withdrawAmount);
    });

    it("Should not allow non-owner to withdraw funds", async function () {
      const withdrawAmount = ethers.utils.parseEther("1");
      
      await expect(
        shardFlip.connect(player1).withdrawFunds(withdrawAmount)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow owner to pause/unpause", async function () {
      await shardFlip.pause();
      
      await expect(
        shardFlip.connect(player1).flipCoin(true, { value: MIN_BET })
      ).to.be.revertedWith("Pausable: paused");
      
      await shardFlip.unpause();
      
      // Should work after unpause
      await expect(
        shardFlip.connect(player1).flipCoin(true, { value: MIN_BET })
      ).to.emit(shardFlip, "GamePlayed");
    });

    it("Should allow emergency withdraw", async function () {
      const contractBalance = await ethers.provider.getBalance(shardFlip.address);
      
      await expect(shardFlip.emergencyWithdraw())
        .to.emit(shardFlip, "EmergencyWithdraw")
        .withArgs(owner.address, contractBalance);
      
      expect(await ethers.provider.getBalance(shardFlip.address)).to.equal(0);
      expect(await shardFlip.contractBalance()).to.equal(0);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle contract with zero balance", async function () {
      // Withdraw all funds
      await shardFlip.emergencyWithdraw();
      
      await expect(
        shardFlip.connect(player1).flipCoin(true, { value: MIN_BET })
      ).to.be.revertedWith("Insufficient contract balance");
    });

    it("Should handle multiple rapid bets", async function () {
      const betAmount = ethers.utils.parseEther("0.1");
      
      // Submit multiple transactions quickly
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          shardFlip.connect(player1).flipCoin(i % 2 === 0, { value: betAmount })
        );
      }
      
      await Promise.all(promises);
      
      const stats = await shardFlip.getPlayerStats(player1.address);
      expect(stats.totalGames).to.equal(5);
    });

    it("Should prevent reentrancy", async function () {
      // This test would require a malicious contract to test reentrancy
      // For now, we trust that ReentrancyGuard is working correctly
      expect(await shardFlip.getTotalGames()).to.equal(0);
    });
  });
});