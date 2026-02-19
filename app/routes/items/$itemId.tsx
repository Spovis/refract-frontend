import { Form, useLoaderData, useParams } from "react-router";
import type { ActionArgs } from "~/routes/+types";
import {
  getItems,
  getAvailableLanguages,
  putTranslation,
  deleteItem,
} from "~/utils/backend";
import Button from "~/src/general/Button";

//fetch all items and all languages we allow
export async function loader() {
  const items = await getItems();
  const availableLanguages = await getAvailableLanguages();
  return { items, availableLanguages };
}

//save translation or delete
export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const _action = formData.get("_action");
  const itemId = formData.get("itemId") as string;

  if (!_action || !itemId) return { error: "Invalid form submission" };

  switch (_action) {
    case "SAVE_TRANSLATION": {
      const languageId = formData.get("language") as string;
      const translation = formData.get("translation") as string;
      if (!languageId || !translation) return { error: "Missing data" };
      await putTranslation(itemId, languageId, translation);
      return { success: true };
    }
    case "DELETE_ITEM": {
      await deleteItem(itemId);
      return { success: true };
    }
    default:
      return { error: "Unknown action" };
  }
}

export default function ItemEditor() {
  const { items, availableLanguages } = useLoaderData<typeof loader>();
  const { itemId } = useParams();

  const item = items.find(i => i.item_id.toString() === itemId);
  if (!item) return <p>Item not found.</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">
        Editing: {item.translations?.[0]?.text ?? "Untitled"}
      </h1>

      {/* Render translations for each language */}
      {availableLanguages.map(lang => {
        const translation = item.translations.find(
          t => t.language_id === lang.language_id
        )?.text;
        return (
          <Form method="post" key={`${item.item_id}-${lang.language_id}`} className="flex items-center gap-2">
            <input type="hidden" name="itemId" value={item.item_id} />
            <input type="hidden" name="language" value={lang.language_id} />
            <a>{lang.name}</a>
            <input
              type="text"
              name="translation"
              defaultValue={translation}
              placeholder={`Enter translation..`}
              className="border p-2 rounded flex-1"
            />
            <Button type="submit" name="_action" value="SAVE_TRANSLATION" color="green">
              Save
            </Button>
          </Form>
        );
      })}

      {/* Delete item */}
      <Form method="post">
        <input type="hidden" name="itemId" value={item.item_id} />
        <Button type="submit" name="_action" value="DELETE_ITEM" color="red">
          Delete Item
        </Button>
      </Form>
    </div>
  );
}




