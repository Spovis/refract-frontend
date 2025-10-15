import { createString, deleteString, getStrings } from "~/utils/backend";
import type { Route } from "./+types/home";
import { Form, redirect } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Refract" }];
}

export async function loader() {
  const strings = await getStrings();
  return { strings };
}

const pageActions = {
  createString: "CREATE_STRING",
  deleteString: "DELETE_STRING",
};

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const action = formData.get("_action");

  switch (action) {
    case pageActions.createString: {
      const text = formData.get("text");
      if (!text || typeof text !== "string") {
        return { error: "Text is required" };
      }
      await createString(text);
      return { success: true };
    }
    case pageActions.deleteString: {
      const stringId = formData.get("stringId");
      if (!stringId || typeof stringId !== "string") {
        return { error: "String ID is required" };
      }
      await deleteString(stringId);
      return { success: true };
    }
    default: {
      console.error("Invalid action", action);
      return { error: "Invalid action" };
    }
  }
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { strings } = loaderData;

  return (
    <div>
      {strings.map((string) => (
        <Form key={string.string_id} method="post" className="m-2">
          <p key={string.string_id}>{string.text}</p>
          <input type="hidden" name="stringId" value={string.string_id} />
          <button
            type="submit"
            name="_action"
            value={pageActions.deleteString}
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
          value={pageActions.createString}
          className="bg-blue-500 text-white rounded-md p-2"
        >
          Add String
        </button>
      </Form>
    </div>
  );
}
