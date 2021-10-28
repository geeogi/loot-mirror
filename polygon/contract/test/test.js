const { expect } = require("chai");
const { ethers } = require("hardhat");

const ADDRESS_1 = "0x17A15c0B866b156167A678f0F9986778CBbC5719";
const ADDRESS_2 = "0xA0c68C638235ee32657e8f720a23ceC1bFc77C77";
const ADDRESS_3 = "0xccaCeB16F86674B62286855706c69f060E003eFe";

describe("LootMirror", function () {
  it("Should return the new owners once updated", async function () {
    const LootMirror = await ethers.getContractFactory("LootMirror");
    const lootMirror = await LootMirror.deploy();

    await lootMirror.deployed();

    /*
     * Let's suppose there are only two owners at first
     */
    const setOwnersTx = await lootMirror.setLootOwners([
      {
        owner: ADDRESS_1,
        tokenIds: [1, 2, 3],
      },
      {
        owner: ADDRESS_2,
        tokenIds: [1576],
      },
    ]);

    await setOwnersTx.wait();

    expect(await lootMirror.ownerOf(1)).to.equal(ADDRESS_1);
    expect(await lootMirror.ownerOf(1)).not.to.equal(ADDRESS_2);
    expect(await lootMirror.ownerOf(1)).not.to.equal(ADDRESS_3);

    expect(await lootMirror.ownerOf(2)).to.equal(ADDRESS_1);
    expect(await lootMirror.ownerOf(2)).not.to.equal(ADDRESS_2);
    expect(await lootMirror.ownerOf(2)).not.to.equal(ADDRESS_3);

    expect(await lootMirror.ownerOf(3)).to.equal(ADDRESS_1);
    expect(await lootMirror.ownerOf(3)).not.to.equal(ADDRESS_2);
    expect(await lootMirror.ownerOf(3)).not.to.equal(ADDRESS_3);

    expect(await lootMirror.ownerOf(1576)).not.to.equal(ADDRESS_1);
    expect(await lootMirror.ownerOf(1576)).to.equal(ADDRESS_2);
    expect(await lootMirror.ownerOf(1576)).not.to.equal(ADDRESS_3);

    expect(await lootMirror.balanceOf(ADDRESS_1)).to.equal(3);
    expect(await lootMirror.balanceOf(ADDRESS_2)).to.equal(1);
    expect(await lootMirror.balanceOf(ADDRESS_3)).to.equal(0);

    expect(await lootMirror.tokenOfOwnerByIndex(ADDRESS_1, 0)).to.equal(1);
    expect(await lootMirror.tokenOfOwnerByIndex(ADDRESS_1, 1)).to.equal(2);
    expect(await lootMirror.tokenOfOwnerByIndex(ADDRESS_1, 2)).to.equal(3);
    expect(await lootMirror.tokenOfOwnerByIndex(ADDRESS_2, 0)).to.equal(1576);

    /*
     * Let's suppose that `2` and `1576` are sent to ADDRESS_3
     *
     * We'll send an update for the addresses where balances have
     * changed, ommiting addresses which are no longer owners
     */
    const setOwnersTx2 = await lootMirror.setLootOwners([
      {
        owner: ADDRESS_1,
        tokenIds: [1, 3],
      },
      {
        owner: ADDRESS_3,
        tokenIds: [2, 1576],
      },
    ]);

    await setOwnersTx2.wait();

    expect(await lootMirror.ownerOf(1)).to.equal(ADDRESS_1);
    expect(await lootMirror.ownerOf(1)).not.to.equal(ADDRESS_2);
    expect(await lootMirror.ownerOf(1)).not.to.equal(ADDRESS_3);

    expect(await lootMirror.ownerOf(2)).not.to.equal(ADDRESS_1);
    expect(await lootMirror.ownerOf(2)).not.to.equal(ADDRESS_2);
    expect(await lootMirror.ownerOf(2)).to.equal(ADDRESS_3);

    expect(await lootMirror.ownerOf(3)).to.equal(ADDRESS_1);
    expect(await lootMirror.ownerOf(3)).not.to.equal(ADDRESS_2);
    expect(await lootMirror.ownerOf(3)).not.to.equal(ADDRESS_3);

    expect(await lootMirror.ownerOf(1576)).not.to.equal(ADDRESS_1);
    expect(await lootMirror.ownerOf(1576)).not.to.equal(ADDRESS_2);
    expect(await lootMirror.ownerOf(1576)).to.equal(ADDRESS_3);

    expect(await lootMirror.balanceOf(ADDRESS_1)).to.equal(2);
    expect(await lootMirror.balanceOf(ADDRESS_2)).to.equal(0);
    expect(await lootMirror.balanceOf(ADDRESS_3)).to.equal(2);

    expect(await lootMirror.tokenOfOwnerByIndex(ADDRESS_1, 0)).to.equal(1);
    expect(await lootMirror.tokenOfOwnerByIndex(ADDRESS_1, 1)).to.equal(3);
    expect(await lootMirror.tokenOfOwnerByIndex(ADDRESS_3, 0)).to.equal(2);
    expect(await lootMirror.tokenOfOwnerByIndex(ADDRESS_3, 1)).to.equal(1576);

    await expect(lootMirror.tokenOfOwnerByIndex(ADDRESS_2, 0)).to.be.revertedWith(
      "ERC721Enumerable: owner index out of bounds"
    );
  });
});
