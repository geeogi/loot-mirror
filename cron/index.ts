import { ContractCallContext, Multicall } from "ethereum-multicall";
import { ethers } from "ethers";

const ethProvider = new ethers.providers.JsonRpcProvider(
  process.env.ETHEREUM_RPC_ENDPOINT
);

const ethMulticall = new Multicall({
  ethersProvider: ethProvider,
  tryAggregate: true,
});

const POLYGON_RPC_ENDPOINT = "https://polygon-rpc.com";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

/*
 * Aavegotchi diamond ABI
 *
 * https://polygonscan.com/address/0xfa7a3bb12848a7856dd2769cd763310096c053f1
 */
const abi = LOOT_OWNERS;

/*
 * Aavegotchi diamond instance
 *
 * https://polygonscan.com/address/0x86935F11C86623deC8a25696E1C19a8659CbF95d
 */
const contractAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";

const lootContractCallContext: ContractCallContext[] = [
  {
    reference: "Loot",
    contractAddress: "0xFF9C1b15B16263C61d017ee9F65C50e4AE0113D7",
    abi: [
      {
        inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
        name: "ownerOf",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function",
      },
    ],
    calls: [
      ...Array(100)
        .fill(null)
        .map((_, index) => ({
          reference: (index + 1).toString(),
          methodName: "ownerOf",
          methodParameters: [index + 1],
        })),
    ],
  },
];

ethMulticall.call(lootContractCallContext).then((results) => {
  const lootOwners: { [address: string]: number[] } = {};

  results.results.Loot.callsReturnContext.forEach((result) => {
    const address = result.returnValues[0];
    const ownedId = Number(result.reference);

    lootOwners[address] = lootOwners[address]
      ? [...lootOwners[address], ownedId]
      : [ownedId];
  });

  console.log(lootOwners);
});
