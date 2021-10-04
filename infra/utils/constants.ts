export const POLYGON_RPC_ENDPOINT = "https://polygon-rpc.com";

export const PRIVATE_KEY = process.env.LOOT_BRIDGE_PRIVATE_KEY;

export const LOOT_MIRROR_ADDRESS = "0xd09B6fBaCE8c284B2A6633c74163E2520f585acF";

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
