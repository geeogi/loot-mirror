# LootMirror

The [LootMirror](https://polygonscan.com/address/0xd09b6fbace8c284b2a6633c74163e2520f585acf#code) is an approach for bridging the Loot game to L2s (currently deployed to Polygon). The mirror is an L2 contract that implements ERC-721 except the `ownerOf` method returns the L1 value of the main [Loot](https://etherscan.io/token/0xff9c1b15b16263c61d017ee9f65c50e4ae0113d7#readContract) contract and the transfer methods are disabled. The Loot component methods (e.g. `getWeapon`) are available.

The owner state is updated regularly to reflect L1 transfers of Loot (see [actions](https://github.com/geeogi/loot-mirror/actions/workflows/cron-action.yml)). At the moment the update can only be performed by the owner of the LootMirror contract.

> LootMirror is ready to use on Polygon, but it's a work in progress and some of the owner data could be inaccurate. Currently, only 5 Loot bags per owner are guaranteed to be mirrored. LootMirror has also been deployed on Arbitrum using a lazier sync strategy.

## How it works

LootMirror enables L1 Loot owners to play games with their bags on L2. You could build a game for Loot on L2 and use the LootMirror to authorise players and fetch their bag attributes, leveraging the existing Loot owner community and L2 scalability. The scores of any L2 game can be associated with the bag id (new Loot owners would inherit the score of their bags). Any existing ERC-721 compatible L2 game could be played by Loot owners via the LootMirror.

The LootMirror automatically mirrors L1 owner data on L2 without any action required from the users. The L1 Loot doesn't need to be locked, bridged, or staked and is never at risk.

## Contract

The [LootMirror](https://polygonscan.com/address/0xd09b6fbace8c284b2a6633c74163e2520f585acf#code) is currently deployed on Polygon.

## Infra

The script `legacy/seed.ts` was used to seed the LootMirror with existing Loot owners. A cron job at `sanity.ts` is used to sync the LootMirror to reflect recent L1 transfers. This job runs approx every 3 hours via [GitHub actions](https://github.com/geeogi/loot-mirror/actions/workflows/cron-action.yml).

## Arbitrum deployment

The LootMirror has also been deployed on [Arbitrum](https://arbiscan.io/address/0x3b624348fc06a8629e0107a8a409b83b6297c77b#code). The gas cost of doing a full sync on Arbitrum would be pretty expensive (see estimates below) so the Arbitrum LootMirror will use a lazy syncing strategy (work in progress):

- The mirror will only sync addresses that request to be sync'd
- An address can request to be synced by donating 0.002 ETH to the mirror controller

This way we only mirror the users who are interested in playing the L2 game and their donation covers the TX costs (users only need to donate once, some users could donate more than others). The mirror cron script will watch the donation address to pick up new addresses and perform the sync.

### Gas estimates on Arbitrum

- Gas cost to deploy: [0.1695 ETH](https://arbiscan.io/tx/0x9dabaabd720890b221659634dbafd9326c9c64f477fa7cc8cb34e9701d281f0e)
- Gas cost to sync 10 owners: [0.0125 ETH](https://arbiscan.io/tx/0x4d53afbd52daa228801ee145bdfd120dff11e969d8316fb4dc6e1e61b0baf50e)
- Est. cost to sync 3000 owners: 3 ETH
- Est. cost to sync daily (100 transfers): 0.05 ETH

Gas costs quoted use the `setLootOwners` batch method for updating owners but using the "surgical" methods in the contract could be a bit cheaper.

## More Loot

At the moment the LootMirror is tracking the original Loot contract tokenIds (1-7779) but it could be extended to track the mLoot tokenIds also.

## Future

The LootMirror currently relies on centralised infrastructure to run the cron job and update the owner state. Ideally there would be a decentralised / community owned solution and the owner of the LootMirror contract can be changed when this is ready. At least, the cron job could run on the lootproject github using a private key controlled by the community.

## Credit

Built from conversations with [sammybauch](https://twitter.com/sammybauch), ZKTruth.eth and Peter Watts in the Loot builders discord.
