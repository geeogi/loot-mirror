import { ContractCallContext, Multicall } from "ethereum-multicall";
import { BigNumber } from "ethers";

export const getBalancesForAddresses = async (
  ethMulticall: Multicall,
  addresses: string[],
  contractAddress: string
) => {
  const lootContractCallContext: ContractCallContext[] = [
    {
      reference: "Loot",
      contractAddress,
      abi: [
        {
          inputs: [{ internalType: "address", name: "owner", type: "address" }],
          name: "balanceOf",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function",
        },
      ],
      calls: [
        ...addresses.map((address) => ({
          reference: address.toString(),
          methodName: "balanceOf",
          methodParameters: [address],
        })),
      ],
    },
  ];

  const results = await ethMulticall.call(lootContractCallContext);

  const lootBalances: { [address: string]: number } = {};

  results.results.Loot.callsReturnContext.forEach((result) => {
    const balance = BigNumber.from(result.returnValues[0]).toNumber();
    const address = result.reference;
    lootBalances[address] = balance;
  });

  return lootBalances;
};

export const aggregateLootBalances = (
  lootBalancesList: { [address: string]: number }[]
) => {
  const lootBalances: { [address: string]: number } = {};

  lootBalancesList.forEach((lootBalancesInstance) => {
    Object.entries(lootBalancesInstance).forEach((entry) => {
      const address = entry[0];
      const balance = entry[1];
      lootBalances[address] = balance;
    });
  });

  return lootBalances;
};
