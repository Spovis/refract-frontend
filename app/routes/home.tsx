import {
  createItem,
  deleteItem,
  getAvailableLanguages,
  getItems,
  putTranslation,
} from "~/utils/backend";
import type { Route } from "./+types/home.tsx";
import { Form } from "react-router";
import ItemRow from "~/src/ItemRow.js";
import Button from "~/src/general/Button.js";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Refract" }];
}

export async function loader() {
  const items = await getItems();
  const availableLanguages = await getAvailableLanguages();
  return { items, availableLanguages };
}

export const homePageActions = {
  createItem: "CREATE_ITEM",
  saveTranslation: "SAVE_TRANSLATION",
  deleteItem: "DELETE_ITEM",
};

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const action = formData.get("_action");

  switch (action) {
    case homePageActions.createItem: {
      const text = formData.get("text");
      if (!text || typeof text !== "string") {
        return { error: "Text is required" };
      }
      await createItem(text);
      return { success: true };
    }
    case homePageActions.deleteItem: {
      const itemId = formData.get("itemId");
      if (!itemId || typeof itemId !== "string") {
        return { error: "Item ID is required" };
      }
      await deleteItem(itemId);
      return { success: true };
    }
    case homePageActions.saveTranslation: {
      const itemId = formData.get("itemId");
      if (!itemId || typeof itemId !== "string") {
        return { error: "Item ID is required" };
      }
      const languageId = formData.get("language");
      if (!languageId || typeof languageId !== "string") {
        return { error: "Language ID is required" };
      }
      const translation = formData.get("translation");
      if (!translation || typeof translation !== "string") {
        return { error: "Translation is required" };
      }
      await putTranslation(itemId, languageId, translation);
      return { success: true };
    }
    default: {
      console.error("Invalid action", action);
      return { error: "Invalid action" };
    }
  }
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { items, availableLanguages } = loaderData;

  return (
    <div>
      <div className="grid grid-cols-10 font-bold mt-5">
        <div className="col-span-1"></div>
        <div className="col-span-3">English</div>
        <div className="col-span-5">Translation</div>
        <div className="col-span-1"></div>
      </div>
      {items.map(
        (item: {
          item_id: number;
          translations: { language_id: number; text: string }[];
        }) => (
          <ItemRow
            key={item.item_id}
            item={item}
            availableLanguages={availableLanguages}
          />
        )
      )}

      <Form method="post" className="m-2">
        <input
          type="text"
          name="text"
          className="border-2 border-gray-300 rounded-md p-2"
        />
        <Button
          type="submit"
          name="_action"
          value={homePageActions.createItem}
          color="blue"
        >
          Add Item
        </Button>
      </Form>
    </div>
  );
}
