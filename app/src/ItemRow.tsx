import { Form } from "react-router";
import { homePageActions } from "~/routes/home";
import Button from "./general/Button";
import TextInput from "./general/TextInput";
import { useRef } from "react";

const ItemRow = ({
  item,
  availableLanguages,
}: {
  item: {
    item_id: number;
    translations: { language_id: number; text: string }[];
  };
  availableLanguages: { language_id: string; code: string; name: string }[];
}) => {
  const englishTranslation = item.translations.find(
    (translation) => translation.language_id === 1
  );

  const translationInputRef = useRef<HTMLInputElement>(null);

  const onLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const languageId = event.target.value;
    const translation = item.translations.find(
      (translation) => translation.language_id === Number(languageId)
    );

    if (translationInputRef.current) {
      translationInputRef.current.value = translation?.text || "";
      translationInputRef.current.focus();
    }
  };

  return (
    <Form key={item.item_id} method="post" className="m-2">
      <div className="grid grid-cols-10 items-center p-2 border-2 border-gray-300 rounded-md gap-3">
        <Button
          type="submit"
          name="_action"
          value={homePageActions.deleteItem}
          color="red"
          className="col-span-1"
        >
          Delete
        </Button>
        <div className="col-span-3">
          <p key={item.item_id}>{englishTranslation?.text}</p>
          <input type="hidden" name="itemId" value={item.item_id} />
        </div>
        <div className="col-span-5">
          <div className="border-2 border-gray-300 rounded-md w-fit">
            <select
              name="language"
              id="language"
              onChange={onLanguageChange}
              className="w-fit"
            >
              {availableLanguages
                .filter((language) => Number(language.language_id) !== 1)
                .map((language) => (
                  <option
                    key={language.language_id}
                    value={language.language_id}
                  >
                    {language.name}
                  </option>
                ))}
            </select>
          </div>
          <TextInput
            name="translation"
            id="translation"
            defaultValue={englishTranslation?.text}
            ref={translationInputRef}
            className="w-full"
          />
        </div>
        <Button
          type="submit"
          name="_action"
          value={homePageActions.saveTranslation}
          color="blue"
          className="col-span-1"
        >
          Save Translation
        </Button>
      </div>
    </Form>
  );
};

export default ItemRow;
