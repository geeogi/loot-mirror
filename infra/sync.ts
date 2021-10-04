import { TransactionResponse } from "@ethersproject/abstract-provider";
import { ContractCallContext, Multicall } from "ethereum-multicall";
import { Contract, ethers } from "ethers";

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
 * Fetch the addresses involved in recent Loot transfers
 */
const lootContract = new Contract(
  "0xff9c1b15b16263c61d017ee9f65c50e4ae0113d7",
  [
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  ],
  ethProvider
);

const transferEventFilter = {
  ...lootContract.filters.Transfer(),
  // Sync from 25000 blocks ago (approx. 12 hours)
  fromBlock: ethProvider.getBlockNumber().then((b) => b - 25000),
  toBlock: "latest",
};

ethProvider.getLogs(transferEventFilter).then((logs) => {
  const recentTransferAddresses = logs
    .flatMap((log) => [log.topics[1], log.topics[2]])
    .map((bytes) => `0x${bytes.toLowerCase().slice(26)}`);

  /*
   * LootMirror
   *
   * https://polygonscan.com/address/0xd09B6fBaCE8c284B2A6633c74163E2520f585acF
   */
  const lootMirrorContractAddress =
    "0xd09B6fBaCE8c284B2A6633c74163E2520f585acF";

  const lootMirrorAbi = [
    "function setLootOwners(tuple(address owner, uint256[] tokenIds)[] _ownerUpdates)",
  ];

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
          ...LOOT_IDS.map((id) => ({
            reference: id.toString(),
            methodName: "ownerOf",
            methodParameters: [id],
          })),
        ],
      },
    ];

    /*
     * Fetch all the Loot token owners in a multicall
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
      };

      /*
       * Send owner updates to the LootMirror for addresses
       * that have been involved in recent transfers
       */
      const ownerUpdates = Object.entries(lootMirror)
        .map((entry) => ({
          owner: entry[0],
          // Max of 5 tokenIds per owner
          tokenIds: entry[1].slice(0, 5),
        }))
        .filter((update) =>
          recentTransferAddresses.includes(
            update.owner.toString().toLowerCase()
          )
        );

      console.log(`sending ${ownerUpdates.length} owner updates`);

      lootMirrorContractWithSigner
        .setLootOwners(ownerUpdates, options)
        .then((tx: TransactionResponse) => {
          console.log(`tx sent: ${tx.hash}`);

          tx.wait()
            .then((receipt) => {
              console.log(`status: ${receipt.status}`);
            })
            .catch((e: any) => {
              console.log(e);
              throw new Error(e);
            });
        })
        .catch((e: any) => {
          console.log(e);
          throw new Error(e);
        });
    });
  });
});
