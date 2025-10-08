import { Action, ObjectType } from "../../../data/constants";
import {
  Row,
  Col,
  Input,
  Button,
  Popover,
  Select,
  InputNumber,
} from "@douyinfe/semi-ui";
import { IconMore, IconKeyStroked } from "@douyinfe/semi-icons";
import {
  useEnums,
  useDiagram,
  useTypes,
  useUndoRedo,
  useSettings,
} from "../../../hooks";
import { useState } from "react";
import FieldDetails from "./FieldDetails";
import { useTranslation } from "react-i18next";
import { dbToTypes } from "../../../data/datatypes";
import { Toast } from "@douyinfe/semi-ui";
import { createNewField } from "./createNewField";

export default function TableField({ data, tid, index }) {
  const { updateField, relationships } = useDiagram();
  const { types } = useTypes();
  const { enums } = useEnums();
  const { tables, database, addFieldToTable } = useDiagram();
  const { t } = useTranslation();
  const { pushUndo } = useUndoRedo();
  const [editField, setEditField] = useState({});
  const { settings } = useSettings();

  // Function to check if the FK field belongs to a subtype relationship
  const isSubtypeForeignKey = () => {
    if (!data.foreignK || !data.foreignKey) return false;
    // Search for subtype relationships where this table is a child table
    return relationships.some((rel) => {
      // Check if it is a subtype relationship
      if (!rel.subtype) return false;
      // Check if this table is a child table in the subtype relationship
      const isChildTable =
        rel.endTableId === tid ||
        (rel.endTableIds && rel.endTableIds.includes(tid));
      // Check if the FK points to the parent table of the subtype relationship
      const pointsToParent = rel.startTableId === data.foreignKey.tableId;
      return isChildTable && pointsToParent;
    });
  };

  const inconsistencyOfData = () => {
    if (!data.primary) return false;
    return relationships.some((rel) => {
      const parentTable = rel.startTableId === tid;
      return parentTable;
    });
  };

  return (
    <div className="hover-1 my-2">
      {/* Main field row */}
      <Row gutter={6}>
        <Col span={7}>
          <Input
            id={`scroll_table_${tid}_input_${index}`}
            value={data.name}
            validateStatus={data.name.trim() === "" ? "error" : "default"}
            placeholder="Name"
            onChange={(value) =>
              updateField(tid, index, {
                name: settings.upperCaseFields
                  ? value.toUpperCase()
                  : value.toLowerCase(),
              })
            }
            onKeyUp={(e) => {
              if (e.key === "Enter") {
                //When pressing enter, focus the next input, if there is no next input, create a new field and focus it
                const input = document.getElementById(
                  `scroll_table_${tid}_input_${index + 1}`,
                );
                if (input) input.focus();
                else {
                  createNewField({
                    data,
                    settings,
                    database,
                    dbToTypes,
                    addFieldToTable,
                    pushUndo,
                    t,
                    tid,
                  });
                  setTimeout(() => {
                    const newInput = document.getElementById(
                      `scroll_table_${tid}_input_${index + 1}`,
                    );
                    if (newInput) newInput.focus();
                  }, 0);
                }
              }
            }}
            onFocus={(e) => setEditField({ name: e.target.value })}
            onBlur={(e) => {
              if (e.target.value === editField.name) return;
              const transformedValue = settings.upperCaseFields
                ? e.target.value.toUpperCase()
                : e.target.value.toLowerCase();
              pushUndo({
                action: Action.EDIT,
                element: ObjectType.TABLE,
                component: "field",
                tid: tid,
                fid: index,
                undo: editField,
                redo: { name: transformedValue },
                message: t("edit_table", {
                  tableName: tables[tid].name,
                  extra: "[field]",
                }),
              });
            }}
          />
        </Col>
        <Col span={8}>
          <Select
            className="w-full"
            optionList={[
              ...Object.keys(dbToTypes[database]).map((value) => ({
                label: value,
                value: value,
              })),
              ...types.map((type) => ({
                label: type.name.toUpperCase(),
                value: type.name.toUpperCase(),
              })),
              ...enums.map((type) => ({
                label: type.name.toUpperCase(),
                value: type.name.toUpperCase(),
              })),
            ]}
            filter
            value={data.type}
            validateStatus={data.type === "" ? "error" : "default"}
            placeholder="Type"
            onChange={(value) => {
              if (value === data.type) return;
              pushUndo({
                action: Action.EDIT,
                element: ObjectType.TABLE,
                component: "field",
                tid: tid,
                fid: index,
                undo: { type: data.type },
                redo: { type: value },
                message: t("edit_table", {
                  tableName: tables[tid].name,
                  extra: "[field]",
                }),
              });
              const incr =
                data.increment && !!dbToTypes[database][value].canIncrement;

              if (value === "ENUM" || value === "SET") {
                updateField(tid, index, {
                  type: value,
                  default: "",
                  values: data.values ? [...data.values] : [],
                  increment: incr,
                });
              } else if (
                dbToTypes[database][value].isSized ||
                dbToTypes[database][value].hasPrecision
              ) {
                updateField(tid, index, {
                  type: value,
                  size: dbToTypes[database][value].defaultSize,
                  increment: incr,
                });
              } else if (!dbToTypes[database][value].hasDefault || incr) {
                updateField(tid, index, {
                  type: value,
                  increment: incr,
                  default: "",
                  size: "",
                  values: [],
                });
              } else if (dbToTypes[database][value].hasCheck) {
                updateField(tid, index, {
                  type: value,
                  check: "",
                  increment: incr,
                });
              } else {
                updateField(tid, index, {
                  type: value,
                  increment: incr,
                  size: "",
                  values: [],
                });
              }
            }}
          />
        </Col>
        <Col span={3}>
          <Button
            type={data.notNull || data.primary ? "primary" : "tertiary"}
            title={t("not_null")}
            theme={data.notNull ? "solid" : "light"}
            onClick={() => {
              if (data.primary) {
                Toast.info(t("pk_has_not_be_null"));
                return;
              }
              pushUndo({
                action: Action.EDIT,
                element: ObjectType.TABLE,
                component: "field",
                tid: tid,
                fid: index,
                undo: { notNull: data.notNull },
                redo: { notNull: !data.notNull },
                message: t("edit_table", {
                  tableName: tables[tid].name,
                  extra: "[field]",
                }),
              });
              updateField(tid, index, { notNull: !data.notNull });
            }}
          >
            ?
          </Button>
        </Col>
        <Col span={3}>
          <Button
            type={data.primary ? "primary" : "tertiary"}
            title={t("primary")}
            theme={data.primary ? "solid" : "light"}
            onClick={() => {
              if (data.primary && inconsistencyOfData()) {
                Toast.info(t("inconsistency_of_data"));
                return;
              }
              // Check if it is a subtype relationship FK that cannot stop being PK
              if (data.primary && isSubtypeForeignKey()) {
                Toast.info(t("subtype_fk_must_be_pk"));
                return;
              }
              const newStatePK = !data.primary;
              const stateNull = newStatePK ? true : !data.notNull;
              const mustSetNotNull = !data.primary && !data.notNull;
              const changes = { primary: !data.primary };

              const undo = { primary: data.primary, notNull: data.notNull };
              const redo = { primary: newStatePK, notNull: stateNull };

              if (mustSetNotNull) {
                undo.notNull = data.notNull;
                redo.notNull = true;
                changes.notNull = true;
              }
              pushUndo({
                action: Action.EDIT,
                element: ObjectType.TABLE,
                component: "field",
                tid: tid,
                fid: index,
                message: t("edit_table", {
                  tableName: tables[tid].name,
                  extra: "[field]",
                }),
              });
              updateField(tid, index, {
                primary: newStatePK,
                notNull: stateNull,
              });
            }}
            icon={<IconKeyStroked />}
          />
        </Col>
        <Col span={3}>
          <Popover
            content={
              <div className="px-1 w-[240px] popover-theme">
                <FieldDetails data={data} index={index} tid={tid} />
              </div>
            }
            trigger="click"
            position="right"
            showArrow
          >
            <Button type="tertiary" icon={<IconMore />} />
          </Popover>
        </Col>
      </Row>

      {/* Precision/Size row - only show if field type supports it */}
      {(dbToTypes[database][data.type].isSized ||
        dbToTypes[database][data.type].hasPrecision) && (
        <Row gutter={6} className="mt-2">
          {dbToTypes[database][data.type].hasPrecision ? (
            <>
              <Col span={12}>
                <InputNumber
                  placeholder="Precision"
                  value={
                    data.size && data.size.includes(",")
                      ? parseInt(data.size.split(",")[0]) || ""
                      : ""
                  }
                  className="w-full"
                  min={1}
                  max={65}
                  onChange={(value) => {
                    const scale =
                      data.size && data.size.includes(",")
                        ? data.size.split(",")[1]?.trim() || "0"
                        : "0";
                    const scaleNum = parseInt(scale) || 0;
                    const maxAccuracy = Math.max(0, value - 1);
                    const clampedScale = Math.min(scaleNum, maxAccuracy);
                    const newSize = value ? `${value},${clampedScale}` : "";
                    updateField(tid, index, { size: newSize });
                  }}
                  onFocus={() => setEditField({ size: data.size })}
                  onBlur={() => {
                    if (data.size === editField.size) return;
                    pushUndo({
                      action: Action.EDIT,
                      element: ObjectType.TABLE,
                      component: "field",
                      tid: tid,
                      fid: index,
                      undo: editField,
                      redo: { size: data.size },
                      message: t("edit_table", {
                        tableName: tables[tid].name,
                        extra: "[field]",
                      }),
                    });
                  }}
                />
              </Col>
              <Col span={12}>
                <InputNumber
                  placeholder="Accuracy"
                  value={
                    data.size && data.size.includes(",")
                      ? parseInt(data.size.split(",")[1]?.trim()) || ""
                      : ""
                  }
                  className="w-full"
                  min={0}
                  max={
                    data.size && data.size.includes(",")
                      ? Math.max(0, parseInt(data.size.split(",")[0]) - 1)
                      : 9
                  }
                  onChange={(value) => {
                    const precision =
                      data.size && data.size.includes(",")
                        ? data.size.split(",")[0] || "10"
                        : "10";
                    const precisionNum = parseInt(precision);
                    const maxAccuracy = Math.max(0, precisionNum - 1);
                    const clampedValue = Math.min(value || 0, maxAccuracy);
                    const newSize =
                      typeof clampedValue === "number"
                        ? `${precision},${clampedValue}`
                        : precision;
                    updateField(tid, index, { size: newSize });
                  }}
                  onFocus={() => setEditField({ size: data.size })}
                  onBlur={() => {
                    if (data.size === editField.size) return;
                    pushUndo({
                      action: Action.EDIT,
                      element: ObjectType.TABLE,
                      component: "field",
                      tid: tid,
                      fid: index,
                      undo: editField,
                      redo: { size: data.size },
                      message: t("edit_table", {
                        tableName: tables[tid].name,
                        extra: "[field]",
                      }),
                    });
                  }}
                />
              </Col>
            </>
          ) : (
            <Col span={24}>
              <InputNumber
                placeholder={t("size")}
                value={data.size}
                className="w-full"
                onChange={(value) => updateField(tid, index, { size: value })}
                onFocus={(e) => setEditField({ size: e.target.value })}
                onBlur={(e) => {
                  if (e.target.value === editField.size) return;
                  pushUndo({
                    action: Action.EDIT,
                    element: ObjectType.TABLE,
                    component: "field",
                    tid: tid,
                    fid: index,
                    undo: editField,
                    redo: { size: e.target.value },
                    message: t("edit_table", {
                      tableName: tables[tid].name,
                      extra: "[field]",
                    }),
                  });
                }}
              />
            </Col>
          )}
        </Row>
      )}
    </div>
  );
}
