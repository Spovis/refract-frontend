// We can change this to the production backend URL when we deploy
const BACKEND_URL = "http://localhost:5123";

export const getStrings = async (): Promise<
  { string_id: string; text: string }[]
> => {
  const response = await fetch(`${BACKEND_URL}/strings`);
  return response.json();
};

export const createString = async (
  text: string
): Promise<{ string_id: string }> => {
  const response = await fetch(`${BACKEND_URL}/string`, {
    method: "POST",
    body: JSON.stringify({ text }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.json();
};

export const deleteString = async (string_id: string): Promise<void> => {
  const response = await fetch(`${BACKEND_URL}/string/${string_id}`, {
    method: "DELETE",
  });
  return response.json();
};
