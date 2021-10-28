"use strict";
exports.__esModule = true;
exports.LOOT_IDS = exports.LOOT_MIRROR_ABI = exports.LOOT_MIRROR_ADDRESS = exports.LOOT_ADDRESS = exports.PRIVATE_KEY = exports.POLYGON_RPC_ENDPOINT = void 0;
exports.POLYGON_RPC_ENDPOINT = "https://polygon-rpc.com";
exports.PRIVATE_KEY = process.env.LOOT_BRIDGE_PRIVATE_KEY;
exports.LOOT_ADDRESS = "0xFF9C1b15B16263C61d017ee9F65C50e4AE0113D7";
exports.LOOT_MIRROR_ADDRESS = "0xd09B6fBaCE8c284B2A6633c74163E2520f585acF";
exports.LOOT_MIRROR_ABI = [
    [
        "function setLootOwners",
        "(",
        "tuple(address owner, uint256[] tokenIds)[] _ownerUpdates",
        ")",
    ].join(""),
];
exports.LOOT_IDS = Array(7777)
    .fill(null)
    .map(function (_, index) { return index + 1; });
