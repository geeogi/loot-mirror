# LootMirror

The [LootMirror](https://polygonscan.com/address/0xd09b6fbace8c284b2a6633c74163e2520f585acf#code) is an approach for bridging the Loot game to L2s. The mirror is an L2 contract that implements ERC-721 except the `ownerOf` method returns the L1 value of the main [Loot](https://etherscan.io/token/0xff9c1b15b16263c61d017ee9f65c50e4ae0113d7#readContract) contract and the transfer methods are disabled. The Loot component methods (e.g. `getWeapon`) are available.

The owner state will be updated regularly to reflect L1 transfers of Loot. At the moment the update can only be performed by the owner of the LootMirror contract.

> LootMirror is ready to trial, but it's a work in progress and some of the owner data could be inaccurate

## How it works

LootMirror enables L1 Loot owners to play games with their bags on L2. You could build a game for Loot on L2 and use the LootMirror to fetch bag attributes and authorise players, leveraging the Loot component data and existing Loot owner community. The scores of the game can be associated with the bag id in which case new Loot owners would inherit the score of their bags. Any existing ERC-721 compatible L2 game could be played by Loot owners via the LootMirror.

The LootMirror automatically mirrors L1 owner data on L2 without any action required from the user. The L1 Loot doesn't need to be locked or staked.

## Contract

The [LootMirror](https://polygonscan.com/address/0xd09b6fbace8c284b2a6633c74163e2520f585acf#code) is currently deployed on Polygon.

## Cron

A cron job at `infra/sync.ts` is used to sync the LootMirror to reflect recent L1 transfers. This job will run periodically via GitHub actions (in progress).

## Future

The LootMirror currently relies on centralised infrastructure to run the cron job and update the owner state. Ideally there would be a decentralised / community owned solution.

## Credit

Built from conversations with [sammybauch](https://twitter.com/sammybauch), ZKTruth.eth and Peter Watts in the Loot builders discord.
