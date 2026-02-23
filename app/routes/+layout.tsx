import { Outlet, NavLink, Form, useLoaderData, redirect } from "react-router";
import { useEffect, useState } from "react";
import type { LoaderArgs, ActionArgs } from "~/routes/+types";
import { getItems, createItem, queueTranslations, importFromSource, BACKEND_URL } from "~/utils/backend";
import Button from "~/src/general/Button";
import { Header } from "~/components/ui/header/header";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}from "~/components/ui/select";


import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

export async function loader(): Promise<LoaderArgs> {
  try {
    const items = await getItems();
    return { items: Array.isArray(items) ? items : [] };
  } catch (err) {
    return { items: [] };
  }
}

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const actionType = formData.get("_action");

  if (actionType === "add-item") {
    const text = formData.get("text");
    if (!text || typeof text !== "string") return { error: "Text is required" };
    try {
      const result = await createItem(text);
      if (result?.item_id) return redirect(`items/${result.item_id}`);
      return { error: "Failed to create item" };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return { error: `Create item failed: ${message}` };
    }
  }

  if (actionType === "queue-translations") {
    try {
      await queueTranslations();
      await new Promise(resolve => setTimeout(resolve, 3000));
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return { error: `Queue translations failed: ${message}` };
    }
  }

  if (actionType === "import-from-source") {
    try {
      await importFromSource();
      await new Promise(resolve => setTimeout(resolve, 3000));
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return { error: `Import from source failed: ${message}` };
    }
  }

  return null;
}


export default function Layout() {
  const { items } = useLoaderData<typeof loader>();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [lang, setLang] = useState("all");


  useEffect(() => {
    // Check auth status on mount; if unauthorized, redirect to backend Google OAuth
    const authBase = BACKEND_URL || "/api";
    const statusUrl = authBase + "/auth/status";
    fetch(statusUrl, { method: "GET", credentials: "include" })
      .then(res => {
        if (res.status === 401) {
          // redirect browser to backend OAuth start (proxied via /api in dev)
          window.location.href = authBase + "/auth/google";
          return;
        }
        setCheckingAuth(false);
      })
      .catch(() => {
        window.location.href = authBase + "/auth/google";
      });
  }, []);
  "use client"

  return (
    <div className="flex flex-col h-screen">
    {/* Header on top */}
    <Header />
        <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <aside className="w-72 border-r p-4 flex flex-col">
          {checkingAuth && (
            <div className="mb-2 text-xs text-gray-500">Checking authentication...</div>
          )}
          <h2 className="font-bold text-sm text-gray-500 mb-4">Strings</h2>
          <div className="flex-1 space-y-1 overflow-auto">
            {items.map(item => (
              <NavLink
                key={item.item_id}
                to={`items/${item.item_id}`} // relative path
                className={({ isActive }) =>
                  `block rounded px-2 py-1 text-sm ${isActive ? "bg-blue-600 text-white" : "hover:bg-gray-100"}`
                }
              >
                {item.translations?.[0]?.text ?? "Untitled"}
              </NavLink>
            ))}
          </div>
    <div className="flex h-screen">
      {/* Left panel */}
      <aside className="w-72 border-r p-4 flex flex-col">
        {checkingAuth && (
          <div className="mb-2 text-xs text-gray-500">Checking authentication...</div>
        )}
        <h2 className="font-bold text-sm text-gray-500 mb-4">Strings</h2>
        <h3 className="text-xs font-medium text-gray-500 mb-2">Language</h3>

        <Select value={lang} onValueChange={setLang}>
  <SelectTrigger className="w-full mb-4">
    <SelectValue placeholder="Select language" />
  </SelectTrigger>

  <SelectContent>
  <SelectItem value="all">All Languages</SelectItem>

  {/* English */}
  <SelectItem value="en-US">🇺🇸 English (US)</SelectItem>
  <SelectItem value="en-GB">🇬🇧 English (UK)</SelectItem>

  {/* Spanish */}
  <SelectItem value="es-ES">🇪🇸 Spanish (Spain)</SelectItem>
  <SelectItem value="es-MX">🇲🇽 Spanish (Mexico)</SelectItem>

  {/* French */}
  <SelectItem value="fr-FR">🇫🇷 French (France)</SelectItem>
  <SelectItem value="fr-CA">🇨🇦 French (Canada)</SelectItem>

  {/* German */}
  <SelectItem value="de-DE">🇩🇪 German (Germany)</SelectItem>
  <SelectItem value="de-AT">🇦🇹 German (Austria)</SelectItem>

  {/* Chinese */}
  <SelectItem value="zh-CN">🇨🇳 Chinese (Simplified)</SelectItem>
  <SelectItem value="zh-TW">🇹🇼 Chinese (Traditional)</SelectItem>

  {/* Japanese */}
  <SelectItem value="ja-JP">🇯🇵 Japanese</SelectItem>

  {/* Korean */}
  <SelectItem value="ko-KR">🇰🇷 Korean</SelectItem>
</SelectContent>
</Select>

<div className="flex-1 space-y-1 overflow-auto"></div>
        <div className="flex-1 space-y-1 overflow-auto">
          {items.map(item => (
            <NavLink
              key={item.item_id}
              to={`items/${item.item_id}`} // relative path
              className={({ isActive }) =>
                `block rounded px-2 py-1 text-sm ${isActive ? "bg-blue-600 text-white" : "hover:bg-gray-100"}`
              }
            >
              {item.translations?.[0]?.text ?? "Untitled"}
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

        {/* queue translations */}
        <Form method="post" className="mt-4">
          <Button type="submit" name="_action" value="queue-translations" className="w-full">
            Queue Translations
          </Button>
        </Form>

        {/* import from source */}
        <Form method="post" className="mt-4">
          <Button type="submit" name="_action" value="import-from-source" className="w-full">
            Import From Source
          </Button>
        </Form>
      </aside>

      {/* Right panel */}
      <main className="flex-1 p-6 overflow-auto">
      <Outlet context={{ lang }} /> {/* Renders selected string editor */}
      </main>
    </div>
  );
}
