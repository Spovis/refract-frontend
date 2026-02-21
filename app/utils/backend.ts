// In development the Vite dev server proxies API requests so use same-origin paths.
// For server-side (SSR) we fall back to an absolute backend URL.
export const BACKEND_URL = "";

// Use /api prefix in browser; for SSR (node) fall back to absolute backend URL
const BASE = BACKEND_URL || (typeof window === "undefined" ? "http://localhost:5002/api" : "");

export const getItems = async (): Promise<
  { item_id: number; translations: { language_id: number; text: string }[] }[]
> => {
  const response = await fetch(`${BASE}/items`.replace(/\/api\/api/, "/api/items"), { credentials: "include" });
  return response.json();
};

export const createItem = async (
  text: string
): Promise<{ item_id: number }> => {
  const response = await fetch(`${BASE}/items`.replace(/\/api\/api/, "/api/items"), {
    method: "POST",
    body: JSON.stringify({ text }),
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to create item: ${response.statusText} - ${text}`);
  }
  return response.json();
};

export const deleteItem = async (item_id: string): Promise<void> => {
  const response = await fetch(`${BASE}/items/${item_id}`.replace(/\/api\/api/, "/api/items/${item_id}"), {
    method: "DELETE",
    credentials: "include",
  });
  return response.json();
};

export const getAvailableLanguages = async (): Promise<
  { language_id: string; code: string; name: string }[]
> => {
  const response = await fetch(`${BASE}/languages`.replace(/\/api\/api/, "/api/languages"), { credentials: "include" });
  return response.json();
};

export const putTranslation = async (
  item_id: string,
  language_id: string,
  text: string
): Promise<void> => {
  await fetch(`${BASE}/translation`.replace(/\/api\/api/, "/api/translation"), {
    method: "PUT",
    body: JSON.stringify({ item_id, language_id, text }),
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
};

export const queueTranslations = async (item_id?: string): Promise<void> => {
  await fetch(`${BASE}/translation/queue`.replace(/\/api\/api/, "/api/translation/queue"), {
    method: "POST",
    body: JSON.stringify({ item_id }),
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
}
