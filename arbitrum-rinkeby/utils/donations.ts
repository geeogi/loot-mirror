import fetch from "node-fetch";

const base = "https://api-testnet.arbiscan.io/api";
const lootMirrorController = "0xac490f011cfa4676b64beca052f92a868b8827a9";

/*
 * Fetch the addresses which have made a donation to the controller.
 *
 * A donation counts as a request to be sync'd.
 *
 * We can improve this later by checking the donation amount and
 * checking the timestamp of the donation.
 */
export const fetchRecentDonationAddresses = async () => {
  const url = `${base}?module=account&action=txlist&address=${lootMirrorController}&startblock=6000000&endblock=9999999999&sort=asc&apikey=YourApiKeyToken`;

  const response = await fetch(url);
  const json = (await response.json()) as { result: { from: string }[] };
  return json.result?.map((tx) => tx.from);
};
