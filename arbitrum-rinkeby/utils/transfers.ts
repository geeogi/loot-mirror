import { Contract, ethers } from "ethers";
import { LOOT_ADDRESS } from "./constants";

export const recentLootTransfers = (
  ethProvider: ethers.providers.JsonRpcProvider
) => {
  const lootContract = new Contract(
    LOOT_ADDRESS,
    [
      [
        "event Transfer",
        "(",
        "address indexed from,",
        "address indexed to,",
        "uint256 indexed tokenId",
        ")",
      ].join(""),
    ],
    ethProvider
  );

  const transferEventFilter = {
    ...lootContract.filters.Transfer(),
    // from 3000 blocks ago (approx. 12 hours)
    fromBlock: ethProvider.getBlockNumber().then((b) => b - 3000),
    toBlock: "latest",
  };

  return ethProvider.getLogs(transferEventFilter);
};

export const findAddressesInTransferLogs = (logs: ethers.providers.Log[]) => {
  return logs
    .flatMap((log) => [log.topics[1], log.topics[2]])
    .map((bytes) => `0x${bytes.toLowerCase().slice(26)}`);
};
