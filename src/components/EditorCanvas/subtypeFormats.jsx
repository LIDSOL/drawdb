// Helper function to calculate angle for subtype notation based on parent-child relationship
// Returns angles in 90-degree increments (0, 90, 180, 270) for cleaner visual appearance
function calculateSubtypeAngle(
  parentTable,
  childTable,
  subtypePoint,
  tableWidth = 200,
) {
  if (!parentTable || !childTable || !subtypePoint) {
    return 0;
  }

  // Calculate parent center using the actual table width
  const parentCenter = {
    x: parentTable.x + tableWidth / 2,
    y: parentTable.y + 30, // Approximate table height center
  };

  // Calculate the vector from subtype point to parent center
  const dx = parentCenter.x - subtypePoint.x;
  const dy = parentCenter.y - subtypePoint.y;

  // Determine if relationship is primarily horizontal or vertical
  const isHorizontal = Math.abs(dx) > Math.abs(dy);
  
  // Return angle in 90-degree increments based on orientation
  // The symbol should point AWAY from parent (towards children)
  // Note: The symbol design has 0° pointing LEFT and 180° pointing RIGHT
  if (isHorizontal) {
    // Horizontal: if parent is to the left (dx < 0), children are to the right, so point right (180°)
    // if parent is to the right (dx > 0), children are to the left, so point left (0°)
    return dx < 0 ? 180 : 0;
  } else {
    // Vertical: if parent is above (dy > 0), point down (90°), if parent below, point up (-90°)
    return dy > 0 ? 90 : -90;
  }
}

export function subDT(
  point,
  angle,
  notation,
  subtypevar,
  direction,
  cardinalityStart,
  cardinalityEnd,
  onConnectSubtypePoint,
  relationshipId,
  parentTable = null,
  childTable = null,
  tableWidth = 200,
  onContextMenu = null,
) {
  // Calculate proper angle if parent and child table information is provided
  let rotationAngle = angle;
  if (parentTable && childTable && point) {
    rotationAngle = calculateSubtypeAngle(
      parentTable,
      childTable,
      point,
      tableWidth,
    );
  }

  return (
    point &&
    subtypevar === "disjoint_total" && (
      <g
        transform={`rotate(${rotationAngle}, ${point.x}, ${point.y})`}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (onContextMenu) {
            onContextMenu(e);
          }
        }}
      >
        <circle
          cx={point.x}
          cy={point.y}
          r="8"
          stroke="gray"
          strokeWidth="2"
          fill="white"
          className="group-hover:fill-sky-700"
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onContextMenu) {
              onContextMenu(e);
            }
          }}
        />
        <text
          x={point.x}
          y={point.y + 2}
          fill="gray"
          strokeWidth="0.5"
          textAnchor="middle"
          alignmentBaseline="middle"
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onContextMenu) {
              onContextMenu(e);
            }
          }}
        >
          D
        </text>
        <line
          x1={point.x - 10}
          y1={point.y - 20}
          x2={point.x - 10}
          y2={point.y + 20}
          stroke="gray"
          strokeWidth="2"
          className="group-hover:stroke-sky-700"
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onContextMenu) {
              onContextMenu(e);
            }
          }}
        />
        <line
          x1={point.x - 20}
          y1={point.y - 20}
          x2={point.x - 20}
          y2={point.y + 20}
          stroke="gray"
          strokeWidth="2"
          className="group-hover:stroke-sky-700"
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onContextMenu) {
              onContextMenu(e);
            }
          }}
        />
        <circle
          cx={point.x}
          cy={point.y + 20}
          r={6}
          fill="skyblue"
          stroke="gray"
          strokeWidth="1"
          cursor="crosshair"
          onPointerDown={(e) =>
            onConnectSubtypePoint?.(e, point.x, point.y + 20, relationshipId)
          }
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onContextMenu) {
              onContextMenu(e);
            }
          }}
        />
      </g>
    )
  );
}

export function subDP(
  point,
  angle,
  notation,
  subtypevar,
  direction,
  cardinalityStart,
  cardinalityEnd,
  onConnectSubtypePoint,
  relationshipId,
  parentTable = null,
  childTable = null,
  tableWidth = 200,
  onContextMenu = null,
) {
  // Calculate proper angle if parent and child table information is provided
  let rotationAngle = angle;
  if (parentTable && childTable && point) {
    rotationAngle = calculateSubtypeAngle(
      parentTable,
      childTable,
      point,
      tableWidth,
    );
  }

  return (
    point &&
    subtypevar === "disjoint_partial" && (
      <g
        transform={`rotate(${rotationAngle}, ${point.x}, ${point.y})`}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (onContextMenu) {
            onContextMenu(e);
          }
        }}
      >
        <circle
          cx={point.x}
          cy={point.y}
          r="8"
          stroke="gray"
          strokeWidth="2"
          fill="white"
          className="group-hover:fill-sky-700"
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onContextMenu) {
              onContextMenu(e);
            }
          }}
        />
        <text
          x={point.x}
          y={point.y + 2}
          fill="grey"
          strokeWidth="0.5"
          textAnchor="middle"
          alignmentBaseline="middle"
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onContextMenu) {
              onContextMenu(e);
            }
          }}
        >
          D
        </text>
        <line
          x1={point.x - 10}
          y1={point.y + 20}
          x2={point.x - 10}
          y2={point.y - 20}
          stroke="gray"
          strokeWidth="2"
          className="group-hover:fill-sky-700"
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onContextMenu) {
              onContextMenu(e);
            }
          }}
        />
        <text
          x={point.x + 10}
          y={point.y - 10}
          fill="black"
          strokeWidth="0.5"
          textAnchor="middle"
          alignmentBaseline="middle"
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onContextMenu) {
              onContextMenu(e);
            }
          }}
        >
          {cardinalityEnd}
        </text>
        <circle
          cx={point.x}
          cy={point.y + 20}
          r={6}
          fill="skyblue"
          stroke="gray"
          strokeWidth="1"
          cursor="crosshair"
          onPointerDown={(e) =>
            onConnectSubtypePoint?.(e, point.x, point.y + 20, relationshipId)
          }
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onContextMenu) {
              onContextMenu(e);
            }
          }}
        />
      </g>
    )
  );
}

export function subOT(
  point,
  angle,
  notation,
  subtypevar,
  direction,
  cardinalityStart,
  cardinalityEnd,
  onConnectSubtypePoint,
  relationshipId,
  parentTable = null,
  childTable = null,
  tableWidth = 200,
  onContextMenu = null,
) {
  // Calculate proper angle if parent and child table information is provided
  let rotationAngle = angle;
  if (parentTable && childTable && point) {
    rotationAngle = calculateSubtypeAngle(
      parentTable,
      childTable,
      point,
      tableWidth,
    );
  }

  return (
    point &&
    subtypevar === "overlapping_total" && (
      <g
        transform={`rotate(${rotationAngle}, ${point.x}, ${point.y})`}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (onContextMenu) {
            onContextMenu(e);
          }
        }}
      >
        <circle
          cx={point.x}
          cy={point.y}
          r="8"
          stroke="gray"
          strokeWidth="2"
          fill="white"
          className="group-hover:fill-sky-700"
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onContextMenu) {
              onContextMenu(e);
            }
          }}
        />
        <text
          x={point.x}
          y={point.y + 2}
          fill="grey"
          strokeWidth="0.5"
          textAnchor="middle"
          alignmentBaseline="middle"
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onContextMenu) {
              onContextMenu(e);
            }
          }}
        >
          O
        </text>
        <line
          x1={point.x - 10}
          y1={point.y + 20}
          x2={point.x - 10}
          y2={point.y - 20}
          stroke="gray"
          strokeWidth="2"
          className="group-hover:fill-sky-700"
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onContextMenu) {
              onContextMenu(e);
            }
          }}
        />
        <line
          x1={point.x - 20}
          y1={point.y + 20}
          x2={point.x - 20}
          y2={point.y - 20}
          stroke="gray"
          strokeWidth="2"
          className="group-hover:fill-sky-700"
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onContextMenu) {
              onContextMenu(e);
            }
          }}
        />
        <text
          x={point.x + 10}
          y={point.y - 10}
          fill="black"
          strokeWidth="0.5"
          textAnchor="middle"
          alignmentBaseline="middle"
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onContextMenu) {
              onContextMenu(e);
            }
          }}
        >
          {cardinalityEnd}
        </text>
        <circle
          cx={point.x}
          cy={point.y + 20}
          r={6}
          fill="skyblue"
          stroke="gray"
          strokeWidth="1"
          cursor="crosshair"
          onPointerDown={(e) =>
            onConnectSubtypePoint?.(e, point.x, point.y + 20, relationshipId)
          }
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onContextMenu) {
              onContextMenu(e);
            }
          }}
        />
      </g>
    )
  );
}

export function subOP(
  point,
  angle,
  notation,
  subtypevar,
  direction,
  cardinalityStart,
  cardinalityEnd,
  onConnectSubtypePoint,
  relationshipId,
  parentTable = null,
  childTable = null,
  tableWidth = 200,
  onContextMenu = null,
) {
  // Calculate proper angle if parent and child table information is provided
  let rotationAngle = angle;
  if (parentTable && childTable && point) {
    rotationAngle = calculateSubtypeAngle(
      parentTable,
      childTable,
      point,
      tableWidth,
    );
  }

  return (
    point &&
    subtypevar === "overlapping_partial" && (
      <g
        transform={`rotate(${rotationAngle}, ${point.x}, ${point.y})`}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (onContextMenu) {
            onContextMenu(e);
          }
        }}
      >
        <circle
          cx={point.x}
          cy={point.y}
          r="8"
          stroke="gray"
          strokeWidth="2"
          fill="white"
          className="group-hover:fill-sky-700"
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onContextMenu) {
              onContextMenu(e);
            }
          }}
        />
        <text
          x={point.x}
          y={point.y + 2}
          fill="grey"
          strokeWidth="0.5"
          textAnchor="middle"
          alignmentBaseline="middle"
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onContextMenu) {
              onContextMenu(e);
            }
          }}
        >
          O
        </text>
        <line
          x1={point.x - 10}
          y1={point.y + 20}
          x2={point.x - 10}
          y2={point.y - 20}
          stroke="gray"
          strokeWidth="2"
          className="group-hover:fill-sky-700"
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onContextMenu) {
              onContextMenu(e);
            }
          }}
        />
        <text
          x={point.x + 10}
          y={point.y - 10}
          fill="black"
          strokeWidth="0.5"
          textAnchor="middle"
          alignmentBaseline="middle"
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onContextMenu) {
              onContextMenu(e);
            }
          }}
        >
          {cardinalityEnd}
        </text>
        <circle
          cx={point.x}
          cy={point.y + 20}
          r={6}
          fill="skyblue"
          stroke="gray"
          strokeWidth="1"
          cursor="crosshair"
          onPointerDown={(e) =>
            onConnectSubtypePoint?.(e, point.x, point.y + 20, relationshipId)
          }
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onContextMenu) {
              onContextMenu(e);
            }
          }}
        />
      </g>
    )
  );
}
