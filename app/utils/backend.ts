// In development the Vite dev server proxies API requests so use same-origin paths.
// For server-side (SSR) we fall back to an absolute backend URL.
export const BACKEND_URL = '';
export const BACKEND_ORIGIN = BACKEND_URL || 'http://localhost:5002';
// Relative so SSR 302s land on the user's origin (nginx proxies /auth to Flask).
export const GOOGLE_AUTH_URL = '/auth/google';

// Use /api prefix in browser; for SSR (node) fall back to absolute backend URL
const BASE =
  BACKEND_URL ||
  (typeof window === 'undefined' ? `${BACKEND_ORIGIN}/api` : '/api');

const getRequestHeaders = (request?: Request): HeadersInit | undefined => {
  const cookie = request?.headers.get('cookie');
  return cookie ? { cookie } : undefined;
};

const assertResponseOk = async (response: Response, action: string) => {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${action} failed: ${response.statusText} - ${text}`);
  }
};

export const getAuthStatus = async (request?: Request): Promise<Response> => {
  return fetch(`${BACKEND_ORIGIN}/auth/status`, {
    credentials: 'include',
    headers: getRequestHeaders(request),
  });
};

export const getItems = async (request?: Request): Promise<
  { item_id: number; translations: { language_id: number; text: string; translation_id: number; approved: boolean }[] }[]
> => {
  const response = await fetch(
    `${BASE}/items`.replace(/\/api\/api/, '/api/items'),
    { credentials: 'include', headers: getRequestHeaders(request) }
  );
  return response.json();
};

export const createItem = async (
  text: string,
  request?: Request
): Promise<{ item_id: number }> => {
  const response = await fetch(
    `${BASE}/items`.replace(/\/api\/api/, '/api/items'),
    {
      method: 'POST',
      body: JSON.stringify({ text }),
      headers: {
        'Content-Type': 'application/json',
        ...getRequestHeaders(request),
      },
      credentials: 'include',
    }
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to create item: ${response.statusText} - ${text}`);
  }
  return response.json();
};

export const deleteItem = async (item_id: string, request?: Request): Promise<void> => {
  const response = await fetch(
    `${BASE}/items/${item_id}`.replace(/\/api\/api/, '/api/items/${item_id}'),
    {
      method: 'DELETE',
      credentials: 'include',
      headers: getRequestHeaders(request),
    }
  );
  await assertResponseOk(response, 'Delete item');
};

export const getAvailableLanguages = async (request?: Request): Promise<
  { language_id: string; code: string; name: string }[]
> => {
  const response = await fetch(
    `${BASE}/languages`.replace(/\/api\/api/, '/api/languages'),
    { credentials: 'include', headers: getRequestHeaders(request) }
  );
  return response.json();
};

export const putTranslation = async (
  item_id: string,
  language_id: string,
  text: string,
  request?: Request
): Promise<void> => {
  const response = await fetch(`${BASE}/translation`.replace(/\/api\/api/, '/api/translation'), {
    method: 'PUT',
    body: JSON.stringify({ item_id, language_id, text }),
    headers: {
      'Content-Type': 'application/json',
      ...getRequestHeaders(request),
    },
    credentials: 'include',
  });
  await assertResponseOk(response, 'Save translation');
};

export const queueTranslations = async (item_id?: string, request?: Request): Promise<void> => {
  const response = await fetch(
    `${BASE}/translation/queue`.replace(/\/api\/api/, '/api/translation/queue'),
    {
      method: 'POST',
      body: JSON.stringify({ item_id }),
      headers: {
        'Content-Type': 'application/json',
        ...getRequestHeaders(request),
      },
      credentials: 'include',
    }
  );
  await assertResponseOk(response, 'Queue translations');
};

export const importFromSource = async (request?: Request): Promise<void> => {
  const response = await fetch(`${BASE}/import`.replace(/\/api\/api/, '/api/import'), {
    method: 'POST',
    body: JSON.stringify({}),
    headers: {
      'Content-Type': 'application/json',
      ...getRequestHeaders(request),
    },
    credentials: 'include',
  });
  await assertResponseOk(response, 'Import from source');
}

export const approveTranslation = async (translation_id: string, request?: Request): Promise<void> => {
  const response = await fetch(`${BASE}/translations/approve/${translation_id}`.replace(/\/api\/api/, "/api/translations/approve/${translation_id}"), {
    method: "PUT",
    credentials: "include",
    headers: getRequestHeaders(request),
  });
  await assertResponseOk(response, 'Approve translation');
}

export const searchStrings = async (
  query: string,
  language_ids: string[]
): Promise<
  { item_id: number; translations: { language_id: number; text: string }[] }[]
> => {
  const params = new URLSearchParams();
  params.set('query', query);
  params.set('language_ids', language_ids.join(','));
  const response = await fetch(
    `${BASE}/search?${params.toString()}`.replace(/\/api\/api/, '/api/search')
  );
  return response.json();
};

export const getUserPreferences = async (request?: Request): Promise<{ preferred_language_id: number }> => {
  const response = await fetch(
    `${BASE}/user/preferences`.replace(/\/api\/api/, '/api/user/preferences'),
    { credentials: 'include', headers: getRequestHeaders(request) }
  );
  if (!response.ok) {
    throw new Error(`Failed to get user preferences: ${response.statusText}`);
  }
  return response.json();
};

export const updateUserPreferences = async (preferred_language_id: number, request?: Request): Promise<void> => {
  const response = await fetch(
    `${BASE}/user/preferences`.replace(/\/api\/api/, '/api/user/preferences'),
    {
      method: 'PUT',
      body: JSON.stringify({ preferred_language_id }),
      headers: {
        'Content-Type': 'application/json',
        ...getRequestHeaders(request),
      },
      credentials: 'include',
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to update user preferences: ${response.statusText}`);
  }
};
