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
} from '~/utils/backend';
import Button from '~/src/general/Button';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';

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

export async function loader({ request }: { request: Request }) {
  const authStatus = await getAuthStatus(request);
  if (!authStatus.ok) {
    throw redirectDocument(GOOGLE_AUTH_URL);
  }

  const items = await getItems(request);
  const availableLanguages = await getAvailableLanguages(request);
  return { items, availableLanguages };
}

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
    case 'APPROVE_TRANSLATION': {
      const translationId = formData.get('translationId') as string;
      const languageId = formData.get('language') as string;
      const translation = formData.get('translation') as string;

      if (!translationId || !languageId || !itemId || !translation) return { error: 'Missing data' };

      // save it, then approve it
      await putTranslation(itemId, languageId, translation, request);
      await approveTranslation(translationId, request);

      return { success: true, action: 'APPROVE_TRANSLATION', itemId };
    }
    case 'DELETE_ITEM': {
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

  const langFilter = searchParams.get('lang');
  const showApproved =
    searchParams.get('view') === 'approved' ||
    searchParams.get('showAll') === 'true';
  const selectedLangId = langFilter ? Number(langFilter) || null : null;

  const languagesToShow = availableLanguages.filter((language) => {
    const langId = Number(language.language_id);

    if (langId === 1) return true;

    if (selectedLangId && selectedLangId !== 1) {
      return langId === selectedLangId;
    }

    return true;
  });

  return (
    <div className="bg-white p-4 rounded-lg border border-lightgray w-full">
      <p className="">
        {item.translations?.[0]?.text ?? 'Untitled'}
      </p>

      {languagesToShow.map((language) => {
        const langId = Number(language.language_id);
        const translation = item.translations.find(
          (t) => t.language_id === langId
        );
        const wasJustSavedInApproved =
          showApproved &&
          actionData?.success &&
          actionData.action === 'SAVE_TRANSLATION' &&
          actionData.itemId === itemId &&
          actionData.languageId === String(language.language_id);

        if (
          showApproved &&
          langId !== 1 &&
          !translation?.approved &&
          !wasJustSavedInApproved
        ) {
          return null;
        }

        if (!showApproved && translation?.approved && langId !== 1) {
          return null;
        }

        const isEnglish = langId === 1;

        return (
          <div key={`${item.item_id}-${language.language_id}`} >
            <Form method="post" className="space-y-3">
              <Input type="hidden" name="itemId" value={item.item_id} />
              <Input
                type="hidden"
                name="translationId"
                value={translation?.translation_id}
              />
              <Input
                type="hidden"
                name="language"
                value={language.language_id}
              />

              <div className="flex flex-col gap-4 mt-4">
                <div className="flex flex-col gap-1">
                  <label htmlFor="translation" className="text-sm font-medium">Translation</label>
                  <Textarea
                    autoResize
                    name="translation"
                    defaultValue={translation?.text ?? ''}
                    placeholder="Enter translation..."
                    className="border p-2 rounded"
                    disabled={isEnglish}
                  />
                </div>

                {!isEnglish && (
                  <div className="flex justify-between shrink-0 gap-2">
                    <Button
                      type="submit"
                      name="_action"
                      value="SAVE_TRANSLATION"
                      className="bg-darkgray hover:bg-darkgray/90 text-white rounded-full"
                    >
                      Save
                    </Button>
                    <Button
                      type="submit"
                      name="_action"
                      value="APPROVE_TRANSLATION"
                      className={
                        translation?.approved
                          ? 'bg-darkgray cursor-pointer text-white hover:bg-darkgray/90 rounded-full'
                          : 'bg-salmon cursor-pointer hover:bg-salmon/90 text-white rounded-full'
                      }
                      disabled={!translation?.translation_id}
                    >
                      {translation?.approved ? 'Unapprove' : '✓ Approve'}
                    </Button>
                  </div>
                )}
              </div>
            </Form>
          </div>
        );
      })}
    </div>
  );
}
