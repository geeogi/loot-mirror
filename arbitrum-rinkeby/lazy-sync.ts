import { Multicall } from "ethereum-multicall";
import { ethers } from "ethers";
import { chunk, uniq } from "lodash";
import {
  ARBITRUM_TESTNET_RPC_ENDPOINT,
  LOOT_ADDRESS,
  LOOT_IDS,
} from "./utils/constants";
import { fetchRecentDonationAddresses } from "./utils/donations";
import { aggregateLootOwners, getOwnersForLootIds } from "./utils/owners";
import { sendOwnerUpdates } from "./utils/update";

const arbitrumTestnetProvider = new ethers.providers.JsonRpcProvider(
  ARBITRUM_TESTNET_RPC_ENDPOINT
);

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

  // Find addresses that require update
  const donatingAddresses = await fetchRecentDonationAddresses();

  const uniqueAddresses = uniq(donatingAddresses).map((address) =>
    address.toLowerCase()
  );

  console.log(`found ${uniqueAddresses.length} addresses to update`);

  const addressMap = Object.keys(ethLootOwners).reduce((acc, curr) => {
    acc[curr.toLowerCase()] = curr;
    return acc;
  }, {} as { [key: string]: string });

  const ownerUpdates = uniqueAddresses
    .map((address) => ({
      owner: addressMap[address],
      /*
       * Max 5 bags mirrored per address for now
       * Some owners have 600+ bags (=lots of gas), could be attempted for V2
       */
      tokenIds: (ethLootOwners[addressMap[address]] || []).slice(0, 5),
    }))
    .filter((update) => update.tokenIds.length > 0)
    // could be 100s of updates, let's send 10 and pick up the rest next time
    .slice(0, 10);

  console.log(`prepared ${ownerUpdates.length} owner updates`);

  sendOwnerUpdates(arbitrumTestnetProvider, ownerUpdates);
};

run();
