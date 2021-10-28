const { expect } = require("chai");
const { ethers } = require("hardhat");

const ADDRESS_1 = "0x17A15c0B866b156167A678f0F9986778CBbC5719";
const ADDRESS_2 = "0xA0c68C638235ee32657e8f720a23ceC1bFc77C77";
const ADDRESS_3 = "0xccaCeB16F86674B62286855706c69f060E003eFe";

describe("LootMirror", function () {
  it("Should update balances", async function () {
    const LootMirror = await ethers.getContractFactory("LootMirror");
    const lootMirror = await LootMirror.deploy();

    await lootMirror.deployed();

    const setBalancesTx = await lootMirror.setBalancesSurgically([
      {
        owner: ADDRESS_1,
        balance: 623,
      },
      {
        owner: ADDRESS_2,
        balance: 1,
      },
    ]);

    await setBalancesTx.wait();

    expect(await lootMirror.balanceOf(ADDRESS_1)).to.equal(623);
    expect(await lootMirror.balanceOf(ADDRESS_2)).to.equal(1);
    expect(await lootMirror.balanceOf(ADDRESS_3)).to.equal(0);
  });

  it("Should update token owners", async function () {
    const LootMirror = await ethers.getContractFactory("LootMirror");
    const lootMirror = await LootMirror.deploy();

    await lootMirror.deployed();

    const setTokenOwnersTx = await lootMirror.setTokenOwnersSurgically([
      {
        owner: ADDRESS_1,
        tokenId: 4567,
      },
      {
        owner: ADDRESS_2,
        tokenId: 2345,
      },
    ]);

    await setTokenOwnersTx.wait();

    expect(await lootMirror.ownerOf(4567)).to.equal(ADDRESS_1);
    expect(await lootMirror.ownerOf(2345)).to.equal(ADDRESS_2);
  });

  it("Should update owned tokens", async function () {
    const LootMirror = await ethers.getContractFactory("LootMirror");
    const lootMirror = await LootMirror.deploy();

    await lootMirror.deployed();

    const setOwnedTokensTx = await lootMirror.setOwnedTokensSurgically([
      {
        owner: ADDRESS_1,
        indicies: [0, 100],
        tokenIds: [12, 6587],
      },
      {
        owner: ADDRESS_2,
        indicies: [1, 2],
        tokenIds: [3, 33],
      },
    ]);

    await setOwnedTokensTx.wait();

    const setBalancesTx = await lootMirror.setBalancesSurgically([
      {
        owner: ADDRESS_1,
        balance: 101,
      },
      {
        owner: ADDRESS_2,
        balance: 34,
      },
    ]);

    await setBalancesTx.wait();

    expect(await lootMirror.tokenOfOwnerByIndex(ADDRESS_1, 0)).to.equal(12);
    expect(await lootMirror.tokenOfOwnerByIndex(ADDRESS_1, 100)).to.equal(6587);
    expect(await lootMirror.tokenOfOwnerByIndex(ADDRESS_2, 1)).to.equal(3);
    expect(await lootMirror.tokenOfOwnerByIndex(ADDRESS_2, 2)).to.equal(33);

    const deleteOwnedTokensTx = await lootMirror.deleteOwnedTokensSurgically([
      {
        owner: ADDRESS_1,
        indiciesToDelete: [0],
      },
      {
        owner: ADDRESS_2,
        indiciesToDelete: [2],
      },
    ]);

    await deleteOwnedTokensTx.wait();

    expect(await lootMirror.tokenOfOwnerByIndex(ADDRESS_1, 0)).not.to.equal(12);
    expect(await lootMirror.tokenOfOwnerByIndex(ADDRESS_1, 100)).to.equal(6587);
    expect(await lootMirror.tokenOfOwnerByIndex(ADDRESS_2, 1)).to.equal(3);
    expect(await lootMirror.tokenOfOwnerByIndex(ADDRESS_2, 2)).not.to.equal(33);
  });
});
