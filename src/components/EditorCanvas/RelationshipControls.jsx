import { useMemo, useEffect, useState } from "react";
import { useSelect, useWaypointEditor, useSubtypeWaypoints, useDiagram, useSettings } from "../../hooks";
import { WaypointContainer } from "./WaypointHandle";
import { ConnectionPointHandles } from "./ConnectionPointHandle";
import { ObjectType, Notation } from "../../data/constants";
import {
  getFieldPerimeterPoints,
  getAllTablePerimeterPoints,
  findClosestPerimeterPoint
} from "../../utils/perimeterPoints";

/**
 * RelationshipControls - Renders interactive waypoint and connection point handles
 * This component is rendered separately from the relationship line itself to ensure
 * waypoints and handles appear on top of tables in the z-order.
 */
export default function RelationshipControls({ data }) {
  const { tables, updateRelationshipWaypoints, updateRelationship, updateSubtypePerimeterPoints } = useDiagram();
  const { selectedElement } = useSelect();
  const { settings } = useSettings();

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

  // Multi-child subtype perimeter points logic - MUST be before early return
  const isMultiChildSubtype = data.subtype && data.endTableIds && data.endTableIds.length > 1;
  const [isDraggingPerimeter, setIsDraggingPerimeter] = useState(false);
  const [draggingPerimeterType, setDraggingPerimeterType] = useState(null);
  const [draggingChildId, setDraggingChildId] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const childTables = useMemo(() => {
    if (!isMultiChildSubtype) return [];
    return data.endTableIds.map(id => tables.find(t => t.id === id)).filter(Boolean);
  }, [isMultiChildSubtype, data.endTableIds, tables]);

  // Show waypoints when relationship is selected
  useEffect(() => {
    if (!shouldUseWaypoints) return;
    if (isSelected && waypointsData?.setShowWaypoints) {
      waypointsData.setShowWaypoints(true);
    }
  }, [isSelected, shouldUseWaypoints, waypointsData]);

  const handlePerimeterMouseDown = (e, type, childId = null) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Get canvas element and coordinates using SVG transformation
    const svg = e.currentTarget.ownerSVGElement || document.getElementById('diagram') || document.querySelector('svg.canvas');
    if (!svg) return;
    
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const canvasPt = pt.matrixTransform(svg.getScreenCTM().inverse());
    
    setMousePosition({ x: canvasPt.x, y: canvasPt.y });
    setIsDraggingPerimeter(true);
    setDraggingPerimeterType(type);
    setDraggingChildId(childId);
  };

  useEffect(() => {
    if (!isDraggingPerimeter) return;

    const hasColorStrip = settings.notation === Notation.DEFAULT;

    const handleMove = (e) => {
      // Get canvas element and coordinates
      const svg = document.getElementById('diagram') || document.querySelector('svg.canvas') || document.querySelector('svg');
      if (!svg) return;
      
      // Use SVG point transformation for accurate coordinates
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const canvasPt = pt.matrixTransform(svg.getScreenCTM().inverse());
      
      setMousePosition({ x: canvasPt.x, y: canvasPt.y });

      // Update perimeter point IN REAL-TIME during drag (like ConnectionPointHandles)
      if (draggingPerimeterType === 'parent') {
        const parentPerimeterPoints = getAllTablePerimeterPoints(startTable, hasColorStrip);
        const closestPoint = findClosestPerimeterPoint(parentPerimeterPoints, canvasPt.x, canvasPt.y, Infinity);
        
        if (closestPoint && updateSubtypePerimeterPoints) {
          const currentChildPoints = data.subtypePerimeterPoints?.childPoints || {};
          updateSubtypePerimeterPoints(data.id, {
            parentPoint: {
              side: closestPoint.side,
              fieldIndex: closestPoint.fieldIndex
            },
            childPoints: currentChildPoints
          });
        }
      } else if (draggingPerimeterType === 'child' && draggingChildId) {
        const childTable = childTables.find(t => t.id === draggingChildId);
        if (childTable) {
          const childPerimeterPoints = getAllTablePerimeterPoints(childTable, hasColorStrip);
          const closestPoint = findClosestPerimeterPoint(childPerimeterPoints, canvasPt.x, canvasPt.y, Infinity);
          
          if (closestPoint && updateSubtypePerimeterPoints) {
            const currentParentPoint = data.subtypePerimeterPoints?.parentPoint || {};
            const currentChildPoints = data.subtypePerimeterPoints?.childPoints || {};
            
            updateSubtypePerimeterPoints(data.id, {
              parentPoint: currentParentPoint,
              childPoints: {
                ...currentChildPoints,
                [draggingChildId]: {
                  side: closestPoint.side,
                  fieldIndex: closestPoint.fieldIndex
                }
              }
            });
          }
        }
      }
    };

    const handleUp = (e) => {
      setIsDraggingPerimeter(false);
      setDraggingPerimeterType(null);
      setDraggingChildId(null);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
  }, [isDraggingPerimeter, draggingPerimeterType, draggingChildId, data.id, data.subtypePerimeterPoints, isMultiChildSubtype, settings.notation, updateSubtypePerimeterPoints, childTables, startTable]);

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

      {/* Perimeter points for multi-child subtype relationships */}
      {isMultiChildSubtype && isSelected && (() => {
        const hasColorStrip = settings.notation === Notation.DEFAULT;
        const parentPerimeterPoints = getAllTablePerimeterPoints(startTable, hasColorStrip);

        return (
          <>
            {/* Parent table perimeter points */}
            {parentPerimeterPoints.map((point, idx) => {
              if (!point) return null;
              
              const isCurrentPoint = data.subtypePerimeterPoints && 
                                     data.subtypePerimeterPoints.parentPoint &&
                                     data.subtypePerimeterPoints.parentPoint.side === point.side &&
                                     data.subtypePerimeterPoints.parentPoint.fieldIndex === point.fieldIndex;
              
              const closestPoint = isDraggingPerimeter && draggingPerimeterType === 'parent' 
                ? findClosestPerimeterPoint(parentPerimeterPoints, mousePosition.x, mousePosition.y, Infinity)
                : null;
              const isHovered = closestPoint && closestPoint.side === point.side && closestPoint.fieldIndex === point.fieldIndex;
              
              // Solo mostrar: el punto actual SIEMPRE, o todos los puntos durante el drag
              const shouldShow = isCurrentPoint || (isDraggingPerimeter && draggingPerimeterType === 'parent');
              if (!shouldShow) return null;
              
              const handleMouseDown = (e) => {
                if (isCurrentPoint) {
                  handlePerimeterMouseDown(e, 'parent');
                }
              };
              
              // Mostrar puntos disponibles (grises) durante drag, punto actual (rojo) siempre
              const showAsAvailable = !isCurrentPoint && isDraggingPerimeter;
              
              return (
                <g key={`parent-perimeter-${idx}`}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={isCurrentPoint ? 9 : (isHovered ? 8 : 7)}
                    fill={isCurrentPoint ? "rgba(239, 68, 68, 0.3)" : (isHovered ? "rgba(239, 68, 68, 0.2)" : "rgba(156, 163, 175, 0.1)")}
                    stroke={isCurrentPoint ? "#ef4444" : (isHovered ? "#ef4444" : "#9ca3af")}
                    strokeWidth={isCurrentPoint ? 3 : (isHovered ? 2.5 : 1.5)}
                    cursor={isCurrentPoint ? "move" : "default"}
                    onMouseDown={handleMouseDown}
                  />
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={isCurrentPoint ? 5 : (isHovered ? 4 : 3)}
                    fill={isCurrentPoint ? "#ef4444" : (isHovered ? "#f87171" : "#d1d5db")}
                    cursor={isCurrentPoint ? "move" : "default"}
                    onMouseDown={handleMouseDown}
                    pointerEvents={isCurrentPoint ? "all" : "none"}
                  />
                </g>
              );
            })}

            {/* Child tables perimeter points */}
            {childTables.map((childTable) => {
              const childId = childTable.id;
              const childPerimeterPoints = getAllTablePerimeterPoints(childTable, hasColorStrip);
              
              const savedChildPoint = data.subtypePerimeterPoints?.childPoints?.[childId];
              
              // Verificar si el punto guardado existe en los puntos generados
              const savedPointExists = savedChildPoint && childPerimeterPoints.some(
                p => p && p.side === savedChildPoint.side && p.fieldIndex === savedChildPoint.fieldIndex
              );
              
              if (savedChildPoint && !savedPointExists) {
                console.warn(`⚠️ Saved point for ${childTable.name} (${childId}) doesn't exist in generated points. Saved:`, savedChildPoint);
                console.warn(`   Available sides:`, [...new Set(childPerimeterPoints.filter(p => p).map(p => p.side))]);
              }

              return childPerimeterPoints.map((point, idx) => {
                if (!point) return null;
                
                const savedChildPoint = data.subtypePerimeterPoints?.childPoints?.[childId];
                
                // Solo mostrar si el punto guardado coincide EXACTAMENTE con este punto
                const isCurrentPoint = savedChildPoint && 
                  point.side === savedChildPoint.side && 
                  point.fieldIndex === savedChildPoint.fieldIndex;
                
                // Log solo para debug (remover después)
                if (idx === 0 && savedChildPoint && !isCurrentPoint) {
                  console.warn(`⚠️ ${childTable.name} (${childId}): Saved point doesn't match. Saved:`, savedChildPoint, 'Available:', childPerimeterPoints.filter(p => p).map(p => ({side: p.side, fieldIndex: p.fieldIndex})));
                }
                
                const closestPoint = isDraggingPerimeter && draggingPerimeterType === 'child' && draggingChildId === childId
                  ? findClosestPerimeterPoint(childPerimeterPoints, mousePosition.x, mousePosition.y, Infinity)
                  : null;
                const isHovered = closestPoint && closestPoint.side === point.side && closestPoint.fieldIndex === point.fieldIndex;
                
                // Solo mostrar: el punto actual SIEMPRE, o todos los puntos durante el drag de ESTE child
                const shouldShow = isCurrentPoint || (isDraggingPerimeter && draggingPerimeterType === 'child' && draggingChildId === childId);
                if (!shouldShow) return null;
                
                const handleMouseDown = (e) => {
                  if (isCurrentPoint) {
                    handlePerimeterMouseDown(e, 'child', childId);
                  }
                };
                
                return (
                  <g key={`child-perimeter-${childId}-${idx}`}>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={isCurrentPoint ? 9 : (isHovered ? 8 : 7)}
                      fill={isCurrentPoint ? "rgba(59, 130, 246, 0.3)" : (isHovered ? "rgba(59, 130, 246, 0.2)" : "rgba(156, 163, 175, 0.1)")}
                      stroke={isCurrentPoint ? "#3b82f6" : (isHovered ? "#3b82f6" : "#9ca3af")}
                      strokeWidth={isCurrentPoint ? 3 : (isHovered ? 2.5 : 1.5)}
                      cursor={isCurrentPoint ? "move" : "default"}
                      onMouseDown={handleMouseDown}
                    />
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={isCurrentPoint ? 5 : (isHovered ? 4 : 3)}
                      fill={isCurrentPoint ? "#3b82f6" : (isHovered ? "#60a5fa" : "#d1d5db")}
                      cursor={isCurrentPoint ? "move" : "default"}
                      onMouseDown={handleMouseDown}
                      pointerEvents={isCurrentPoint ? "all" : "none"}
                    />
                  </g>
                );
              });
            })}
          </>
        );
      })()}
    </g>
  );
}
