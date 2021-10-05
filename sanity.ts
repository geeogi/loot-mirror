import { Multicall } from "ethereum-multicall";
import { ethers } from "ethers";
import { chunk, uniq } from "lodash";
import {
  aggregateLootBalances,
  getBalancesForAddresses,
} from "./utils/balances";
import {
  LOOT_ADDRESS,
  LOOT_IDS,
  LOOT_MIRROR_ADDRESS,
  POLYGON_RPC_ENDPOINT,
} from "./utils/constants";
import { aggregateLootOwners, getOwnersForLootIds } from "./utils/owners";
import { sendOwnerUpdates } from "./utils/update";

const polygonProvider = new ethers.providers.JsonRpcProvider(
  POLYGON_RPC_ENDPOINT
);

const polygonMulticall = new Multicall({
  ethersProvider: polygonProvider,
  tryAggregate: true,
});

const ethProvider = new ethers.providers.JsonRpcProvider(
  process.env.ETHEREUM_RPC_ENDPOINT
);

const ethMulticall = new Multicall({
  ethersProvider: ethProvider,
  tryAggregate: true,
});

const run = async () => {
  const ethLootOwners = aggregateLootOwners(
    await Promise.all(
      chunk(LOOT_IDS, 1000).map((thisChunk) =>
        getOwnersForLootIds(ethMulticall, thisChunk, LOOT_ADDRESS)
      )
    )
  );

  const mirrorLootOwners = aggregateLootOwners(
    await Promise.all(
      chunk(LOOT_IDS, 1000).map((thisChunk) =>
        getOwnersForLootIds(polygonMulticall, thisChunk, LOOT_MIRROR_ADDRESS)
      )
    )
  );

  const ethLootBalances = aggregateLootBalances(
    await Promise.all(
      chunk(Object.keys(ethLootOwners), 1000).map((thisChunk) =>
        getBalancesForAddresses(ethMulticall, thisChunk, LOOT_ADDRESS)
      )
    )
  );

  const mirrorLootBalances = aggregateLootBalances(
    await Promise.all(
      chunk(Object.keys(mirrorLootOwners), 1000).map((thisChunk) =>
        getBalancesForAddresses(
          polygonMulticall,
          thisChunk,
          LOOT_MIRROR_ADDRESS
        )
      )
    )
  );

  const affectedAddresses = [];

  Object.keys(ethLootOwners).forEach((address) => {
    const lootBags = ethLootOwners[address];
    const lootBalance = ethLootBalances[address];

    const mirrorBags = mirrorLootOwners[address];
    const mirrorBalance = mirrorLootBalances[address];

    if (lootBags && !mirrorBags) {
      affectedAddresses.push(address);
      console.log(`${address}: missing all bags`);
      return;
    }

    const bagsMissingFromMirror = lootBags.filter(
      (id) => !mirrorBags.includes(id)
    ).length;

    const bagsIncorrectlyInMirror = mirrorBags.filter(
      (id) => !lootBags.includes(id)
    ).length;

    if (bagsMissingFromMirror) {
      affectedAddresses.push(address);
      console.log(`${address}: missing ${bagsMissingFromMirror} bags`);
    }

    if (bagsIncorrectlyInMirror) {
      affectedAddresses.push(address);
      console.log(
        `${address}: found ${bagsIncorrectlyInMirror} incorrect bags`
      );
    }

    if (lootBalance !== mirrorBalance) {
      affectedAddresses.push(address);
      console.log(
        `${address}: loot balance ${lootBalance}, mirror balance: ${mirrorBalance}`
      );
    }
  });

  Object.keys(mirrorLootOwners).forEach((address) => {
    const lootBags = ethLootOwners[address];
    const lootBalance = ethLootBalances[address];

    const mirrorBags = mirrorLootOwners[address];
    const mirrorBalance = mirrorLootBalances[address];

    if (mirrorBags && !lootBags) {
      affectedAddresses.push(address);
      console.log(`${address}: found bags for non-owner`);
    }

    if (lootBalance !== mirrorBalance) {
      affectedAddresses.push(address);
      console.log(
        `${address}: loot balance ${lootBalance}, mirror balance: ${mirrorBalance}`
      );
    }
  });

  /*
   * Send healing transaction
   */
  const uniqueAddresses = uniq(affectedAddresses);

  const ownerUpdates = uniqueAddresses.map((address) => ({
    owner: address,
    tokenIds: ethLootOwners[address],
  }));

  console.log(`prepared ${ownerUpdates.length} owner updates`);

  sendOwnerUpdates(polygonProvider, ownerUpdates);
};

run();
