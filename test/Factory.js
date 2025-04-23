const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Factory", function () {
  const FEE = ethers.parseEther("0.01", 18);

  async function deployFactoryFixture() {
    // Fetch accounts
    const [deployer] = await ethers.getSigners();

    // Fetch the contract
    const Factory = await ethers.getContractFactory("Factory");
    // Deploy the contract

    const factory = await Factory.deploy(FEE);

    return { factory, deployer };
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
});
