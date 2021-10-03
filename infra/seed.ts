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
 * https://polygonscan.com/address/0x546773aeea1eace2681ef477b4e1936a4bf927cd
 */
const lootMirrorContractAddress = "0x546773aeea1eace2681ef477b4e1936a4bf927cd";

const lootMirrorAbi = [
  "function setLootOwners(tuple(address owner, uint256[] tokenIds)[] _ownerUpdates)",
];

/*
 * Send owner updates for all token IDs to seed the contract state
 */
const LOOT_IDS = Array(7779)
  .fill(null)
  .map((_, index) => index + 1);

polygonProvider.ready.then(() => {
  const contract = new ethers.Contract(
    lootMirrorContractAddress,
    lootMirrorAbi,
    polygonProvider
  );

  const wallet = new ethers.Wallet(PRIVATE_KEY, polygonProvider);
  const contractWithSigner = contract.connect(wallet);

  chunk(LOOT_IDS, 100).map((lootIds) => {
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
        gasPrice: ethers.utils.parseUnits("6.0", "gwei"),
      };

      const ownerUpdates = Object.entries(lootMirror).map((entry) => ({
        owner: entry[0],
        tokenIds: entry[1],
      }));

      contractWithSigner
        .setLootOwners(ownerUpdates, options)
        .then((tx: TransactionResponse) => {
          console.log(`tx sent: ${tx.hash}`);

          tx.wait()
            .then((receipt) => {
              console.log(`status: ${receipt.status}`);
            })
            .catch(() => {
              console.log(
                `error: ${lootIds[0]}-${lootIds[lootIds.length - 1]}`
              );
            });
        })
        .catch(() => {
          console.log(`error: ${lootIds[0]}-${lootIds[lootIds.length - 1]}`);
        });
    });
  });
});
