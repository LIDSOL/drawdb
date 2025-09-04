import { useRef, useState, useEffect } from "react";
import {
  Action,
  RelationshipType,
  RelationshipCardinalities,
  Constraint,
  darkBgTheme,
  ObjectType,
  tableHeaderHeight,
  tableFieldHeight,
  tableColorStripHeight,
  Notation,
  Tab,
} from "../../data/constants";
import { Toast, Modal, Input } from "@douyinfe/semi-ui";
import Table from "./Table";
import Area from "./Area";
import Relationship from "./Relationship";
import Note from "./Note";
import TableContextMenu from "./TableContextMenu";
import RelationshipContextMenu from "./RelationshipContextMenu";
import AreaContextMenu from "./AreaContextMenu";
import NoteContextMenu from "./NoteContextMenu";
import CanvasContextMenu from "./CanvasContextMenu";
import FieldContextMenu from "./FieldContextMenu";
import {
  useCanvas,
  useSettings,
  useTransform,
  useDiagram,
  useUndoRedo,
  useSelect,
  useAreas,
  useNotes,
  useLayout,
} from "../../hooks";
import { useTranslation } from "react-i18next";
import { useEventListener } from "usehooks-ts";
import { areFieldsCompatible } from "../../utils/utils";
import { useLocation, useNavigate } from "react-router-dom";

export default function Canvas() {
  const { t } = useTranslation();
  const { transform, setTransform } = useTransform();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const focusPosition = location.state?.focusPosition;
    if (focusPosition) {
      setTransform((prev) => ({
        ...prev,
        pan: focusPosition,
      }));
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate, setTransform]);

  const [isAreaSelecting, setIsAreaSelecting] = useState(false);
  const [isDrawingSelectionArea, setIsDrawingSelectionArea] = useState(false);
  const [selectionArea, setSelectionArea] = useState({
    startX: 0,
    startY: 0,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const [dragStart, setDragStart] = useState({
    x: 0,
    y: 0,
  });

  const canvasRef = useRef(null);
  const canvasContextValue = useCanvas();
  const {
    canvas: { viewBox },
    pointer,
  } = canvasContextValue;

  const {
    tables,
    updateTable,
    relationships,
    addRelationship,
    addTable,
    deleteTable,
    addChildToSubtype,
    deleteRelationship,
    updateRelationship,
    setRelationships,
    deleteField,
  } = useDiagram();
  const { areas, updateArea, addArea, deleteArea } = useAreas();
  const { notes, updateNote, addNote, deleteNote } = useNotes();
  const { layout } = useLayout();
  const { settings } = useSettings();
  const { undoStack, redoStack, setRedoStack, setUndoStack, pushUndo } =
    useUndoRedo();

  const { selectedElement, setSelectedElement } = useSelect();
  const [dragging, setDragging] = useState({
    element: ObjectType.NONE,
    id: -1,
    prevX: 0,
    prevY: 0,
  });
  const [resizing, setResizing] = useState({
    element: ObjectType.NONE,
    id: -1,
    prevX: 0,
    prevY: 0,
  });
  const [linking, setLinking] = useState(false);
  const [linkingLine, setLinkingLine] = useState({
    startTableId: -1,
    startFieldId: -1,
    endTableId: -1,
    endFieldId: -1,
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
  });

  // Estado para conexiones de jerarquía
  const [hierarchyLinking, setHierarchyLinking] = useState(false);
  const [hierarchyLinkingLine, setHierarchyLinkingLine] = useState({
    relationshipId: -1,
    subtypePoint: { x: 0, y: 0 },
    endTableId: -1,
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
  });

  const [grabOffset, setGrabOffset] = useState({ x: 0, y: 0 });
  const [hoveredTable, setHoveredTable] = useState({
    tableId: -1,
    field: -2,
  });
  const [panning, setPanning] = useState({
    isPanning: false,
    panStart: { x: 0, y: 0 },
    cursorStart: { x: 0, y: 0 },
  });
  const [areaResize, setAreaResize] = useState({ id: -1, dir: "none" });
  const [initCoords, setInitCoords] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    pointerX: 0,
    pointerY: 0,
  });

  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    tableId: null,
  });

  const [relationshipContextMenu, setRelationshipContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    relationshipId: null,
  });

  const [areaContextMenu, setAreaContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    areaId: null,
  });

  const [noteContextMenu, setNoteContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    noteId: null,
  });

  const [canvasContextMenu, setCanvasContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    diagramX: 0,
    diagramY: 0,
  });

  const [fieldContextMenu, setFieldContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    tableId: null,
    fieldId: null,
  });

  const [renameModal, setRenameModal] = useState({
    visible: false,
    tableId: null,
    currentName: "",
    newName: "",
  });

  const [relationshipRenameModal, setRelationshipRenameModal] = useState({
    visible: false,
    relationshipId: null,
    currentName: "",
    newName: "",
  });

  const [areaRenameModal, setAreaRenameModal] = useState({
    visible: false,
    areaId: null,
    currentName: "",
    newName: "",
  });

  const [noteRenameModal, setNoteRenameModal] = useState({
    visible: false,
    noteId: null,
    currentName: "",
    newName: "",
  });

  const [fieldRenameModal, setFieldRenameModal] = useState({
    visible: false,
    tableId: null,
    fieldId: null,
    currentName: "",
    newName: "",
  });

  const [foreignKeyRenameModal, setForeignKeyRenameModal] = useState({
    visible: false,
    tableId: null,
    fieldId: null,
    newName: "",
    relatedField: null, // { tableId, fieldId, tableName, fieldName }
  });

  const fieldRenameInputRef = useRef(null);
  const tableRenameInputRef = useRef(null);
  const relationshipRenameInputRef = useRef(null);

  // Auto-select text when field rename modal opens
  useEffect(() => {
    if (fieldRenameModal.visible && fieldRenameInputRef.current) {
      const timer = setTimeout(() => {
        if (fieldRenameInputRef.current) {
          fieldRenameInputRef.current.focus();
          fieldRenameInputRef.current.select();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [fieldRenameModal.visible]);

  // Auto-select text when table rename modal opens
  useEffect(() => {
    if (renameModal.visible && tableRenameInputRef.current) {
      const timer = setTimeout(() => {
        if (tableRenameInputRef.current) {
          tableRenameInputRef.current.focus();
          tableRenameInputRef.current.select();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [renameModal.visible]);

  // Auto-select text when relationship rename modal opens
  useEffect(() => {
    if (relationshipRenameModal.visible && relationshipRenameInputRef.current) {
      const timer = setTimeout(() => {
        if (relationshipRenameInputRef.current) {
          relationshipRenameInputRef.current.focus();
          relationshipRenameInputRef.current.select();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [relationshipRenameModal.visible]);

  const handleTableContextMenu = (e, tableId, x, y) => {
    e.preventDefault();
    e.stopPropagation();

    // Close field context menu
    handleFieldContextMenuClose();

    setContextMenu({
      visible: true,
      x: x,
      y: y,
      tableId: tableId,
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu({
      visible: false,
      x: 0,
      y: 0,
      tableId: null,
    });
  };

  const handleRelationshipContextMenu = (e, relationshipId, x, y) => {
    e.preventDefault();
    e.stopPropagation();

    // Close field context menu
    handleFieldContextMenuClose();

    setRelationshipContextMenu({
      visible: true,
      x: x,
      y: y,
      relationshipId: relationshipId,
    });
  };

  const handleRelationshipContextMenuClose = () => {
    setRelationshipContextMenu({
      visible: false,
      x: 0,
      y: 0,
      relationshipId: null,
    });
  };

  const handleEditTable = () => {
    if (contextMenu.tableId !== null) {
      if (layout.sidebar) {
        setSelectedElement((prev) => ({
          ...prev,
          element: ObjectType.TABLE,
          id: contextMenu.tableId,
          currentTab: Tab.TABLES,
          open: true,
        }));
        setTimeout(() => {
          document
            .getElementById(`scroll_table_${contextMenu.tableId}`)
            ?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        setSelectedElement((prev) => ({
          ...prev,
          element: ObjectType.TABLE,
          id: contextMenu.tableId,
          open: true,
        }));
      }
    }
  };

  const handleRenameTable = () => {
    if (contextMenu.tableId !== null) {
      const table = tables.find((t) => t.id === contextMenu.tableId);
      if (table) {
        setRenameModal({
          visible: true,
          tableId: contextMenu.tableId,
          currentName: table.name,
          newName: table.name,
        });
      }
    }
  };

  const handleRenameConfirm = () => {
    if (renameModal.tableId !== null && renameModal.newName.trim()) {
      updateTable(renameModal.tableId, {
        name: renameModal.newName.trim(),
      });
      setRenameModal({
        visible: false,
        tableId: null,
        currentName: "",
        newName: "",
      });
      Toast.success(t("table_renamed_success"));
    }
  };

  const handleRenameCancel = () => {
    setRenameModal({
      visible: false,
      tableId: null,
      currentName: "",
      newName: "",
    });
  };

  const handleRelationshipRenameConfirm = () => {
    if (
      relationshipRenameModal.relationshipId !== null &&
      relationshipRenameModal.newName.trim()
    ) {
      updateRelationship(relationshipRenameModal.relationshipId, {
        name: relationshipRenameModal.newName.trim(),
      });
      setRelationshipRenameModal({
        visible: false,
        relationshipId: null,
        currentName: "",
        newName: "",
      });
    }
  };

  const handleRelationshipRenameCancel = () => {
    setRelationshipRenameModal({
      visible: false,
      relationshipId: null,
      currentName: "",
      newName: "",
    });
  };

  const handleAddField = () => {
    if (contextMenu.tableId !== null) {
      const table = tables.find((t) => t.id === contextMenu.tableId);
      if (table) {
        const maxId = table.fields.reduce(
          (max, field) =>
            Math.max(max, typeof field.id === "number" ? field.id : -1),
          -1,
        );

        const newField = {
          id: maxId + 1,
          name: `field_${maxId + 1}`,
          type: "VARCHAR",
          size: "255",
          notNull: false,
          unique: false,
          primary: false,
          increment: false,
          default: "",
          check: "",
          comment: "",
          foreignK: false,
        };

        const updatedFields = [...table.fields, newField];
        updateTable(contextMenu.tableId, {
          fields: updatedFields,
        });

        Toast.success(t("field_added_success"));

        setSelectedElement({
          element: ObjectType.TABLE,
          id: contextMenu.tableId,
          open: true,
        });
      }
    }
  };

  const handleDeleteTable = () => {
    if (contextMenu.tableId !== null) {
      deleteTable(contextMenu.tableId);
    }
  };

  // Field context menu handlers
  const handleFieldContextMenu = (e, tableId, fieldId, x, y) => {
    e.preventDefault();
    e.stopPropagation();

    // Close all other context menus
    handleContextMenuClose();
    handleRelationshipContextMenuClose();
    handleAreaContextMenuClose();
    handleNoteContextMenuClose();
    handleCanvasContextMenuClose();

    setFieldContextMenu({
      visible: true,
      x: x,
      y: y,
      tableId: tableId,
      fieldId: fieldId,
    });
  };

  const handleFieldContextMenuClose = () => {
    setFieldContextMenu({
      visible: false,
      x: 0,
      y: 0,
      tableId: null,
      fieldId: null,
    });
  };

  const handleEditField = () => {
    if (
      fieldContextMenu.tableId !== null &&
      fieldContextMenu.fieldId !== null
    ) {
      if (layout.sidebar) {
        setSelectedElement((prev) => ({
          ...prev,
          element: ObjectType.TABLE,
          id: fieldContextMenu.tableId,
          currentTab: Tab.TABLES,
          open: true,
        }));
        setTimeout(() => {
          document
            .getElementById(`scroll_table_${fieldContextMenu.tableId}`)
            ?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        setSelectedElement((prev) => ({
          ...prev,
          element: ObjectType.TABLE,
          id: fieldContextMenu.tableId,
          open: true,
        }));
      }
    }
  };

  const handleDeleteField = () => {
    if (
      fieldContextMenu.tableId !== null &&
      fieldContextMenu.fieldId !== null
    ) {
      const table = tables.find((t) => t.id === fieldContextMenu.tableId);
      const field = table?.fields.find(
        (f) => f.id === fieldContextMenu.fieldId,
      );
      if (table && field) {
        deleteField(field, fieldContextMenu.tableId);
      }
    }
  };

  const handleToggleFieldPrimaryKey = () => {
    if (
      fieldContextMenu.tableId !== null &&
      fieldContextMenu.fieldId !== null
    ) {
      const table = tables.find((t) => t.id === fieldContextMenu.tableId);
      const field = table?.fields.find(
        (f) => f.id === fieldContextMenu.fieldId,
      );
      if (table && field) {
        const updatedFields = table.fields.map((f) =>
          f.id === fieldContextMenu.fieldId
            ? {
                ...f,
                primary: !f.primary,
                // When setting as primary key, ensure notNull and unique are true
                notNull: !f.primary ? true : f.notNull,
                unique: !f.primary ? true : f.unique,
              }
            : f,
        );
        updateTable(fieldContextMenu.tableId, { fields: updatedFields });
      }
    }
  };

  const handleToggleFieldNotNull = () => {
    if (
      fieldContextMenu.tableId !== null &&
      fieldContextMenu.fieldId !== null
    ) {
      const table = tables.find((t) => t.id === fieldContextMenu.tableId);
      const field = table?.fields.find(
        (f) => f.id === fieldContextMenu.fieldId,
      );
      if (table && field) {
        // If trying to set a primary key as nullable, show warning and don't change
        if (field.primary && field.notNull) {
          Toast.info(t("pk_has_not_be_null"));
          return;
        }

        // Primary key fields cannot be null, so don't allow setting notNull to false
        const newNotNull = field.primary ? true : !field.notNull;
        const updatedFields = table.fields.map((f) =>
          f.id === fieldContextMenu.fieldId ? { ...f, notNull: newNotNull } : f,
        );
        updateTable(fieldContextMenu.tableId, { fields: updatedFields });
      }
    }
  };

  const handleToggleFieldUnique = () => {
    if (
      fieldContextMenu.tableId !== null &&
      fieldContextMenu.fieldId !== null
    ) {
      const table = tables.find((t) => t.id === fieldContextMenu.tableId);
      const field = table?.fields.find(
        (f) => f.id === fieldContextMenu.fieldId,
      );
      if (table && field) {
        // If trying to remove unique from a primary key, show warning and don't change
        if (field.primary && field.unique) {
          Toast.info(t("pk_has_to_be_unique"));
          return;
        }

        const updatedFields = table.fields.map((f) =>
          f.id === fieldContextMenu.fieldId ? { ...f, unique: !f.unique } : f,
        );
        updateTable(fieldContextMenu.tableId, { fields: updatedFields });
      }
    }
  };

  const handleToggleFieldAutoIncrement = () => {
    if (
      fieldContextMenu.tableId !== null &&
      fieldContextMenu.fieldId !== null
    ) {
      const table = tables.find((t) => t.id === fieldContextMenu.tableId);
      const field = table?.fields.find(
        (f) => f.id === fieldContextMenu.fieldId,
      );
      if (table && field) {
        const updatedFields = table.fields.map((f) =>
          f.id === fieldContextMenu.fieldId
            ? { ...f, increment: !f.increment }
            : f,
        );
        updateTable(fieldContextMenu.tableId, { fields: updatedFields });
      }
    }
  };

  const handleEditRelationship = () => {
    if (relationshipContextMenu.relationshipId !== null) {
      if (layout.sidebar) {
        setSelectedElement((prev) => ({
          ...prev,
          element: ObjectType.RELATIONSHIP,
          id: relationshipContextMenu.relationshipId,
          currentTab: Tab.RELATIONSHIPS,
          open: true,
        }));
        setTimeout(() => {
          document
            .getElementById(
              `scroll_relationship_${relationshipContextMenu.relationshipId}`,
            )
            ?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        setSelectedElement((prev) => ({
          ...prev,
          element: ObjectType.RELATIONSHIP,
          id: relationshipContextMenu.relationshipId,
          open: true,
        }));
      }
      handleRelationshipContextMenuClose();
    }
  };

  const handleRenameRelationship = () => {
    if (relationshipContextMenu.relationshipId !== null) {
      const relationship = relationships.find(
        (r) => r.id === relationshipContextMenu.relationshipId,
      );
      if (relationship) {
        setRelationshipRenameModal({
          visible: true,
          relationshipId: relationshipContextMenu.relationshipId,
          currentName: relationship.name,
          newName: relationship.name,
        });
        handleRelationshipContextMenuClose();
      }
    }
  };

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

  const handleSwapRelationshipDirection = () => {
    if (relationshipContextMenu.relationshipId !== null) {
      const relationship =
        relationships[relationshipContextMenu.relationshipId];
      if (relationship) {
        const shouldUpdateName = isDefaultRelationshipName(
          relationship,
          tables,
        );

        const undoData = {
          startTableId: relationship.startTableId,
          startFieldId: relationship.startFieldId,
          endTableId: relationship.endTableId,
          endFieldId: relationship.endFieldId,
        };

        const redoData = {
          startTableId: relationship.endTableId,
          startFieldId: relationship.endFieldId,
          endTableId: relationship.startTableId,
          endFieldId: relationship.startFieldId,
        };

        if (shouldUpdateName) {
          undoData.name = relationship.name;
          // Generate the new name after swapping
          const newStartTable = tables.find(
            (t) => t.id === relationship.endTableId,
          );
          const newEndTable = tables.find(
            (t) => t.id === relationship.startTableId,
          );
          const newEndField = newEndTable?.fields?.find(
            (f) => f.id === relationship.startFieldId,
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
            rid: relationshipContextMenu.relationshipId,
            undo: undoData,
            redo: redoData,
            message: `Swap direction for ${relationship.name}`,
          },
        ]);
        setRedoStack([]);

        setRelationships((prev) =>
          prev.map((e, idx) => {
            if (idx === relationshipContextMenu.relationshipId) {
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
      }
      handleRelationshipContextMenuClose();
    }
  };

  const handleChangeRelationshipType = (newType) => {
    if (relationshipContextMenu.relationshipId !== null) {
      const relationship =
        relationships[relationshipContextMenu.relationshipId];
      if (relationship) {
        const defaultCardinality =
          RelationshipCardinalities[newType] &&
          RelationshipCardinalities[newType][0]
            ? RelationshipCardinalities[newType][0].label
            : "";

        setUndoStack((prev) => [
          ...prev,
          {
            action: Action.EDIT,
            element: ObjectType.RELATIONSHIP,
            rid: relationshipContextMenu.relationshipId,
            undo: {
              relationshipType: relationship.relationshipType,
              cardinality: relationship.cardinality,
            },
            redo: {
              relationshipType: newType,
              cardinality: defaultCardinality,
            },
            message: `Change type for ${relationship.name}`,
          },
        ]);
        setRedoStack([]);
        setRelationships((prev) =>
          prev.map((e, idx) =>
            idx === relationshipContextMenu.relationshipId
              ? {
                  ...e,
                  relationshipType: newType,
                  cardinality: defaultCardinality,
                }
              : e,
          ),
        );
      }
      handleRelationshipContextMenuClose();
    }
  };

  const handleChangeRelationshipCardinality = (newCardinality) => {
    if (relationshipContextMenu.relationshipId !== null) {
      const relationship =
        relationships[relationshipContextMenu.relationshipId];
      if (relationship) {
        setUndoStack((prev) => [
          ...prev,
          {
            action: Action.EDIT,
            element: ObjectType.RELATIONSHIP,
            rid: relationshipContextMenu.relationshipId,
            undo: { cardinality: relationship.cardinality },
            redo: { cardinality: newCardinality },
            message: `Change cardinality for ${relationship.name}`,
          },
        ]);
        setRedoStack([]);
        setRelationships((prev) =>
          prev.map((e, idx) =>
            idx === relationshipContextMenu.relationshipId
              ? { ...e, cardinality: newCardinality }
              : e,
          ),
        );
      }
      handleRelationshipContextMenuClose();
    }
  };

  const handleDeleteRelationship = () => {
    if (relationshipContextMenu.relationshipId !== null) {
      deleteRelationship(relationshipContextMenu.relationshipId);
      handleRelationshipContextMenuClose();
    }
  };

  const handleSetDefaultRelationshipName = () => {
    if (relationshipContextMenu.relationshipId !== null) {
      const relationship =
        relationships[relationshipContextMenu.relationshipId];
      if (relationship) {
        const startTable = tables.find(
          (t) => t.id === relationship.startTableId,
        );
        const endTable = tables.find((t) => t.id === relationship.endTableId);

        if (!startTable || !endTable) return;

        const startField = startTable.fields?.find(
          (f) => f.id === relationship.startFieldId,
        );
        const endField = endTable.fields?.find(
          (f) => f.id === relationship.endFieldId,
        );

        if (!startField || !endField) return;

        const defaultName = `fk_${endTable.name}_${endField.name}_${startTable.name}`;

        if (relationship.name === defaultName) {
          handleRelationshipContextMenuClose();
          return; // Already has default name
        }

        setUndoStack((prev) => [
          ...prev,
          {
            action: Action.EDIT,
            element: ObjectType.RELATIONSHIP,
            rid: relationshipContextMenu.relationshipId,
            undo: { name: relationship.name },
            redo: { name: defaultName },
            message: `Set default name for ${defaultName}`,
          },
        ]);
        setRedoStack([]);
        updateRelationship(relationshipContextMenu.relationshipId, {
          name: defaultName,
        });
      }
      handleRelationshipContextMenuClose();
    }
  };

  // Area context menu handlers
  const handleAreaContextMenu = (e, areaId, x, y) => {
    e.preventDefault();
    e.stopPropagation();

    // Close field context menu
    handleFieldContextMenuClose();

    setAreaContextMenu({
      visible: true,
      x: x,
      y: y,
      areaId: areaId,
    });
  };

  const handleAreaContextMenuClose = () => {
    setAreaContextMenu({
      visible: false,
      x: 0,
      y: 0,
      areaId: null,
    });
  };

  const handleEditArea = () => {
    if (areaContextMenu.areaId !== null) {
      if (layout.sidebar) {
        setSelectedElement((prev) => ({
          ...prev,
          element: ObjectType.AREA,
          id: areaContextMenu.areaId,
          currentTab: Tab.AREAS,
          open: true,
        }));
        // Scroll to the area after a brief delay to ensure the tab has switched
        setTimeout(() => {
          document
            .getElementById(`scroll_area_${areaContextMenu.areaId}`)
            ?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        setSelectedElement((prev) => ({
          ...prev,
          element: ObjectType.AREA,
          id: areaContextMenu.areaId,
          open: true,
        }));
      }
    }
  };

  const handleRenameArea = () => {
    if (areaContextMenu.areaId !== null) {
      const area = areas.find((a) => a.id === areaContextMenu.areaId);
      if (area) {
        setAreaRenameModal({
          visible: true,
          areaId: areaContextMenu.areaId,
          currentName: area.name,
          newName: area.name,
        });
      }
    }
  };

  const handleAreaRenameConfirm = () => {
    if (areaRenameModal.areaId !== null && areaRenameModal.newName.trim()) {
      updateArea(areaRenameModal.areaId, {
        name: areaRenameModal.newName.trim(),
      });
      setAreaRenameModal({
        visible: false,
        areaId: null,
        currentName: "",
        newName: "",
      });
      Toast.success(t("area_renamed_success"));
    }
  };

  const handleAreaRenameCancel = () => {
    setAreaRenameModal({
      visible: false,
      areaId: null,
      currentName: "",
      newName: "",
    });
  };

  const handleAreaChangeColor = () => {
    if (areaContextMenu.areaId !== null) {
      if (layout.sidebar) {
        setSelectedElement((prev) => ({
          ...prev,
          element: ObjectType.AREA,
          id: areaContextMenu.areaId,
          currentTab: Tab.AREAS,
          open: true,
        }));
        setTimeout(() => {
          document
            .getElementById(`scroll_area_${areaContextMenu.areaId}`)
            ?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        setSelectedElement((prev) => ({
          ...prev,
          element: ObjectType.AREA,
          id: areaContextMenu.areaId,
          open: true,
        }));
      }
    }
  };

  const handleDeleteArea = () => {
    if (areaContextMenu.areaId !== null) {
      deleteArea(areaContextMenu.areaId, true);
      handleAreaContextMenuClose();
    }
  };

  // Note context menu handlers
  const handleNoteContextMenu = (e, noteId, x, y) => {
    e.preventDefault();
    e.stopPropagation();

    // Close field context menu
    handleFieldContextMenuClose();

    setNoteContextMenu({
      visible: true,
      x: x,
      y: y,
      noteId: noteId,
    });
  };

  const handleNoteContextMenuClose = () => {
    setNoteContextMenu({
      visible: false,
      x: 0,
      y: 0,
      noteId: null,
    });
  };

  const handleEditNote = () => {
    if (noteContextMenu.noteId !== null) {
      if (layout.sidebar) {
        setSelectedElement((prev) => ({
          ...prev,
          element: ObjectType.NOTE,
          id: noteContextMenu.noteId,
          currentTab: Tab.NOTES,
          open: true,
        }));
        setTimeout(() => {
          document
            .getElementById(`scroll_note_${noteContextMenu.noteId}`)
            ?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        setSelectedElement((prev) => ({
          ...prev,
          element: ObjectType.NOTE,
          id: noteContextMenu.noteId,
          open: true,
        }));
      }
    }
  };

  const handleRenameNote = () => {
    if (noteContextMenu.noteId !== null) {
      const note = notes.find((n) => n.id === noteContextMenu.noteId);
      if (note) {
        setNoteRenameModal({
          visible: true,
          noteId: noteContextMenu.noteId,
          currentName: note.title,
          newName: note.title,
        });
      }
    }
  };

  const handleNoteRenameConfirm = () => {
    if (noteRenameModal.noteId !== null && noteRenameModal.newName.trim()) {
      updateNote(noteRenameModal.noteId, {
        title: noteRenameModal.newName.trim(),
      });
      setNoteRenameModal({
        visible: false,
        noteId: null,
        currentName: "",
        newName: "",
      });
      Toast.success(t("note_renamed_success"));
    }
  };

  const handleNoteRenameCancel = () => {
    setNoteRenameModal({
      visible: false,
      noteId: null,
      currentName: "",
      newName: "",
    });
  };

  const handleFieldRename = () => {
    if (
      fieldContextMenu.tableId !== null &&
      fieldContextMenu.fieldId !== null
    ) {
      const table = tables.find((t) => t.id === fieldContextMenu.tableId);
      const field = table?.fields.find(
        (f) => f.id === fieldContextMenu.fieldId,
      );

      if (field) {
        setFieldRenameModal({
          visible: true,
          tableId: fieldContextMenu.tableId,
          fieldId: fieldContextMenu.fieldId,
          currentName: field.name,
          newName: field.name,
        });
      }
    }
    handleFieldContextMenuClose();
  };

  const handleFieldRenameConfirm = () => {
    if (
      fieldRenameModal.tableId !== null &&
      fieldRenameModal.fieldId !== null &&
      fieldRenameModal.newName.trim()
    ) {
      // Check if this field is part of a foreign key relationship
      const relatedField = findRelatedForeignKeyField(
        fieldRenameModal.tableId,
        fieldRenameModal.fieldId,
      );

      if (relatedField) {
        // Show foreign key confirmation modal
        setForeignKeyRenameModal({
          visible: true,
          tableId: fieldRenameModal.tableId,
          fieldId: fieldRenameModal.fieldId,
          newName: fieldRenameModal.newName.trim(),
          relatedField: relatedField,
        });
        setFieldRenameModal({
          visible: false,
          tableId: null,
          fieldId: null,
          currentName: "",
          newName: "",
        });
      } else {
        // No foreign key relationship, rename directly
        renameFieldOnly(
          fieldRenameModal.tableId,
          fieldRenameModal.fieldId,
          fieldRenameModal.newName.trim(),
        );
        setFieldRenameModal({
          visible: false,
          tableId: null,
          fieldId: null,
          currentName: "",
          newName: "",
        });
        Toast.success(t("field_renamed_success"));
      }
    }
  };

  const findRelatedForeignKeyField = (tableId, fieldId) => {
    for (const relationship of relationships) {
      // Check if this field is the foreign key (start field)
      if (
        relationship.startTableId === tableId &&
        relationship.startFieldId === fieldId
      ) {
        const relatedTable = tables.find(
          (t) => t.id === relationship.endTableId,
        );
        const relatedField = relatedTable?.fields.find(
          (f) => f.id === relationship.endFieldId,
        );
        if (relatedTable && relatedField) {
          return {
            tableId: relationship.endTableId,
            fieldId: relationship.endFieldId,
            tableName: relatedTable.name,
            fieldName: relatedField.name,
          };
        }
      }
      // Check if this field is the referenced field (end field)
      if (
        relationship.endTableId === tableId &&
        relationship.endFieldId === fieldId
      ) {
        const relatedTable = tables.find(
          (t) => t.id === relationship.startTableId,
        );
        const relatedField = relatedTable?.fields.find(
          (f) => f.id === relationship.startFieldId,
        );
        if (relatedTable && relatedField) {
          return {
            tableId: relationship.startTableId,
            fieldId: relationship.startFieldId,
            tableName: relatedTable.name,
            fieldName: relatedField.name,
          };
        }
      }
    }
    return null;
  };

  const renameFieldOnly = (tableId, fieldId, newName) => {
    const table = tables.find((t) => t.id === tableId);
    if (table) {
      const updatedFields = table.fields.map((f) =>
        f.id === fieldId ? { ...f, name: newName } : f,
      );
      updateTable(tableId, { fields: updatedFields });
    }
  };

  const renameBothFields = (
    tableId,
    fieldId,
    newName,
    relatedTableId,
    relatedFieldId,
  ) => {
    // Rename the original field
    renameFieldOnly(tableId, fieldId, newName);
    // Rename the related field
    renameFieldOnly(relatedTableId, relatedFieldId, newName);

    // Update relationship names to default when foreign key fields are renamed
    updateRelationshipNamesAfterFieldRename(
      tableId,
      fieldId,
      newName,
      relatedTableId,
      relatedFieldId,
      newName,
    );
  };

  const updateRelationshipNamesAfterFieldRename = (
    tableId,
    fieldId,
    newFieldName,
    relatedTableId,
    relatedFieldId,
    relatedNewFieldName,
  ) => {
    // Find relationships that involve these fields
    const relatedRelationships = relationships.filter(
      (r) =>
        (r.startTableId === tableId && r.startFieldId === fieldId) ||
        (r.endTableId === tableId && r.endFieldId === fieldId) ||
        (r.startTableId === relatedTableId &&
          r.startFieldId === relatedFieldId) ||
        (r.endTableId === relatedTableId && r.endFieldId === relatedFieldId),
    );

    // Update each relationship with a new default name
    relatedRelationships.forEach((relationship) => {
      const startTable = tables.find((t) => t.id === relationship.startTableId);
      const endTable = tables.find((t) => t.id === relationship.endTableId);

      if (startTable && endTable) {
        // Determine the field name to use based on which field was renamed
        let endFieldName, startTableName, endTableName;

        if (
          relationship.endTableId === tableId &&
          relationship.endFieldId === fieldId
        ) {
          // The end field was renamed
          endFieldName = newFieldName;
        } else if (
          relationship.endTableId === relatedTableId &&
          relationship.endFieldId === relatedFieldId
        ) {
          // The related end field was renamed
          endFieldName = relatedNewFieldName;
        } else {
          // Use current field name
          const endField = endTable.fields?.find(
            (f) => f.id === relationship.endFieldId,
          );
          endFieldName = endField?.name;
        }

        startTableName = startTable.name;
        endTableName = endTable.name;

        if (endFieldName && startTableName && endTableName) {
          const defaultName = `fk_${endTableName}_${endFieldName}_${startTableName}`;

          // Only update if the name is different
          if (relationship.name !== defaultName) {
            updateRelationship(relationship.id, { name: defaultName });
          }
        }
      }
    });
  };

  const updateRelationshipNamesAfterSingleFieldRename = (
    tableId,
    fieldId,
    newFieldName,
  ) => {
    // Find relationships that involve this field
    const relatedRelationships = relationships.filter(
      (r) =>
        (r.startTableId === tableId && r.startFieldId === fieldId) ||
        (r.endTableId === tableId && r.endFieldId === fieldId),
    );

    // Update each relationship with a new default name
    relatedRelationships.forEach((relationship) => {
      const startTable = tables.find((t) => t.id === relationship.startTableId);
      const endTable = tables.find((t) => t.id === relationship.endTableId);

      if (startTable && endTable) {
        // Determine the field name to use
        let endFieldName, startTableName, endTableName;

        if (
          relationship.endTableId === tableId &&
          relationship.endFieldId === fieldId
        ) {
          // The end field was renamed
          endFieldName = newFieldName;
        } else {
          // Use current field name
          const endField = endTable.fields?.find(
            (f) => f.id === relationship.endFieldId,
          );
          endFieldName = endField?.name;
        }

        startTableName = startTable.name;
        endTableName = endTable.name;

        if (endFieldName && startTableName && endTableName) {
          const defaultName = `fk_${endTableName}_${endFieldName}_${startTableName}`;

          // Only update if the name is different
          if (relationship.name !== defaultName) {
            updateRelationship(relationship.id, { name: defaultName });
          }
        }
      }
    });
  };

  const handleForeignKeyRenameYes = () => {
    if (
      foreignKeyRenameModal.tableId !== null &&
      foreignKeyRenameModal.fieldId !== null
    ) {
      renameBothFields(
        foreignKeyRenameModal.tableId,
        foreignKeyRenameModal.fieldId,
        foreignKeyRenameModal.newName,
        foreignKeyRenameModal.relatedField.tableId,
        foreignKeyRenameModal.relatedField.fieldId,
      );
      setForeignKeyRenameModal({
        visible: false,
        tableId: null,
        fieldId: null,
        newName: "",
        relatedField: null,
      });
      Toast.success(t("both_fields_renamed_success"));
    }
  };

  const handleForeignKeyRenameNo = () => {
    if (
      foreignKeyRenameModal.tableId !== null &&
      foreignKeyRenameModal.fieldId !== null
    ) {
      renameFieldOnly(
        foreignKeyRenameModal.tableId,
        foreignKeyRenameModal.fieldId,
        foreignKeyRenameModal.newName,
      );

      // Update relationship names when only one field is renamed
      updateRelationshipNamesAfterSingleFieldRename(
        foreignKeyRenameModal.tableId,
        foreignKeyRenameModal.fieldId,
        foreignKeyRenameModal.newName,
      );

      setForeignKeyRenameModal({
        visible: false,
        tableId: null,
        fieldId: null,
        newName: "",
        relatedField: null,
      });
      Toast.success(t("field_renamed_success"));
    }
  };

  const handleForeignKeyRenameCancel = () => {
    setForeignKeyRenameModal({
      visible: false,
      tableId: null,
      fieldId: null,
      newName: "",
      relatedField: null,
    });
  };

  const foreignKeyRenameFooter = [
    <button
      key="cancel"
      className="px-3 py-2 mr-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
      onClick={handleForeignKeyRenameCancel}
    >
      Cancel
    </button>,
    <button
      key="no"
      className="px-3 py-2 mr-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
      onClick={handleForeignKeyRenameNo}
    >
      No, rename only this field
    </button>,
    <button
      key="yes"
      className="px-3 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600"
      onClick={handleForeignKeyRenameYes}
    >
      Yes, rename both fields
    </button>,
  ];

  const handleFieldRenameCancel = () => {
    setFieldRenameModal({
      visible: false,
      tableId: null,
      fieldId: null,
      currentName: "",
      newName: "",
    });
  };

  const handleEditNoteContent = () => {
    if (noteContextMenu.noteId !== null) {
      // Focus on the textarea for the note
      const textarea = document.getElementById(
        `note_${noteContextMenu.noteId}`,
      );
      if (textarea) {
        textarea.focus();
      }
    }
  };

  const handleNoteChangeColor = () => {
    if (noteContextMenu.noteId !== null) {
      if (layout.sidebar) {
        setSelectedElement((prev) => ({
          ...prev,
          element: ObjectType.NOTE,
          id: noteContextMenu.noteId,
          currentTab: Tab.NOTES,
          open: true,
        }));
        setTimeout(() => {
          document
            .getElementById(`scroll_note_${noteContextMenu.noteId}`)
            ?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        setSelectedElement((prev) => ({
          ...prev,
          element: ObjectType.NOTE,
          id: noteContextMenu.noteId,
          open: true,
        }));
      }
    }
  };

  const handleDeleteNote = () => {
    if (noteContextMenu.noteId !== null) {
      deleteNote(noteContextMenu.noteId, true);
      handleNoteContextMenuClose();
    }
  };

  // Canvas context menu handlers
  const handleCanvasContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Close field context menu
    handleFieldContextMenuClose();

    // Convert screen coordinates to canvas coordinates
    const screenX = e.clientX;
    const screenY = e.clientY;

    // Store diagram coordinates at the time of right-click
    const diagramX = pointer.spaces.diagram.x;
    const diagramY = pointer.spaces.diagram.y;

    setCanvasContextMenu({
      visible: true,
      x: screenX,
      y: screenY,
      diagramX: diagramX,
      diagramY: diagramY,
    });
  };

  const handleCanvasContextMenuClose = () => {
    setCanvasContextMenu({
      visible: false,
      x: 0,
      y: 0,
      diagramX: 0,
      diagramY: 0,
    });
  };

  const handleCanvasAddTable = () => {
    // Get stored diagram coordinates from when context menu was opened
    const targetX = canvasContextMenu.diagramX;
    const targetY = canvasContextMenu.diagramY;

    // Store the current transform pan values for restoration
    const originalPan = { ...transform.pan };

    // Update transform to place table at right-click position
    setTransform((prev) => ({
      ...prev,
      pan: { x: targetX, y: targetY },
    }));

    // Add the table (it will use the updated transform.pan values)
    addTable();

    // Restore original transform pan immediately
    setTransform((prev) => ({
      ...prev,
      pan: originalPan,
    }));
  };

  const handleCanvasAddArea = () => {
    // Get stored diagram coordinates from when context menu was opened
    const targetX = canvasContextMenu.diagramX;
    const targetY = canvasContextMenu.diagramY;

    // Store the current transform pan values for restoration
    const originalPan = { ...transform.pan };

    // Update transform to place area at right-click position
    setTransform((prev) => ({
      ...prev,
      pan: { x: targetX, y: targetY },
    }));

    // Add the area (it will use the updated transform.pan values)
    addArea();

    // Restore original transform pan immediately
    setTransform((prev) => ({
      ...prev,
      pan: originalPan,
    }));
  };

  const handleCanvasAddNote = () => {
    // Get stored diagram coordinates from when context menu was opened
    const targetX = canvasContextMenu.diagramX;
    const targetY = canvasContextMenu.diagramY;

    // Store the current transform pan values for restoration
    const originalPan = { ...transform.pan };

    // Update transform to place note at right-click position
    setTransform((prev) => ({
      ...prev,
      pan: { x: targetX, y: targetY },
    }));

    // Add the note (it will use the updated transform.pan values)
    addNote();

    // Restore original transform pan immediately
    setTransform((prev) => ({
      ...prev,
      pan: originalPan,
    }));
  };

  const handleCanvasUndo = () => {
    // Simplified undo logic - for basic operations
    if (undoStack.length === 0) return;
    const a = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.filter((_, i) => i !== prev.length - 1));

    if (a.action === Action.ADD) {
      if (a.element === ObjectType.TABLE) {
        const tableIdToDelete =
          tables.length > 0 ? tables[tables.length - 1].id : null;
        if (tableIdToDelete !== null) {
          deleteTable(tableIdToDelete, false);
        }
      } else if (a.element === ObjectType.AREA) {
        const areaIdToDelete = areas.length > 0 ? areas.length - 1 : null;
        if (areaIdToDelete !== null) {
          deleteArea(areaIdToDelete, false);
        }
      } else if (a.element === ObjectType.NOTE) {
        const noteIdToDelete = notes.length > 0 ? notes.length - 1 : null;
        if (noteIdToDelete !== null) {
          deleteNote(noteIdToDelete, false);
        }
      } else if (a.element === ObjectType.RELATIONSHIP) {
        const relationshipIdToDelete =
          relationships.length > 0 ? relationships.length - 1 : null;
        if (relationshipIdToDelete !== null) {
          deleteRelationship(relationshipIdToDelete, false);
        }
      }
      setRedoStack((prev) => [...prev, a]);
    } else if (a.action === Action.EDIT) {
      if (a.element === ObjectType.AREA && a.aid !== undefined) {
        updateArea(a.aid, a.undo);
      } else if (a.element === ObjectType.NOTE && a.nid !== undefined) {
        updateNote(a.nid, a.undo);
      } else if (a.element === ObjectType.TABLE && a.tid !== undefined) {
        updateTable(a.tid, a.undo);
      } else if (a.element === ObjectType.RELATIONSHIP && a.rid !== undefined) {
        updateRelationship(a.rid, a.undo, false);
      }
      setRedoStack((prev) => [...prev, a]);
    } else if (a.action === Action.MOVE) {
      // Handle MOVE operations
      if (Array.isArray(a.id)) {
        // Multiple element move
        if (a.initialPositions) {
          Object.entries(a.initialPositions).forEach(([id, pos]) => {
            const elementId = parseInt(id);
            if (a.element === ObjectType.TABLE) {
              updateTable(elementId, { x: pos.x, y: pos.y });
            } else if (a.element === ObjectType.AREA) {
              updateArea(elementId, { x: pos.x, y: pos.y });
            } else if (a.element === ObjectType.NOTE) {
              updateNote(elementId, { x: pos.x, y: pos.y });
            }
          });
        }
      } else {
        // Single element move
        if (a.from) {
          if (a.element === ObjectType.TABLE) {
            updateTable(a.id, { x: a.from.x, y: a.from.y });
          } else if (a.element === ObjectType.AREA) {
            updateArea(a.id, { x: a.from.x, y: a.from.y });
          } else if (a.element === ObjectType.NOTE) {
            updateNote(a.id, { x: a.from.x, y: a.from.y });
          }
        }
      }
      setRedoStack((prev) => [...prev, a]);
    }
  };

  const handleCanvasRedo = () => {
    // Simplified redo logic - for basic operations
    if (redoStack.length === 0) return;
    const a = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.filter((_, i) => i !== prev.length - 1));

    if (a.action === Action.ADD) {
      if (a.element === ObjectType.TABLE) {
        addTable();
      } else if (a.element === ObjectType.AREA) {
        addArea();
      } else if (a.element === ObjectType.NOTE) {
        addNote();
      } else if (a.element === ObjectType.RELATIONSHIP) {
        // For relationship redo, we need the relationship data
        if (a.data && a.data.relationship) {
          addRelationship(
            a.data.relationship,
            a.data.autoGeneratedFkFields,
            a.data.childTableIdWithGeneratedFks,
            false,
          );
        }
      }
      setUndoStack((prev) => [...prev, a]);
    } else if (a.action === Action.EDIT) {
      if (a.element === ObjectType.AREA && a.aid !== undefined) {
        updateArea(a.aid, a.redo);
      } else if (a.element === ObjectType.NOTE && a.nid !== undefined) {
        updateNote(a.nid, a.redo);
      } else if (a.element === ObjectType.TABLE && a.tid !== undefined) {
        updateTable(a.tid, a.redo);
      } else if (a.element === ObjectType.RELATIONSHIP && a.rid !== undefined) {
        updateRelationship(a.rid, a.redo, false);
      }
      setUndoStack((prev) => [...prev, a]);
    } else if (a.action === Action.MOVE) {
      // Handle MOVE operations for redo
      if (Array.isArray(a.id)) {
        // Multiple element move
        if (a.finalPositions) {
          Object.entries(a.finalPositions).forEach(([id, pos]) => {
            const elementId = parseInt(id);
            if (a.element === ObjectType.TABLE) {
              updateTable(elementId, { x: pos.x, y: pos.y });
            } else if (a.element === ObjectType.AREA) {
              updateArea(elementId, { x: pos.x, y: pos.y });
            } else if (a.element === ObjectType.NOTE) {
              updateNote(elementId, { x: pos.x, y: pos.y });
            }
          });
        }
      } else {
        // Single element move
        if (a.to) {
          if (a.element === ObjectType.TABLE) {
            updateTable(a.id, { x: a.to.x, y: a.to.y });
          } else if (a.element === ObjectType.AREA) {
            updateArea(a.id, { x: a.to.x, y: a.to.y });
          } else if (a.element === ObjectType.NOTE) {
            updateNote(a.id, { x: a.to.x, y: a.to.y });
          }
        }
      }
      setUndoStack((prev) => [...prev, a]);
    }
  };

  const handleCanvasStartAreaSelection = () => {
    // Start area selection mode - wait for user to click and drag
    setIsAreaSelecting(true);
    setIsDrawingSelectionArea(false);

    // Change pointer style to indicate selection mode
    pointer.setStyle("crosshair");
  };

  /**
   * @param {PointerEvent} e
   * @param {*} id
   * @param {ObjectType[keyof ObjectType]} type
   */
  const handlePointerDownOnElement = (e, id, type) => {
    // Unified context menu close handler
    const closeAllContextMenus = () => {
      handleContextMenuClose && handleContextMenuClose();
      handleRelationshipContextMenuClose &&
        handleRelationshipContextMenuClose();
      handleAreaContextMenuClose && handleAreaContextMenuClose();
      handleNoteContextMenuClose && handleNoteContextMenuClose();
      handleCanvasContextMenuClose && handleCanvasContextMenuClose();
      handleFieldContextMenuClose && handleFieldContextMenuClose();
    };

    if (e.button === 0) {
      closeAllContextMenus();
    }

    if (selectedElement.open && !layout.sidebar) return;
    if (!e.isPrimary) return;

    // Verify if already selected (for multiple selection)
    const alreadySelected = Array.isArray(selectedElement.id)
      ? selectedElement.id.includes(id)
      : selectedElement.id === id;

    let elementData;
    if (type === ObjectType.TABLE) {
      const table = tables.find((t) => t.id === id);

      setGrabOffset({
        x: table.x - pointer.spaces.diagram.x,
        y: table.y - pointer.spaces.diagram.y,
      });

      // expose table as elementData so common logic below (multi-select handling)
      // can use it the same way as AREA/NOTE branches do
      elementData = table;

      let width = table.width || settings.tableWidth;
      if (table.x - pointer.spaces.diagram.x < -width + 15) {
        setResizing({
          element: type,
          id: id,
          prevX: table.x,
          prevY: table.y,
        });
      } else {
        setDragging({
          element: type,
          id: id,
          prevX: table.x,
          prevY: table.y,
        });
      }
    } else if (type === ObjectType.AREA) {
      elementData = areas.find((a) => a.id === id);
    } else if (type === ObjectType.NOTE) {
      elementData = notes.find((n) => n.id === id);
    }

    if (!elementData) return;

    // Calcular offset
    setGrabOffset({
      x: elementData.x - pointer.spaces.diagram.x,
      y: elementData.y - pointer.spaces.diagram.y,
    });

    // If the object is alredy selected and the selection is multiple,
    // strore the initial position of each one in the selection
    if (alreadySelected && Array.isArray(selectedElement.id)) {
      const initialPositions = {};
      selectedElement.id.forEach((tableId) => {
        const tData = tables.find((t) => t.id === tableId);
        if (tData) {
          initialPositions[tableId] = { x: tData.x, y: tData.y };
        }
      });
      setDragging({
        element: type,
        id: selectedElement.id,
        prevX: elementData.x,
        prevY: elementData.y,
        initialPositions,
      });
    } else {
      setDragging({
        element: type,
        id: id,
        prevX: elementData.x,
        prevY: elementData.y,
      });
      setSelectedElement((prev) => ({
        ...prev,
        element: type,
        id: id,
        open: false,
      }));
    }
    setDragStart({
      x: pointer.spaces.diagram.x,
      y: pointer.spaces.diagram.y,
    });
  };

  /**
   * @param {PointerEvent} e
   */
  const handlePointerMove = (e) => {
    if (selectedElement.open && !layout.sidebar) return;

    if (!e.isPrimary) return;

    if (isAreaSelecting && isDrawingSelectionArea) {
      const currentX = pointer.spaces.diagram.x;
      const currentY = pointer.spaces.diagram.y;
      setSelectionArea((prev) => ({
        ...prev,
        x: Math.min(prev.startX, currentX),
        y: Math.min(prev.startY, currentY),
        width: Math.abs(currentX - prev.startX),
        height: Math.abs(currentY - prev.startY),
      }));
      return;
    }

    if (linking) {
      setLinkingLine({
        ...linkingLine,
        endX: pointer.spaces.diagram.x,
        endY: pointer.spaces.diagram.y,
      });
    } else if (resizing.element === ObjectType.TABLE && resizing.id >= 0) {
      const table = tables.find((t) => t.id === resizing.id);
      const newWidth = Math.max(-(table.x - pointer.spaces.diagram.x), 180);
      updateTable(resizing.id, {
        width: newWidth,
      });
    } else if (hierarchyLinking) {
      setHierarchyLinkingLine({
        ...hierarchyLinkingLine,
        endX: pointer.spaces.diagram.x,
        endY: pointer.spaces.diagram.y,
      });
    } else if (
      panning.isPanning &&
      dragging.element === ObjectType.NONE &&
      areaResize.id === -1
    ) {
      if (!settings.panning) {
        return;
      }
      setTransform((prev) => ({
        ...prev,
        pan: {
          x:
            panning.panStart.x +
            (panning.cursorStart.x - pointer.spaces.screen.x) / transform.zoom,
          y:
            panning.panStart.y +
            (panning.cursorStart.y - pointer.spaces.screen.y) / transform.zoom,
        },
      }));
    } else if (dragging.element === ObjectType.TABLE) {
      if (Array.isArray(dragging.id)) {
        const deltaX = pointer.spaces.diagram.x - dragStart.x;
        const deltaY = pointer.spaces.diagram.y - dragStart.y;
        dragging.id.forEach((tableId) => {
          const initPos = dragging.initialPositions[tableId];
          updateTable(tableId, {
            x: initPos.x + deltaX,
            y: initPos.y + deltaY,
          });
        });
      } else {
        // Move table individually
        updateTable(dragging.id, {
          x: pointer.spaces.diagram.x + grabOffset.x,
          y: pointer.spaces.diagram.y + grabOffset.y,
        });
      }
    } else if (
      dragging.element === ObjectType.AREA &&
      dragging.id >= 0 &&
      areaResize.id === -1
    ) {
      updateArea(dragging.id, {
        x: pointer.spaces.diagram.x + grabOffset.x,
        y: pointer.spaces.diagram.y + grabOffset.y,
      });
    } else if (dragging.element === ObjectType.NOTE && dragging.id >= 0) {
      updateNote(dragging.id, {
        x: pointer.spaces.diagram.x + grabOffset.x,
        y: pointer.spaces.diagram.y + grabOffset.y,
      });
    } else if (areaResize.id !== -1) {
      if (areaResize.dir === "none") return;
      let newDims = { ...initCoords };
      delete newDims.pointerX;
      delete newDims.pointerY;
      setPanning((old) => ({ ...old, isPanning: false }));

      switch (areaResize.dir) {
        case "br":
          newDims.width = pointer.spaces.diagram.x - initCoords.x;
          newDims.height = pointer.spaces.diagram.y - initCoords.y;
          break;
        case "tl":
          newDims.x = pointer.spaces.diagram.x;
          newDims.y = pointer.spaces.diagram.y;
          newDims.width =
            initCoords.x + initCoords.width - pointer.spaces.diagram.x;
          newDims.height =
            initCoords.y + initCoords.height - pointer.spaces.diagram.y;
          break;
        case "tr":
          newDims.y = pointer.spaces.diagram.y;
          newDims.width = pointer.spaces.diagram.x - initCoords.x;
          newDims.height =
            initCoords.y + initCoords.height - pointer.spaces.diagram.y;
          break;
        case "bl":
          newDims.x = pointer.spaces.diagram.x;
          newDims.width =
            initCoords.x + initCoords.width - pointer.spaces.diagram.x;
          newDims.height = pointer.spaces.diagram.y - initCoords.y;
          break;
      }

      updateArea(areaResize.id, { ...newDims });
    }
  };

  /**
   * @param {PointerEvent} e
   */
  const handlePointerDown = (e) => {
    if (contextMenu.visible && e.button === 0) {
      handleContextMenuClose();
    }

    if (relationshipContextMenu.visible && e.button === 0) {
      handleRelationshipContextMenuClose();
    }

    if (areaContextMenu.visible && e.button === 0) {
      handleAreaContextMenuClose();
    }

    if (noteContextMenu.visible && e.button === 0) {
      handleNoteContextMenuClose();
    }

    if (canvasContextMenu.visible && e.button === 0) {
      handleCanvasContextMenuClose();
    }

    if (fieldContextMenu.visible && e.button === 0) {
      handleFieldContextMenuClose();
    }

    // Handle right-click on canvas background for context menu
    if (e.button === 2 && e.target.id === "diagram") {
      handleCanvasContextMenu(e);
      return;
    }

    if (e.isPrimary && e.target.id === "diagram") {
      // if the user clicks on the background, reset the selected element
      // desactivate area selection and move mode
      setDragging({
        element: ObjectType.NONE,
        id: -1,
        prevX: 0,
        prevY: 0,
      });
      setSelectedElement({
        ...selectedElement,
        element: ObjectType.NONE,
        id: -1,
        open: false,
      });
      setPanning((prev) => ({ ...prev, isPanning: false }));
    }

    if (selectedElement.open && !layout.sidebar) return;

    if (!e.isPrimary) return;

    // If in area selection mode, start drawing the selection area
    if (isAreaSelecting && !isDrawingSelectionArea && e.button === 0) {
      setIsDrawingSelectionArea(true);
      setSelectionArea({
        startX: pointer.spaces.diagram.x,
        startY: pointer.spaces.diagram.y,
        x: pointer.spaces.diagram.x,
        y: pointer.spaces.diagram.y,
        width: 0,
        height: 0,
      });
      return;
    }

    // If pressing Alt + left click, start area selection
    if (e.altKey && e.button === 0) {
      setIsAreaSelecting(true);
      setSelectionArea({
        startX: pointer.spaces.diagram.x,
        startY: pointer.spaces.diagram.y,
        x: pointer.spaces.diagram.x,
        y: pointer.spaces.diagram.y,
        width: 0,
        height: 0,
      });
      return;
    }

    // Cancel area selection if clicking without being in drawing mode
    if (isAreaSelecting && !isDrawingSelectionArea && e.button === 0) {
      setIsAreaSelecting(false);
      pointer.setStyle("default");
      return;
    }

    // don't pan if the sidesheet for editing a table is open
    if (
      selectedElement.element === ObjectType.TABLE &&
      selectedElement.open &&
      !layout.sidebar
    )
      return;

    // Start panning only when the pointerdown happened on the diagram background
    // (element with id="diagram"). This avoids starting a pan when clicking UI
    // elements or tables and thus prevents recording spurious PAN undo entries.
    if (e.target && e.target.id === "diagram") {
      setPanning({
        isPanning: true,
        panStart: transform.pan,
        // Diagram space depends on the current panning.
        // Use screen space to avoid circular dependencies and undefined behavior.
        cursorStart: pointer.spaces.screen,
      });
      pointer.setStyle("grabbing");
    } else {
      // Ensure panning flag is not set when clicking other elements
      setPanning((prev) => ({ ...prev, isPanning: false }));
    }
  };

  const coordsDidUpdate = (element) => {
    // multiple selection
    if (Array.isArray(dragging.id)) {
      return dragging.id.some((id) => {
        const table = tables.find((t) => t.id === id);
        const initPos = dragging.initialPositions?.[id];
        return table && initPos
          ? !(initPos.x === table.x && initPos.y === table.y)
          : false;
      });
    }

    switch (element) {
      case ObjectType.TABLE:
        return !(
          dragging.prevX === tables[dragging.id].x &&
          dragging.prevY === tables[dragging.id].y
        );
      case ObjectType.AREA:
        return !(
          dragging.prevX === areas[dragging.id].x &&
          dragging.prevY === areas[dragging.id].y
        );
      case ObjectType.NOTE:
        return !(
          dragging.prevX === notes[dragging.id].x &&
          dragging.prevY === notes[dragging.id].y
        );
      default:
        return false;
    }
  };

  const didResize = (id) => {
    return !(
      areas[id].x === initCoords.x &&
      areas[id].y === initCoords.y &&
      areas[id].width === initCoords.width &&
      areas[id].height === initCoords.height
    );
  };

  const didPan = () =>
    !(transform.pan.x === panning.x && transform.pan.y === panning.y);

  const getMovedElementDetails = () => {
    switch (dragging.element) {
      case ObjectType.TABLE:
        if (Array.isArray(dragging.id)) {
          let sumX = 0,
            sumY = 0,
            count = 0;
          dragging.id.forEach((id) => {
            const table = tables.find((t) => t.id === id);
            if (table) {
              sumX += table.x;
              sumY += table.y;
              count++;
            }
          });
          return {
            name: `${count} tables`,
            x: count ? Math.round(sumX / count) : 0,
            y: count ? Math.round(sumY / count) : 0,
          };
        } else {
          const table = tables.find((t) => t.id === dragging.id);
          if (!table) return {};
          return {
            name: table.name,
            x: Math.round(table.x),
            y: Math.round(table.y),
          };
        }
      case ObjectType.AREA:
        if (Array.isArray(dragging.id)) {
          let sumX = 0,
            sumY = 0,
            count = 0;
          dragging.id.forEach((id) => {
            const area = areas.find((a) => a.id === id);
            if (area) {
              sumX += area.x;
              sumY += area.y;
              count++;
            }
          });
          return {
            name: `${count} areas`,
            x: count ? Math.round(sumX / count) : 0,
            y: count ? Math.round(sumY / count) : 0,
          };
        } else {
          const area = areas.find((a) => a.id === dragging.id);
          if (!area) return {};
          return {
            name: area.name,
            x: Math.round(area.x),
            y: Math.round(area.y),
          };
        }
      case ObjectType.NOTE:
        if (Array.isArray(dragging.id)) {
          let sumX = 0,
            sumY = 0,
            count = 0;
          dragging.id.forEach((id) => {
            const note = notes.find((n) => n.id === id);
            if (note) {
              sumX += note.x;
              sumY += note.y;
              count++;
            }
          });
          return {
            name: `${count} notes`,
            x: count ? Math.round(sumX / count) : 0,
            y: count ? Math.round(sumY / count) : 0,
          };
        } else {
          const note = notes.find((n) => n.id === dragging.id);
          if (!note) return {};
          return {
            name: note.title,
            x: Math.round(note.x),
            y: Math.round(note.y),
          };
        }
      default:
        return false;
    }
  };

  /**
   * @param {PointerEvent} e
   */
  const handlePointerUp = (e) => {
    if (selectedElement.open && !layout.sidebar) return;

    if (!e.isPrimary) return;

    if (isAreaSelecting && isDrawingSelectionArea) {
      const areaBBox = selectionArea;
      // Select tables that intersect the selection area (any part of table)
      const selectedTables = tables.filter((table) => {
        const tableX = table.x;
        const tableY = table.y;
        const tableWidth = table.width || settings.tableWidth;
        const tableHeight =
          (table.fields?.length || 0) * tableFieldHeight +
          tableHeaderHeight +
          7;

        const tableRect = {
          x: tableX,
          y: tableY,
          width: tableWidth,
          height: tableHeight,
        };

        const areaRect = {
          x: areaBBox.x,
          y: areaBBox.y,
          width: areaBBox.width,
          height: areaBBox.height,
        };

        const intersects = !(
          tableRect.x + tableRect.width < areaRect.x ||
          tableRect.x > areaRect.x + areaRect.width ||
          tableRect.y + tableRect.height < areaRect.y ||
          tableRect.y > areaRect.y + areaRect.height
        );
        return intersects;
      });

      if (selectedTables.length > 0) {
        setSelectedElement({
          ...selectedElement,
          element: ObjectType.TABLE,
          id: selectedTables.map((t) => t.id),
          open: false,
        });

        // Set up dragging state for the selected tables
        setDragging({
          element: ObjectType.TABLE,
          id: selectedTables.map((t) => t.id),
          prevX: selectedTables[0].x, // Use first table as reference
          prevY: selectedTables[0].y,
        });

        // set start point for dragging
        setDragStart({
          x: pointer.spaces.diagram.x,
          y: pointer.spaces.diagram.y,
        });
      }
      // Reset area selection states and restore pointer style
      setIsAreaSelecting(false);
      setIsDrawingSelectionArea(false);
      pointer.setStyle("default");
      return;
    }

    if (coordsDidUpdate(dragging.element)) {
      const info = getMovedElementDetails();
      // Use pushUndo to ensure centralized filtering/deduplication
      pushUndo(
        (() => {
          if (Array.isArray(dragging.id)) {
            // Build arrays matching ControlPanel's expected shape: originalPositions/newPositions
            const originalPositionsArray =
              dragging.initialPositions &&
              typeof dragging.initialPositions === "object"
                ? // Preserve the dragging.id ordering to match finalPositionsArray and ControlPanel expectations
                  dragging.id.map((id) => {
                    const pos = dragging.initialPositions[id];
                    return pos
                      ? { id, x: pos.x, y: pos.y }
                      : { id, x: 0, y: 0 };
                  })
                : dragging.id.map((id) => {
                    const t = tables.find((tt) => tt.id === id);
                    return t ? { id, x: t.x, y: t.y } : { id, x: 0, y: 0 };
                  });

            const finalPositionsArray = dragging.id
              .map((id) => {
                const table = tables.find((t) => t.id === id);
                return table ? { id, x: table.x, y: table.y } : null;
              })
              .filter(Boolean);

            const newAction = {
              action: Action.MOVE,
              element: dragging.element,
              // originalPositions = positions before the move
              originalPositions: originalPositionsArray,
              // newPositions = positions after the move
              newPositions: finalPositionsArray,
              id: dragging.id,
              message: t("move_element", {
                coords: `(${info.x}, ${info.y})`,
                name: info.name,
              }),
            };
            return newAction;
          }
          const newAction = {
            action: Action.MOVE,
            element: dragging.element,
            from: { x: dragging.prevX, y: dragging.prevY },
            to: { x: info.x, y: info.y },
            id: dragging.id,
            message: t("move_element", {
              coords: `(${info.x}, ${info.y})`,
              name: info.name,
            }),
          };
          return newAction;
        })(),
      );
      setRedoStack([]);
    }
    setDragging({ element: ObjectType.NONE, id: -1, prevX: 0, prevY: 0 });
    setResizing({ element: ObjectType.NONE, id: -1, prevX: 0, prevY: 0 });
    if (panning.isPanning && didPan()) {
      pushUndo({
        action: Action.PAN,
        undo: { x: panning.x, y: panning.y },
        redo: transform.pan,
        message: t("move_element", {
          coords: `(${transform?.pan.x}, ${transform?.pan.y})`,
          name: "diagram",
        }),
      });
      setRedoStack([]);
      setSelectedElement((prev) => ({
        ...prev,
        element: ObjectType.NONE,
        id: -1,
        open: false,
      }));
    }
    setPanning((old) => ({ ...old, isPanning: false }));
    pointer.setStyle("default");
    if (linking) handleLinking();
    setLinking(false);
    if (hierarchyLinking) {
      handleHierarchyLinking();
    }
    setHierarchyLinking(false);
    if (areaResize.id !== -1 && didResize(areaResize.id)) {
      pushUndo({
        action: Action.EDIT,
        element: ObjectType.AREA,
        aid: areaResize.id,
        undo: {
          ...areas[areaResize.id],
          x: initCoords.x,
          y: initCoords.y,
          width: initCoords.width,
          height: initCoords.height,
        },
        redo: areas[areaResize.id],
        message: t("edit_area", {
          areaName: areas[areaResize.id].name,
          extra: "[resize]",
        }),
      });
      setRedoStack([]);
    }
    setAreaResize({ id: -1, dir: "none" });
    setInitCoords({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      pointerX: 0,
      pointerY: 0,
    });
  };

  const handleGripField = (field, fieldTableid) => {
    // A field can be a foreign key only if it's a primary key or both NOT NULL and UNIQUE.
    // If it can't be selected, show an error message and exit.
    if (!field.primary && !(field.notNull && field.unique)) {
      Toast.info(t("cannot_fk"));
      return;
    }
    setPanning((old) => ({ ...old, isPanning: false }));
    setDragging({ element: ObjectType.NONE, id: -1, prevX: 0, prevY: 0 });
    setLinkingLine({
      ...linkingLine,
      startTableId: fieldTableid,
      startFieldId: field.id,
      startX: pointer.spaces.diagram.x,
      startY: pointer.spaces.diagram.y,
      endX: pointer.spaces.diagram.x,
      endY: pointer.spaces.diagram.y,
      endTableId: -1,
      endFieldId: -1,
    });
    setLinking(true);
  };

  const handleLinking = () => {
    if (hoveredTable.tableId < 0) return;
    // Get the childTable and parentTable
    const childTable = tables.find((t) => t.id === hoveredTable.tableId);
    const parentTable = tables.find((t) => t.id === linkingLine.startTableId);

    if (!parentTable) {
      setLinking(false);
      return;
    }
    if (!childTable) {
      setLinking(false);
      return;
    }
    const parentFields = parentTable.fields.filter((field) => field.primary);

    if (parentFields.length === 0) {
      Toast.info(t("no_primary_key"));
      setLinking(false);
      return;
    }
    // If the relationship is recursive
    const recursiveRelation = parentTable === childTable;
    if (!recursiveRelation) {
      if (!areFieldsCompatible(parentFields, childTable)) {
        Toast.info(t("duplicate_field_name"));
        setLinking(false);
        return;
      }
    }
    // Check if the relationship already exists
    const alreadyLinked = relationships.some(
      (rel) =>
        rel.startTableId === linkingLine.startTableId &&
        rel.endTableId === hoveredTable.tableId &&
        rel.startFieldId === linkingLine.startFieldId &&
        rel.endFieldId ===
          parentFields.map(
            (field, index) =>
              childTable.fields.reduce(
                (maxId, f) =>
                  Math.max(maxId, typeof f.id === "number" ? f.id : -1),
                -1,
              ) +
              1 +
              index,
          )[0],
    );
    if (alreadyLinked) {
      Toast.info(t("duplicate_relationship"));
      setLinking(false);
      return;
    }
    // Save the ID of the child table before modifying its fields
    const childTableIdForFks = childTable.id;
    // Generate new fields for the childTable
    const newFields = parentFields.map((field, index) => ({
      name: recursiveRelation ? "" : field.name,
      type: field.type,
      size: field.size,
      notNull: true,
      unique: false,
      default: "",
      check: "",
      primary: false,
      increment: false,
      comment: "",
      foreignK: true,
      foreignKey: {
        tableId: parentTable.id,
        fieldId: field.id,
      },
      id:
        childTable.fields.reduce(
          (maxId, f) => Math.max(maxId, typeof f.id === "number" ? f.id : -1),
          -1,
        ) +
        1 +
        index,
    }));
    // Concatenate the existing fields with the new fields
    const updatedChildFields = [...childTable.fields, ...newFields];
    // Update the childTable with the new fields
    updateTable(childTableIdForFks, {
      fields: updatedChildFields,
    });
    const actualStartFieldId = parentTable.fields.find(
      (f) => f.id === linkingLine.startFieldId,
    );
    const relationshipName = `${parentTable.name}_${actualStartFieldId ? actualStartFieldId.name : "table"}`;
    // Use the updated childTable fields to create the new relationship
    const newRelationship = {
      startTableId: linkingLine.startTableId,
      startFieldId: linkingLine.startFieldId,
      endTableId: hoveredTable.tableId,
      endFieldId: newFields.length > 0 ? newFields[0].id : undefined,
      relationshipType: RelationshipType.ONE_TO_ONE, // Default, can be changed by editing the relationship
      cardinality:
        RelationshipCardinalities[RelationshipType.ONE_TO_ONE][0].label,
      updateConstraint: Constraint.NONE,
      deleteConstraint: Constraint.NONE,
      name: relationshipName,
    };

    delete newRelationship.startX;
    delete newRelationship.startY;
    delete newRelationship.endX;
    delete newRelationship.endY;
    // Add the new relationship to the relationships array
    addRelationship(newRelationship, newFields, childTableIdForFks, true);
    setLinking(false);
  };

  // Function to handle clicks on the subtype point
  const handleSubtypePointClick = (e, x, y, relationshipId) => {
    // Don't allow subtype connections when notation is DEFAULT
    if (settings.notation === Notation.DEFAULT) {
      return;
    }
    e.stopPropagation();
    setPanning((old) => ({ ...old, isPanning: false }));
    setDragging({ element: ObjectType.NONE, id: -1, prevX: 0, prevY: 0 });
    const hierarchyLineStartPoint = { x: x, y: y - 20 };
    setHierarchyLinkingLine({
      relationshipId: relationshipId,
      subtypePoint: hierarchyLineStartPoint,
      endTableId: -1,
      startX: hierarchyLineStartPoint.x,
      startY: hierarchyLineStartPoint.y,
      endX: hierarchyLineStartPoint.x,
      endY: hierarchyLineStartPoint.y,
    });
    setHierarchyLinking(true);
  };

  const handleHierarchyLinking = () => {
    // If no hovered table, try to find the table at the current mouse position
    let targetTableId = hoveredTable.tableId;
    if (targetTableId < 0) {
      // Find table under cursor by checking coordinates
      const mouseX = hierarchyLinkingLine.endX;
      const mouseY = hierarchyLinkingLine.endY;
      for (let table of tables) {
        if (
          mouseX >= table.x &&
          mouseX <= table.x + settings.tableWidth &&
          mouseY >= table.y &&
          mouseY <=
            table.y +
              (tableHeaderHeight +
                table.fields.length * tableFieldHeight +
                tableColorStripHeight)
        ) {
          targetTableId = table.id;
          break;
        }
      }
    }
    if (targetTableId < 0) {
      return;
    }
    // Find the original relationship
    const originalRelationship = relationships.find(
      (r) => r.id === hierarchyLinkingLine.relationshipId,
    );
    if (!originalRelationship) {
      setHierarchyLinking(false);
      return;
    }

    // Check if this relationship is actually a subtype
    if (!originalRelationship.subtype) {
      setHierarchyLinking(false);
      return;
    }

    // Verify that the table is not already included (as parent or child)
    const existingChildren =
      originalRelationship.endTableIds ||
      (originalRelationship.endTableId !== undefined &&
      originalRelationship.endTableId !== null
        ? [originalRelationship.endTableId]
        : []);
    const allRelatedTables = [
      originalRelationship.startTableId,
      ...existingChildren,
    ].filter((id) => id !== undefined && id !== null);
    if (allRelatedTables.includes(targetTableId)) {
      setHierarchyLinking(false);
      return;
    }
    // Add the new child table to the existing subtype relationship
    addChildToSubtype(hierarchyLinkingLine.relationshipId, targetTableId);
    setHierarchyLinking(false);
    // Force a re-render to ensure UI updates properly
    setTimeout(() => {}, 100);
  };

  // Handle mouse wheel scrolling
  useEventListener(
    "wheel",
    (e) => {
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        // How "eager" the viewport is to
        // center the cursor's coordinates
        const eagernessFactor = 0.05;
        setTransform((prev) => ({
          pan: {
            x:
              prev.pan.x -
              (pointer.spaces.diagram.x - prev.pan.x) *
                eagernessFactor *
                Math.sign(e.deltaY),
            y:
              prev.pan.y -
              (pointer.spaces.diagram.y - prev.pan.y) *
                eagernessFactor *
                Math.sign(e.deltaY),
          },
          zoom: e.deltaY <= 0 ? prev.zoom * 1.05 : prev.zoom / 1.05,
        }));
      } else if (e.shiftKey) {
        setTransform((prev) => ({
          ...prev,
          pan: {
            ...prev.pan,
            x: prev.pan.x + e.deltaY / prev.zoom,
          },
        }));
      } else {
        setTransform((prev) => ({
          ...prev,
          pan: {
            x: prev.pan.x + e.deltaX / prev.zoom,
            y: prev.pan.y + e.deltaY / prev.zoom,
          },
        }));
      }
    },
    canvasRef,
    { passive: false },
  );

  useEventListener("keyup", (e) => {
    if (e.key === "Alt") {
      // deactivate area selection
      setIsAreaSelecting(false);
    }
  });
  const theme = localStorage.getItem("theme");

  return (
    <div className="flex-grow h-full touch-none" id="canvas">
      <div
        className="w-full h-full"
        style={{
          cursor: pointer.style,
          backgroundColor: theme === "dark" ? darkBgTheme : "white",
        }}
      >
        {settings.showGrid && (
          <svg className="absolute w-full h-full">
            <defs>
              <pattern
                id="pattern-circles"
                x="0"
                y="0"
                width="24"
                height="24"
                patternUnits="userSpaceOnUse"
                patternContentUnits="userSpaceOnUse"
              >
                <circle
                  id="pattern-circle"
                  cx="4"
                  cy="4"
                  r="0.85"
                  fill="rgb(99, 152, 191)"
                ></circle>
              </pattern>
            </defs>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="url(#pattern-circles)"
            ></rect>
          </svg>
        )}
        <svg
          id="diagram"
          ref={canvasRef}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onContextMenu={handleCanvasContextMenu}
          className="absolute w-full h-full touch-none"
          viewBox={`${viewBox.left} ${viewBox.top} ${viewBox.width} ${viewBox.height}`}
        >
          {areas.map((a) => (
            <Area
              key={a.id}
              data={a}
              onPointerDown={(e) =>
                handlePointerDownOnElement(e, a.id, ObjectType.AREA)
              }
              onContextMenu={handleAreaContextMenu}
              setResize={setAreaResize}
              setInitCoords={setInitCoords}
            />
          ))}
          {relationships
            .filter((rel) => {
              // For subtype relationships with single child, render normally
              if (
                rel.subtype &&
                rel.endTableId !== undefined &&
                !rel.endTableIds
              ) {
                return true;
              }
              // For subtype relationships with multiple children, only render the parent relationship
              // (it will handle rendering individual lines internally)
              if (
                rel.subtype &&
                rel.endTableIds &&
                rel.endTableIds.length > 1
              ) {
                return true;
              }
              // For non-subtype relationships, render normally
              if (!rel.subtype) {
                return true;
              }
              // For subtype relationships with single child in array format, render normally
              if (
                rel.subtype &&
                rel.endTableIds &&
                rel.endTableIds.length === 1
              ) {
                return true;
              }
              return true;
            })
            .map((e, i) => (
              <Relationship
                key={e.id || i}
                data={e}
                onContextMenu={handleRelationshipContextMenu}
                onConnectSubtypePoint={handleSubtypePointClick}
              />
            ))}
          {tables.map((table) => {
            const isMoving =
              dragging.element === ObjectType.TABLE &&
              (Array.isArray(dragging.id)
                ? dragging.id.includes(table.id)
                : dragging.id === table.id);
            return (
              <Table
                key={table.id}
                tableData={table}
                moving={isMoving}
                setHoveredTable={setHoveredTable}
                handleGripField={handleGripField}
                setLinkingLine={setLinkingLine}
                onPointerDown={(e) =>
                  handlePointerDownOnElement(e, table.id, ObjectType.TABLE)
                }
                onContextMenu={handleTableContextMenu}
                onFieldContextMenu={handleFieldContextMenu}
              />
            );
          })}
          {
            /*Draw the selection areas*/
            isAreaSelecting && isDrawingSelectionArea && (
              <rect
                x={selectionArea.x}
                y={selectionArea.y}
                width={selectionArea.width}
                height={selectionArea.height}
                fill="rgba(99, 152, 191, 0.3)"
                stroke="rgb(99, 152, 191)"
                strokeWidth="2"
              />
            )
          }
          {linking && (
            <path
              d={`M ${linkingLine.startX} ${linkingLine.startY} L ${linkingLine.endX} ${linkingLine.endY}`}
              stroke="red"
              strokeDasharray="8,8"
              className="pointer-events-none touch-none"
            />
          )}
          {hierarchyLinking && (
            <path
              d={`M ${hierarchyLinkingLine.startX} ${hierarchyLinkingLine.startY} L ${hierarchyLinkingLine.endX} ${hierarchyLinkingLine.endY}`}
              stroke="skyblue"
              strokeDasharray="8,8"
              strokeWidth="3"
              className="pointer-events-none touch-none"
            />
          )}
          {notes.map((n) => (
            <Note
              key={n.id}
              data={n}
              onPointerDown={(e) =>
                handlePointerDownOnElement(e, n.id, ObjectType.NOTE)
              }
              onContextMenu={handleNoteContextMenu}
            />
          ))}
        </svg>
      </div>
      {settings.showDebugCoordinates && (
        <div className="fixed flex flex-col flex-wrap gap-6 bg-[rgba(var(--semi-grey-1),var(--tw-bg-opacity))]/40 border border-color bottom-4 right-4 p-4 rounded-xl backdrop-blur-sm pointer-events-none select-none">
          <table className="table-auto grow">
            <thead>
              <tr>
                <th className="text-left" colSpan={3}>
                  {t("transform")}
                </th>
              </tr>
              <tr className="italic [&_th]:font-normal [&_th]:text-right">
                <th>pan x</th>
                <th>pan y</th>
                <th>scale</th>
              </tr>
            </thead>
            <tbody className="[&_td]:text-right [&_td]:min-w-[8ch]">
              <tr>
                <td>{transform.pan.x.toFixed(2)}</td>
                <td>{transform.pan.y.toFixed(2)}</td>
                <td>{transform.zoom.toFixed(4)}</td>
              </tr>
            </tbody>
          </table>
          <table className="table-auto grow [&_th]:text-left [&_th:not(:first-of-type)]:text-right [&_td:not(:first-of-type)]:text-right [&_td]:min-w-[8ch]">
            <thead>
              <tr>
                <th colSpan={4}>{t("viewbox")}</th>
              </tr>
              <tr className="italic [&_th]:font-normal">
                <th>left</th>
                <th>top</th>
                <th>width</th>
                <th>height</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{viewBox.left.toFixed(2)}</td>
                <td>{viewBox.top.toFixed(2)}</td>
                <td>{viewBox.width.toFixed(2)}</td>
                <td>{viewBox.height.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <table className="table-auto grow [&_th]:text-left [&_th:not(:first-of-type)]:text-right [&_td:not(:first-of-type)]:text-right [&_td]:min-w-[8ch]">
            <thead>
              <tr>
                <th colSpan={3}>{t("cursor_coordinates")}</th>
              </tr>
              <tr className="italic [&_th]:font-normal">
                <th>{t("coordinate_space")}</th>
                <th>x</th>
                <th>y</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{t("coordinate_space_screen")}</td>
                <td>{pointer.spaces.screen.x.toFixed(2)}</td>
                <td>{pointer.spaces.screen.y.toFixed(2)}</td>
              </tr>
              <tr>
                <td>{t("coordinate_space_diagram")}</td>
                <td>{pointer.spaces.diagram.x.toFixed(2)}</td>
                <td>{pointer.spaces.diagram.y.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <TableContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={handleContextMenuClose}
        onEdit={handleEditTable}
        onDelete={handleDeleteTable}
        onAddField={handleAddField}
        onRename={handleRenameTable}
      />

      <RelationshipContextMenu
        visible={relationshipContextMenu.visible}
        x={relationshipContextMenu.x}
        y={relationshipContextMenu.y}
        onClose={handleRelationshipContextMenuClose}
        onEdit={handleEditRelationship}
        onDelete={handleDeleteRelationship}
        onRename={handleRenameRelationship}
        onSwapDirection={handleSwapRelationshipDirection}
        onChangeType={handleChangeRelationshipType}
        onChangeCardinality={handleChangeRelationshipCardinality}
        onSetDefaultName={handleSetDefaultRelationshipName}
        currentType={
          relationshipContextMenu.relationshipId !== null
            ? relationships[relationshipContextMenu.relationshipId]
                ?.relationshipType
            : null
        }
        currentCardinality={
          relationshipContextMenu.relationshipId !== null
            ? relationships[relationshipContextMenu.relationshipId]?.cardinality
            : null
        }
      />

      <AreaContextMenu
        visible={areaContextMenu.visible}
        x={areaContextMenu.x}
        y={areaContextMenu.y}
        onClose={handleAreaContextMenuClose}
        onEdit={handleEditArea}
        onDelete={handleDeleteArea}
        onRename={handleRenameArea}
        onChangeColor={handleAreaChangeColor}
      />

      <NoteContextMenu
        visible={noteContextMenu.visible}
        x={noteContextMenu.x}
        y={noteContextMenu.y}
        onClose={handleNoteContextMenuClose}
        onEdit={handleEditNote}
        onDelete={handleDeleteNote}
        onRename={handleRenameNote}
        onEditContent={handleEditNoteContent}
        onChangeColor={handleNoteChangeColor}
      />

      <CanvasContextMenu
        visible={canvasContextMenu.visible}
        x={canvasContextMenu.x}
        y={canvasContextMenu.y}
        onClose={handleCanvasContextMenuClose}
        onAddTable={handleCanvasAddTable}
        onAddArea={handleCanvasAddArea}
        onAddNote={handleCanvasAddNote}
        onUndo={handleCanvasUndo}
        onRedo={handleCanvasRedo}
        onStartAreaSelection={handleCanvasStartAreaSelection}
        undoStack={undoStack}
        redoStack={redoStack}
      />

      <FieldContextMenu
        visible={fieldContextMenu.visible}
        x={fieldContextMenu.x}
        y={fieldContextMenu.y}
        field={
          fieldContextMenu.tableId !== null && fieldContextMenu.fieldId !== null
            ? tables
                .find((t) => t.id === fieldContextMenu.tableId)
                ?.fields.find((f) => f.id === fieldContextMenu.fieldId)
            : null
        }
        onClose={handleFieldContextMenuClose}
        onEdit={handleEditField}
        onRename={handleFieldRename}
        onDelete={handleDeleteField}
        onTogglePrimaryKey={handleToggleFieldPrimaryKey}
        onToggleNotNull={handleToggleFieldNotNull}
        onToggleUnique={handleToggleFieldUnique}
        onToggleAutoIncrement={handleToggleFieldAutoIncrement}
      />

      <Modal
        title={t("rename") + " Table"}
        visible={renameModal.visible}
        onOk={handleRenameConfirm}
        onCancel={handleRenameCancel}
        okText={t("confirm")}
        cancelText={t("cancel")}
      >
        <div style={{ padding: "20px 0" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "bold",
            }}
          >
            {t("name")}:
          </label>
          <Input
            ref={tableRenameInputRef}
            value={renameModal.newName}
            onChange={(value) =>
              setRenameModal((prev) => ({
                ...prev,
                newName: value,
              }))
            }
            placeholder={t("name")}
            onEnterPress={handleRenameConfirm}
          />
        </div>
      </Modal>

      <Modal
        title={t("rename") + " Relationship"}
        visible={relationshipRenameModal.visible}
        onOk={handleRelationshipRenameConfirm}
        onCancel={handleRelationshipRenameCancel}
        okText={t("confirm")}
        cancelText={t("cancel")}
      >
        <div style={{ padding: "20px 0" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "bold",
            }}
          >
            {t("name")}:
          </label>
          <Input
            ref={relationshipRenameInputRef}
            value={relationshipRenameModal.newName}
            onChange={(value) =>
              setRelationshipRenameModal((prev) => ({
                ...prev,
                newName: value,
              }))
            }
            placeholder={t("name")}
            onEnterPress={handleRelationshipRenameConfirm}
          />
        </div>
      </Modal>

      <Modal
        title={t("rename") + " Area"}
        visible={areaRenameModal.visible}
        onOk={handleAreaRenameConfirm}
        onCancel={handleAreaRenameCancel}
        okText={t("confirm")}
        cancelText={t("cancel")}
      >
        <div style={{ padding: "20px 0" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "bold",
            }}
          >
            {t("name")}:
          </label>
          <Input
            value={areaRenameModal.newName}
            onChange={(value) =>
              setAreaRenameModal((prev) => ({
                ...prev,
                newName: value,
              }))
            }
            placeholder={t("name")}
            autoFocus
            onEnterPress={handleAreaRenameConfirm}
          />
        </div>
      </Modal>

      <Modal
        title={t("rename") + " Note"}
        visible={noteRenameModal.visible}
        onOk={handleNoteRenameConfirm}
        onCancel={handleNoteRenameCancel}
        okText={t("confirm")}
        cancelText={t("cancel")}
      >
        <div style={{ padding: "20px 0" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "bold",
            }}
          >
            {t("title")}:
          </label>
          <Input
            value={noteRenameModal.newName}
            onChange={(value) =>
              setNoteRenameModal((prev) => ({
                ...prev,
                newName: value,
              }))
            }
            placeholder={t("title")}
            autoFocus
            onEnterPress={handleNoteRenameConfirm}
          />
        </div>
      </Modal>

      <Modal
        title={t("rename") + " Field"}
        visible={fieldRenameModal.visible}
        onOk={handleFieldRenameConfirm}
        onCancel={handleFieldRenameCancel}
        okText={t("confirm")}
        cancelText={t("cancel")}
        maskClosable={false}
        keyboard={false}
      >
        <div style={{ padding: "20px 0" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "bold",
            }}
          >
            {t("name")}:
          </label>
          <Input
            ref={fieldRenameInputRef}
            value={fieldRenameModal.newName}
            onChange={(value) =>
              setFieldRenameModal((prev) => ({
                ...prev,
                newName: value,
              }))
            }
            placeholder={t("name")}
            onEnterPress={(e) => {
              e?.preventDefault();
              e?.stopPropagation();
              handleFieldRenameConfirm();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                handleFieldRenameConfirm();
              }
            }}
          />
        </div>
      </Modal>

      <Modal
        title="Foreign Key Relationship Detected"
        visible={foreignKeyRenameModal.visible}
        onOk={handleForeignKeyRenameYes}
        onCancel={handleForeignKeyRenameCancel}
        okText="Yes, rename both"
        cancelText="Cancel"
        width={600}
        footer={foreignKeyRenameFooter}
      >
        <div style={{ padding: "20px 0" }}>
          <p style={{ marginBottom: "16px", lineHeight: "1.5" }}>
            This field is part of a foreign key relationship with:
          </p>
          <div
            style={{
              padding: "12px",
              backgroundColor:
                settings.mode === "light" ? "#f5f5f5" : "#374151",
              borderRadius: "4px",
              marginBottom: "16px",
            }}
          >
            <strong
              style={{
                color: settings.mode === "light" ? "#1f2937" : "#f9fafb",
              }}
            >
              {foreignKeyRenameModal.relatedField?.tableName}.
              {foreignKeyRenameModal.relatedField?.fieldName}
            </strong>
          </div>
          <p style={{ lineHeight: "1.5" }}>
            Would you like to rename the related field to{" "}
            <strong>&ldquo;{foreignKeyRenameModal.newName}&rdquo;</strong> as
            well to maintain consistency?
          </p>
        </div>
      </Modal>
    </div>
  );
}
