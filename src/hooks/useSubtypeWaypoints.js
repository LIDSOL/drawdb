import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Custom hook for managing waypoints in multi-child subtype relationships
 * Handles separate waypoint arrays for:
 * - Parent to subtype notation point
 * - Each child line from subtype notation to child table
 */
export function useSubtypeWaypoints(relationship, tables, onUpdate) {
  const [parentWaypoints, setParentWaypoints] = useState([]);
  const [childWaypoints, setChildWaypoints] = useState({}); // { [childId]: [...waypoints] }
  const [isDragging, setIsDragging] = useState(false);
  const [draggedWaypoint, setDraggedWaypoint] = useState(null); // { type: 'parent'|'child', childId?, index }
  const [showWaypoints, setShowWaypoints] = useState(false);

  const dragStartPos = useRef({ x: 0, y: 0 });
  const waypointStartPos = useRef({ x: 0, y: 0 });

  // Refs to hold current waypoints state for dragging
  const parentWaypointsRef = useRef(parentWaypoints);
  const childWaypointsRef = useRef(childWaypoints);

  // Update refs when state changes
  useEffect(() => {
    parentWaypointsRef.current = parentWaypoints;
    childWaypointsRef.current = childWaypoints;
  }, [parentWaypoints, childWaypoints]);

  // Initialize waypoints from relationship data
  useEffect(() => {
    if (relationship && relationship.subtypeWaypoints) {
      const { parentToSubtype = [], subtypeToChildren = {} } = relationship.subtypeWaypoints;
      setParentWaypoints(parentToSubtype);
      setChildWaypoints(subtypeToChildren);
    } else {
      setParentWaypoints([]);
      setChildWaypoints({});
    }
  }, [relationship?.id, relationship?.subtypeWaypoints]);

  // Add waypoint to parent line
  const addParentWaypoint = useCallback((x, y, insertIndex) => {
    setParentWaypoints(prev => {
      const newWaypoints = [...prev];
      newWaypoints.splice(insertIndex, 0, { x, y });
      return newWaypoints;
    });
  }, []);

  // Add waypoint to child line
  const addChildWaypoint = useCallback((childId, x, y, insertIndex) => {
    setChildWaypoints(prev => {
      const childWaypoints = prev[childId] || [];
      const newChildWaypoints = [...childWaypoints];
      newChildWaypoints.splice(insertIndex, 0, { x, y });
      return {
        ...prev,
        [childId]: newChildWaypoints,
      };
    });
  }, []);

  // Move waypoint
  const moveWaypoint = useCallback((type, index, x, y, childId = null) => {
    if (type === 'parent') {
      setParentWaypoints(prev => {
        const newWaypoints = [...prev];
        newWaypoints[index] = { x, y };
        return newWaypoints;
      });
    } else if (type === 'child' && childId) {
      setChildWaypoints(prev => {
        const childWaypoints = prev[childId] || [];
        const newChildWaypoints = [...childWaypoints];
        newChildWaypoints[index] = { x, y };
        return {
          ...prev,
          [childId]: newChildWaypoints,
        };
      });
    }
  }, []);

  // Remove waypoint
  const removeWaypoint = useCallback((type, index, childId = null) => {
    if (type === 'parent') {
      setParentWaypoints(prev => prev.filter((_, i) => i !== index));
    } else if (type === 'child' && childId) {
      setChildWaypoints(prev => {
        const childWaypoints = prev[childId] || [];
        return {
          ...prev,
          [childId]: childWaypoints.filter((_, i) => i !== index),
        };
      });
    }
  }, []);

  // Handle waypoint mouse down (start drag)
  const handleWaypointMouseDown = useCallback((e, type, index, childId = null) => {
    e.stopPropagation();
    e.preventDefault();

    setIsDragging(true);
    setDraggedWaypoint({ type, index, childId });

    dragStartPos.current = { x: e.clientX, y: e.clientY };
    
    // Get current waypoint position using refs
    let waypoint;
    if (type === 'parent') {
      waypoint = parentWaypointsRef.current[index];
    } else if (type === 'child' && childId !== null) {
      waypoint = (childWaypointsRef.current[childId] || [])[index];
    }
    
    if (waypoint) {
      waypointStartPos.current = { x: waypoint.x, y: waypoint.y };
    }
  }, []);

  // Handle mouse move during drag
  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !draggedWaypoint) return;

    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;

    const newX = waypointStartPos.current.x + dx;
    const newY = waypointStartPos.current.y + dy;

    moveWaypoint(draggedWaypoint.type, draggedWaypoint.index, newX, newY, draggedWaypoint.childId);
  }, [isDragging, draggedWaypoint, moveWaypoint]);

  // Handle mouse up (end drag)
  const handleMouseUp = useCallback(() => {
    if (isDragging && onUpdate) {
      // Save the updated waypoints using refs to get most current values
      onUpdate({
        parentToSubtype: parentWaypointsRef.current,
        subtypeToChildren: childWaypointsRef.current,
      });
    }

    setIsDragging(false);
    setDraggedWaypoint(null);
  }, [isDragging, onUpdate]);

  // Handle double-click to remove waypoint
  const handleWaypointDoubleClick = useCallback((e, type, index, childId = null) => {
    e.stopPropagation();
    e.preventDefault();

    removeWaypoint(type, index, childId);

    if (onUpdate) {
      // Use refs to get updated values after removal
      setTimeout(() => {
        onUpdate({
          parentToSubtype: parentWaypointsRef.current,
          subtypeToChildren: childWaypointsRef.current,
        });
      }, 0);
    }
  }, [removeWaypoint, onUpdate]);

  // Handle virtual bend click to add waypoint
  const handleVirtualBendClick = useCallback((e, type, segmentIndex, childId = null) => {
    e.stopPropagation();
    e.preventDefault();

    const rect = e.currentTarget.ownerSVGElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (type === 'parent') {
      addParentWaypoint(x, y, segmentIndex);
    } else if (type === 'child' && childId) {
      addChildWaypoint(childId, x, y, segmentIndex);
    }

    if (onUpdate) {
      const updatedParent = type === 'parent' ? [...parentWaypoints.slice(0, segmentIndex), { x, y }, ...parentWaypoints.slice(segmentIndex)] : parentWaypoints;
      const updatedChildren = type === 'child' ? {
        ...childWaypoints,
        [childId]: [...(childWaypoints[childId] || []).slice(0, segmentIndex), { x, y }, ...(childWaypoints[childId] || []).slice(segmentIndex)],
      } : childWaypoints;

      onUpdate({
        parentToSubtype: updatedParent,
        subtypeToChildren: updatedChildren,
      });
    }
  }, [parentWaypoints, childWaypoints, addParentWaypoint, addChildWaypoint, onUpdate]);

  return {
    parentWaypoints,
    childWaypoints,
    showWaypoints,
    setShowWaypoints,
    isDragging,
    handlers: {
      onWaypointMouseDown: handleWaypointMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onWaypointDoubleClick: handleWaypointDoubleClick,
      onVirtualBendClick: handleVirtualBendClick,
    },
  };
}
