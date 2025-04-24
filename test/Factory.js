const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Factory", function () {
  const FEE = ethers.parseEther("0.01", 18);

  async function deployFactoryFixture() {
    // Fetch accounts
    const [deployer, creator, buyer] = await ethers.getSigners();

    // Fetch the contract
    const Factory = await ethers.getContractFactory("Factory");
    // Deploy the contract

    const factory = await Factory.deploy(FEE);

    // Create token
    const transaction = await factory.connect(creator).create("Token", "TOK", {
      value: FEE,
    });
    await transaction.wait();

    // Get token address
    const tokenAddress = await factory.tokens(0);
    const token = await ethers.getContractAt("Token", tokenAddress);

    return { factory, token, deployer, creator, buyer };
  }

  async function buyTokenFixture() {
    const { factory, token, creator, buyer } = await deployFactoryFixture();

    const AMOUNT = ethers.parseUnits("10000", 18);
    const COST = ethers.parseUnits("1", 18);

    // Buy tokens
    const transaction = await factory
      .connect(buyer)
      .buy(await token.getAddress(), AMOUNT, { value: COST });
    await transaction.wait();

    return { factory, token, creator, buyer };
  }

  describe("Deployment", function () {
    it("Should set the fee", async function () {
      const { factory } = await loadFixture(deployFactoryFixture);
      expect(await factory.fee()).to.equal(FEE);
    });

    it("Should the owner", async function () {
      const { factory, deployer } = await loadFixture(deployFactoryFixture);
      expect(await factory.owner()).to.equal(deployer.address);
    });
  });

  describe("Creating", function () {
    it("Should set the owner", async function () {
      const { factory, token } = await loadFixture(deployFactoryFixture);
      expect(await token.owner()).to.equal(await factory.getAddress());
    });

    it("Should set the creator", async function () {
      const { token, creator } = await loadFixture(deployFactoryFixture);
      expect(await token.creator()).to.equal(creator.address);
    });

    it("Should set the supply", async function () {
      const { factory, token } = await loadFixture(deployFactoryFixture);

      const totalSupply = ethers.parseUnits("1000000", 18);

      expect(await token.balanceOf(await factory.getAddress())).to.equal(
        totalSupply
      );
    });

    it("Should update ETH balance", async function () {
      const { factory } = await loadFixture(deployFactoryFixture);

      const balance = await ethers.provider.getBalance(
        await factory.getAddress()
      );

      expect(balance).to.equal(FEE);
    });

    it("Should create the sale", async function () {
      const { factory, token, creator } = await loadFixture(
        deployFactoryFixture
      );

      const count = await factory.totalTokens();
      expect(count).to.equal(1);

      const sale = await factory.getTokenSale(0);
      expect(sale.token).to.equal(await token.getAddress());
      expect(sale.creator).to.equal(creator.address);
      expect(sale.sold).to.equal(0);
      expect(sale.raised).to.equal(0);
      expect(sale.isOpen).to.equal(true);
    });
  });

  describe("Buying", async function () {
    const AMOUNT = ethers.parseUnits("10000", 18);
    const COST = ethers.parseUnits("1", 18);

    // Check contract recieved the ETH
    it("Should update ETH balance", async function () {
      const { factory } = await loadFixture(buyTokenFixture);

      const balance = await ethers.provider.getBalance(
        await factory.getAddress()
      );
      expect(balance).to.equal(FEE + COST);
    });

    // Check that buyer recieved tokens
    it("Should update token balances", async function () {
      const { token, buyer } = await loadFixture(buyTokenFixture);

      const balance = await token.balanceOf(buyer.address);
      expect(balance).to.equal(AMOUNT);
    });
  });
});
