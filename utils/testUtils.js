const { ethers } = require("hardhat");

const beforeHook = async () => {
  const [deployer, user1, user2, user3] = await ethers.getSigners();

  return {
    deployer,
    user1,
    user2,
    user3,
  };
};

const beforeEachHook = async () => {
  const [deployer] = await ethers.getSigners();

  const iceBearsNFTFactory = await ethers.getContractFactory(
    "IceBearSociety",
    deployer
  );
  const iceBearsNFT = await iceBearsNFTFactory.deploy(
    "IceBearSociety",
    "ICY",
    "https://api1.nftgarage.world/serve/assets/icebearsociety/metadata/"
  );
  await iceBearsNFT.deployed();

  return {
    iceBearsNFT,
  };
};

const getERC20At = async (address) =>
  await ethers.getContractAt(
    "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
    address
  );

module.exports = {
  beforeHook,
  beforeEachHook,
};
