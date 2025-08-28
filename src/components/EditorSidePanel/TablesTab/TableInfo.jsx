import { useState } from "react";
import {
  Collapse,
  Input,
  TextArea,
  Button,
  Card,
  Popover,
} from "@douyinfe/semi-ui";
import { IconDeleteStroked } from "@douyinfe/semi-icons";
import { useDiagram, useUndoRedo, useSettings } from "../../../hooks";
import { Action, Notation, ObjectType, defaultBlue } from "../../../data/constants";
import ColorPalette from "../../ColorPicker";
import TableField from "./TableField";
import IndexDetails from "./IndexDetails";
import { useTranslation } from "react-i18next";
import { dbToTypes } from "../../../data/datatypes";

import { useNavigate } from "react-router-dom";

export default function TableInfo({ data }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [indexActiveKey, setIndexActiveKey] = useState("");
  const { deleteTable, updateTable, addFieldToTable, updateField, setRelationships, database } =
    useDiagram();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const [editField, setEditField] = useState({});
  const { settings } = useSettings();
  const [drag, setDrag] = useState({
    draggingElementIndex: null,
    draggingOverIndexList: [],
  });

  return (
    <div>
      <div className="flex items-center mb-2.5">
        <div className="text-md font-semibold break-keep">{t("name")}: </div>
        <Input
          value={data.name}
          validateStatus={data.name.trim() === "" ? "error" : "default"}
          placeholder={t("name")}
          className="ms-2"
          onChange={(value) => updateTable(data.id, {
              name: settings.upperCaseFields ? value.toUpperCase() : value.toLowerCase()
          })}
          onFocus={(e) => setEditField({ name: e.target.value })}
          onBlur={(e) => {
            if (e.target.value === editField.name) return;
            const transformedValue = settings.upperCaseFields
              ? e.target.value.toUpperCase()
              : e.target.value.toLowerCase();
            setUndoStack((prev) => [
              ...prev,
              {
                action: Action.EDIT,
                element: ObjectType.TABLE,
                component: "self",
                tid: data.id,
                undo: editField,
                redo: { name: transformedValue },
                message: t("edit_table", {
                  tableName: transformedValue,
                  extra: "[name]",
                }),
              },
            ]);
            setRedoStack([]);
          }}
        />
      </div>
      {data.fields.map((f, j) => (
        <div
          key={"field_" + j}
          className={`cursor-pointer ${drag.draggingOverIndexList.includes(j) ? "opacity-25" : ""}`}
          style={{ direction: "ltr" }}
          draggable
          onDragStart={() => {
            setDrag((prev) => ({ ...prev, draggingElementIndex: j }));
          }}
          onDragLeave={() => {
            setDrag((prev) => ({
              ...prev,
              draggingOverIndexList: prev.draggingOverIndexList.filter(
                (index) => index !== j,
              ),
            }));
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (drag.draggingElementIndex != null) {
              if (j !== drag.draggingElementIndex) {
                setDrag((prev) => {
                  if (prev.draggingOverIndexList.includes(j)) {
                    return prev;
                  }

                  return {
                    ...prev,
                    draggingOverIndexList: prev.draggingOverIndexList.concat(j),
                  };
                });
              }

              return;
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            const index = drag.draggingElementIndex;
            setDrag({ draggingElementIndex: null, draggingOverIndexList: [] });
            if (index == null || index === j) {
              return;
            }

            const a = data.fields[index];
            const b = data.fields[j];

            updateField(data.id, index, {
              ...b,
              ...(!dbToTypes[database][b.type].isSized && { size: "" }),
              ...(!dbToTypes[database][b.type].hasCheck && { check: "" }),
              ...(dbToTypes[database][b.type].noDefault && { default: "" }),
              id: index,
            });
            updateField(data.id, j, {
              ...a,
              ...(!dbToTypes[database][a.type].isSized && { size: "" }),
              ...(!dbToTypes[database][a.type].hasCheck && { check: "" }),
              ...(!dbToTypes[database][a.type].noDefault && { default: "" }),
              id: j,
            });

            setRelationships((prev) =>
              prev.map((e) => {
                if (e.startTableId === data.id) {
                  if (e.startFieldId === index) {
                    return { ...e, startFieldId: j };
                  }
                  if (e.startFieldId === j) {
                    return { ...e, startFieldId: index };
                  }
                }
                if (e.endTableId === data.id) {
                  if (e.endFieldId === index) {
                    return { ...e, endFieldId: j };
                  }
                  if (e.endFieldId === j) {
                    return { ...e, endFieldId: index };
                  }
                }
                return e;
              }),
            );
          }}
          onDragEnd={(e) => {
            e.preventDefault();
            setDrag({ draggingElementIndex: null, draggingOverIndexList: [] });
          }}
        >
          <TableField data={f} tid={data.id} index={j} />
        </div>
      ))}
      {data.indices.length > 0 && (
        <Card
          bodyStyle={{ padding: "4px" }}
          style={{ marginTop: "12px", marginBottom: "12px" }}
          headerLine={false}
        >
          <Collapse
            activeKey={indexActiveKey}
            keepDOM={false}
            lazyRender
            onChange={(itemKey) => setIndexActiveKey(itemKey)}
            accordion
          >
            <Collapse.Panel header={t("indices")} itemKey="1">
              {data.indices.map((idx, k) => (
                <IndexDetails
                  key={"index_" + k}
                  data={idx}
                  iid={k}
                  tid={data.id}
                  fields={data.fields.map((e) => ({
                    value: e.name,
                    label: e.name,
                  }))}
                />
              ))}
            </Collapse.Panel>
          </Collapse>
        </Card>
      )}
      <Card
        bodyStyle={{ padding: "4px" }}
        style={{ marginTop: "12px", marginBottom: "12px" }}
        headerLine={false}
      >
        <Collapse keepDOM={false} lazyRender>
          <Collapse.Panel header={t("comment")} itemKey="1">
            <TextArea
              field="comment"
              value={data.comment}
              autosize
              placeholder={t("comment")}
              rows={1}
              onChange={(value) =>
                updateTable(data.id, { comment: value }, false)
              }
              onFocus={(e) => setEditField({ comment: e.target.value })}
              onBlur={(e) => {
                if (e.target.value === editField.comment) return;
                setUndoStack((prev) => [
                  ...prev,
                  {
                    action: Action.EDIT,
                    element: ObjectType.TABLE,
                    component: "self",
                    tid: data.id,
                    undo: editField,
                    redo: { comment: e.target.value },
                    message: t("edit_table", {
                      tableName: e.target.value,
                      extra: "[comment]",
                    }),
                  },
                ]);
                setRedoStack([]);
              }}
            />
          </Collapse.Panel>
        </Collapse>
      </Card>
      <div className="flex flex-col gap-1">
      <div className="flex gap-1 w-full">  
        {!(settings.notation === Notation.CROWS_FOOT || settings.notation === Notation.IDEF1X)? (
          <Popover
            content={
              <div className="popover-theme">
                <ColorPalette
                  currentColor={data.color}
                  onClearColor={() => {
                    setUndoStack((prev) => [
                      ...prev,
                      {
                        action: Action.EDIT,
                        element: ObjectType.TABLE,
                        component: "self",
                        tid: data.id,
                        undo: { color: data.color },
                        redo: { color: defaultBlue },
                        message: t("edit_table", {
                          tableName: data.name,
                          extra: "[color]",
                        }),
                      },
                    ]);
                    setRedoStack([]);
                    updateTable(data.id, { color: defaultBlue });
                  }}
                  onPickColor={(c) => {
                    setUndoStack((prev) => [
                      ...prev,
                      {
                        action: Action.EDIT,
                        element: ObjectType.TABLE,
                        component: "self",
                        tid: data.id,
                        undo: { color: data.color },
                        redo: { color: c },
                        message: t("edit_table", {
                          tableName: data.name,
                          extra: "[color]",
                        }),
                      },
                    ]);
                    setRedoStack([]);
                    updateTable(data.id, { color: c });
                  }}
                />
              </div>
            }
            trigger="click"
            position="bottomLeft"
            showArrow
          >
            <div
              className={"h-[32px] w-[1100px] rounded"}
              style={{ backgroundColor: data.color }}
            />
          </Popover >
        ):null}
      
        <div className="flex gap-1 flex grow">
          <Button
            block
            onClick={() => {
              setIndexActiveKey("1");
              setUndoStack((prev) => [
                ...prev,
                {
                  action: Action.EDIT,
                  element: ObjectType.TABLE,
                  component: "index_add",
                  tid: data.id,
                  message: t("edit_table", {
                    tableName: data.name,
                    extra: "[add index]",
                  }),
                },
              ]);
              setRedoStack([]);
              updateTable(data.id, {
                indices: [
                  ...data.indices,
                  {
                    id: data.indices.length,
                    name: `${data.name}_index_${data.indices.length}`,
                    unique: false,
                    fields: [],
                  },
                ],
              });
            }}
            className="flex-grow"
          >
            {t("add_index")}
          </Button>
          <Button
            onClick={() => {
              setUndoStack((prev) => [
                ...prev,
                {
                  action: Action.EDIT,
                  element: ObjectType.TABLE,
                  component: "field_add",
                  tid: data.id,
                  message: t("edit_table", {
                    tableName: data.name,
                    extra: "[add field]",
                  }),
                },
              ]);
              setRedoStack([]);

              const incr = data.increment && !!dbToTypes[database][settings.defaultFieldType].canIncrement;
              // Function to get the default size configured by the user
              const getUserDefaultSize = (typeName) => {
                const dbSettings = settings?.defaultTypeSizes?.[database] || {};
                const userSize = dbSettings[typeName];
                if (typeof userSize === 'number') {
                  return userSize;
                }
                return dbToTypes[database][typeName]?.defaultSize || '';
              };
              // Function to get the combined size for types with precision and scale
              const getUserDefaultPrecisionScale = (typeName) => {
                const dbSettings = settings?.defaultTypeSizes?.[database] || {};
                const userSettings = dbSettings[typeName];
                if (typeof userSettings === 'object') {
                  const precision = userSettings?.precision || 10;
                  const scale = userSettings?.scale;
                  // If it has a defined scale, combine as "precision,scale"
                  if (scale !== undefined && scale !== null) {
                    return `${precision},${scale}`;
                  }
                  // If it only has precision, return just the precision
                  return precision.toString();
                }
                // Default value for types with precision
                return "10";
              };

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
                  size: getUserDefaultPrecisionScale(settings.defaultFieldType),
                };
              } else if (dbToTypes[database][settings.defaultFieldType].isSized) {
                fieldUpdates = {
                  ...fieldUpdates,
                  size: getUserDefaultSize(settings.defaultFieldType),
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
              addFieldToTable(data.id, newFieldData, fieldUpdates);
            }}
            block
            className="flex-grow"
          >
            {t("add_field")}
          </Button>
        </div>
      </div>
            <div className="flex items-center gap-5 mt-1">
            <Button
            block
              onClick={() => {
                if (data.x != null && data.y != null) {
                  navigate('/editor', { state: { focusPosition: { x: data.x, y: data.y } } });
                }
              }}
              className="flex-grow"
            >{t("board")}
            </Button>

            </div>
            <div className="flex items-center gap-5 mt-1">
            <Button
                icon={<IconDeleteStroked />}
                iconPosition="Right"
                type="danger"
                onClick={() => deleteTable(data.id)}
                className="flex-grow"
            >
                {t("delete_table_")}
              </Button>
          </div>
      </div>
    </div>
  );
}