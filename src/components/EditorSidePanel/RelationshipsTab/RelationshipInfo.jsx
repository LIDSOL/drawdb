import {
  Row,
  Col,
  Select,
  Button,
  Popover,
  Table,
  Input,
} from "@douyinfe/semi-ui";
import { Toast } from "@douyinfe/semi-ui";
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
  SubtypeRestriction,
  Action,
  ObjectType,
  Notation,
} from "../../../data/constants";
import { useDiagram, useSettings, useUndoRedo } from "../../../hooks";
import i18n from "../../../i18n/i18n";
import { useTranslation } from "react-i18next";
import { useState } from "react";
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
  const { pushUndo } = useUndoRedo();
  const { settings } = useSettings();
  const {
    tables,
    setTables,
    setRelationships,
    deleteRelationship,
    updateRelationship,
    removeChildFromSubtype,
  } = useDiagram();
  const { t } = useTranslation();
  const [editField, setEditField] = useState({});
  // Helper function to get the effective end table ID and field ID
  const getEffectiveEndTable = () => {
    if (data.endTableId !== undefined) {
      return {
        tableId: data.endTableId,
        fieldId: data.endFieldId,
      };
    } else if (data.endTableIds && data.endTableIds.length > 0) {
      return {
        tableId: data.endTableIds[0],
        fieldId: data.endFieldIds ? data.endFieldIds[0] : 0,
      };
    }
    return { tableId: null, fieldId: null };
  };

  // Function to handle smart deletion of relationships
  const handleDeleteRelationship = () => {
    // For the main Delete button, always delete the entire relationship
    // This will handle all FK deletions automatically via deleteRelationship function
    deleteRelationship(data.id);
  };

  const effectiveEndTable = getEffectiveEndTable();

  const swapKeys = () => {
    // Disable swap for subtype relationships with multiple children
    if (data.subtype && data.endTableIds && data.endTableIds.length > 1) {
      console.warn(
        "Cannot swap keys for subtype relationships with multiple children",
      );
      return;
    }
    const effectiveEndTable = getEffectiveEndTable();
    const currentChildTableId = effectiveEndTable.tableId;
    const currentParentTableId = data.startTableId;
    // Find current child and parent tables
    const currentChildTable = tables.find(t => t.id === currentChildTableId);
    const currentParentTable = tables.find(t => t.id === currentParentTableId);
    if (!currentChildTable || !currentParentTable) {
      console.error("Cannot find child or parent table for swap operation");
      return;
    }

    // Find and collect FK fields in current child table that reference the current parent
    const currentFkFields = currentChildTable.fields.filter(field =>
      field.foreignK &&
      field.foreignKey &&
      field.foreignKey.tableId === currentParentTableId
    );

    // Prepare new FK fields for the new child table (current parent)
    const newChildTable = currentParentTable;
    const newParentTable = currentChildTable;
    const newParentPkFields = newParentTable.fields.filter(field => field.primary);
    if (newParentPkFields.length === 0) {
      Toast.error("Cannot swap: New parent table has no primary key fields");
      return;
    }

    // Find the primary key field that will be referenced by the new FK
    const newParentPkField = newParentTable.fields.find(field => field.primary);
    const newParentPkFieldId = newParentPkField ? newParentPkField.id : 0;

    // Generate new FK fields for the new child table
    const newFkFields = newParentPkFields.map((pkField, index) => ({
      name: `${pkField.name}`,
      type: pkField.type,
      size: pkField.size,
      notNull: true,
      unique: false,
      default: "",
      check: "",
      primary: false,
      increment: false,
      comment: `Foreign key referencing ${newParentTable.name}.${pkField.name}`,
      foreignK: true,
      foreignKey: {
        tableId: newParentTable.id,
        fieldId: pkField.id,
      },
      id: newChildTable.fields.reduce((maxId, f) => Math.max(maxId, typeof f.id === 'number' ? f.id : -1), -1) + 1 + index,
    }));

    // Store states for undo
    const undoChildTableFields = JSON.parse(JSON.stringify(currentChildTable.fields));
    const undoParentTableFields = JSON.parse(JSON.stringify(currentParentTable.fields));

    pushUndo({
      action: Action.EDIT,
      element: ObjectType.RELATIONSHIP,
      rid: data.id,
      undo: {
        startTableId: data.startTableId,
        startFieldId: data.startFieldId,
        endTableId: effectiveEndTable.tableId,
        endFieldId: effectiveEndTable.fieldId,
        // Store table states for FK restoration
        childTableFields: undoChildTableFields,
        parentTableFields: undoParentTableFields,
        childTableId: currentChildTableId,
        parentTableId: currentParentTableId,
        removedFkFields: currentFkFields,
        addedFkFields: newFkFields,
      },
      redo: {
        startTableId: effectiveEndTable.tableId,
        startFieldId: newParentPkFieldId, // Use the correct PK field ID
        endTableId: data.startTableId,
        endFieldId: newFkFields.length > 0 ? newFkFields[0].id : data.startFieldId,
        // Store table states for FK restoration
        childTableFields: undoParentTableFields,
        parentTableFields: undoChildTableFields,
        childTableId: currentParentTableId,
        parentTableId: currentChildTableId,
        removedFkFields: currentFkFields,
        addedFkFields: newFkFields,
      },
      message: t("edit_relationship", {
        refName: data.name,
        extra: "[swap keys]",
      }),
    });

    // Remove FK fields from current child table
    const updatedCurrentChildFields = currentChildTable.fields.filter(field =>
      !(field.foreignK &&
        field.foreignKey &&
        field.foreignKey.tableId === currentParentTableId)
    ).map((f, i) => ({ ...f, id: i }));

    // Add FK fields to new child table (current parent)
    const updatedNewChildFields = [...newChildTable.fields, ...newFkFields];

    // Update both tables
    setTables((prevTables) =>
      prevTables.map((table) => {
        if (table.id === currentChildTableId) {
          return { ...table, fields: updatedCurrentChildFields };
        } else if (table.id === currentParentTableId) {
          return { ...table, fields: updatedNewChildFields };
        }
        return table;
      })
    );

    // Update relationship with swapped roles
    setRelationships((prev) =>
      prev.map((e, idx) =>
        idx === data.id
          ? {
              ...e,
              name: `fk_${newChildTable.name}_${
                newFkFields.length > 0 ? newFkFields[0].name : 'field'
              }_${newParentTable.name}`,
              startTableId: currentChildTableId, // New parent (was child)
              startFieldId: newParentPkFieldId, // New parent PK field
              endTableId: currentParentTableId, // New child (was parent)
              endFieldId: newFkFields.length > 0 ? newFkFields[0].id : 0, // New FK field
              // Clear multi-child arrays when swapping back to single format
              endTableIds: undefined,
              endFieldIds: undefined,
            }
          : e,
      ),
    );
    Toast.success("Relationship swapped successfully with FK fields updated");
  };

  const changeRelationshipType = (value) => {
    const defaultCardinality =
      RelationshipCardinalities[value] && RelationshipCardinalities[value][0]
        ? RelationshipCardinalities[value][0].label
        : "";

    // Determine if this is switching to/from subtype
    const isBecomingSubtype = value === RelationshipType.SUBTYPE;
    const wasSubtype = data.relationshipType === RelationshipType.SUBTYPE;
    // Set default subtype_restriction when becoming subtype
    const defaultSubtypeRestriction = isBecomingSubtype
      ? SubtypeRestriction.DISJOINT_TOTAL
      : undefined;

    pushUndo({
      action: Action.EDIT,
      element: ObjectType.RELATIONSHIP,
      rid: data.id,
      undo: {
        relationshipType: data.relationshipType,
        cardinality: data.cardinality,
        subtype: data.subtype,
        subtype_restriction: data.subtype_restriction,
      },
      redo: {
        relationshipType: value,
        cardinality: defaultCardinality,
        subtype: isBecomingSubtype,
        subtype_restriction: defaultSubtypeRestriction,
      },
      message: t("edit_relationship", {
        refName: data.name,
        extra: "[relationship type]",
      }),
    });

    // When becoming subtype, convert existing FK fields to primary keys
    if (isBecomingSubtype && !wasSubtype) {
      const childTableId = data.endTableId;
      const parentTableId = data.startTableId;

      if (childTableId !== undefined && parentTableId !== undefined) {
        const childTable = tables.find((t) => t.id === childTableId);

        if (childTable) {
          // Find FK fields that reference the parent table
          const fkFieldsToPromote = childTable.fields.filter(
            (field) =>
              field.foreignK &&
              field.foreignKey &&
              field.foreignKey.tableId === parentTableId,
          );

          if (fkFieldsToPromote.length > 0) {
            // Update each FK field to be a primary key
            const updatedFields = childTable.fields.map((field) => {
              if (fkFieldsToPromote.some((fk) => fk.id === field.id)) {
                return { ...field, primary: true };
              }
              return field;
            });
            // Update the table with the new fields
            setTables((prevTables) =>
              prevTables.map((table) =>
                table.id === childTableId
                  ? { ...table, fields: updatedFields }
                  : table,
              ),
            );
          }
        }
      }
    }

    setRelationships((prev) =>
      prev.map((e, idx) =>
        idx === data.id
          ? {
              ...e,
              relationshipType: value,
              cardinality: defaultCardinality,
              subtype: isBecomingSubtype,
              subtype_restriction: defaultSubtypeRestriction,
            }
          : e,
      ),
    );
  };

  const changeCardinality = (value) => {
    pushUndo({
      action: Action.EDIT,
      element: ObjectType.RELATIONSHIP,
      rid: data.id,
      undo: { cardinality: data.cardinality },
      redo: { cardinality: value },
      message: t("edit_relationship", {
        refName: data.name,
        extra: "[cardinality]",
      }),
    });
    setRelationships((prev) =>
      prev.map((e, idx) =>
        idx === data.id ? { ...e, cardinality: value } : e,
      ),
    );
  };

  const changeSubtypeRestriction = (value) => {
    pushUndo({
      action: Action.EDIT,
      element: ObjectType.RELATIONSHIP,
      rid: data.id,
      undo: { subtype_restriction: data.subtype_restriction },
      redo: { subtype_restriction: value },
      message: t("edit_relationship", {
        refName: data.name,
        extra: "[subtype_restriction]",
      }),
    });
    setRelationships((prev) =>
      prev.map((e, idx) =>
        idx === data.id ? { ...e, subtype_restriction: value } : e,
      ),
    );
  };

  const changeConstraint = (key, value) => {
    const undoKey = `${key}Constraint`;
    pushUndo({
      action: Action.EDIT,
      element: ObjectType.RELATIONSHIP,
      rid: data.id,
      undo: { [undoKey]: data[undoKey] },
      redo: { [undoKey]: value },
      message: t("edit_relationship", {
        refName: data.name,
        extra: "[constraint]",
      }),
    });
    setRelationships((prev) =>
      prev.map((e, idx) => (idx === data.id ? { ...e, [undoKey]: value } : e)),
    );
  };

  const toggleParentCardinality = () => {
    // Get foreign key fields from the child table (end table) that reference the parent table (start table)
    const effectiveEndTable = getEffectiveEndTable();
    const childTable =
      effectiveEndTable.tableId !== null
        ? tables[effectiveEndTable.tableId]
        : null;
    if (!childTable) {
      console.warn("Child table not found for relationship", data.id);
      return;
    }

    // Find FK fields in the child table that reference the parent table
    const fkFields = childTable.fields.filter(
      (field) =>
        field.foreignK &&
        field.foreignKey &&
        field.foreignKey.tableId === data.startTableId,
    );
    if (fkFields.length === 0) {
      console.warn(
        "No FK fields found in child table",
        childTable.id,
        "referencing parent table",
        data.startTableId,
      );
      return;
    }

    const fkIsToPk = fkFields[0].primary;
    if (fkIsToPk) {
      Toast.info(t("Null_not_allowed"));
      return;
    }

    const fkFieldIds = fkFields.map((field) => field.id);
    const newNotNullValue = !fkFields[0].notNull;
    const undoFields = fkFields.map((field) => ({
      id: field.id,
      notNull: field.notNull,
    }));
    const redoFields = fkFields.map((field) => ({
      id: field.id,
      notNull: newNotNullValue,
    }));

    pushUndo({
      action: Action.EDIT,
      element: ObjectType.TABLE,
      component: "field",
      tid: effectiveEndTable.tableId,
      fid: fkFieldIds,
      undo: { fields: undoFields },
      redo: { fields: redoFields },
      message: t("edit_relationship", {
        refName: data.name,
        extra: "[parent cardinality]",
      }),
    });

    setTables((prevTables) =>
      prevTables.map((table) => {
        if (table.id === effectiveEndTable.tableId) {
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

    pushUndo({
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
    });
    updateRelationship(data.id, { name: defaultName });
  };

  const removeSubtypeHierarchy = (indexToRemove) => {
    if (!data.endTableIds || data.endTableIds.length <= 1) {
      return;
    }

    // Get the child table ID to remove
    const childTableToRemove = data.endTableIds[indexToRemove];
    // Use removeChildFromSubtype which handles both relationship update AND FK deletion
    removeChildFromSubtype(data.id, childTableToRemove);
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
            pushUndo({
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
            });
          }}
        />
      </div>
      <div className="flex justify-between items-center mb-3">
        <div className="me-3">
          <span className="font-semibold">{t("primary")}: </span>
          {effectiveEndTable.tableId !== null
            ? tables[effectiveEndTable.tableId]?.name
            : "N/A"}
        </div>
        <div className="mx-1">
          <span className="font-semibold">{t("foreign")}: </span>
          {tables[data.startTableId]?.name}
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
                        tables[data.startTableId]?.fields[data.startFieldId]
                          ?.name
                      })`,
                      primary: `${effectiveEndTable.tableId !== null ? tables[effectiveEndTable.tableId]?.name : "N/A"}(${
                        effectiveEndTable.tableId !== null &&
                        effectiveEndTable.fieldId !== null
                          ? tables[effectiveEndTable.tableId]?.fields[
                              effectiveEndTable.fieldId
                            ]?.name
                          : "N/A"
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
                    disabled={
                      data.subtype &&
                      data.endTableIds &&
                      data.endTableIds.length > 1
                    }
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
      {settings.notation !== "default" &&
        data.relationshipType !== RelationshipType.SUBTYPE && (
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
      {/* Subtype restriction - only available when relationship type is SUBTYPE */}
      {data.relationshipType === RelationshipType.SUBTYPE &&
        settings.notation !== Notation.DEFAULT && (
          <Row gutter={6} className="my-3">
            <div className="font-semibold my-1">
              {t("subtype_restriction")}:
            </div>
            <Select
              optionList={Object.values(SubtypeRestriction).map((v) => ({
                label: t(v),
                value: v,
              }))}
              value={data.subtype_restriction}
              className="w-full"
              onChange={changeSubtypeRestriction}
            />
          </Row>
        )}

      {/* Subtype hierarchy management - show multiple connected tables */}
      {data.relationshipType === RelationshipType.SUBTYPE &&
        data.endTableIds &&
        data.endTableIds.length > 1 && (
          <div className="my-3">
            <div className="font-semibold my-1">
              {t("subtype")} {t("tables")}:
            </div>
            <div className="space-y-2">
              {data.endTableIds.map((endTableId, index) => (
                <div
                  key={`${endTableId}-${index}`}
                  className="flex items-center justify-between p-2 border rounded "
                >
                  <span className="text-sm">
                    {tables[data.startTableId]?.name} →{" "}
                    {tables[endTableId]?.name}
                  </span>
                  <Button
                    icon={<IconDeleteStroked />}
                    type="danger"
                    size="small"
                    onClick={() => removeSubtypeHierarchy(index)}
                  >
                    {t("delete")}
                  </Button>
                </div>
              ))}
            </div>
          </div>
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
        onClick={handleDeleteRelationship}
      >
        {t("delete_relationship_")}
      </Button>
    </>
  );
}
