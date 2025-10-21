import { createItem, deleteItem, getItems } from "~/utils/backend";
import type { Route } from "./+types/home";
import { Form, redirect } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Refract" }];
}

export async function loader() {
  const items = await getItems();
  return { items };
}

const pageActions = {
  createItem: "CREATE_ITEM",
  deleteItem: "DELETE_ITEM",
};

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const action = formData.get("_action");

  switch (action) {
    case pageActions.createItem: {
      const text = formData.get("text");
      if (!text || typeof text !== "string") {
        return { error: "Text is required" };
      }
      await createItem(text);
      return { success: true };
    }
    case pageActions.deleteItem: {
      const itemId = formData.get("itemId");
      if (!itemId || typeof itemId !== "string") {
        return { error: "Item ID is required" };
      }
      await deleteItem(itemId);
      return { success: true };
    }
    default: {
      console.error("Invalid action", action);
      return { error: "Invalid action" };
    }
  }
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { items } = loaderData;

  return (
    <div>
      {items.map((item) => (
        <Form key={item.item_id} method="post" className="m-2">
          <p key={item.item_id}>{item.text}</p>
          <input type="hidden" name="itemId" value={item.item_id} />
          <button
            type="submit"
            name="_action"
            value={pageActions.deleteItem}
            className="bg-red-500 text-white rounded-md p-2"
          >
            Delete
          </button>
        </Form>
      ))}

      <Form method="post" className="m-2">
        <input
          type="text"
          name="text"
          className="border-2 border-gray-300 rounded-md p-2"
        />
        <button
          type="submit"
          name="_action"
          value={pageActions.createItem}
          className="bg-blue-500 text-white rounded-md p-2"
        >
          Add Item
        </button>
      </Form>
    </div>
  );
}
