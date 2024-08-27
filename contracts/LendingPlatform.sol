// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract LendingPlatform {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 public token;

    mapping(address => uint256) public deposits;
    mapping(address => uint256) public borrows;
    mapping(address => uint256) public lastInterestTime;

    uint256 public constant INTEREST_RATE = 5; // 5% annual interest rate
    uint256 public constant INTEREST_RATE_DENOMINATOR = 100;
    uint256 public constant SECONDS_PER_YEAR = 31536000; // 365 days

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event Borrow(address indexed user, uint256 amount);
    event Repay(address indexed user, uint256 amount);

    constructor(address _token) {
        token = IERC20(_token);
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "Deposit amount must be greater than 0");
        token.safeTransferFrom(msg.sender, address(this), amount);
        deposits[msg.sender] = deposits[msg.sender].add(amount);
        lastInterestTime[msg.sender] = block.timestamp;
        emit Deposit(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        require(amount > 0, "Withdraw amount must be greater than 0");
        require(deposits[msg.sender] >= amount, "Insufficient balance");

        updateInterest();
        deposits[msg.sender] = deposits[msg.sender].sub(amount);
        token.safeTransfer(msg.sender, amount);
        emit Withdraw(msg.sender, amount);
    }

    function borrow(uint256 amount) external {
        require(amount > 0, "Borrow amount must be greater than 0");
        require(token.balanceOf(address(this)) >= amount, "Insufficient liquidity");

        updateInterest();
        borrows[msg.sender] = borrows[msg.sender].add(amount);
        token.safeTransfer(msg.sender, amount);
        emit Borrow(msg.sender, amount);
    }

    function repay(uint256 amount) external {
        require(amount > 0, "Repay amount must be greater than 0");
        require(borrows[msg.sender] >= amount, "Repay amount exceeds borrowed amount");

        updateInterest();
        borrows[msg.sender] = borrows[msg.sender].sub(amount);
        token.safeTransferFrom(msg.sender, address(this), amount);
        emit Repay(msg.sender, amount);
    }

    function updateInterest() internal {
        uint256 timePassed = block.timestamp.sub(lastInterestTime[msg.sender]);
        if (timePassed > 0) {
            uint256 interestEarned = deposits[msg.sender].mul(INTEREST_RATE).mul(timePassed).div(INTEREST_RATE_DENOMINATOR).div(SECONDS_PER_YEAR);
            deposits[msg.sender] = deposits[msg.sender].add(interestEarned);
            
            uint256 interestOwed = borrows[msg.sender].mul(INTEREST_RATE).mul(timePassed).div(INTEREST_RATE_DENOMINATOR).div(SECONDS_PER_YEAR);
            borrows[msg.sender] = borrows[msg.sender].add(interestOwed);

            lastInterestTime[msg.sender] = block.timestamp;
        }
    }

    function getBalance() external view returns (uint256) {
        return deposits[msg.sender];
    }

    function getBorrowBalance() external view returns (uint256) {
        return borrows[msg.sender];
    }
}