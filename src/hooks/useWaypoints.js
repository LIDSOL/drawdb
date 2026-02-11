import { useState, useCallback, useRef, useEffect } from "react";
import { EdgeHandler } from "../utils/edgeHandler";
import { getConnectionPoints } from "../utils/perimeter";

/**
 * Custom hook for managing waypoint editing on relationships
 * Handles drag operations, virtual bends, and waypoint manipulation
 */
export function useWaypointEditor(relationship, tables, onUpdate) {
  const [edgeHandler, setEdgeHandler] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedWaypointIndex, setDraggedWaypointIndex] = useState(null);
  const [hoveredWaypointIndex, setHoveredWaypointIndex] = useState(null);
  const [hoveredVirtualBendIndex, setHoveredVirtualBendIndex] = useState(null);
  const [showWaypoints, setShowWaypoints] = useState(false);

  const dragStartPos = useRef({ x: 0, y: 0 });
  const waypointStartPos = useRef({ x: 0, y: 0 });

  // Initialize edge handler when relationship or tables change
  useEffect(() => {
    if (relationship && tables) {
      const handler = new EdgeHandler(relationship, tables, {
        snapToGrid: true,
        gridSize: 10,
        waypointRadius: 6,
        virtualBendEnabled: true,
        tolerance: 10,
      });
      setEdgeHandler(handler);
    }
  }, [relationship?.id, relationship, tables]);

  // Handle waypoint mouse down (start drag)
  const handleWaypointMouseDown = useCallback((e, index) => {
    e.stopPropagation();
    e.preventDefault();

    if (!edgeHandler) return;

    const waypoint = edgeHandler.waypoints[index];
    if (!waypoint) return;

    setIsDragging(true);
    setDraggedWaypointIndex(index);

    dragStartPos.current = { x: e.clientX, y: e.clientY };
    waypointStartPos.current = { x: waypoint.x, y: waypoint.y };
  }, [edgeHandler]);

  // Handle mouse move during drag
  const handleMouseMove = useCallback((e) => {
    if (!isDragging || draggedWaypointIndex === null || !edgeHandler) return;

    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;

    const newX = waypointStartPos.current.x + dx;
    const newY = waypointStartPos.current.y + dy;

    edgeHandler.moveWaypoint(draggedWaypointIndex, newX, newY);

    // Trigger re-render by updating a state
    setEdgeHandler({ ...edgeHandler });
  }, [isDragging, draggedWaypointIndex, edgeHandler]);

  // Handle mouse up (end drag)
  const handleMouseUp = useCallback(() => {
    if (isDragging && edgeHandler && onUpdate) {
      // Save the updated waypoints
      const waypoints = edgeHandler.getWaypointsData();
      onUpdate(waypoints);
    }

    setIsDragging(false);
    setDraggedWaypointIndex(null);
  }, [isDragging, edgeHandler, onUpdate]);

  // Handle double-click to remove waypoint
  const handleWaypointDoubleClick = useCallback((e, index) => {
    e.stopPropagation();
    e.preventDefault();

    if (!edgeHandler || !onUpdate) return;

    edgeHandler.removeWaypoint(index);
    const waypoints = edgeHandler.getWaypointsData();
    onUpdate(waypoints);

    // Trigger re-render
    setEdgeHandler({ ...edgeHandler });
  }, [edgeHandler, onUpdate]);

  // Handle virtual bend click to add waypoint
  const handleVirtualBendMouseDown = useCallback((e, segmentIndex) => {
    e.stopPropagation();
    e.preventDefault();

    if (!edgeHandler || !onUpdate) return;

    const rect = e.currentTarget.ownerSVGElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Add waypoint at the virtual bend position
    edgeHandler.addWaypoint(x, y, segmentIndex);
    const waypoints = edgeHandler.getWaypointsData();
    onUpdate(waypoints);

    // Trigger re-render
    setEdgeHandler({ ...edgeHandler });
  }, [edgeHandler, onUpdate]);

  // Hover handlers
  const handleWaypointMouseEnter = useCallback((e, index) => {
    setHoveredWaypointIndex(index);
  }, []);

  const handleWaypointMouseLeave = useCallback(() => {
    setHoveredWaypointIndex(null);
  }, []);

  const handleVirtualBendMouseEnter = useCallback((e, index) => {
    setHoveredVirtualBendIndex(index);
  }, []);

  const handleVirtualBendMouseLeave = useCallback(() => {
    setHoveredVirtualBendIndex(null);
  }, []);

  // Get virtual bend positions (midpoints of segments)
  const getVirtualBends = useCallback(() => {
    if (!edgeHandler || !showWaypoints) return [];

    const segments = edgeHandler.getSegments();
    const virtualBends = [];

    // Skip first and last segment (connected to tables)
    for (let i = 1; i < segments.length - 1; i++) {
      const segment = segments[i];
      virtualBends.push({
        x: (segment.start.x + segment.end.x) / 2,
        y: (segment.start.y + segment.end.y) / 2,
        segmentIndex: i,
      });
    }

    return virtualBends;
  }, [edgeHandler, showWaypoints]);

  return {
    edgeHandler,
    waypoints: edgeHandler?.waypoints || [],
    isDragging,
    draggedWaypointIndex,
    hoveredWaypointIndex,
    hoveredVirtualBendIndex,
    showWaypoints,
    setShowWaypoints,
    virtualBends: getVirtualBends(),
    handlers: {
      onWaypointMouseDown: handleWaypointMouseDown,
      onWaypointMouseEnter: handleWaypointMouseEnter,
      onWaypointMouseLeave: handleWaypointMouseLeave,
      onWaypointDoubleClick: handleWaypointDoubleClick,
      onVirtualBendMouseDown: handleVirtualBendMouseDown,
      onVirtualBendMouseEnter: handleVirtualBendMouseEnter,
      onVirtualBendMouseLeave: handleVirtualBendMouseLeave,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
    },
  };
}

/**
 * Hook for calculating connection points with waypoints
 */
export function useConnectionPoints(startTable, endTable, waypoints = []) {
  return useCallback(() => {
    if (!startTable || !endTable) {
      return { startPoint: null, endPoint: null, points: [] };
    }

    const { startPoint, endPoint } = getConnectionPoints(
      startTable,
      endTable,
      waypoints
    );

    // Build complete point array
    const points = [startPoint];
    waypoints.forEach(wp => {
      points.push({ x: wp.x, y: wp.y });
    });
    points.push(endPoint);

    return { startPoint, endPoint, points };
  }, [startTable, endTable, waypoints]);
}
