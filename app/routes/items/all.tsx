import {
  redirectDocument,
  useLoaderData,
  useSearchParams,
} from 'react-router';
import { useMemo, useState } from 'react';
import {
  getItems,
  getAvailableLanguages,
  getUserPreferences,
  getAuthStatus,
  GOOGLE_AUTH_URL,
} from '~/utils/backend';
import { Input } from '~/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import Button from '~/src/general/Button';
import { Header } from '~/components/ui/header/header';

const ENGLISH_ID = 1;

type Translation = { language_id: number; text: string; approved: boolean };
type Item = { item_id: number; translations: Translation[] };
type Language = { language_id: string; code: string; name: string };

export async function loader({ request }: { request: Request }) {
  const authStatus = await getAuthStatus(request);
  if (!authStatus.ok) {
    throw redirectDocument(GOOGLE_AUTH_URL);
  }

  const [items, availableLanguages, userPreferences] = await Promise.all([
    getItems(request),
    getAvailableLanguages(request),
    getUserPreferences(request).catch(() => ({ preferred_language_id: ENGLISH_ID })), // fallback to English if error
  ]);
  return {
    items: Array.isArray(items) ? items : [],
    availableLanguages: availableLanguages ?? [],
    userPreferences,
  };
}

function getText(item: Item, languageId: number): string | undefined {
  return item.translations.find((t) => t.language_id === languageId)?.text;
}

function getApprovalStatus(item: Item, languageId: number): boolean {
  return item.translations.find((t) => t.language_id === languageId)?.approved ?? false;
}

function matchesSearch(item: Item, query: string, langId: number): boolean {
  if (!query.trim()) return true;
  const text = getText(item, langId) ?? '';
  return text.toLowerCase().includes(query.toLowerCase());
}

export default function AllItems() {
  const { items, availableLanguages, userPreferences } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const requestedLanguageId = searchParams.get('lang');
  const defaultLanguageId =
    availableLanguages.find(
      (language: Language) =>
        String(language.language_id) ===
        String(userPreferences?.preferred_language_id)
    )?.language_id ??
    availableLanguages[0]?.language_id ??
    '';
  const initialLanguageId =
    availableLanguages.find(
      (language: Language) =>
        String(language.language_id) === String(requestedLanguageId)
    )?.language_id ?? defaultLanguageId;
  const [languageId, setLanguageId] = useState<string>(
    () => String(initialLanguageId)
  );
  const [showSources, setShowSources] = useState(
    () => searchParams.get('sources') === '1'
  );

  const langIdNum = parseInt(languageId, 10) || 0;
  const filtered = useMemo(
    () => items.filter((item: Item) => matchesSearch(item, query, langIdNum)),
    [items, query, langIdNum]
  );

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const handleLangChange = (v: string) => {
    setLanguageId(v);
    updateParam('lang', v);
  };

  const handleSourcesToggle = () => {
    const next = !showSources;
    setShowSources(next);
    updateParam('sources', next ? '1' : '');
  };

  return (
    <div className="flex flex-col h-screen bg-[#F9F9F9]">
      <Header />
      <div className="flex flex-col w-full max-w-7xl mx-auto">
        {/* Toolbar */}
        <div className="flex flex-wrap items-start gap-4 p-4">
        <div className="flex flex-col gap-2 min-w-[200px] max-w-[360px]">
          <Input
            type="search"
            placeholder="Search here"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="rounded-full px-4 bg-white"
          />
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground self-center">
              Language
            </label>
            <Select value={languageId} onValueChange={handleLangChange}>
              <SelectTrigger className="w-[280px] max-w-full bg-white">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {availableLanguages.map((lang: Language) => (
                  <SelectItem
                    key={lang.language_id}
                    value={String(lang.language_id)}
                  >
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={handleSourcesToggle}
            className="bg-salmon text-white font-semibold hover:bg-salmon/90 cursor-pointer rounded-full"
          >
            Show sources
          </Button>
        </div>
      </div>

      {/* Cards grid */}
      <div className="flex-1 max-h-[calc(100vh-195px)] overflow-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl">
          {filtered.map((item: Item) => {
            const targetText = getText(item, langIdNum);
            const englishText = getText(item, ENGLISH_ID);
            const targetApproved = getApprovalStatus(item, langIdNum);
            const englishApproved = getApprovalStatus(item, ENGLISH_ID);
            return (
              <div
                key={item.item_id}
                className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm"
              >
                {showSources ? (
                  <div className="space-y-3">
                    {langIdNum === ENGLISH_ID ? (
                      englishText != null && (
                        <div className="flex items-start gap-2">
                          {englishApproved ? (
                            <div className="mt-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          ) : (
                            <div className="mt-0.5 w-4 h-4 bg-gray-400 rounded-full"></div>
                          )}
                          <div className="flex-1">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              English
                            </p>
                            <p className="text-sm">{englishText}</p>
                          </div>
                        </div>
                      )
                    ) : (
                      <>
                        {englishText != null && (
                          <div className="flex items-start gap-2">
                            {!!englishApproved && (
                              <div className="mt-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                English
                              </p>
                              <p className="text-sm">{englishText}</p>
                            </div>
                          </div>
                        )}
                        {targetText != null && (
                          <div className="flex items-start gap-2">
                            {targetApproved ? (
                              <div className="mt-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            ) : (
                              <div className="mt-0.5 w-4 h-4 bg-gray-400 rounded-full"></div>
                            )}
                            <div className="flex-1">
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                {availableLanguages.find(
                                  (l: Language) =>
                                    String(l.language_id) === String(langIdNum)
                                )?.name ?? 'Translation'}
                              </p>
                              <p className="text-sm">{targetText}</p>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    {!englishText && !targetText && (
                      <p className="text-sm text-muted-foreground">
                        No translation
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    {targetApproved ? (
                      <div className="mt-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="mt-0.5 w-4 h-4 bg-gray-400 rounded-full"></div>
                    )}
                    <p className="text-sm flex-1">
                      {targetText ?? (
                        <span className="text-muted-foreground">
                          No translation
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <p className="text-muted-foreground text-sm py-8">
            No strings match your search.
          </p>
        )}
      </div>
    </div>
  </div>
  );
}
