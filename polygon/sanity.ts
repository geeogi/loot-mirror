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
  // Fetch owners for all tokenIds aggregated by owner
  const ethLootOwners = aggregateLootOwners(
    await Promise.all(
      chunk(LOOT_IDS, 1000).map((thisChunk) =>
        getOwnersForLootIds(ethMulticall, thisChunk, LOOT_ADDRESS)
      )
    )
  );

  // Fetch owners for all tokenIds aggregated by owner (mirror)
  const mirrorLootOwners = aggregateLootOwners(
    await Promise.all(
      chunk(LOOT_IDS, 1000).map((thisChunk) =>
        getOwnersForLootIds(polygonMulticall, thisChunk, LOOT_MIRROR_ADDRESS)
      )
    )
  );

  // Fetch all balances of Loot owners
  const ethLootBalances = aggregateLootBalances(
    await Promise.all(
      chunk(Object.keys(ethLootOwners), 1000).map((thisChunk) =>
        getBalancesForAddresses(ethMulticall, thisChunk, LOOT_ADDRESS)
      )
    )
  );

  // Fetch all balances of Loot owners (mirror)
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

  // Addresses that require update (e.g. involved in recent transfers)
  const addressesToUpdate = [];

  Object.keys(ethLootOwners).forEach((address) => {
    /*
     * Max 5 bags mirrored per address for now
     * Some owners have 600+ bags (=lots of gas), can be attempted for V2
     */
    const lootBags = (ethLootOwners[address] || []).slice(0, 5);
    const lootBalance = Math.min(ethLootBalances[address], 5) || 0;

    const mirrorBags = (mirrorLootOwners[address] || []).slice(0, 5);
    const mirrorBalance = Math.min(mirrorLootBalances[address], 5) || 0;

    if (lootBags && !mirrorBags) {
      addressesToUpdate.push(address);
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
      addressesToUpdate.push(address);
      console.log(`${address}: missing ${bagsMissingFromMirror} bags`);
    }

    if (bagsIncorrectlyInMirror) {
      addressesToUpdate.push(address);
      console.log(
        `${address}: found ${bagsIncorrectlyInMirror} incorrect bags`
      );
    }

    if (lootBalance !== mirrorBalance) {
      addressesToUpdate.push(address);
      console.log(
        `${address}: loot balance ${lootBalance}, mirror balance: ${mirrorBalance}`
      );
    }
  });

  Object.keys(mirrorLootOwners).forEach((address) => {
    const lootBags = (ethLootOwners[address] || []).slice(0, 5);
    const lootBalance = Math.min(ethLootBalances[address], 5) || 0;

    const mirrorBags = (mirrorLootOwners[address] || []).slice(0, 5);
    const mirrorBalance = Math.min(mirrorLootBalances[address], 5) || 0;

    if (mirrorBags && !lootBags) {
      addressesToUpdate.push(address);
      console.log(`${address}: found bags for non-owner`);
    }

    if (lootBalance !== mirrorBalance) {
      addressesToUpdate.push(address);
      console.log(
        `${address}: loot balance ${lootBalance}, mirror balance: ${mirrorBalance}`
      );
    }
  });

  /*
   * Send healing transaction
   */
  const uniqueAddresses = uniq(addressesToUpdate);

  console.log(`found ${uniqueAddresses.length} addresses to update`);

  const ownerUpdates = uniqueAddresses
    .map((address) => ({
      owner: address,
      /*
       * Max 5 bags mirrored per address for now
       * Some owners have 600+ bags (=lots of gas), could be attempted for V2
       */
      tokenIds: (ethLootOwners[address] || []).slice(0, 5),
    }))
    // could be 100s of updates, let's send 100 and pick up the rest next time
    .slice(0, 100);

  console.log(`prepared ${ownerUpdates.length} owner updates`);

  sendOwnerUpdates(polygonProvider, ownerUpdates);
};

run();
