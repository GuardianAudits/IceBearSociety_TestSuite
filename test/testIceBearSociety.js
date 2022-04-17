const { expect } = require("chai");
const { beforeHook, beforeEachHook } = require("../utils/testUtils.js");
const { TEST_TIMEOUT, DEV_ADDRESS } = require("../constants.js");

describe("Ice Bears Society", function () {
  let deployer, user1, user2, user3, iceBearsNFT;

  this.slow(20000);

  before(async () => {
    ({ deployer, user1, user2, user3 } = await beforeHook());
  });

  beforeEach(async () => {
    ({ iceBearsNFT } = await beforeEachHook());
  });

  it("Can Mint an ice bear", async function () {
    let ownedNFTs = await iceBearsNFT.walletOfOwner(deployer.address);
    expect(ownedNFTs.length).to.eq(0);

    // Owner avoids the cost, notice no value is in this tx
    await iceBearsNFT.mint(deployer.address, 1);

    ownedNFTs = await iceBearsNFT.walletOfOwner(deployer.address);
    expect(ownedNFTs.length).to.eq(1);
    expect(ownedNFTs[0]).to.eq(1);
    ownedNFTs = await iceBearsNFT.walletOfOwner(user1.address);
    expect(ownedNFTs.length).to.eq(0);

    await expect(
      iceBearsNFT.connect(user1).mint(user1.address, 1)
    ).to.be.revertedWith("");
    await expect(
      iceBearsNFT
        .connect(user1)
        .mint(user1.address, 1, { value: ethers.utils.parseEther("32") })
    ).to.be.revertedWith("");

    await iceBearsNFT
      .connect(user1)
      .mint(user1.address, 1, { value: ethers.utils.parseEther("33") });

    ownedNFTs = await iceBearsNFT.walletOfOwner(user1.address);
    expect(ownedNFTs.length).to.eq(1);
    expect(ownedNFTs[0]).to.eq(2);
  }).timeout(TEST_TIMEOUT);

  it("Owner and only owner can setSaleTime", async function () {
    expect(await iceBearsNFT.saleStart()).to.eq(1649172780);

    await iceBearsNFT.setSaleTime(1);

    expect(await iceBearsNFT.saleStart()).to.eq(1);

    await expect(iceBearsNFT.connect(user1).setSaleTime(5)).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
  }).timeout(TEST_TIMEOUT);

  it("Owner and only owner can setCost", async function () {
    expect(await iceBearsNFT.cost()).to.eq(ethers.utils.parseEther("33"));

    await expect(
      iceBearsNFT.connect(user1).setCost(ethers.utils.parseEther("100"))
    ).to.be.revertedWith("Ownable: caller is not the owner");
    expect(await iceBearsNFT.cost()).to.eq(ethers.utils.parseEther("33"));

    await iceBearsNFT.setCost(ethers.utils.parseEther("100"));

    expect(await iceBearsNFT.cost()).to.eq(ethers.utils.parseEther("100"));
  }).timeout(TEST_TIMEOUT);

  it("Owner and only owner can setMaxMintAmount", async function () {
    expect(await iceBearsNFT.maxMintAmount()).to.eq(5);

    await expect(
      iceBearsNFT.connect(user1).setmaxMintAmount(10)
    ).to.be.revertedWith("Ownable: caller is not the owner");
    expect(await iceBearsNFT.maxMintAmount()).to.eq(5);

    await iceBearsNFT.setmaxMintAmount(10);
    expect(await iceBearsNFT.maxMintAmount()).to.eq(10);
  }).timeout(TEST_TIMEOUT);

  it("Owner and only owner can setBaseURI", async function () {
    expect(await iceBearsNFT.baseURI()).to.eq(
      "https://api1.nftgarage.world/serve/assets/icebearsociety/metadata/"
    );

    await expect(
      iceBearsNFT.connect(user1).setBaseURI("test")
    ).to.be.revertedWith("Ownable: caller is not the owner");
    expect(await iceBearsNFT.baseURI()).to.eq(
      "https://api1.nftgarage.world/serve/assets/icebearsociety/metadata/"
    );

    await iceBearsNFT.setBaseURI("test");

    expect(await iceBearsNFT.baseURI()).to.eq("test");
  }).timeout(TEST_TIMEOUT);

  it("Owner and only owner can pause", async function () {
    expect(await iceBearsNFT.paused()).to.be.false;

    await expect(iceBearsNFT.connect(user1).pause(true)).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
    expect(await iceBearsNFT.paused()).to.be.false;

    await iceBearsNFT.pause(false);
    expect(await iceBearsNFT.paused()).to.be.false;

    await iceBearsNFT.pause(true);
    expect(await iceBearsNFT.paused()).to.be.true;
  }).timeout(TEST_TIMEOUT);

  it("Owner and only owner can withdraw", async function () {
    const devBalStart = await ethers.provider.getBalance(DEV_ADDRESS);
    let contractBal = await ethers.provider.getBalance(iceBearsNFT.address);

    expect(contractBal).to.eq(0);

    await iceBearsNFT
      .connect(user1)
      .mint(user1.address, 1, { value: ethers.utils.parseEther("33") });

    contractBal = await ethers.provider.getBalance(iceBearsNFT.address);

    expect(contractBal).to.eq(ethers.utils.parseEther("33"));
    await expect(iceBearsNFT.connect(user1).withdraw()).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
    expect(contractBal).to.eq(ethers.utils.parseEther("33"));

    await iceBearsNFT.withdraw();

    contractBal = await ethers.provider.getBalance(iceBearsNFT.address);
    expect(contractBal).to.eq(0);

    const devBalFinal = await ethers.provider.getBalance(DEV_ADDRESS);

    expect(devBalFinal.sub(devBalStart)).to.eq(ethers.utils.parseEther("33"));
  }).timeout(TEST_TIMEOUT);

  it("Owner and only owner can reserveForGiveaway", async function () {
    const giveawayAmount = 10;

    expect(await iceBearsNFT.totalSupply()).to.eq(0);

    await expect(
      iceBearsNFT
        .connect(user1)
        .reserveForGiveaway(user1.address, giveawayAmount)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    expect(await iceBearsNFT.totalSupply()).to.eq(0);
    await iceBearsNFT.reserveForGiveaway(user1.address, giveawayAmount);
    expect(await iceBearsNFT.totalSupply()).to.eq(giveawayAmount);

    let ownedNFTs = await iceBearsNFT.walletOfOwner(user1.address);

    expect(ownedNFTs.length).to.eq(giveawayAmount);

    for (let i = 0; i < giveawayAmount; i++) {
      expect(ownedNFTs[i]).to.eq(i + 1);
    }

    await iceBearsNFT.reserveForGiveaway(deployer.address, 0);

    ownedNFTs = await iceBearsNFT.walletOfOwner(deployer.address);
    expect(ownedNFTs.length).to.eq(0);

    for (let i = 0; i < 660; i++) {
      await iceBearsNFT.mint(user1.address, 5);
    }

    // Notice that you can reserveForGiveaway more than the total supply
    await iceBearsNFT.reserveForGiveaway(deployer.address, 100);

    const maxSupply = await iceBearsNFT.maxSupply();
    const existingSupply = await iceBearsNFT.totalSupply();

    expect(existingSupply).to.be.gt(maxSupply);
  }).timeout(TEST_TIMEOUT);

  it("Cannot mint while paused", async function () {
    expect(await iceBearsNFT.paused()).to.be.false;
    let contractBal = await ethers.provider.getBalance(iceBearsNFT.address);

    expect(contractBal).to.eq(0);

    await iceBearsNFT
      .connect(user1)
      .mint(user1.address, 1, { value: ethers.utils.parseEther("33") });

    contractBal = await ethers.provider.getBalance(iceBearsNFT.address);

    expect(contractBal).to.eq(ethers.utils.parseEther("33"));
    expect((await iceBearsNFT.walletOfOwner(user1.address)).length).to.eq(1);

    await iceBearsNFT.pause(true);
    expect(await iceBearsNFT.paused()).to.be.true;

    await expect(
      iceBearsNFT
        .connect(user1)
        .mint(user1.address, 1, { value: ethers.utils.parseEther("33") })
    ).to.be.revertedWith("Minting is paused");

    await expect(iceBearsNFT.mint(deployer.address, 1)).to.be.revertedWith(
      "Minting is paused"
    );
  }).timeout(TEST_TIMEOUT);

  it("Test mint requires", async function () {
    await expect(iceBearsNFT.mint(deployer.address, 0)).to.be.revertedWith(
      "Mint amount must be greater than 0"
    );
    await expect(iceBearsNFT.mint(deployer.address, 6)).to.be.revertedWith(
      "You can mint a max of 5"
    );

    // Time in the future
    await iceBearsNFT.setSaleTime(5649172780);

    await expect(iceBearsNFT.mint(deployer.address, 1)).to.be.revertedWith(
      "Sale isn't live yet"
    );

    await iceBearsNFT.setSaleTime(1649172780);

    for (let i = 0; i < 3333; i++) {
      await iceBearsNFT.mint(deployer.address, 1);
    }

    await expect(iceBearsNFT.mint(deployer.address, 1)).to.be.revertedWith(
      "All pieces have been minted!"
    );
  }).timeout(TEST_TIMEOUT);

  it("Returns the expected token URI", async function () {
    await expect(iceBearsNFT.tokenURI(1)).to.be.revertedWith(
      "ERC721Metadata: URI query for nonexistent token"
    );

    await iceBearsNFT.mint(deployer.address, 2);

    let token1URI = await iceBearsNFT.tokenURI(1);
    let token2URI = await iceBearsNFT.tokenURI(2);

    expect(token1URI).to.eq(
      "https://api1.nftgarage.world/serve/assets/icebearsociety/metadata/1"
    );
    expect(token2URI).to.eq(
      "https://api1.nftgarage.world/serve/assets/icebearsociety/metadata/2"
    );

    await iceBearsNFT.setBaseURI("");

    token1URI = await iceBearsNFT.tokenURI(1);
    token2URI = await iceBearsNFT.tokenURI(2);

    expect(token1URI).to.eq("");
    expect(token2URI).to.eq("");

    await iceBearsNFT.setBaseURI("test");

    token1URI = await iceBearsNFT.tokenURI(1);
    token2URI = await iceBearsNFT.tokenURI(2);

    expect(token1URI).to.eq("test1.json");
    expect(token2URI).to.eq("test2.json");
  }).timeout(TEST_TIMEOUT);

  it("Owner can renounce ownership", async function () {
    expect(await iceBearsNFT.owner()).to.eq(deployer.address);

    await expect(
      iceBearsNFT.connect(user1).renounceOwnership()
    ).to.be.revertedWith("Ownable: caller is not the owner");
    await iceBearsNFT.renounceOwnership();

    expect(await iceBearsNFT.owner()).to.eq(ethers.constants.AddressZero);
  }).timeout(TEST_TIMEOUT);

  it("Owner can transfer ownership", async function () {
    expect(await iceBearsNFT.owner()).to.eq(deployer.address);

    await expect(
      iceBearsNFT.connect(user1).transferOwnership(user1.address)
    ).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(
      iceBearsNFT.transferOwnership(ethers.constants.AddressZero)
    ).to.be.revertedWith("Ownable: new owner is the zero address");

    await iceBearsNFT.transferOwnership(user1.address);

    expect(await iceBearsNFT.owner()).to.eq(user1.address);

    await expect(iceBearsNFT.withdraw()).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
  }).timeout(TEST_TIMEOUT);

  it("Minted token IDs are as expected", async function () {
    expect(await iceBearsNFT.totalSupply()).to.eq(0);

    await iceBearsNFT.mint(deployer.address, 1);

    let ownedNFTs = await iceBearsNFT.walletOfOwner(deployer.address);

    expect(ownedNFTs.length).to.eq(1);
    expect(ownedNFTs[0]).to.eq(1);

    await iceBearsNFT.mint(deployer.address, 1);

    ownedNFTs = await iceBearsNFT.walletOfOwner(deployer.address);

    expect(ownedNFTs.length).to.eq(2);
    expect(ownedNFTs[1]).to.eq(2);

    await iceBearsNFT.reserveForGiveaway(deployer.address, 2);

    ownedNFTs = await iceBearsNFT.walletOfOwner(deployer.address);

    expect(ownedNFTs.length).to.eq(4);
    expect(ownedNFTs[2]).to.eq(3);
    expect(ownedNFTs[3]).to.eq(4);
  }).timeout(TEST_TIMEOUT);
});
