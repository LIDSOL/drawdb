import { useMemo, useEffect } from "react";
import { useSelect, useWaypointEditor, useDiagram } from "../../hooks";
import { WaypointContainer } from "./WaypointHandle";
import { ConnectionPointHandles } from "./ConnectionPointHandle";
import { ObjectType } from "../../data/constants";
import {
  getFieldPerimeterPoints,
  getAllTablePerimeterPoints
} from "../../utils/perimeterPoints";

/**
 * RelationshipControls - Renders interactive waypoint and connection point handles
 * This component is rendered separately from the relationship line itself to ensure
 * waypoints and handles appear on top of tables in the z-order.
 */
export default function RelationshipControls({ data }) {
  const { tables, updateRelationshipWaypoints, updateRelationship } = useDiagram();
  const { selectedElement } = useSelect();

  // Find start and end tables
  const startTable = useMemo(() => {
    return tables.find((t) => t.id === data.startTableId);
  }, [data.startTableId, tables]);

  const endTable = useMemo(() => {
    if (data.endTableIds && data.endTableIds.length > 0) {
      return tables.find((t) => t.id === data.endTableIds[0]);
    }
    return tables.find((t) => t.id === data.endTableId);
  }, [data.endTableId, data.endTableIds, tables]);

  // Waypoint editor hook - always call hook but may not be active for subtype relationships
  const shouldUseWaypoints = !data.subtype && startTable && endTable;
  const waypointsData = useWaypointEditor(
    shouldUseWaypoints ? data : null,
    tables,
    (updatedWaypoints) => {
      if (shouldUseWaypoints) {
        updateRelationshipWaypoints(data.id, updatedWaypoints);
      }
    }
  );

  const {
    waypoints = [],
    draggedWaypointIndex = -1,
    hoveredWaypointIndex = -1,
    hoveredVirtualBendIndex = -1,
    showWaypoints = false,
    virtualBends = [],
    handlers = {},
  } = (shouldUseWaypoints && waypointsData) ? waypointsData : {};

  // Check if this relationship is selected
  const isSelected = selectedElement.element === ObjectType.RELATIONSHIP && selectedElement.id === data.id;

  // Calculate actual start and end points from stored side/fieldIndex
  // IMPORTANT: All hooks must be called before any conditional returns
  const actualStartPoint = useMemo(() => {
    if (!data.startPoint || !startTable) return null;
    const { side, fieldIndex } = data.startPoint;
    if (side === undefined || fieldIndex === undefined) return data.startPoint;

    const perimeterPoints = getFieldPerimeterPoints(startTable, fieldIndex);
    return perimeterPoints[side] || data.startPoint;
  }, [data.startPoint, startTable]);

  const actualEndPoint = useMemo(() => {
    if (!data.endPoint || !endTable) return null;
    const { side, fieldIndex } = data.endPoint;
    if (side === undefined || fieldIndex === undefined) return data.endPoint;

    const perimeterPoints = getFieldPerimeterPoints(endTable, fieldIndex);
    return perimeterPoints[side] || data.endPoint;
  }, [data.endPoint, endTable]);

  // Get all available perimeter points for start and end tables
  const availableStartPoints = useMemo(() => {
    if (!startTable) return [];
    return getAllTablePerimeterPoints(startTable);
  }, [startTable]);

  const availableEndPoints = useMemo(() => {
    if (!endTable) return [];
    return getAllTablePerimeterPoints(endTable);
  }, [endTable]);

  // Show waypoints when relationship is selected
  useEffect(() => {
    if (!shouldUseWaypoints) return;
    if (isSelected && waypointsData?.setShowWaypoints) {
      waypointsData.setShowWaypoints(true);
    }
  }, [isSelected, shouldUseWaypoints, waypointsData]);

  // Don't render controls if relationship is not selected
  if (!isSelected) {
    return null;
  }

  // Handlers for changing connection points
  const handleStartPointChange = (newPoint) => {
    if (!data.startPoint) return;
    updateRelationship(data.id, {
      startPoint: {
        ...data.startPoint,
        x: newPoint.x,
        y: newPoint.y,
        side: newPoint.side,
        fieldIndex: newPoint.fieldIndex,
      }
    });
  };

  const handleEndPointChange = (newPoint) => {
    if (!data.endPoint) return;
    updateRelationship(data.id, {
      endPoint: {
        ...data.endPoint,
        x: newPoint.x,
        y: newPoint.y,
        side: newPoint.side,
        fieldIndex: newPoint.fieldIndex,
      }
    });
  };

  return (
    <g className="relationship-controls">
      {/* Waypoint handles (only visible when selected and waypoints enabled) */}
      {shouldUseWaypoints && showWaypoints && handlers.onWaypointMouseDown && (
        <WaypointContainer
          waypoints={waypoints}
          relationshipId={data.id}
          selectedWaypointIndex={draggedWaypointIndex}
          hoveredWaypointIndex={hoveredWaypointIndex}
          onWaypointMouseDown={handlers.onWaypointMouseDown}
          onWaypointMouseEnter={handlers.onWaypointMouseEnter}
          onWaypointMouseLeave={handlers.onWaypointMouseLeave}
          onWaypointDoubleClick={handlers.onWaypointDoubleClick}
          showVirtualBends={true}
          virtualBends={virtualBends}
          hoveredVirtualBendIndex={hoveredVirtualBendIndex}
          onVirtualBendMouseDown={handlers.onVirtualBendMouseDown}
          onVirtualBendMouseEnter={handlers.onVirtualBendMouseEnter}
          onVirtualBendMouseLeave={handlers.onVirtualBendMouseLeave}
        />
      )}

      {/* Connection point handles (start/end points - shown when relationship is selected) */}
      {showWaypoints && data.startPoint && data.endPoint && actualStartPoint && actualEndPoint && (
        <ConnectionPointHandles
          startPoint={actualStartPoint}
          endPoint={actualEndPoint}
          isSelected={showWaypoints}
          onStartPointChange={handleStartPointChange}
          onEndPointChange={handleEndPointChange}
          availableStartPoints={availableStartPoints}
          availableEndPoints={availableEndPoints}
        />
      )}
    </g>
  );
}
