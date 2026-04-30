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
      if (!translationId) return { error: 'Missing data' };
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
    <div className="space-y-4">
      <h1 className="text-lg font-bold">
        {item.translations?.[0]?.text ?? 'Untitled'}
      </h1>

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
          <div
            key={`${item.item_id}-${language.language_id}`}
            className="border rounded-lg p-4 bg-card"
          >
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

              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {language.name}
                  {!!translation?.approved && (
                    <span className="ml-2 inline-flex items-center">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-[10px] text-white">
                        ✓
                      </span>
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
                          ? 'bg-gray-600 hover:bg-gray-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }
                      disabled={!translation?.translation_id}
                    >
                      {translation?.approved ? 'Unapprove' : 'Approve'}
                    </Button>
                  </div>
                )}
              </div>

              <Textarea
                autoResize
                name="translation"
                defaultValue={translation?.text ?? ''}
                placeholder="Enter translation..."
                className="border p-2 rounded"
                disabled={isEnglish}
              />
            </Form>
          </div>
        );
      })}

      <Form method="post">
        <input type="hidden" name="itemId" value={item.item_id} />
        <Button type="submit" name="_action" value="DELETE_ITEM" color="red">
          Delete Item
        </Button>
      </Form>
    </div>
  );
}
