import { ContractCallContext, Multicall } from "ethereum-multicall";
import { TransactionResponse } from "@ethersproject/abstract-provider";
import { ethers } from "ethers";
import { chunk } from "lodash";

const POLYGON_RPC_ENDPOINT = "https://polygon-rpc.com";
const PRIVATE_KEY = process.env.LOOT_BRIDGE_PRIVATE_KEY;

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

/*
 * LootMirror
 *
 * https://polygonscan.com/address/0xd09B6fBaCE8c284B2A6633c74163E2520f585acF
 */
const lootMirrorContractAddress = "0xd09B6fBaCE8c284B2A6633c74163E2520f585acF";

const lootMirrorAbi = [
  "function setLootOwners(tuple(address owner, uint256[] tokenIds)[] _ownerUpdates)",
];

/*
 * Send owner updates for all token IDs to seed the contract state
 */
const LOOT_IDS = Array(7777)
  .fill(null)
  .map((_, index) => index + 1);

polygonProvider.ready.then(() => {
  const lootMirrorContract = new ethers.Contract(
    lootMirrorContractAddress,
    lootMirrorAbi,
    polygonProvider
  );

  const polygonWallet = new ethers.Wallet(PRIVATE_KEY, polygonProvider);
  const lootMirrorContractWithSigner =
    lootMirrorContract.connect(polygonWallet);

  chunk(LOOT_IDS, 100).map((lootIds, chunkIndex) => {
    const lootContractCallContext: ContractCallContext[] = [
      {
        reference: "Loot",
        contractAddress: "0xFF9C1b15B16263C61d017ee9F65C50e4AE0113D7",
        abi: [
          {
            inputs: [
              { internalType: "uint256", name: "tokenId", type: "uint256" },
            ],
            name: "ownerOf",
            outputs: [{ internalType: "address", name: "", type: "address" }],
            stateMutability: "view",
            type: "function",
          },
        ],
        calls: [
          ...lootIds.map((id) => ({
            reference: id.toString(),
            methodName: "ownerOf",
            methodParameters: [id],
          })),
        ],
      },
    ];

    /*
     * Fetch all the token owners in a multicall
     */
    ethMulticall.call(lootContractCallContext).then((results) => {
      const lootMirror: { [address: string]: number[] } = {};

      results.results.Loot.callsReturnContext.forEach((result) => {
        const address = result.returnValues[0];
        const ownedId = Number(result.reference);

        lootMirror[address] = lootMirror[address]
          ? [...lootMirror[address], ownedId]
          : [ownedId];
      });

      const options = {
        gasLimit: 10000000,
        gasPrice: ethers.utils.parseUnits("5.0", "gwei"),
        nonce: chunkIndex,
      };

      const ownerUpdates = Object.entries(lootMirror).map((entry) => ({
        owner: entry[0],
        tokenIds: entry[1],
      }));

      const chunkName = `${lootIds[0]}-${lootIds[lootIds.length - 1]}`;

      /*
       * Send owner updates to the LootMirror
       */
      lootMirrorContractWithSigner
        .setLootOwners(ownerUpdates, options)
        .then((tx: TransactionResponse) => {
          console.log(`tx sent: ${chunkName}: ${tx.hash}`);

          tx.wait()
            .then((receipt) => {
              console.log(`status: ${chunkName}: ${receipt.status}`);
            })
            .catch(() => {
              console.log(`error: ${chunkName}`);
            });
        })
        .catch(() => {
          console.log(`error: ${chunkName}`);
        });
    });
  });
});
