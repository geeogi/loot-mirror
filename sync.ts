import { TransactionResponse } from "@ethersproject/abstract-provider";
import { Multicall } from "ethereum-multicall";
import { ethers } from "ethers";
import * as fs from "fs";
import { chunk } from "lodash";
import {
  PRIVATE_KEY,
  POLYGON_RPC_ENDPOINT,
  LOOT_MIRROR_ADDRESS,
  LOOT_MIRROR_ABI,
  LOOT_IDS,
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
  const contract = new ethers.Contract(
    LOOT_MIRROR_ADDRESS,
    LOOT_MIRROR_ABI,
    polygonProvider
  );

  const wallet = new ethers.Wallet(PRIVATE_KEY, polygonProvider);
  const signer = contract.connect(wallet);

  console.log("fetching recent Loot transfers");
  const transferLogs = await recentLootTransfers(ethProvider);
  const recentTransferAddresses = findAddressesInTransferLogs(transferLogs);

  console.log("fetching Loot owners");
  const lootOwners = aggregateLootOwners(
    await Promise.all(
      chunk(LOOT_IDS, 1000).map((thisChunk) =>
        getOwnersForLootIds(ethMulticall, thisChunk)
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

  /*
   * write update to local file for debugging purposes
   */
  if (!process.env.CI) {
    fs.writeFile(
      `./output/ownerUpdates-${Date.now()}.json`,
      JSON.stringify(ownerUpdates, null, 2),
      "utf8",
      () => {}
    );
  }

  if (ownerUpdates.length > 0) {
    console.log("sending tx to LootMirror");

    const options = {
      gasLimit: 10000000,
      gasPrice: ethers.utils.parseUnits("10.0", "gwei"),
    };

    signer
      .setLootOwners(ownerUpdates, options)
      .then((tx: TransactionResponse) => {
        console.log(`tx sent: ${tx.hash}`);

        tx.wait()
          .then((receipt) => {
            console.log(`status: ${receipt.status}`);
          })
          .catch((e: any) => {
            console.log(e);
            throw new Error(e);
          });
      })
      .catch((e: any) => {
        console.log(e);
        throw new Error(e);
      });
  }
};

run();
