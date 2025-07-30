import { useRef } from "react";
import {
  RelationshipType,
  RelationshipCardinalities,
  ParentCardinality,
  darkBgTheme,
  ObjectType,
  Tab,
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

  // Helper function to sort fields (same logic as in Table.jsx)
  const getSortedFields = (fields) => {
    if (!fields) return [];
    return [...fields].sort((a, b) => {
      const aIsPK = a.primary;
      const bIsPK = b.primary;
      const aIsFK = a.foreignK === true;
      const bIsFK = b.foreignK === true;

      let groupA;
      if (aIsPK) groupA = 1;
      else if (!aIsFK) groupA = 2;
      else groupA = 3;

      let groupB;
      if (bIsPK) groupB = 1;
      else if (!bIsFK) groupB = 2;
      else groupB = 3;

      if (groupA !== groupB) return groupA - groupB;
      return 0;
    });
  };
  const startTable = tables[data.startTableId];
  const endTable = tables[data.endTableId];

  let startFieldYOffset = 0;
  let endFieldYOffset = 0;
  const effectiveColorStripHeight = settings.notation === Notation.DEFAULT ? tableColorStripHeight : 0;
  const totalHeaderHeightForFields = tableHeaderHeight + effectiveColorStripHeight;

  if (startTable && startTable.fields && data.startFieldId !== undefined) {
    const sortedStartFields = getSortedFields(startTable.fields);
    const startFieldIndex = sortedStartFields.findIndex(f => f.id === data.startFieldId);
    if (startFieldIndex !== -1) {
      startFieldYOffset = totalHeaderHeightForFields + (startFieldIndex * tableFieldHeight) + (tableFieldHeight / 2);
    } else {
      // Fallback if field not found, point to middle of table header or top
      startFieldYOffset = tableHeaderHeight / 2;
    }
  }

  if (endTable && endTable.fields && data.endFieldId !== undefined) {
    const sortedEndFields = getSortedFields(endTable.fields);
    const endFieldIndex = sortedEndFields.findIndex(f => f.id === data.endFieldId);
    if (endFieldIndex !== -1) {
      endFieldYOffset = totalHeaderHeightForFields + (endFieldIndex * tableFieldHeight) + (tableFieldHeight / 2);
    } else {
      // Fallback, similar to startFieldYOffset
      endFieldYOffset = tableHeaderHeight / 2;
    }
  }

  // This part for strokeDasharray remains the same
  let determinedRelationshipType = null;
  if (endTable && endTable.fields && data.endFieldId !== undefined) {
    const foreignKeyField = endTable.fields.find(field => field.id === data.endFieldId);
    if (foreignKeyField) {
      if (foreignKeyField.primary === true) {
        determinedRelationshipType = "0";
      } else {
        determinedRelationshipType = "5.5"; // Assuming "5.5" is a valid dasharray string like "5,5"
      }
    }
  }
  const relationshipType = determinedRelationshipType !== null ? determinedRelationshipType : (data.lineType || "0");

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
      default:  {
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
  }

  const effectiveNotationKey =
    settings.notation &&
    Object.prototype.hasOwnProperty.call(
      formats.notation,
      settings.notation,
    )
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

  let cardinalityStartX = 0;
  let cardinalityEndX = 0;
  let cardinalityStartY = 0;
  let cardinalityEndY = 0;
  let labelX = 0;
  let labelY = 0;

  let labelWidth = labelRef.current?.getBBox().width ?? 0;
  let labelHeight = labelRef.current?.getBBox().height ?? 0;

  const cardinalityOffset = 28;

  if (pathRef.current) {
    const pathLength = pathRef.current.getTotalLength();

    const labelPoint = pathRef.current.getPointAtLength(pathLength / 2);
    labelX = labelPoint.x - (labelWidth ?? 0) / 2;
    labelY = labelPoint.y + (labelHeight ?? 0) / 2;

    const point1 = pathRef.current.getPointAtLength(cardinalityOffset);
    cardinalityStartX = point1.x;
    cardinalityStartY = point1.y;
    const point2 = pathRef.current.getPointAtLength(
      pathLength - cardinalityOffset,
    );
    cardinalityEndX = point2.x;
    cardinalityEndY = point2.y;
  }

  const edit = () => {
    if (!layout.sidebar) {
      setSelectedElement((prev) => ({
        ...prev,
        element: ObjectType.RELATIONSHIP,
        id: data.id,
        open: true,
      }));
    } else {
      setSelectedElement((prev) => ({
        ...prev,
        currentTab: Tab.RELATIONSHIPS,
        element: ObjectType.RELATIONSHIP,
        id: data.id,
        open: true,
      }));
      if (selectedElement.currentTab !== Tab.RELATIONSHIPS) return;
      document
        .getElementById(`scroll_ref_${data.id}`)
        .scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <g className="select-none group" onDoubleClick={edit}>
        <path
          ref={pathRef}
          d={calcPath(
            {
              ...data,
              startTable: {
                x: tables[data.startTableId].x,
                y: tables[data.startTableId].y,
              },
              endTable: {
                x: tables[data.endTableId].x,
                y: tables[data.endTableId].y,
              },
            },
            settings.tableWidth,
          )}
          stroke="gray"
          className="group-hover:stroke-sky-700"
          fill="none"
          strokeWidth={2}
          cursor="pointer"
        />
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
        {pathRef.current && settings.showCardinality && (
          <>
            <circle
              cx={cardinalityStartX}
              cy={cardinalityStartY}
              r="12"
              fill="grey"
              className="group-hover:fill-sky-700"
            />
            <text
              x={cardinalityStartX}
              y={cardinalityStartY}
              fill="white"
              strokeWidth="0.5"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {cardinalityStart}
            </text>
            <circle
              cx={cardinalityEndX}
              cy={cardinalityEndY}
              r="12"
              fill="grey"
              className="group-hover:fill-sky-700"
            />
            <text
              x={cardinalityEndX}
              y={cardinalityEndY}
              fill="white"
              strokeWidth="0.5"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {cardinalityEnd}
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
        onCancel={() => {
          setSelectedElement((prev) => ({
            ...prev,
            open: false,
          }));
        }}
        style={{ paddingBottom: "16px" }}
      >
        <div className="sidesheet-theme">
          <RelationshipInfo data={data} />
        </div>
      </SideSheet>
    </>
  );
}
