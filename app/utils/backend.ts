// We can change this to the production backend URL when we deploy
const BACKEND_URL = "http://localhost:5123";

export const getItems = async (): Promise<
  { item_id: string; text: string }[]
> => {
  const response = await fetch(`${BACKEND_URL}/items`);
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
  const response = await fetch(`${BACKEND_URL}/item/${item_id}`, {
    method: "DELETE",
  });
  return response.json();
};
