import { ContractCallContext, Multicall } from "ethereum-multicall";

export const getOwnersForLootIds = async (
  ethMulticall: Multicall,
  lootIds: number[]
) => {
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

  const results = await ethMulticall.call(lootContractCallContext);

  const lootOwners: { [address: string]: number[] } = {};

  results.results.Loot.callsReturnContext.forEach((result) => {
    const address = result.returnValues[0];
    const ownedId = Number(result.reference);

    lootOwners[address] = lootOwners[address]
      ? [...lootOwners[address], ownedId]
      : [ownedId];
  });

  return lootOwners;
};

export const aggregateLootOwners = (
  lootOwnersList: { [address: string]: number[] }[]
) => {
  const lootOwners: { [address: string]: number[] } = {};

  lootOwnersList.forEach((lootOwnersInstance) => {
    Object.entries(lootOwnersInstance).forEach((entry) => {
      const address = entry[0];
      const ownedIds = entry[1];

      lootOwners[address] = lootOwners[address]
        ? [...lootOwners[address], ...ownedIds]
        : [...ownedIds];
    });
  });

  return lootOwners;
};
