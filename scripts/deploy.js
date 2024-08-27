const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  const signers = await ethers.getSigners();
  const deployer = signers[1];  // 使用第二个账户（索引为1）作为部署者

  console.log("Deploying contracts with the account:", deployer.address);

  // 部署 MockToken
  const MockToken = await hre.ethers.getContractFactory("MockToken");
  const mockToken = await MockToken.deploy("Mock Token", "MTK");
  await mockToken.deployed();

  console.log("MockToken deployed to:", mockToken.address);

  // 部署 LendingPlatform
  const LendingPlatform = await hre.ethers.getContractFactory("LendingPlatform");
  const lendingPlatform = await LendingPlatform.deploy(mockToken.address);
  await lendingPlatform.deployed();

  console.log("LendingPlatform deployed to:", lendingPlatform.address);

  // 为部署者铸造一些代币
  const mintAmount = ethers.utils.parseEther("10000");  // 铸造 10,000 个代币
  await mockToken.mint(deployer.address, mintAmount);
  console.log("Minted", ethers.utils.formatEther(mintAmount), "tokens to deployer");

  // 向 LendingPlatform 合约转入一些代币
  const transferAmount = ethers.utils.parseEther("5000");  // 转入 5,000 个代币
  await mockToken.transfer(lendingPlatform.address, transferAmount);
  console.log("Transferred", ethers.utils.formatEther(transferAmount), "tokens to LendingPlatform");

  // 查看余额
  const deployerBalance = await mockToken.balanceOf(deployer.address);
  const contractBalance = await mockToken.balanceOf(lendingPlatform.address);
  
  console.log("Deployer token balance:", ethers.utils.formatEther(deployerBalance));
  console.log("LendingPlatform token balance:", ethers.utils.formatEther(contractBalance));

  // 保存合约地址到配置文件
  const config = {
    tokenAddress: mockToken.address,
    lendingPlatformAddress: lendingPlatform.address
  };

  const configPath = path.join(__dirname, '..', 'frontend', 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log("Contract addresses saved to frontend/config.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });