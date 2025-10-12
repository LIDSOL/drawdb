import { Action, ObjectType } from "../../../data/constants";
import { getUserDefaultPrecisionScale, getUserDefaultSize } from "../../../utils/typeDefaults";

export function createNewField({
  data,
  settings,
  database,
  dbToTypes,
  addFieldToTable,
  pushUndo,
  t,
  tid,
}) {
    pushUndo({
      action: Action.EDIT,
      element: ObjectType.TABLE,
      component: "field_add",
      tid: tid,
      message: t("edit_table", {
        tableName: data.name,
        extra: "[add field]",
      }),
    });

    const incr = data.increment && !!dbToTypes[database][settings.defaultFieldType].canIncrement;

    // Base field data
    const newFieldData = {
      name: "",
      type: settings.defaultFieldType,
      default: "",
      check: "",
      primary: false,
      unique: false,
      notNull: settings.defaultNotNull,
      increment: false,
      comment: "",
      foreignK: false,
    };

    // Field updates based on type
    let fieldUpdates = {
      increment: incr,
    };

    if (settings.defaultFieldType === "ENUM" || settings.defaultFieldType === "SET") {
      fieldUpdates = {
        ...fieldUpdates,
        values: data.values ? [...data.values] : [],
      };
    } else if (dbToTypes[database][settings.defaultFieldType].hasPrecision) {
      fieldUpdates = {
        ...fieldUpdates,
        size: getUserDefaultPrecisionScale(settings.defaultFieldType, settings, database),
      };
    } else if (dbToTypes[database][settings.defaultFieldType].isSized) {
      fieldUpdates = {
        ...fieldUpdates,
        size: getUserDefaultSize(settings.defaultFieldType, settings, database, dbToTypes),
      };
    } else if (!dbToTypes[database][settings.defaultFieldType].hasDefault || incr) {
      fieldUpdates = {
        ...fieldUpdates,
        default: "",
        size: "",
        values: [],
      };
    } else if (dbToTypes[database][settings.defaultFieldType].hasCheck) {
      fieldUpdates = {
        ...fieldUpdates,
        check: "",
      };
    } else {
      fieldUpdates = {
        ...fieldUpdates,
        size: "",
        values: [],
      };
    }
    // Use the new atomic function
    addFieldToTable(tid, newFieldData, fieldUpdates);
}
