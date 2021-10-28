export const ARBITRUM_TESTNET_RPC_ENDPOINT = "https://rinkeby.arbitrum.io/rpc";

export const PRIVATE_KEY = process.env.LOOT_BRIDGE_PRIVATE_KEY;

export const LOOT_ADDRESS = "0xFF9C1b15B16263C61d017ee9F65C50e4AE0113D7";

export const LOOT_MIRROR_ADDRESS = "0x3b624348fC06a8629E0107a8a409b83B6297C77B";

export const LOOT_MIRROR_ABI = [
  [
    "function setLootOwners",
    "(",
    "tuple(address owner, uint256[] tokenIds)[] _ownerUpdates",
    ")",
  ].join(""),
];

export const LOOT_IDS = Array(7777)
  .fill(null)
  .map((_, index) => index + 1);
