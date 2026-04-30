import { redirect, redirectDocument } from 'react-router';
import type { LoaderArgs } from '~/routes/+types';
import { getAuthStatus, getItems, GOOGLE_AUTH_URL } from '~/utils/backend';

//show first item when loading
export async function loader({ request }: { request: Request }): Promise<LoaderArgs | Response> {
  const authStatus = await getAuthStatus(request);
  if (!authStatus.ok) {
    throw redirectDocument(GOOGLE_AUTH_URL);
  }

  const items = await getItems(request);
  if (items && items.length > 0) {
    return redirect(`/items/${items[0].item_id}`);
  }
  return { items: [] };
}

export default function Home() {
  return <p>Select a string from the left panel, or add one.</p>;
}
