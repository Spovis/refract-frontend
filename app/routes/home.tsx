import { redirect, redirectDocument } from 'react-router';
import type { LoaderArgs } from '~/routes/+types';
import {
  getAuthStatus,
  getAvailableLanguages,
  getItems,
  getUserPreferences,
  GOOGLE_AUTH_URL,
} from '~/utils/backend';

const ALL_LANGUAGES = 'all';

//show first item when loading
export async function loader({ request }: { request: Request }): Promise<LoaderArgs | Response> {
  const authStatus = await getAuthStatus(request);
  if (!authStatus.ok) {
    throw redirectDocument(GOOGLE_AUTH_URL);
  }

  const searchParams = new URL(request.url).searchParams;
  const showApproved =
    searchParams.get('view') === 'approved' ||
    searchParams.get('showAll') === 'true';
  const [items, availableLanguages, userPreferences] = await Promise.all([
    getItems(request),
    getAvailableLanguages(request),
    getUserPreferences(request).catch(() => ({ preferred_language_id: 1 })),
  ]);
  const visibleLanguageIds = availableLanguages
    .map((language) => Number(language.language_id))
    .filter((languageId) => languageId && languageId !== 1);
  const requestedLang = searchParams.get('lang');
  const preferredLang = String(userPreferences.preferred_language_id);
  const selectedLang =
    visibleLanguageIds.includes(Number(requestedLang))
      ? requestedLang ?? ''
      : visibleLanguageIds.includes(Number(preferredLang))
        ? preferredLang
        : ALL_LANGUAGES;

  const firstItem = items?.find((item) => {
    const hasTranslation = (languageId: number, approved: boolean) => {
      const translation = item.translations.find(
        (itemTranslation) => itemTranslation.language_id === languageId
      );
      return approved ? !!translation?.approved : !translation?.approved;
    };

    if (selectedLang === ALL_LANGUAGES) {
      return visibleLanguageIds.some((languageId) =>
        hasTranslation(languageId, showApproved)
      );
    }

    return hasTranslation(Number(selectedLang), showApproved);
  });

  if (firstItem) {
    const params = new URLSearchParams();
    if (showApproved) params.set('view', 'approved');
    if (selectedLang !== ALL_LANGUAGES) params.set('lang', selectedLang);
    const queryString = params.toString();

    return redirect(
      `/items/${firstItem.item_id}${queryString ? `?${queryString}` : ''}`
    );
  }
  return { items: [] };
}

export default function Home() {
  return <p>Select a string from the left panel, or add one.</p>;
}
