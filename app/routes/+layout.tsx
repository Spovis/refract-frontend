import { Outlet, NavLink, Form, useLoaderData, redirect } from 'react-router';
import { useEffect, useState } from 'react';
import type { ActionArgs } from '~/routes/+types';
import {
  getItems,
  getAvailableLanguages,
  createItem,
  queueTranslations,
  importFromSource,
  BACKEND_URL,
} from '~/utils/backend';
import Button from '~/src/general/Button';
import { Header } from '~/components/ui/header/header';
import { Input } from '~/components/ui/input';

export async function loader() {
  try {
    const items = await getItems();
    const languages = await getAvailableLanguages();
    return {
      items: Array.isArray(items) ? items : [],
      languages: Array.isArray(languages) ? languages : [],
    };
  } catch {
    return { items: [], languages: [] };
  }
}

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const actionType = formData.get('_action');

  if (actionType === 'add-item') {
    const text = formData.get('text');
    if (!text || typeof text !== 'string') return { error: 'Text is required' };
    try {
      const result = await createItem(text);
      if (result?.item_id) return redirect(`items/${result.item_id}`);
      return { error: 'Failed to create item' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { error: `Create item failed: ${message}` };
    }
  }

  if (actionType === 'queue-translations') {
    try {
      await queueTranslations();
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { error: `Queue translations failed: ${message}` };
    }
  }

  if (actionType === 'import-from-source') {
    try {
      await importFromSource();
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { error: `Import from source failed: ${message}` };
    }
  }

  return null;
}

export default function Layout() {
  const { items, languages } = useLoaderData<typeof loader>();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [lang, setLangState] = useState('all');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setLangState(params.get('lang') ?? 'all');
  }, []);
  
  const setLang = (value: string) => {
    setLangState(value);
    window.location.href = `${window.location.pathname}?lang=${value}`;
  };

  useEffect(() => {
      // Check auth status on mount; if unauthorized, redirect to backend Google OAuth
    const authBase = BACKEND_URL || '/api';
    const statusUrl = authBase + '/auth/status';
    fetch(statusUrl, { method: 'GET', credentials: 'include' })
      .then((res) => {
        if (res.status === 401) {
           // redirect browser to backend OAuth start (proxied via /api in dev)
          window.location.href = authBase + '/auth/google';
        
          return;
        }
        setCheckingAuth(false);
      })
      .catch(() => {
        window.location.href = authBase + '/auth/google';
      });
  }, []);

  return (
    <div className="flex flex-col h-screen">
        {/* Header */}
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 border-r p-4 flex flex-col">
          {checkingAuth && (
            <div className="mb-2 text-xs text-gray-500">
              Checking authentication...
            </div>
          )}
          <h2 className="font-bold text-sm text-gray-500 mb-4">Strings</h2>
          {/* Language Selector */}
          <h3 className="text-xs font-medium text-gray-500 mb-2">Language</h3>
          <div className="text-xs text-gray-500 mb-2">languages: {languages.length}</div>

          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="w-full mb-4 border rounded px-2 py-2"
          >
            <option value="all">All Languages</option>
            {languages.map((l: any) => (
              <option key={l.language_id} value={String(l.language_id)}>
                {l.name} ({l.code})
              </option>
            ))}
          </select>

          <div className="flex-1 space-y-1 overflow-auto">
            {items.map((item) => (
              <NavLink
                key={item.item_id}
                to={`items/${item.item_id}?lang=${lang}`}
                className={({ isActive }) =>
                  `block rounded px-2 py-1 text-sm ${
                    isActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'
                  }`
                }
              >
                {item.translations?.[0]?.text ?? 'Untitled'}
              </NavLink>
            ))}
          </div>

          {/* Add new string */}
          <Form method="post" className="mt-4">
            <Input
              type="text"
              name="text"
              placeholder="New string"
              className="w-full border rounded p-2 mb-2"
            />
            <Button type="submit" name="_action" value="add-item">
              Add Item
            </Button>
          </Form>
          
          {/* Queue translations */}
          <Form method="post" className="mt-4">
            <Button
              type="submit"
              name="_action"
              value="queue-translations"
              className="w-full"
            >
              Queue Translations
            </Button>
          </Form>
          
          {/* Import from source */}
          <Form method="post" className="mt-4">
            <Button
              type="submit"
              name="_action"
              value="import-from-source"
              className="w-full"
            >
              Import From Source
            </Button>
          </Form>
        </aside>


         {/* Right panel */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet context={{ lang }} />
        </main>
      </div>
    </div>
  );
}