import { Outlet, NavLink, Form, useLoaderData } from "react-router";
import type { LoaderArgs, ActionArgs } from "~/routes/+types";
import { getItems, createItem, queueTranslations } from "~/utils/backend";
import Button from "~/src/general/Button";

export async function loader(): Promise<LoaderArgs> {
  const items = await getItems();
  return { items };
}

export default function Layout() {
  const { items } = useLoaderData<typeof loader>();

  return (
    <div className="flex h-screen">
      {/* Left panel */}
      <aside className="w-72 border-r p-4 flex flex-col">
        <h2 className="font-bold text-sm text-gray-500 mb-4">Strings</h2>

        <div className="flex-1 space-y-1 overflow-auto">
          {items.map(item => (
            <NavLink
              key={item.item_id}
              to={`items/${item.item_id}`} // relative path
              className={({ isActive }) =>
                `block rounded px-2 py-1 text-sm ${isActive ? "bg-blue-600 text-white" : "hover:bg-gray-100"}`
              }
            >
              {item.translations?.[0]?.text ?? "Untitled"}
            </NavLink>
          ))}
        </div>

        {/* Add new string */}
        <Form method="post" action="/" className="mt-4">
          <input
            type="text"
            name="text"
            placeholder="New string"
            className="w-full border rounded p-2 mb-2"
          />
          <Button type="submit" name="_action" value="add-item">
            Add Item
          </Button>
        </Form>

        {/* queue translations */}
        <Form method="post" action="/" className="mt-4">
          <Button type="submit" name="_action" value="queue-translations" className="w-full">
            Queue Translations
          </Button>
        </Form>
      </aside>

      {/* Right panel */}
      <main className="flex-1 p-6 overflow-auto">
        <Outlet /> {/* Renders selected string editor */}
      </main>
    </div>
  );
}
