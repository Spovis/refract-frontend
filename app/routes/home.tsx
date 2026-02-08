

import { redirect } from "react-router";
import type { LoaderArgs } from "~/routes/+types";
import { getItems } from "~/utils/backend";

//show first item when loading
export async function loader(): Promise<LoaderArgs | Response> {
  const items = await getItems();
  if (items && items.length > 0) {
    return redirect(`/items/${items[0].item_id}`);
  }
  return { items: [] };
}

export default function Home() {
  return <p>Select a string from the left panel, or add one.</p>;
}
