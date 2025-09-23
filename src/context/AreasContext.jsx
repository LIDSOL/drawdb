import { createContext, useState } from "react";
import { Action, ObjectType, defaultBlue } from "../data/constants";
import { useUndoRedo, useTransform, useSelect } from "../hooks";
import { Toast } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";

export const AreasContext = createContext(null);

export default function AreasContextProvider({ children }) {
  const { t } = useTranslation();
  const [areas, setAreas] = useState([]);
  const { transform } = useTransform();
  const { selectedElement, setSelectedElement } = useSelect();
  const { pushUndo } = useUndoRedo();

  const addArea = (data, addToHistory = true) => {
    if (data) {
      setAreas((prev) => {
        const temp = prev.slice();
        temp.splice(data.id, 0, data);
        return temp.map((t, i) => ({ ...t, id: i }));
      });
    } else {
      const width = 200;
      const height = 200;
      setAreas((prev) => [
        ...prev,
        {
          id: prev.length,
          name: `area_${prev.length}`,
          x: transform.pan.x - width / 2,
          y: transform.pan.y - height / 2,
          width,
          height,
          color: defaultBlue,
        },
      ]);
    }
    if (addToHistory) {
      pushUndo({
        action: Action.ADD,
        element: ObjectType.AREA,
        message: t("add_area"),
      });
    }
  };

  const deleteArea = (id, addToHistory = true) => {
    if (addToHistory) {
      Toast.success(t("area_deleted"));
      pushUndo({
        action: Action.DELETE,
        element: ObjectType.AREA,
        data: areas[id],
        message: t("delete_area", areas[id].name),
      });
    }
    setAreas((prev) =>
      prev.filter((e) => e.id !== id).map((e, i) => ({ ...e, id: i })),
    );
    if (id === selectedElement.id) {
      setSelectedElement((prev) => ({
        ...prev,
        element: ObjectType.NONE,
        id: -1,
        open: false,
      }));
    }
  };

  const updateArea = (id, values) => {
    setAreas((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            ...values,
          };
        }
        return t;
      }),
    );
  };

  return (
    <AreasContext.Provider
      value={{
        areas,
        setAreas,
        updateArea,
        addArea,
        deleteArea,
        areasCount: areas.length,
      }}
    >
      {children}
    </AreasContext.Provider>
  );
}
