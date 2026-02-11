import { useState, useRef, useCallback } from "react";

/**
 * Perimeter Point Selector
 * Shows all available perimeter points during drag
 */
function PerimeterPointSelector({
  points,
  currentPoint,
  closestPointIndex, // Index of the closest point to drag position
}) {
  return (
    <g style={{ pointerEvents: 'none' }}>
      {/* Render all available points */}
      {points.map((point, idx) => {
        const isCurrent = currentPoint &&
          point.x === currentPoint.x &&
          point.y === currentPoint.y &&
          point.side === currentPoint.side;
        const isClosest = closestPointIndex === idx;

        return (
          <g key={`perimeter-${idx}`} style={{ pointerEvents: 'none' }}>
            {/* Visual indicator */}
            <circle
              cx={point.x}
              cy={point.y}
              r="8"
              fill={isClosest ? "#60a5fa" : (isCurrent ? "#10b981" : "white")}
              stroke={isClosest ? "#3b82f6" : (isCurrent ? "#059669" : "#9ca3af")}
              strokeWidth={isClosest ? "3" : "2"}
              style={{ pointerEvents: 'none' }}
            />

            {/* Inner dot */}
            {(isCurrent || isClosest) && (
              <circle
                cx={point.x}
                cy={point.y}
                r="4"
                fill={isClosest ? "#3b82f6" : "#059669"}
                style={{ pointerEvents: 'none' }}
              />
            )}
          </g>
        );
      })}
    </g>
  );
}

/**
 * Connection Point Handle Component
 * Renders draggable handles for start/end points of relationships
 */
export function ConnectionPointHandle({
  point,
  type, // 'start' or 'end'
  isSelected,
  isDragging,
  onMouseDown,
}) {
  const [isHovered, setIsHovered] = useState(false);

  if (!point) return null;

  return (
    <g>
      {/* Larger invisible hit area for easier clicking */}
      <circle
        cx={point.x}
        cy={point.y}
        r="12"
        fill="transparent"
        style={{ cursor: 'move' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={(e) => onMouseDown(e, type)}
      />

      {/* Outer ring */}
      <circle
        cx={point.x}
        cy={point.y}
        r="7"
        fill="white"
        stroke={isDragging ? "#3b82f6" : (isSelected ? "#3b82f6" : (isHovered ? "#60a5fa" : "#6b7280"))}
        strokeWidth={isDragging || isSelected ? "3" : "2"}
        style={{ pointerEvents: 'none' }}
      />

      {/* Inner dot to indicate connection point */}
      <circle
        cx={point.x}
        cy={point.y}
        r="3"
        fill={type === 'start' ? "#ef4444" : "#3b82f6"} // Red for start, blue for end
        style={{ pointerEvents: 'none' }}
      />
    </g>
  );
}

/**
 * Helper function to find closest point
 */
function findClosest(points, x, y) {
  if (!points || points.length === 0) return -1;

  let minDist = Infinity;
  let closestIdx = -1;

  points.forEach((point, idx) => {
    const dist = Math.sqrt(
      Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2)
    );
    if (dist < minDist) {
      minDist = dist;
      closestIdx = idx;
    }
  });

  return closestIdx;
}

/**
 * Container for connection point handles
 */
export function ConnectionPointHandles({
  startPoint,
  endPoint,
  isSelected,
  onStartPointChange,
  onEndPointChange,
  availableStartPoints, // Array of perimeter points for start table
  availableEndPoints,   // Array of perimeter points for end table
}) {
  const [draggingType, setDraggingType] = useState(null);
  const [currentDragPos, setCurrentDragPos] = useState({ x: 0, y: 0 });

  // Use refs to keep track of current values in event handlers
  const draggingTypeRef = useRef(null);
  const availableStartPointsRef = useRef(availableStartPoints);
  const availableEndPointsRef = useRef(availableEndPoints);
  const onStartPointChangeRef = useRef(onStartPointChange);
  const onEndPointChangeRef = useRef(onEndPointChange);

  // Update refs whenever props change
  availableStartPointsRef.current = availableStartPoints;
  availableEndPointsRef.current = availableEndPoints;
  onStartPointChangeRef.current = onStartPointChange;
  onEndPointChangeRef.current = onEndPointChange;

  const handleMouseMove = useCallback((e) => {
    const currentDraggingType = draggingTypeRef.current;

    console.log('Handle mouse move, draggingType:', currentDraggingType);

    if (!currentDraggingType) return;

    // Get canvas coordinates
    const svg = document.getElementById('diagram');
    if (!svg) {
      console.warn('Canvas SVG not found');
      return;
    }

    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const canvasPt = pt.matrixTransform(svg.getScreenCTM().inverse());

    // Update current position
    setCurrentDragPos({ x: canvasPt.x, y: canvasPt.y });

    // Find and snap to closest perimeter point in real-time
    if (currentDraggingType === 'start' && availableStartPointsRef.current && onStartPointChangeRef.current) {
      const closestIdx = findClosest(availableStartPointsRef.current, canvasPt.x, canvasPt.y);
      if (closestIdx >= 0 && availableStartPointsRef.current[closestIdx]) {
        const closestPoint = availableStartPointsRef.current[closestIdx];
        console.log('Updating start point to:', closestPoint);
        onStartPointChangeRef.current(closestPoint);
      }
    } else if (currentDraggingType === 'end' && availableEndPointsRef.current && onEndPointChangeRef.current) {
      const closestIdx = findClosest(availableEndPointsRef.current, canvasPt.x, canvasPt.y);
      if (closestIdx >= 0 && availableEndPointsRef.current[closestIdx]) {
        const closestPoint = availableEndPointsRef.current[closestIdx];
        console.log('Updating end point to:', closestPoint);
        onEndPointChangeRef.current(closestPoint);
      }
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    draggingTypeRef.current = null;
    setDraggingType(null);
    console.log('Handle mouse up');
  }, [handleMouseMove]);

  const handleMouseDown = useCallback((e, type) => {
    e.stopPropagation();
    e.preventDefault();

    console.log('Handle mouse down:', type, 'availablePoints:', 
      type === 'start' ? availableStartPoints?.length : availableEndPoints?.length);

    draggingTypeRef.current = type;
    setDraggingType(type);

    // Get canvas coordinates
    const svg = e.currentTarget.ownerSVGElement;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const canvasPt = pt.matrixTransform(svg.getScreenCTM().inverse());

    setCurrentDragPos({ x: canvasPt.x, y: canvasPt.y });

    // Add global mouse listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [availableStartPoints, availableEndPoints, handleMouseMove, handleMouseUp]);

  // Calculate closest point during drag
  const closestStartIdx = draggingType === 'start' && availableStartPoints
    ? findClosest(availableStartPoints, currentDragPos.x, currentDragPos.y)
    : -1;

  const closestEndIdx = draggingType === 'end' && availableEndPoints
    ? findClosest(availableEndPoints, currentDragPos.x, currentDragPos.y)
    : -1;

  return (
    <>
      {/* Show perimeter points during drag */}
      {draggingType === 'start' && availableStartPoints && availableStartPoints.length > 0 && (
        <PerimeterPointSelector
          points={availableStartPoints}
          currentPoint={startPoint}
          closestPointIndex={closestStartIdx}
        />
      )}

      {draggingType === 'end' && availableEndPoints && availableEndPoints.length > 0 && (
        <PerimeterPointSelector
          points={availableEndPoints}
          currentPoint={endPoint}
          closestPointIndex={closestEndIdx}
        />
      )}

      <ConnectionPointHandle
        point={startPoint}
        type="start"
        isSelected={isSelected}
        isDragging={draggingType === 'start'}
        onMouseDown={handleMouseDown}
      />

      <ConnectionPointHandle
        point={endPoint}
        type="end"
        isSelected={isSelected}
        isDragging={draggingType === 'end'}
        onMouseDown={handleMouseDown}
      />
    </>
  );
}
