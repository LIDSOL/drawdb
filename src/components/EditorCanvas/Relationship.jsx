import { useRef, useState, useEffect } from "react";
import {
  RelationshipType,
  RelationshipCardinalities,
  ParentCardinality,
  darkBgTheme,
  Notation,
  ObjectType,
  Tab,
  tableFieldHeight,
  tableHeaderHeight,
  tableColorStripHeight,
} from "../../data/constants";
import { calcPath } from "../../utils/calcPath";
import { useDiagram, useSettings, useLayout, useSelect } from "../../hooks";
import { useTranslation } from "react-i18next";
import { SideSheet } from "@douyinfe/semi-ui";
import RelationshipInfo from "../EditorSidePanel/RelationshipsTab/RelationshipInfo";
import {
  CrowParentLines,
  CrowParentDiamond,
  CrowsFootChild,
  IDEFZM,
  DefaultNotation
} from "./RelationshipFormat";

const labelFontSize = 16;

export default function Relationship({ data }) {
  const { settings } = useSettings();
  const { tables } = useDiagram();
  const { layout } = useLayout();
  const { selectedElement, setSelectedElement } = useSelect();
  const { t } = useTranslation();

  const theme = localStorage.getItem("theme");

  const pathRef = useRef();
  const labelRef = useRef();

  const [breakpoints, setBreakpoints] = useState(data.breakpoints ?? []);
  const [draggingBpIndex, setDraggingBpIndex] = useState(null);

  const startTable = tables[data.startTableId];
  const endTable = tables[data.endTableId];

  if (!startTable || !endTable) return null;

  const getSortedFields = (fields) => {
    if (!fields) return [];
    return [...fields].sort((a, b) => {
      const aIsPK = a.primary;
      const bIsPK = b.primary;
      const aIsFK = a.foreignK === true;
      const bIsFK = b.foreignK === true;

      let groupA = aIsPK ? 1 : !aIsFK ? 2 : 3;
      let groupB = bIsPK ? 1 : !bIsFK ? 2 : 3;

      return groupA - groupB;
    });
  };

  let startFieldYOffset = 0;
  let endFieldYOffset = 0;
  const effectiveColorStripHeight = settings.notation === Notation.DEFAULT ? tableColorStripHeight : 0;
  const totalHeaderHeightForFields = tableHeaderHeight + effectiveColorStripHeight;

  if (startTable && startTable.fields && data.startFieldId !== undefined) {
    const sortedStartFields = getSortedFields(startTable.fields);
    const startFieldIndex = sortedStartFields.findIndex(f => f.id === data.startFieldId);
    startFieldYOffset = startFieldIndex !== -1
      ? totalHeaderHeightForFields + (startFieldIndex * tableFieldHeight) + (tableFieldHeight / 2)
      : tableHeaderHeight / 2;
  }

  if (endTable && endTable.fields && data.endFieldId !== undefined) {
    const sortedEndFields = getSortedFields(endTable.fields);
    const endFieldIndex = sortedEndFields.findIndex(f => f.id === data.endFieldId);
    endFieldYOffset = endFieldIndex !== -1
      ? totalHeaderHeightForFields + (endFieldIndex * tableFieldHeight) + (tableFieldHeight / 2)
      : tableHeaderHeight / 2;
  }

  let determinedRelationshipType = null;
  if (endTable && endTable.fields && data.endFieldId !== undefined) {
    const foreignKeyField = endTable.fields.find(field => field.id === data.endFieldId);
    if (foreignKeyField) {
      determinedRelationshipType = foreignKeyField.primary ? "0" : "5.5";
    }
  }
  const relationshipType = determinedRelationshipType ?? data.lineType ?? "0";

  const getForeignKeyFields = () => {
    if(!endTable || !endTable.fields) return [];

    if(Array.isArray(data.endFieldId)){
      return endTable.fields.filter(f => data.endFieldId.includes(f.id));
    } else if (data.endFieldId !== undefined) {
      return endTable.fields.filter(f => f.id === data.endFieldId);
    }
    return [];
  };

  let direction = 1;
  let cardinalityStart = "1";
  let cardinalityEnd = "1";

  const isCrowOrIDEF = settings.notation === Notation.CROWS_FOOT || settings.notation === Notation.IDEF1X;
  const isDefault = settings.notation === Notation.DEFAULT;
  const fkFields = getForeignKeyFields();

  if (isCrowOrIDEF) {
    const allNullable = fkFields.length > 0 && fkFields.every(field => !field.notNull);
    cardinalityStart = allNullable
      ? ParentCardinality.NULLEABLE.label
      : ParentCardinality.DEFAULT.label;
    if (data.relationshipType === RelationshipType.ONE_TO_ONE) {
      cardinalityEnd =
        data.cardinality ||
        RelationshipCardinalities[RelationshipType.ONE_TO_ONE][0].label;
    } else if (data.relationshipType === RelationshipType.ONE_TO_MANY) {
      cardinalityEnd =
        data.cardinality ||
        RelationshipCardinalities[RelationshipType.ONE_TO_MANY][0].label;
    }
  } else if (isDefault) {
    cardinalityStart = "1";
    cardinalityEnd = data.relationshipType === RelationshipType.ONE_TO_MANY ? "n" : "1";
  }

  const formats = {
    notation: {
      default: {
        one_to_one: DefaultNotation,
        one_to_many: DefaultNotation,
      },
      crows_foot: {
        child: CrowsFootChild,
        parent_lines: CrowParentLines,
        parent_diamond: CrowParentDiamond,
      },
      idef1x: {
        one_to_one: IDEFZM,
        one_to_many: IDEFZM,
        parent_diamond: CrowParentDiamond,
      },
    }
  };

  const effectiveNotationKey = Object.prototype.hasOwnProperty.call(formats.notation, settings.notation)
    ? settings.notation
    : Notation.DEFAULT;

  const currentNotation = formats.notation[effectiveNotationKey];

  let parentFormat = null;
  if (settings.notation === Notation.CROWS_FOOT) {
    if (cardinalityStart === "(1,1)") {
      parentFormat = currentNotation.parent_lines;
    } else if (cardinalityStart === "(0,1)") {
      parentFormat = currentNotation.parent_diamond;
    }
  } else if (settings.notation === Notation.IDEF1X) {
    if (cardinalityStart === "(0,1)") {
      parentFormat = currentNotation.parent_diamond;
    }
  }

  let childFormat;
  if (settings.notation === Notation.CROWS_FOOT) {
    childFormat = currentNotation.child;
  } else if (settings.notation === Notation.IDEF1X) {
    if (data.relationshipType === RelationshipType.ONE_TO_ONE) {
      childFormat = currentNotation.one_to_one;
    } else if (data.relationshipType === RelationshipType.ONE_TO_MANY) {
      childFormat = currentNotation.one_to_many;
    }
  } else {
    if (data.relationshipType === RelationshipType.ONE_TO_ONE) {
      childFormat = currentNotation.one_to_one;
    }
    else if (data.relationshipType === RelationshipType.ONE_TO_MANY) {
      childFormat = currentNotation.one_to_many;
    }
  }

  const pathData = {
    ...data,
    startTable: {
      x: startTable ? startTable.x : 0,
      y: startTable ? startTable.y + startFieldYOffset : 0,
    },
    endTable: {
      x: endTable ? endTable.x : 0,
      y: endTable ? endTable.y + endFieldYOffset : 0,
    },
    breakpoints,
  };

  const { path, startAttach, endAttach, breakpoints: defaultBreakpoints } = calcPath(
    pathData,
    settings.tableWidth
  );

  useEffect(() => {
    if (!breakpoints?.length) {
      setBreakpoints(defaultBreakpoints);
    }
  }, [startTable, endTable]);

  const handleBpPointerDown = (e, idx) => {
    e.stopPropagation();
    setDraggingBpIndex(idx);
  };

  const handlePointerMove = (e) => {
    if (draggingBpIndex !== null) {
      const svg = e.target.ownerSVGElement;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const cursor = pt.matrixTransform(svg.getScreenCTM().inverse());

      setBreakpoints((prev) => {
        const updated = [...prev];
        updated[draggingBpIndex] = { x: cursor.x, y: cursor.y };
        return updated;
      });
    }
  };

  const handlePointerUp = () => setDraggingBpIndex(null);

  let cardinalityStartX = 0;
  let cardinalityEndX = 0;
  let cardinalityStartY = 0;
  let cardinalityEndY = 0;
  let labelX = 0;
  let labelY = 0;

  let labelWidth = labelRef.current?.getBBox().width ?? 0;
  let labelHeight = labelRef.current?.getBBox().height ?? 0;

  const cardinalityOffset = 28;

  if (pathRef.current && path) {
    const pathLength = pathRef.current.getTotalLength() - cardinalityOffset;

    const labelPoint = pathRef.current.getPointAtLength(pathLength / 2);
    labelX = labelPoint.x - (labelWidth ?? 0) / 2;
    labelY = labelPoint.y + (labelHeight ?? 0) / 2;

    const point1 = pathRef.current.getPointAtLength(cardinalityOffset);
    cardinalityStartX = startAttach.x;
    cardinalityStartY = startAttach.y;

    const point2 = pathRef.current.getPointAtLength(pathLength);
    cardinalityEndX = endAttach.x;
    cardinalityEndY = endAttach.y; 
  }

  const edit = () => {
    if (!layout.sidebar) {
      setSelectedElement({
        element: ObjectType.RELATIONSHIP,
        id: data.id,
        open: true,
      });
    } else {
      setSelectedElement({
        currentTab: Tab.RELATIONSHIPS,
        element: ObjectType.RELATIONSHIP,
        id: data.id,
        open: true,
      });
      if (selectedElement.currentTab !== Tab.RELATIONSHIPS) return;
      document.getElementById(`scroll_ref_${data.id}`)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  if ((settings.notation === Notation.CROWS_FOOT || settings.notation === Notation.IDEF1X) && cardinalityEndX < cardinalityStartX) {
    direction = -1;
  }

  return (
    <>
      <g
        className="select-none group"
        onDoubleClick={edit}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <path
          d={path}
          stroke="transparent"
          fill="none"
          strokeWidth={15}
          strokeDasharray={"0"}
          cursor="pointer"
        />
        <path
          ref={pathRef}
          d={path}
          stroke="gray"
          className="group-hover:stroke-sky-700"
          fill="none"
          strokeDasharray={relationshipType}
          strokeWidth={2}
        />

        {(breakpoints ?? []).map((bp, idx) => (
          <circle
            key={`bp-${idx}`}
            cx={bp.x}
            cy={bp.y}
            r={6}
            fill="skyblue"
            stroke="gray"
            strokeWidth={1}
            cursor="move"
            onPointerDown={(e) => handleBpPointerDown(e, idx)}
          />
        ))}

        {parentFormat && parentFormat(
          cardinalityStartX,
          cardinalityStartY,
          direction,
        )}

        {settings.notation === 'default' && settings.showCardinality && childFormat && childFormat(
          pathRef,
          cardinalityEndX,
          cardinalityEndY,
          cardinalityStartX,
          cardinalityStartY,
          direction,
          cardinalityStart,
          cardinalityEnd
        )}

        {settings.notation !== 'default' && childFormat && childFormat(
          pathRef,
          cardinalityEndX,
          cardinalityEndY,
          cardinalityStartX,
          cardinalityStartY,
          direction,
          cardinalityStart,
          cardinalityEnd,
          settings.showCardinality
        )}

        {settings.showRelationshipLabels && (
          <>
            <rect
              x={labelX - 2}
              y={labelY - labelFontSize}
              fill={theme === "dark" ? darkBgTheme : "white"}
              width={labelWidth + 4}
              height={labelHeight}
            />
            <text
              x={labelX}
              y={labelY}
              fill={theme === "dark" ? "lightgrey" : "#333"}
              fontSize={labelFontSize}
              fontWeight={500}
              ref={labelRef}
              className="group-hover:fill-sky-700"
            >
              {data.name}
            </text>
          </>
        )}
      </g>

      <SideSheet
        title={t("edit")}
        size="small"
        visible={
          selectedElement.element === ObjectType.RELATIONSHIP &&
          selectedElement.id === data.id &&
          selectedElement.open &&
          !layout.sidebar
        }
        onCancel={() =>
          setSelectedElement((prev) => ({
            ...prev,
            open: false,
          }))
        }
        style={{ paddingBottom: "16px" }}
      >
        <div className="sidesheet-theme">
          <RelationshipInfo data={data} />
        </div>
      </SideSheet>
    </>
  );
}
