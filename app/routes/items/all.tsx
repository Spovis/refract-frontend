import { useLoaderData } from 'react-router';
import type { LoaderArgs } from '~/routes/+types';
import { searchStrings } from '~/utils/backend';

export async function loader(): Promise<LoaderArgs> {
  const translations = await searchStrings('drill', ['1']);
  return { items: translations };
}

export default function AllItems() {
  const { items } = useLoaderData<typeof loader>();
  console.log(items);
  return <div className="flex flex-col"></div>;
}
