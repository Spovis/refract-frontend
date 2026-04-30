import { useEffect, useState } from 'react';
import { getAvailableLanguages, getUserPreferences, updateUserPreferences } from '../utils/backend';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

interface Language {
  language_id: string;
  code: string;
  name: string;
}

export default function Settings() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [preferredLanguageId, setPreferredLanguageId] = useState('1');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>(
    'idle'
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        const [languagesData, preferencesData] = await Promise.all([
          getAvailableLanguages(),
          getUserPreferences()
        ]);
        const visibleLanguages = languagesData.map((language) => ({
            ...language,
            language_id: String(language.language_id),
          })
        );
        const preferredLanguage = String(preferencesData.preferred_language_id);
        const selectedLanguage =
          visibleLanguages.find(
            (language) => language.language_id === preferredLanguage
          )?.language_id ??
          visibleLanguages[0]?.language_id ??
          '';

        setLanguages(visibleLanguages);
        setPreferredLanguageId(selectedLanguage);
      } catch (error) {
        console.error('Failed to load settings data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('idle');
    try {
      await updateUserPreferences(Number(preferredLanguageId));
      window.dispatchEvent(
        new CustomEvent('preferred-language-updated', {
          detail: preferredLanguageId,
        })
      );
      setSaveStatus('saved');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="max-w-md">
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

        <Button onClick={handleSave} disabled={saving || !preferredLanguageId} className="bg-salmon text-white font-semibold hover:bg-salmon/90 cursor-pointer rounded-full">
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
        {saveStatus === 'saved' && (
          <p className="mt-3 text-sm text-green-700">Preferences saved.</p>
        )}
        {saveStatus === 'error' && (
          <p className="mt-3 text-sm text-red-700">
            Preferences could not be saved.
          </p>
        )}
      </div>
    </div>
  );
}
