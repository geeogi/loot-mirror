import { Contract, ethers } from "ethers";

export const recentLootTransfers = (
  ethProvider: ethers.providers.JsonRpcProvider
) => {
  /*
   * Fetch recent Loot transfers
   */
  const lootContract = new Contract(
    "0xff9c1b15b16263c61d017ee9f65c50e4ae0113d7",
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
