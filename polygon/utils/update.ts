import { TransactionResponse } from "@ethersproject/abstract-provider";
import { ethers } from "ethers";
import * as fs from "fs";
import { LOOT_MIRROR_ABI, LOOT_MIRROR_ADDRESS, PRIVATE_KEY } from "./constants";

export const sendOwnerUpdates = (
  polygonProvider: ethers.providers.JsonRpcProvider,
  ownerUpdates: { owner: string; tokenIds: number[] }[]
) => {
  const contract = new ethers.Contract(
    LOOT_MIRROR_ADDRESS,
    LOOT_MIRROR_ABI,
    polygonProvider
  );

  const wallet = new ethers.Wallet(PRIVATE_KEY, polygonProvider);
  const signer = contract.connect(wallet);

  if (!process.env.CI) {
    fs.writeFile(
      `./output/ownerUpdates-${Date.now()}.json`,
      JSON.stringify(ownerUpdates, null, 2),
      "utf8",
      () => {}
    );
  }

  if (process.env.CI) {
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
  }
};
