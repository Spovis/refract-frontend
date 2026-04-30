import {
  Form,
  redirectDocument,
  useActionData,
  useLoaderData,
  useParams,
  useSearchParams,
} from 'react-router';
import type { ActionArgs } from '~/routes/+types';
import {
  getItems,
  getAvailableLanguages,
  putTranslation,
  deleteItem,
  approveTranslation,
  getAuthStatus,
  GOOGLE_AUTH_URL,
} from "~/utils/backend";
import Button from "~/src/general/Button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { ButtonIcon} from "~/components/ui/buttons/arrow-button";

type ItemActionData =
  | {
      success: true;
      action: 'SAVE_TRANSLATION';
      itemId: string;
      languageId: string;
    }
  | {
      success: true;
      action: 'APPROVE_TRANSLATION' | 'DELETE_ITEM';
      itemId: string;
    }
  | { success?: false; error: string };

//fetch all items and all languages we allow
export async function loader({ request }: { request: Request }) {
  const authStatus = await getAuthStatus(request);
  if (!authStatus.ok) {
    throw redirectDocument(GOOGLE_AUTH_URL);
  }

  const items = await getItems(request);
  const availableLanguages = await getAvailableLanguages(request);
  return { items, availableLanguages };
}

//save translation and delete functions
export async function action({ request }: ActionArgs): Promise<ItemActionData> {
  const formData = await request.formData();
  const _action = formData.get('_action');
  const itemId = formData.get('itemId') as string;

  if (!_action || !itemId) return { error: 'Invalid form submission' };

  switch (_action) {
    case 'SAVE_TRANSLATION': {
      const languageId = formData.get('language') as string;
      const translation = formData.get('translation') as string;
      if (!languageId || !translation) return { error: 'Missing data' };
      await putTranslation(itemId, languageId, translation, request);
      return { success: true, action: 'SAVE_TRANSLATION', itemId, languageId };
    }
    case "APPROVE_TRANSLATION": {
      const translationId = formData.get("translationId") as string;
      if (!translationId) return { error: "Missing data" };
      await approveTranslation(translationId, request);
      return { success: true, action: 'APPROVE_TRANSLATION', itemId };
    }
    case "DELETE_ITEM": {
      await deleteItem(itemId, request);
      return { success: true, action: 'DELETE_ITEM', itemId };
    }
    default:
      return { error: 'Unknown action' };
  }
}

export default function ItemEditor() {
  const { items, availableLanguages } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { itemId } = useParams();
  const [searchParams] = useSearchParams();

  const item = items.find((i) => i.item_id.toString() === itemId);
  if (!item) return <p>Item not found.</p>;

  // Get filter parameters from URL
  const langFilter = searchParams.get('lang');
  const showApproved =
    searchParams.get('view') === 'approved' ||
    searchParams.get('showAll') === 'true';

  const selectedLangId = langFilter ? Number(langFilter) || null : null;

  // Filter languages to show
  const languagesToShow = availableLanguages.filter(lang => {
    const langId = Number(lang.language_id);
    
    // Always show English
    if (langId === 1) return true;
    
    // If a specific language is selected, only show English and that language
    if (selectedLangId && selectedLangId !== 1) {
      return langId === selectedLangId;
    }
    
    // Otherwise show all languages
    return true;
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">
        {item.translations?.[0]?.text ?? 'Untitled'}
      </h1>

      {/* Render translations for filtered languages */}
      {languagesToShow.map(lang => {
        const langId = Number(lang.language_id);
        const translation = item.translations.find(
          (t: any) => t.language_id === langId
        );
        const wasJustSavedInApproved =
          showApproved &&
          actionData?.success &&
          actionData.action === 'SAVE_TRANSLATION' &&
          actionData.itemId === itemId &&
          actionData.languageId === String(lang.language_id);
        
        // English stays visible as the source string in both approval views.
        if (
          showApproved &&
          langId !== 1 &&
          !translation?.approved &&
          !wasJustSavedInApproved
        ) {
          return null;
        }

        if (
          !showApproved &&
          translation?.approved &&
          langId !== 1
        ) {
          return null;
        }
        
        const isEnglish = langId === 1;
        
        return (
          <div key={`${item.item_id}-${lang.language_id}`} className="border rounded-lg p-4 bg-card">
            <Form method="post" className="space-y-3">
              <Input type="hidden" name="itemId" value={item.item_id} />
              <Input type="hidden" name="translationId" value={translation?.translation_id} />
              <Input type="hidden" name="language" value={lang.language_id} />

              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {lang.name}
                  {!!translation?.approved && (
                    <span className="ml-2 inline-flex items-center">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </span>
                  )}
                </h3>

                {!isEnglish && (
                  <div className="flex shrink-0 gap-2">
                    <Button
                      type="submit"
                      name="_action"
                      value="SAVE_TRANSLATION"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Save
                    </Button>
                    <Button
                      type="submit"
                      name="_action"
                      value="APPROVE_TRANSLATION"
                      className={
                        translation?.approved
                          ? "bg-gray-600 hover:bg-gray-700 text-white"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }
                    >
                      {translation?.approved ? "Unapprove" : "Approve"}
                    </Button>
                  </div>
                )}
              </div>
              
              <Textarea
                autoResize
                name="translation"
                defaultValue={translation?.text ?? ""}
                placeholder={`Enter translation...`}
                className="border p-2 rounded"
                disabled={isEnglish} // English is read-only
              />
            </Form>
          </div>
        );
      })}

      {/* Delete item */}
      <Form method="post">
        <input type="hidden" name="itemId" value={item.item_id} />
        <Button type="submit" name="_action" value="DELETE_ITEM" color="red">
          Delete Item
        </Button>
      </Form>
    </div>
  );
}
