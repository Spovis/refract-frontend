import { useLoaderData, useSearchParams } from 'react-router';
import { useMemo, useState } from 'react';
import { getItems, getAvailableLanguages } from '~/utils/backend';
import { Input } from '~/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import Button from '~/src/general/Button';

const ENGLISH_ID = 1;

type Translation = { language_id: number; text: string };
type Item = { item_id: number; translations: Translation[] };
type Language = { language_id: string; code: string; name: string };

export async function loader() {
  const [items, availableLanguages] = await Promise.all([
    getItems(),
    getAvailableLanguages(),
  ]);
  return {
    items: Array.isArray(items) ? items : [],
    availableLanguages: availableLanguages ?? [],
  };
}

function getText(item: Item, languageId: number): string | undefined {
  return item.translations.find((t) => t.language_id === languageId)?.text;
}

function matchesSearch(item: Item, query: string, langId: number): boolean {
  if (!query.trim()) return true;
  const text = getText(item, langId) ?? '';
  return text.toLowerCase().includes(query.toLowerCase());
}

export default function AllItems() {
  const { items, availableLanguages } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [languageId, setLanguageId] = useState<string>(
    () => searchParams.get('lang') ?? String(availableLanguages[0]?.language_id ?? ENGLISH_ID)
  );
  const [showSources, setShowSources] = useState(
    () => searchParams.get('sources') === '1'
  );

  const langIdNum = parseInt(languageId, 10) || ENGLISH_ID;
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
    <div className="flex flex-col h-full bg-muted/30">
      {/* Toolbar */}
      <div className="flex flex-wrap items-start gap-4 p-4 border-b bg-background">
        <div className="flex flex-col gap-2 min-w-[200px] max-w-[360px]">
          <Input
            type="search"
            placeholder="Search here"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="rounded-full"
          />
          <div className="flex gap-2">
            <label className="text-xs text-muted-foreground self-center">
              Language
            </label>
            <Select value={languageId} onValueChange={handleLangChange}>
              <SelectTrigger className="w-[200px]">
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
            variant={showSources ? 'default' : 'outline'}
            onClick={handleSourcesToggle}
          >
            Show sources
          </Button>
        </div>
      </div>

      {/* Cards grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          {filtered.map((item: Item) => {
            const targetText = getText(item, langIdNum);
            const englishText = getText(item, ENGLISH_ID);
            return (
              <div
                key={item.item_id}
                className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm"
              >
                {showSources ? (
                  <div className="space-y-3">
                    {langIdNum === ENGLISH_ID ? (
                      englishText != null && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            English
                          </p>
                          <p className="text-sm">{englishText}</p>
                        </div>
                      )
                    ) : (
                      <>
                        {englishText != null && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              English
                            </p>
                            <p className="text-sm">{englishText}</p>
                          </div>
                        )}
                        {targetText != null && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              {availableLanguages.find(
                                (l: Language) =>
                                  String(l.language_id) === String(langIdNum)
                              )?.name ?? 'Translation'}
                            </p>
                            <p className="text-sm">{targetText}</p>
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
                  <p className="text-sm">
                    {targetText ?? (
                      <span className="text-muted-foreground">
                        No translation
                      </span>
                    )}
                  </p>
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
  );
}
