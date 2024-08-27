const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LendingPlatform", function () {
  let MockToken, mockToken, LendingPlatform, lendingPlatform;
  let owner, user1, user2;
  const INITIAL_SUPPLY = ethers.utils.parseEther("1000000");

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy MockToken
    MockToken = await ethers.getContractFactory("MockToken");
    mockToken = await MockToken.deploy("Mock Token", "MTK");
    await mockToken.deployed();

    // Deploy LendingPlatform
    LendingPlatform = await ethers.getContractFactory("LendingPlatform");
    lendingPlatform = await LendingPlatform.deploy(mockToken.address);
    await lendingPlatform.deployed();

    // Transfer some tokens to users for testing
    await mockToken.transfer(user1.address, ethers.utils.parseEther("10000"));
    await mockToken.transfer(user2.address, ethers.utils.parseEther("10000"));
  });

  describe("Deployment", function () {
    it("Should set the correct token address", async function () {
      expect(await lendingPlatform.token()).to.equal(mockToken.address);
    });

    it("Should mint initial supply to owner", async function () {
      expect(await mockToken.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY);
    });
  });

  describe("Deposits", function () {
    it("Should allow users to deposit tokens", async function () {
      const depositAmount = ethers.utils.parseEther("1000");
      await mockToken.connect(user1).approve(lendingPlatform.address, depositAmount);
      await lendingPlatform.connect(user1).deposit(depositAmount);

      expect(await lendingPlatform.deposits(user1.address)).to.equal(depositAmount);
      expect(await mockToken.balanceOf(lendingPlatform.address)).to.equal(depositAmount);
    });

    it("Should emit Deposit event", async function () {
      const depositAmount = ethers.utils.parseEther("1000");
      await mockToken.connect(user1).approve(lendingPlatform.address, depositAmount);

      await expect(lendingPlatform.connect(user1).deposit(depositAmount))
        .to.emit(lendingPlatform, "Deposit")
        .withArgs(user1.address, depositAmount);
    });

    it("Should revert if deposit amount is zero", async function () {
      await expect(lendingPlatform.connect(user1).deposit(0)).to.be.revertedWith("Deposit amount must be greater than 0");
    });
  });

  describe("Withdrawals", function () {
    beforeEach(async function () {
      const depositAmount = ethers.utils.parseEther("1000");
      await mockToken.connect(user1).approve(lendingPlatform.address, depositAmount);
      await lendingPlatform.connect(user1).deposit(depositAmount);
    });

    it("Should allow users to withdraw tokens", async function () {
      const withdrawAmount = ethers.utils.parseEther("500");
      await lendingPlatform.connect(user1).withdraw(withdrawAmount);

      expect(await lendingPlatform.deposits(user1.address)).to.equal(ethers.utils.parseEther("500"));
      expect(await mockToken.balanceOf(user1.address)).to.equal(ethers.utils.parseEther("9500"));
    });

    it("Should emit Withdraw event", async function () {
      const withdrawAmount = ethers.utils.parseEther("500");

      await expect(lendingPlatform.connect(user1).withdraw(withdrawAmount))
        .to.emit(lendingPlatform, "Withdraw")
        .withArgs(user1.address, withdrawAmount);
    });

    it("Should revert if withdraw amount is zero", async function () {
      await expect(lendingPlatform.connect(user1).withdraw(0)).to.be.revertedWith("Withdraw amount must be greater than 0");
    });

    it("Should revert if withdraw amount exceeds balance", async function () {
      const excessAmount = ethers.utils.parseEther("1001");
      await expect(lendingPlatform.connect(user1).withdraw(excessAmount)).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("Borrowing", function () {
    beforeEach(async function () {
      const depositAmount = ethers.utils.parseEther("1000");
      await mockToken.connect(user1).approve(lendingPlatform.address, depositAmount);
      await lendingPlatform.connect(user1).deposit(depositAmount);
    });

    it("Should allow users to borrow tokens", async function () {
      const borrowAmount = ethers.utils.parseEther("500");
      await lendingPlatform.connect(user2).borrow(borrowAmount);

      expect(await lendingPlatform.borrows(user2.address)).to.equal(borrowAmount);
      expect(await mockToken.balanceOf(user2.address)).to.equal(ethers.utils.parseEther("10500"));
    });

    it("Should emit Borrow event", async function () {
      const borrowAmount = ethers.utils.parseEther("500");

      await expect(lendingPlatform.connect(user2).borrow(borrowAmount))
        .to.emit(lendingPlatform, "Borrow")
        .withArgs(user2.address, borrowAmount);
    });

    it("Should revert if borrow amount is zero", async function () {
      await expect(lendingPlatform.connect(user2).borrow(0)).to.be.revertedWith("Borrow amount must be greater than 0");
    });

    it("Should revert if borrow amount exceeds liquidity", async function () {
      const excessAmount = ethers.utils.parseEther("1001");
      await expect(lendingPlatform.connect(user2).borrow(excessAmount)).to.be.revertedWith("Insufficient liquidity");
    });
  });

  describe("Repayments", function () {
    beforeEach(async function () {
      const depositAmount = ethers.utils.parseEther("1000");
      await mockToken.connect(user1).approve(lendingPlatform.address, depositAmount);
      await lendingPlatform.connect(user1).deposit(depositAmount);

      const borrowAmount = ethers.utils.parseEther("500");
      await lendingPlatform.connect(user2).borrow(borrowAmount);
    });

    it("Should allow users to repay borrowed tokens", async function () {
      const repayAmount = ethers.utils.parseEther("250");
      await mockToken.connect(user2).approve(lendingPlatform.address, repayAmount);
      await lendingPlatform.connect(user2).repay(repayAmount);

      expect(await lendingPlatform.borrows(user2.address)).to.equal(ethers.utils.parseEther("250"));
      expect(await mockToken.balanceOf(lendingPlatform.address)).to.equal(ethers.utils.parseEther("750"));
    });

    it("Should emit Repay event", async function () {
      const repayAmount = ethers.utils.parseEther("250");
      await mockToken.connect(user2).approve(lendingPlatform.address, repayAmount);

      await expect(lendingPlatform.connect(user2).repay(repayAmount))
        .to.emit(lendingPlatform, "Repay")
        .withArgs(user2.address, repayAmount);
    });

    it("Should revert if repay amount is zero", async function () {
      await expect(lendingPlatform.connect(user2).repay(0)).to.be.revertedWith("Repay amount must be greater than 0");
    });

    it("Should revert if repay amount exceeds borrowed amount", async function () {
      const excessAmount = ethers.utils.parseEther("501");
      await mockToken.connect(user2).approve(lendingPlatform.address, excessAmount);
      await expect(lendingPlatform.connect(user2).repay(excessAmount)).to.be.revertedWith("Repay amount exceeds borrowed amount");
    });
  });

  describe("Interest calculation", function () {
    it("Should accrue interest on deposits", async function () {
      const depositAmount = ethers.utils.parseEther("1000");
      await mockToken.connect(user1).approve(lendingPlatform.address, depositAmount);
      await lendingPlatform.connect(user1).deposit(depositAmount);

      // Simulate passage of time (1 year)
      await ethers.provider.send("evm_increaseTime", [31536000]);
      await ethers.provider.send("evm_mine");

      // Trigger interest calculation by making a small deposit
      await mockToken.connect(user1).approve(lendingPlatform.address, 1);
      await lendingPlatform.connect(user1).deposit(1);

      const balance = await lendingPlatform.getBalance();
      expect(balance).to.be.closeTo(ethers.utils.parseEther("1050"), ethers.utils.parseEther("0.1"));
    });

    it("Should accrue interest on borrows", async function () {
      const depositAmount = ethers.utils.parseEther("1000");
      await mockToken.connect(user1).approve(lendingPlatform.address, depositAmount);
      await lendingPlatform.connect(user1).deposit(depositAmount);

      const borrowAmount = ethers.utils.parseEther("500");
      await lendingPlatform.connect(user2).borrow(borrowAmount);

      // Simulate passage of time (1 year)
      await ethers.provider.send("evm_increaseTime", [31536000]);
      await ethers.provider.send("evm_mine");

      // Trigger interest calculation by making a small repayment
      await mockToken.connect(user2).approve(lendingPlatform.address, 1);
      await lendingPlatform.connect(user2).repay(1);

      const borrowBalance = await lendingPlatform.getBorrowBalance();
      expect(borrowBalance).to.be.closeTo(ethers.utils.parseEther("525"), ethers.utils.parseEther("0.1"));
    });
  });
});