import { createContext, useState } from "react";
import { Action, ObjectType } from "../data/constants";
import { Toast } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import { useUndoRedo } from "../hooks";

export const EnumsContext = createContext(null);

export default function EnumsContextProvider({ children }) {
  const { t } = useTranslation();
  const [enums, setEnums] = useState([]);
  const { pushUndo } = useUndoRedo();

  const addEnum = (data, addToHistory = true) => {
    if (data) {
      setEnums((prev) => {
        const temp = prev.slice();
        temp.splice(data.id, 0, data);
        return temp;
      });
    } else {
      setEnums((prev) => [
        ...prev,
        {
          name: `enum_${prev.length}`,
          values: [],
        },
      ]);
    }
    if (addToHistory) {
      pushUndo({
        action: Action.ADD,
        element: ObjectType.ENUM,
        message: t("add_enum"),
      });
    }
  };

  const deleteEnum = (id, addToHistory = true) => {
    if (addToHistory) {
      Toast.success(t("enum_deleted"));
      pushUndo({
        action: Action.DELETE,
        element: ObjectType.ENUM,
        id: id,
        data: enums[id],
        message: t("delete_enum", {
          enumName: enums[id].name,
        }),
      });
    }
    setEnums((prev) => prev.filter((_, i) => i !== id));
  };

  const updateEnum = (id, values) => {
    setEnums((prev) =>
      prev.map((e, i) => (i === id ? { ...e, ...values } : e)),
    );
  };

  return (
    <EnumsContext.Provider
      value={{
        enums,
        setEnums,
        addEnum,
        updateEnum,
        deleteEnum,
        enumsCount: enums.length,
      }}
    >
      {children}
    </EnumsContext.Provider>
  );
}
