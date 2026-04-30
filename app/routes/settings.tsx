import { useEffect, useState } from 'react';
import {
  Form,
  redirectDocument,
  useActionData,
  useLoaderData,
  useNavigation,
} from 'react-router';
import type { ActionArgs } from '~/routes/+types';
import {
  getAvailableLanguages,
  getAuthStatus,
  getUserPreferences,
  GOOGLE_AUTH_URL,
  updateUserPreferences,
} from '~/utils/backend';
import { Button } from '~/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';

interface Language {
  language_id: string;
  code: string;
  name: string;
}

const ENGLISH_ID = 1;

type SettingsActionData =
  | { ok: true; preferredLanguageId: string }
  | { ok: false; error: string };

export async function loader({ request }: { request: Request }) {
  const authStatus = await getAuthStatus(request);
  if (!authStatus.ok) {
    throw redirectDocument(GOOGLE_AUTH_URL);
  }

  const [languagesData, preferencesData] = await Promise.all([
    getAvailableLanguages(request),
    getUserPreferences(request).catch(() => ({
      preferred_language_id: ENGLISH_ID,
    })),
  ]);

  const languages: Language[] = languagesData.map((language) => ({
    ...language,
    language_id: String(language.language_id),
  }));

  const preferredLanguage = String(preferencesData.preferred_language_id);
  const preferredLanguageId =
    languages.find((language) => language.language_id === preferredLanguage)
      ?.language_id ??
    languages[0]?.language_id ??
    '';

  return { languages, preferredLanguageId };
}

export async function action({
  request,
}: ActionArgs): Promise<SettingsActionData> {
  const formData = await request.formData();
  const raw = formData.get('preferred_language_id');
  if (raw == null || typeof raw !== 'string' || raw.trim() === '') {
    return { ok: false, error: 'Language is required' };
  }
  const preferred_language_id = Number(raw);
  if (!Number.isFinite(preferred_language_id)) {
    return { ok: false, error: 'Invalid language' };
  }
  try {
    await updateUserPreferences(preferred_language_id, request);
    return { ok: true, preferredLanguageId: raw };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { ok: false, error: message };
  }
}

export default function Settings() {
  const { languages, preferredLanguageId: initialPreferredLanguageId } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [preferredLanguageId, setPreferredLanguageId] = useState(
    initialPreferredLanguageId
  );

  const saving =
    navigation.state === 'submitting' &&
    navigation.formData?.get('preferred_language_id') != null;

  useEffect(() => {
    if (actionData?.ok) {
      window.dispatchEvent(
        new CustomEvent('preferred-language-updated', {
          detail: actionData.preferredLanguageId,
        })
      );
    }
  }, [actionData]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <Form method="post" className="max-w-md">
        <input
          type="hidden"
          name="preferred_language_id"
          value={preferredLanguageId}
        />
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Preferred Language
          </label>
          <Select
            value={preferredLanguageId}
            onValueChange={setPreferredLanguageId}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Select a language" />
            </SelectTrigger>
            <SelectContent position="popper">
              {languages.map((language) => (
                <SelectItem
                  key={language.language_id}
                  value={language.language_id}
                >
                  {language.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-600 mt-1">
            This language will be automatically selected in filters throughout the app.
          </p>
        </div>

        <Button
          type="submit"
          disabled={saving || !preferredLanguageId}
          className="bg-salmon text-white font-semibold hover:bg-salmon/90 cursor-pointer rounded-full"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
        {actionData?.ok === true && (
          <p className="mt-3 text-sm text-green-700">Preferences saved.</p>
        )}
        {actionData?.ok === false && (
          <p className="mt-3 text-sm text-red-700">
            Preferences could not be saved: {actionData.error}
          </p>
        )}
      </Form>
    </div>
  );
}
