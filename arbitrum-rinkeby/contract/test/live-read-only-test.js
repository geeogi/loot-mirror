const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LootMirror", function () {
  it("Should return the owners", async function () {
    const LootMirror = await ethers.getContractFactory("LootMirror");
    const lootMirror = await LootMirror.attach("0x3b624348fC06a8629E0107a8a409b83B6297C77B")

    expect(await lootMirror.ownerOf(2102)).to.equal("hi");
  });
});

