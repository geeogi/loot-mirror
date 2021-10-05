import { Multicall } from "ethereum-multicall";
import { sendOwnerUpdates } from "./utils/update";
import { ethers } from "ethers";
import { chunk } from "lodash";
import {
  LOOT_ADDRESS,
  LOOT_IDS,
  POLYGON_RPC_ENDPOINT,
} from "./utils/constants";
import { aggregateLootOwners, getOwnersForLootIds } from "./utils/owners";
import {
  findAddressesInTransferLogs,
  recentLootTransfers,
} from "./utils/transfers";

const polygonProvider = new ethers.providers.JsonRpcProvider(
  POLYGON_RPC_ENDPOINT
);

const ethProvider = new ethers.providers.JsonRpcProvider(
  process.env.ETHEREUM_RPC_ENDPOINT
);

const ethMulticall = new Multicall({
  ethersProvider: ethProvider,
  tryAggregate: true,
});

const run = async () => {
  console.log("fetching recent Loot transfers");
  const transferLogs = await recentLootTransfers(ethProvider);
  const recentTransferAddresses = findAddressesInTransferLogs(transferLogs);

  console.log("fetching Loot owners");
  const lootOwners = aggregateLootOwners(
    await Promise.all(
      chunk(LOOT_IDS, 1000).map((thisChunk) =>
        getOwnersForLootIds(ethMulticall, thisChunk, LOOT_ADDRESS)
      )
    )
  );

  /*
   * Send owner updates to the LootMirror for addresses
   * that have been involved in recent transfers
   */
  const ownerUpdates = Object.entries(lootOwners)
    .map((entry) => ({
      owner: entry[0],
      // Max 20 per owner (some users have 600+ bags, too much gas to handle)
      tokenIds: entry[1].slice(0, 20),
    }))
    .filter((update) =>
      recentTransferAddresses.includes(update.owner.toString().toLowerCase())
    );

  console.log(`prepared ${ownerUpdates.length} owner updates`);

  sendOwnerUpdates(polygonProvider, ownerUpdates);
};

run();
