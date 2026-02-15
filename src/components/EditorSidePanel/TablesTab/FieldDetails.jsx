import { useState } from "react";
import {
  Input,
  TextArea,
  Button,
  TagInput,
  Checkbox,
  Toast,
  Popover,
} from "@douyinfe/semi-ui";
import { Action, ObjectType } from "../../../data/constants";
import { IconDeleteStroked } from "@douyinfe/semi-icons";
import { useDiagram, useUndoRedo, useSettings } from "../../../hooks";
import { useTranslation } from "react-i18next";
import { dbToTypes } from "../../../data/datatypes";
import { databases } from "../../../data/databases";
import ColorPicker from "../../ColorPicker";

export default function FieldDetails({ data, tid, index }) {
  const { t } = useTranslation();
  const { tables, database } = useDiagram();
  const { pushUndo } = useUndoRedo();
  const { updateField, deleteField } = useDiagram();
  const [editField, setEditField] = useState({});
  const { settings } = useSettings();

  return (
    <div>
      <div className="font-semibold">{t("default_value")}</div>
      <Input
        className="my-2"
        placeholder={t("default_value")}
        value={data.default}
        disabled={dbToTypes[database][data.type].noDefault || data.increment}
        onChange={(value) => updateField(tid, index, { default: value })}
        onFocus={(e) => setEditField({ default: e.target.value })}
        onBlur={(e) => {
          if (e.target.value === editField.default) return;
          pushUndo({
            action: Action.EDIT,
            element: ObjectType.TABLE,
            component: "field",
            tid: tid,
            fid: index,
            undo: editField,
            redo: { default: e.target.value },
            message: t("edit_table", {
              tableName: tables[tid].name,
              extra: "[field]",
            }),
          });
        }}
      />
      {(data.type === "ENUM" || data.type === "SET") && (
        <>
          <div className="font-semibold mb-1">
            {data.type} {t("values")}
          </div>
          <TagInput
            separator={[",", ", ", " ,"]}
            value={data.values}
            validateStatus={
              !data.values || data.values.length === 0 ? "error" : "default"
            }
            addOnBlur
            className="my-2"
            placeholder={t("use_for_batch_input")}
            onChange={(v) => updateField(tid, index, { values: v })}
            onFocus={() => setEditField({ values: data.values })}
            onBlur={() => {
              if (
                JSON.stringify(editField.values) === JSON.stringify(data.values)
              )
                return;
              pushUndo({
                action: Action.EDIT,
                element: ObjectType.TABLE,
                component: "field",
                tid: tid,
                fid: index,
                undo: editField,
                redo: { values: data.values },
                message: t("edit_table", {
                  tableName: tables[tid].name,
                  extra: "[field]",
                }),
              });
            }}
          />
        </>
      )}
      {dbToTypes[database][data.type].hasCheck && (
        <>
          <div className="font-semibold">{t("check")}</div>
          <Input
            className="mt-2"
            placeholder={t("check")}
            value={data.check}
            disabled={data.increment}
            onChange={(value) => updateField(tid, index, { check: value })}
            onFocus={(e) => setEditField({ check: e.target.value })}
            onBlur={(e) => {
              if (e.target.value === editField.check) return;
              pushUndo({
                action: Action.EDIT,
                element: ObjectType.TABLE,
                component: "field",
                tid: tid,
                fid: index,
                undo: editField,
                redo: { check: e.target.value },
                message: t("edit_table", {
                  tableName: tables[tid].name,
                  extra: "[field]",
                }),
              });
            }}
          />
          <div className="text-xs mt-1">{t("this_will_appear_as_is")}</div>
        </>
      )}
      <div className="flex justify-between items-center my-3">
        <div className="font-medium">{t("unique")}</div>
        <Checkbox
          value="unique"
          checked={data.unique}
          onChange={(checkedValues) => {
            // If trying to remove unique from a primary key, show warning and don't change
            if (data.primary && data.unique && !checkedValues.target.checked) {
              Toast.info(t("pk_has_to_be_unique"));
              return;
            }
            pushUndo({
              action: Action.EDIT,
              element: ObjectType.TABLE,
              component: "field",
              tid: tid,
              fid: index,
              undo: {
                [checkedValues.target.value]: !checkedValues.target.checked,
              },
              redo: {
                [checkedValues.target.value]: checkedValues.target.checked,
              },
            });
            updateField(tid, index, {
              [checkedValues.target.value]: checkedValues.target.checked,
            });
          }}
        />
      </div>
      <div className="flex justify-between items-center my-3">
        <div className="font-medium">{t("autoincrement")}</div>
        <Checkbox
          value="increment"
          checked={data.increment}
          disabled={
            !dbToTypes[database][data.type].canIncrement || data.isArray
          }
          onChange={(checkedValues) => {
            pushUndo({
              action: Action.EDIT,
              element: ObjectType.TABLE,
              component: "field",
              tid: tid,
              fid: index,
              undo: {
                [checkedValues.target.value]: !checkedValues.target.checked,
              },
              redo: {
                [checkedValues.target.value]: checkedValues.target.checked,
              },
              message: t("edit_table", {
                tableName: tables[tid].name,
                extra: "[field]",
              }),
            });
            updateField(tid, index, {
              increment: !data.increment,
              check: data.increment ? data.check : "",
            });
          }}
        />
      </div>
      {databases[database].hasArrays && (
        <div className="flex justify-between items-center my-3">
          <div className="font-medium">{t("declare_array")}</div>
          <Checkbox
            value="isArray"
            checked={data.isArray}
            onChange={(checkedValues) => {
              pushUndo({
                action: Action.EDIT,
                element: ObjectType.TABLE,
                component: "field",
                tid: tid,
                fid: index,
                undo: {
                  [checkedValues.target.value]: !checkedValues.target.checked,
                },
                redo: {
                  [checkedValues.target.value]: checkedValues.target.checked,
                },
                message: t("edit_table", {
                  tableName: tables[tid].name,
                  extra: "[field]",
                }),
              });
              updateField(tid, index, {
                isArray: checkedValues.target.checked,
                increment: data.isArray ? data.increment : false,
              });
            }}
          />
        </div>
      )}
      {databases[database].hasUnsignedTypes &&
        dbToTypes[database][data.type].signed && (
          <div className="flex justify-between items-center my-3">
            <div className="font-medium">{t("Unsigned")}</div>
            <Checkbox
              value="unsigned"
              checked={data.unsigned}
              onChange={(checkedValues) => {
                pushUndo({
                  action: Action.EDIT,
                  element: ObjectType.TABLE,
                  component: "field",
                  tid: tid,
                  fid: index,
                  undo: {
                    [checkedValues.target.value]: !checkedValues.target.checked,
                  },
                  redo: {
                    [checkedValues.target.value]: checkedValues.target.checked,
                  },
                  message: t("edit_table", {
                    tableName: tables[tid].name,
                    extra: "[field]",
                  }),
                });
                updateField(tid, index, {
                  unsigned: checkedValues.target.checked,
                });
              }}
            />
          </div>
        )}
      {data.foreignK && (
        <div className="my-3">
          <div className="font-semibold mb-2">{t("foreign_key")} Color</div>
          <Popover
            content={
              <div className="popover-theme">
                <ColorPicker
                  currentColor={data.fkColor || settings.defaultFkColor}
                  onClearColor={() => {
                    pushUndo({
                      action: Action.EDIT,
                      element: ObjectType.TABLE,
                      component: "field",
                      tid: tid,
                      fid: index,
                      undo: { fkColor: data.fkColor },
                      redo: { fkColor: undefined },
                      message: t("edit_table", {
                        tableName: tables[tid].name,
                        extra: "[field color]",
                      }),
                    });
                    updateField(tid, index, { fkColor: undefined });
                  }}
                  onPickColor={(color) => {
                    pushUndo({
                      action: Action.EDIT,
                      element: ObjectType.TABLE,
                      component: "field",
                      tid: tid,
                      fid: index,
                      undo: { fkColor: data.fkColor },
                      redo: { fkColor: color },
                      message: t("edit_table", {
                        tableName: tables[tid].name,
                        extra: "[field color]",
                      }),
                    });
                    updateField(tid, index, { fkColor: color });
                  }}
                />
              </div>
            }
            trigger="click"
            position="bottomLeft"
            showArrow
          >
            <div
              className="w-full h-8 rounded border-2 border-gray-300 dark:border-gray-600 cursor-pointer hover:border-blue-500 transition-colors"
              style={{
                backgroundColor: data.fkColor || settings.defaultFkColor,
              }}
            />
          </Popover>
        </div>
      )}
      <div className="font-semibold">{t("comment")}</div>
      <TextArea
        className="my-2"
        placeholder={t("comment")}
        value={data.comment}
        autosize
        rows={2}
        onChange={(value) => updateField(tid, index, { comment: value })}
        onFocus={(e) => setEditField({ comment: e.target.value })}
        onBlur={(e) => {
          if (e.target.value === editField.comment) return;
          pushUndo({
            action: Action.EDIT,
            element: ObjectType.TABLE,
            component: "field",
            tid: tid,
            fid: index,
            undo: editField,
            redo: { comment: e.target.value },
            message: t("edit_table", {
              tableName: tables[tid].name,
              extra: "[field]",
            }),
          });
        }}
      />
      <Button
        icon={<IconDeleteStroked />}
        type="danger"
        block
        onClick={() => deleteField(data, tid)}
      >
        {t("delete")}
      </Button>
    </div>
  );
}
