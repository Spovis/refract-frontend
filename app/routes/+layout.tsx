import {
  Outlet,
  NavLink,
  Form,
  useLocation,
  useLoaderData,
  useNavigate,
  redirect,
  redirectDocument,
} from 'react-router';
import KeyIcon from '~/src/KeyIcon.svg';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ActionArgs } from '~/routes/+types';
import {
  getItems,
  getAvailableLanguages,
  getUserPreferences,
  createItem,
  queueTranslations,
  importFromSource,
  getAuthStatus,
  GOOGLE_AUTH_URL,
} from '~/utils/backend';
import Button from '~/src/general/Button';
import { Header } from '~/components/ui/header/header';
import { Input } from '~/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '~/components/ui/dropdown-menu';

const ALL_LANGUAGES = 'all';

type LayoutItem = {
  item_id: number;
  translations: {
    language_id: number;
    text: string;
    translation_id: number;
    approved: boolean;
  }[];
};

type LayoutLanguage = {
  language_id: string;
  code: string;
  name: string;
};

type LayoutLoaderData = {
  items: LayoutItem[];
  availableLanguages: LayoutLanguage[];
  preferredLanguageId: string;
};

export async function loader({
  request,
}: {
  request: Request;
}): Promise<LayoutLoaderData> {
  const authStatus = await getAuthStatus(request);
  if (!authStatus.ok) {
    throw redirectDocument(GOOGLE_AUTH_URL);
  }

  try {
    const [items, availableLanguages, userPreferences] = await Promise.all([
      getItems(request),
      getAvailableLanguages(request),
      getUserPreferences(request).catch(() => ({ preferred_language_id: 1 })),
    ]);

    return {
      items: Array.isArray(items) ? items : [],
      availableLanguages: Array.isArray(availableLanguages)
        ? availableLanguages.map((language) => ({
            ...language,
            language_id: String(language.language_id),
          }))
        : [],
      preferredLanguageId: String(userPreferences.preferred_language_id),
    };
  } catch {
    return { items: [], availableLanguages: [], preferredLanguageId: '1' };
  }
}

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const actionType = formData.get('_action');

  if (actionType === 'add-item') {
    const text = formData.get('text');
    if (!text || typeof text !== 'string') return { error: 'Text is required' };
    try {
      const result = await createItem(text, request);
      if (result?.item_id) return redirect(`items/${result.item_id}`);
      return { error: 'Failed to create item' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { error: `Create item failed: ${message}` };
    }
  }

  if (actionType === 'queue-translations') {
    try {
      await queueTranslations(undefined, request);
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { error: `Queue translations failed: ${message}` };
    }
  }

  if (actionType === 'import-from-source') {
    try {
      await importFromSource(request);
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { error: `Import from source failed: ${message}` };
    }
  }

  return null;
}

function ListItem({ item, isActive }: { item: LayoutItem, isActive: boolean }) {
  return (
    <div className="flex gap-2">
      {isActive && (<img src={KeyIcon} alt="Key" className="w-5 h-5" />)}
      <p>{item.translations?.[0]?.text ?? 'Untitled'}</p>
    </div>
  );
}

export default function Layout() {
  const { items, availableLanguages, preferredLanguageId } =
    useLoaderData<typeof loader>();
  const location = useLocation();
  const navigate = useNavigate();
  const initialLanguage = availableLanguages.some(
    (language) => language.language_id === preferredLanguageId
  )
    ? preferredLanguageId
    : ALL_LANGUAGES;
  const initialShowOnlyUnapproved = !(
    new URLSearchParams(location.search).get('view') === 'approved' ||
    new URLSearchParams(location.search).get('showAll') === 'true'
  );
  const [lang, setLang] = useState(initialLanguage);
  const [showOnlyUnapproved, setShowOnlyUnapproved] = useState(
    initialShowOnlyUnapproved
  );
  const previousFilteredItemIds = useRef<number[]>([]);

  const syncCurrentItemFilters = useCallback(
    (nextLang: string, nextShowOnlyUnapproved: boolean) => {
      if (!location.pathname.startsWith('/items/')) return;
      if (location.pathname === '/items/all') return;

      const params = new URLSearchParams(location.search);
      if (nextLang === ALL_LANGUAGES) {
        params.delete('lang');
      } else {
        params.set('lang', nextLang);
      }

      params.delete('showAll');
      if (nextShowOnlyUnapproved) {
        params.delete('view');
      } else {
        params.set('view', 'approved');
      }

      const queryString = params.toString();
      navigate(`${location.pathname}${queryString ? `?${queryString}` : ''}`, {
        replace: true,
      });
    },
    [location.pathname, location.search, navigate]
  );

  const handleLanguageChange = (nextLang: string) => {
    setLang(nextLang);
    syncCurrentItemFilters(nextLang, showOnlyUnapproved);
  };

  const handleApprovalFilterChange = (nextShowOnlyUnapproved: boolean) => {
    setShowOnlyUnapproved(nextShowOnlyUnapproved);
    syncCurrentItemFilters(lang, nextShowOnlyUnapproved);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setShowOnlyUnapproved(
      !(params.get('view') === 'approved' || params.get('showAll') === 'true')
    );
  }, [location.search]);

  useEffect(() => {
    const handlePreferredLanguageUpdate = (event: Event) => {
      const nextPreferredLanguageId = (event as CustomEvent<string>).detail;
      if (
        availableLanguages.some(
          (language) => language.language_id === nextPreferredLanguageId
        )
      ) {
        setLang(nextPreferredLanguageId);
        syncCurrentItemFilters(nextPreferredLanguageId, showOnlyUnapproved);
      }
    };

    window.addEventListener(
      'preferred-language-updated',
      handlePreferredLanguageUpdate
    );
    return () => {
      window.removeEventListener(
        'preferred-language-updated',
        handlePreferredLanguageUpdate
      );
    };
  }, [availableLanguages, showOnlyUnapproved, syncCurrentItemFilters]);

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const hasUnapprovedLanguage = (languageId: number) => {
          if (languageId === 1) return false;
          const translation = item.translations.find(
            (t) => t.language_id === languageId
          );
          return !translation || !translation.approved;
        };
        const hasApprovedLanguage = (languageId: number) => {
          if (languageId === 1) return false;
          const translation = item.translations.find(
            (t) => t.language_id === languageId
          );
          return !!translation?.approved;
        };

        if (lang === ALL_LANGUAGES) {
          const nonEnglishLanguageIds = availableLanguages
            .map((language) => Number(language.language_id))
            .filter((languageId) => languageId && languageId !== 1);

          if (showOnlyUnapproved) {
            if (nonEnglishLanguageIds.length === 0) {
              return item.translations.some(
                (translation) =>
                  translation.language_id !== 1 && !translation.approved
              );
            }

            return nonEnglishLanguageIds.some(hasUnapprovedLanguage);
          }

          if (nonEnglishLanguageIds.length === 0) {
            return item.translations.some(
              (translation) =>
                translation.language_id !== 1 && translation.approved
            );
          }

          return nonEnglishLanguageIds.some(hasApprovedLanguage);
        }

        const selectedLangId = Number(lang);
        if (!selectedLangId) return true;

        if (showOnlyUnapproved) {
          return hasUnapprovedLanguage(selectedLangId);
        }

        return hasApprovedLanguage(selectedLangId);
      }),
    [availableLanguages, items, lang, showOnlyUnapproved]
  );

  const filteredItemIds = useMemo(
    () => filteredItems.map((item) => item.item_id),
    [filteredItems]
  );

  const currentItemId = useMemo(() => {
    const match = location.pathname.match(/^\/items\/(\d+)$/);
    return match ? Number(match[1]) : null;
  }, [location.pathname]);

  const buildItemUrl = useCallback(
    (itemId: number) => {
      const params = new URLSearchParams();
      if (lang !== ALL_LANGUAGES) params.set('lang', lang);
      if (!showOnlyUnapproved) params.set('view', 'approved');

      const queryString = params.toString();
      return `/items/${itemId}${queryString ? `?${queryString}` : ''}`;
    },
    [lang, showOnlyUnapproved]
  );

  useEffect(() => {
    const previousIds = previousFilteredItemIds.current;
    const isVisible =
      currentItemId !== null && filteredItemIds.includes(currentItemId);

    if (currentItemId !== null && !isVisible) {
      const previousIndex = previousIds.indexOf(currentItemId);
      const nextItemId =
        filteredItemIds[previousIndex] ??
        filteredItemIds[previousIndex - 1] ??
        null;

      if (nextItemId !== null) {
        navigate(buildItemUrl(nextItemId), { replace: true });
      } else {
        navigate(showOnlyUnapproved ? '/' : '/?view=approved', {
          replace: true,
        });
      }
    }

    previousFilteredItemIds.current = filteredItemIds;
  }, [
    buildItemUrl,
    currentItemId,
    filteredItemIds,
    navigate,
    showOnlyUnapproved,
  ]);

  return (
    <div className="flex flex-col h-screen">
      <Header />

      <div className="py-4 w-full bg-[#F9F9F9] border-b">
        <div className="flex gap-1 items-start w-full max-w-7xl mx-auto pl-4">
          <button
            onClick={() => handleApprovalFilterChange(true)}
            className={`flex w-fit px-3 py-2 text-xs rounded-full transition-colors cursor-pointer ${
              showOnlyUnapproved
                ? 'bg-salmon text-white font-semibold'
                : 'bg-[#E0E0E0] hover:bg-lightgray'
            }`}
          >
            New Keys
          </button>
          <button
            onClick={() => handleApprovalFilterChange(false)}
            className={`flex w-fit px-3 py-2 text-xs rounded-full transition-colors cursor-pointer ${
              !showOnlyUnapproved
                ? 'bg-salmon text-white font-semibold'
                : 'bg-[#E0E0E0] hover:bg-lightgray'
            }`}
          >
            Approved Keys
          </button>
        </div>
      </div>

      <div className="bg-[#F9F9F9] w-full">
        <div className="w-full max-w-7xl flex flex-1 overflow-hidden mx-auto">
          <aside className="w-1/3 max-w-[460px] p-4 flex flex-col">
            <div className="flex-1 space-y-3 max-h-[calc(100vh-226px)] overflow-auto pr-4">
              {filteredItems.map((item) => (
                <NavLink
                  key={item.item_id}
                  to={buildItemUrl(item.item_id)}
                  className={({ isActive }) =>
                    `block rounded p-4 text-sm ${
                      isActive ? 'text-black border border-lightgray bg-white' : 'bg-[#F5F5F5] border-1 border-lightgray text-gray-600 hover:bg-[#E6E6E6]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <ListItem key={item.item_id} item={item} isActive={isActive} />
                  )}
                </NavLink>
              ))}
              {filteredItems.length === 0 && (
                <p className="px-2 py-1 text-sm text-gray-500">
                  No strings to show.
                </p>
              )}
            </div>

            <DropdownMenu>
              <div className="flex items-start p-2">
                <DropdownMenuTrigger>
                  <p className="px-4 py-2 bg-lightgray rounded-full cursor-pointer text-xs text-gray-600">More Actions</p>
                </DropdownMenuTrigger>
              </div>
              <DropdownMenuContent side="top">
                <div className="w-full bg-white p-4">

                <Select value={lang} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-full mt-4">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value={ALL_LANGUAGES}>All Languages</SelectItem>
                    {availableLanguages.map((language) => (
                      <SelectItem
                        key={language.language_id}
                        value={language.language_id}
                      >
                        {language.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Form method="post" action="/" className="mt-4">
                  <Input
                    type="text"
                    name="text"
                    placeholder="New string"
                    className="w-full border rounded p-2 mb-2"
                  />
                  <Button type="submit" name="_action" value="add-item" className="w-full">
                    Add Item
                  </Button>
                </Form>

                <Form method="post" action="/" className="mt-4">
                  <Button
                    type="submit"
                    name="_action"
                    value="queue-translations"
                    className="w-full"
                  >
                    Queue Translations
                  </Button>
                </Form>

                <Form method="post" action="/" className="mt-4">
                  <Button
                    type="submit"
                    name="_action"
                    value="import-from-source"
                    className="w-full"
                  >
                    Import From Source
                  </Button>
                </Form>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </aside>
          <main className="flex-1 p-4 overflow-auto">
            <Outlet context={{ lang }} />
          </main>
        </div>
      </div>
    </div>
  );
}
