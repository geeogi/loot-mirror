# Loot Mirror

The Loot Mirror is an experimental approach for building on top of Loot on L2s. The contract implements ERC-721 except the `ownerOf` method returns the L1 value of the main [Loot](https://etherscan.io/token/0xff9c1b15b16263c61d017ee9f65c50e4ae0113d7#readContract) contract and the transfer methods are disabled. The Loot component methods (e.g. `getWeapon`) are available.

The owner state can be updated regularly to reflect L1 transfers of Loot. At the moment the update can only be performed by the owner of the LootMirror contract (currently centralised infrastructure).

## Example

build a game on L2 that can be played by L1 loot owners. Scores of the game could be associated with the bag id. New loot owners would inherit the score of their bags.

## Contract

The [LootMirror]("https://polygonscan.com/address/0xd09b6fbace8c284b2a6633c74163e2520f585acf#code") is currently deployed on Polygon.
