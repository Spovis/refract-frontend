
const BACKEND_URL = "http://127.0.0.1:5002";

export const getItems = async (): Promise<
  { item_id: number; translations: { language_id: number; text: string }[] }[]
> => {
  const response = await fetch(`${BACKEND_URL}/items`);
  return response.json();
};

export const getItem = async (item_id: string | number): Promise<any> => {
  const response = await fetch(`${BACKEND_URL}/items/${item_id}`);
  if (!response.ok) throw new Error(`Item ${item_id} not found`);
  return response.json();
};

export const createItem = async (
  text: string
): Promise<{ string_id: string }> => {
  const response = await fetch(`${BACKEND_URL}/item`, {
    method: "POST",
    body: JSON.stringify({ text }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.json();
};

export const deleteItem = async (item_id: string): Promise<void> => {
  const response = await fetch(`${BACKEND_URL}/items/${item_id}`, {
    method: "DELETE",
  });
  return response.json();
};

export const getAvailableLanguages = async (): Promise<
  { language_id: string; code: string; name: string }[]
> => {
  const response = await fetch(`${BACKEND_URL}/languages`);
  return response.json();
};

export const putTranslation = async (
  item_id: string,
  language_id: string,
  text: string
): Promise<void> => {
  await fetch(`${BACKEND_URL}/translation`, {
    method: "PUT",
    body: JSON.stringify({ item_id, language_id, text }),
    headers: {
      "Content-Type": "application/json",
    },
  });
};
