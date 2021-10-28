import fetch from "node-fetch";

export const fetchRecentDonationAddresses = async () => {
  const url =
    "https://api-testnet.arbiscan.io/api?module=account&action=txlist&address=0xac490f011cfa4676b64beca052f92a868b8827a9&startblock=6000000&endblock=9999999999&sort=asc&apikey=YourApiKeyToken";

  const response = await fetch(url);
  const json = await response.json();
  const addresses = json.result?.map((tx: { from: string }) => tx.from);
  console.log(addresses);
};
