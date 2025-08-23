import {
  Row,
  Col,
  Select,
  Button,
  Popover,
  Table,
  Input,
} from "@douyinfe/semi-ui";
import {
  IconDeleteStroked,
  IconLoopTextStroked,
  IconMore,
  IconRefresh,
} from "@douyinfe/semi-icons";
import {
  RelationshipType,
  RelationshipCardinalities,
  Constraint,
  Action,
  ObjectType,
  Notation,
} from "../../../data/constants";
import { useDiagram, useUndoRedo } from "../../../hooks";
import i18n from "../../../i18n/i18n";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useSettings } from "../../../hooks";
const columns = [
  {
    title: i18n.t("primary"),
    dataIndex: "primary",
  },
  {
    title: i18n.t("foreign"),
    dataIndex: "foreign",
  },
];

export default function RelationshipInfo({ data }) {
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const {
    tables,
    setTables,
    setRelationships,
    deleteRelationship,
    updateRelationship,
  } = useDiagram();
  const { t } = useTranslation();
  const [editField, setEditField] = useState({});
  const { settings } = useSettings();

  const isDefaultRelationshipName = (relationship, tables) => {
    if (!relationship || !tables) return false;

    const startTable = tables.find((t) => t.id === relationship.startTableId);
    const endTable = tables.find((t) => t.id === relationship.endTableId);

    if (!startTable || !endTable) return false;

    const startField = startTable.fields?.find(
      (f) => f.id === relationship.startFieldId,
    );
    const endField = endTable.fields?.find(
      (f) => f.id === relationship.endFieldId,
    );

    if (!startField || !endField) return false;

    // Check if it matches the original creation pattern: parentTable_parentField
    const originalPattern = `${startTable.name}_${startField.name}`;

    // Check if it matches the fk pattern: fk_endTable_endField_startTable
    const fkPattern = `fk_${endTable.name}_${endField.name}_${startTable.name}`;

    return (
      relationship.name === originalPattern || relationship.name === fkPattern
    );
  };

  const swapKeys = () => {
    const shouldUpdateName = isDefaultRelationshipName(data, tables);

    const undoData = {
      startTableId: data.startTableId,
      startFieldId: data.startFieldId,
      endTableId: data.endTableId,
      endFieldId: data.endFieldId,
    };

    const redoData = {
      startTableId: data.endTableId,
      startFieldId: data.endFieldId,
      endTableId: data.startTableId,
      endFieldId: data.startFieldId,
    };

    if (shouldUpdateName) {
      undoData.name = data.name;
      // Generate the new name after swapping
      const newStartTable = tables.find((t) => t.id === data.endTableId);
      const newEndTable = tables.find((t) => t.id === data.startTableId);
      const newEndField = newEndTable?.fields?.find(
        (f) => f.id === data.startFieldId,
      );

      if (newStartTable && newEndTable && newEndField) {
        redoData.name = `fk_${newEndTable.name}_${newEndField.name}_${newStartTable.name}`;
      }
    }

    setUndoStack((prev) => [
      ...prev,
      {
        action: Action.EDIT,
        element: ObjectType.RELATIONSHIP,
        rid: data.id,
        undo: undoData,
        redo: redoData,
        message: t("edit_relationship", {
          refName: data.name,
          extra: "[swap keys]",
        }),
      },
    ]);
    setRedoStack([]);
    setRelationships((prev) =>
      prev.map((e, idx) => {
        if (idx === data.id) {
          const updatedRelationship = {
            ...e,
            startTableId: e.endTableId,
            startFieldId: e.endFieldId,
            endTableId: e.startTableId,
            endFieldId: e.startFieldId,
          };

          // Only update name if it's a default name
          if (shouldUpdateName && redoData.name) {
            updatedRelationship.name = redoData.name;
          }

          return updatedRelationship;
        }
        return e;
      }),
    );
  };

  const changeRelationshipType = (value) => {
    const defaultCardinality =
      RelationshipCardinalities[value] && RelationshipCardinalities[value][0]
        ? RelationshipCardinalities[value][0].label
        : "";

    setUndoStack((prev) => [
      ...prev,
      {
        action: Action.EDIT,
        element: ObjectType.RELATIONSHIP,
        rid: data.id,
        undo: {
          relationshipType: data.relationshipType,
          cardinality: data.cardinality,
        },
        redo: {
          relationshipType: value,
          cardinality: defaultCardinality,
        },
        message: t("edit_relationship", {
          refName: data.name,
          extra: "[relationship type]",
        }),
      },
    ]);
    setRedoStack([]);
    setRelationships((prev) =>
      prev.map((e, idx) =>
        idx === data.id
          ? { ...e, relationshipType: value, cardinality: defaultCardinality }
          : e,
      ),
    );
  };

  const changeCardinality = (value) => {
    setUndoStack((prev) => [
      ...prev,
      {
        action: Action.EDIT,
        element: ObjectType.RELATIONSHIP,
        rid: data.id,
        undo: { cardinality: data.cardinality },
        redo: { cardinality: value },
        message: t("edit_relationship", {
          refName: data.name,
          extra: "[cardinality]",
        }),
      },
    ]);
    setRedoStack([]);
    setRelationships((prev) =>
      prev.map((e, idx) =>
        idx === data.id ? { ...e, cardinality: value } : e,
      ),
    );
  };

  const changeConstraint = (key, value) => {
    const undoKey = `${key}Constraint`;
    setUndoStack((prev) => [
      ...prev,
      {
        action: Action.EDIT,
        element: ObjectType.RELATIONSHIP,
        rid: data.id,
        undo: { [undoKey]: data[undoKey] },
        redo: { [undoKey]: value },
        message: t("edit_relationship", {
          refName: data.name,
          extra: "[constraint]",
        }),
      },
    ]);
    setRedoStack([]);
    setRelationships((prev) =>
      prev.map((e, idx) => (idx === data.id ? { ...e, [undoKey]: value } : e)),
    );
  };

  const toggleParentCardinality = () => {
    const startTable = tables.find((t) => t.id === data.endTableId);
    if (!startTable) return;

    const fkFieldIds = Array.isArray(data.endFieldId)
      ? data.endFieldId
      : [data.endFieldId];

    const fkFields = startTable.fields.filter((f) => fkFieldIds.includes(f.id));
    if (fkFields.length === 0) return;

    const isCurrentlyNullable = fkFields.every((field) => !field.notNull);
    const newNotNullValue = isCurrentlyNullable;

    const undoFields = fkFields.map((field) => ({
      id: field.id,
      notNull: field.notNull,
    }));
    const redoFields = fkFields.map((field) => ({
      id: field.id,
      notNull: newNotNullValue,
    }));

    setUndoStack((prev) => [
      ...prev,
      {
        action: Action.EDIT,
        element: ObjectType.TABLE,
        tid: startTable.id,
        undo: { fields: undoFields },
        redo: { fields: redoFields },
        message: t("edit_relationship", {
          refName: data.name,
          extra: "[parent cardinality]",
        }),
      },
    ]);
    setRedoStack([]);

    setTables((prevTables) =>
      prevTables.map((table) => {
        if (table.id === startTable.id) {
          return {
            ...table,
            fields: table.fields.map((field) => {
              if (fkFieldIds.includes(field.id)) {
                return { ...field, notNull: newNotNullValue };
              }
              return field;
            }),
          };
        }
        return table;
      }),
    );
  };

  const setDefaultName = () => {
    const startTable = tables.find((t) => t.id === data.startTableId);
    const endTable = tables.find((t) => t.id === data.endTableId);

    if (!startTable || !endTable) return;

    const startField = startTable.fields?.find(
      (f) => f.id === data.startFieldId,
    );
    const endField = endTable.fields?.find((f) => f.id === data.endFieldId);

    if (!startField || !endField) return;

    const defaultName = `fk_${endTable.name}_${endField.name}_${startTable.name}`;

    if (data.name === defaultName) return; // Already has default name

    setUndoStack((prev) => [
      ...prev,
      {
        action: Action.EDIT,
        element: ObjectType.RELATIONSHIP,
        component: "self",
        rid: data.id,
        undo: { name: data.name },
        redo: { name: defaultName },
        message: t("edit_relationship", {
          refName: defaultName,
          extra: "[set default name]",
        }),
      },
    ]);
    setRedoStack([]);
    updateRelationship(data.id, { name: defaultName });
  };

  return (
    <>
      <div className="flex items-center mb-2.5">
        <div className="text-md font-semibold break-keep">{t("name")}: </div>
        <Input
          value={data.name}
          validateStatus={data.name.trim() === "" ? "error" : "default"}
          placeholder={t("name")}
          className="ms-2"
          onChange={(value) => updateRelationship(data.id, { name: value })}
          onFocus={(e) => setEditField({ name: e.target.value })}
          onBlur={(e) => {
            if (e.target.value === editField.name) return;
            setUndoStack((prev) => [
              ...prev,
              {
                action: Action.EDIT,
                element: ObjectType.RELATIONSHIP,
                component: "self",
                rid: data.id,
                undo: editField,
                redo: { name: e.target.value },
                message: t("edit_relationship", {
                  refName: e.target.value,
                  extra: "[name]",
                }),
              },
            ]);
            setRedoStack([]);
          }}
        />
      </div>
      <div className="flex justify-between items-center mb-3">
        <div className="me-3">
          <span className="font-semibold">{t("primary")}: </span>
          {tables[data.endTableId].name}
        </div>
        <div className="mx-1">
          <span className="font-semibold">{t("foreign")}: </span>
          {tables[data.startTableId].name}
        </div>
        <div className="ms-1">
          <Popover
            content={
              <div className="p-2 popover-theme">
                <Table
                  columns={columns}
                  dataSource={[
                    {
                      key: "1",
                      foreign: `${tables[data.startTableId]?.name}(${
                        tables[data.startTableId].fields[data.startFieldId]
                          ?.name
                      })`,
                      primary: `${tables[data.endTableId]?.name}(${
                        tables[data.endTableId].fields[data.endFieldId]?.name
                      })`,
                    },
                  ]}
                  pagination={false}
                  size="small"
                  bordered
                />
                <div className="mt-2">
                  <Button
                    icon={<IconLoopTextStroked />}
                    block
                    onClick={swapKeys}
                  >
                    {t("swap")}
                  </Button>
                </div>
                <div className="mt-2">
                  <Button icon={<IconRefresh />} block onClick={setDefaultName}>
                    Set Default Name
                  </Button>
                </div>
              </div>
            }
            trigger="click"
            position="rightTop"
            showArrow
          >
            <Button icon={<IconMore />} type="tertiary" />
          </Popover>
        </div>
      </div>
      <div className="font-semibold my-1">{t("relationship_type")}:</div>
      <Select
        optionList={Object.values(RelationshipType).map((v) => ({
          label: t(v),
          value: v,
        }))}
        value={data.relationshipType}
        className="w-full"
        onChange={changeRelationshipType}
      />
      {settings.notation !== "default" && (
        <>
          <div className="font-semibold my-1">{t("cardinality")}:</div>
          <div className="flex items-center w-full gap-2">
            <Select
              optionList={
                RelationshipCardinalities[data.relationshipType] &&
                RelationshipCardinalities[data.relationshipType].map((c) => ({
                  label: c.label,
                  value: c.label,
                }))
              }
              value={data.cardinality}
              className="w-full"
              onChange={changeCardinality}
              disabled={!data.relationshipType}
              placeholder={t("select_cardinality")}
            />
            {(settings.notation === Notation.CROWS_FOOT ||
              settings.notation === Notation.IDEF1X) && (
              <Button
                icon={<IconLoopTextStroked />}
                type="tertiary"
                onClick={toggleParentCardinality}
                aria-label="Toggle Parent Cardinality"
              />
            )}
          </div>
        </>
      )}
      <Row gutter={6} className="my-3">
        <Col span={12}>
          <div className="font-semibold">{t("on_update")}: </div>
          <Select
            optionList={Object.values(Constraint).map((v) => ({
              label: v,
              value: v,
            }))}
            value={data.updateConstraint}
            className="w-full"
            onChange={(value) => changeConstraint("update", value)}
          />
        </Col>
        <Col span={12}>
          <div className="font-semibold">{t("on_delete")}: </div>
          <Select
            optionList={Object.values(Constraint).map((v) => ({
              label: v,
              value: v,
            }))}
            value={data.deleteConstraint}
            className="w-full"
            onChange={(value) => changeConstraint("delete", value)}
          />
        </Col>
      </Row>
      <div className="my-2"></div>
      <Button
        icon={<IconDeleteStroked />}
        block
        type="danger"
        onClick={() => deleteRelationship(data.id)}
      >
        {t("delete")}
      </Button>
    </>
  );
}
