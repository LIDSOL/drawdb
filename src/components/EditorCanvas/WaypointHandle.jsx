import { darkBgTheme } from "../../data/constants";

/**
 * Waypoint component - renders a draggable waypoint on a relationship line
 * Inspired by WaypointShape from drawio
 */
export default function WaypointHandle({
  x,
  y,
  index,
  isSelected = false,
  isHovered = false,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  onDoubleClick,
  onContextMenu,
}) {
  const theme = localStorage.getItem("theme");
  const isDark = theme === darkBgTheme;

  const radius = 6;
  const strokeWidth = isSelected ? 2.5 : isHovered ? 2 : 1.5;

  const fillColor = isSelected
    ? (isDark ? "#60a5fa" : "#3b82f6")
    : isHovered
      ? (isDark ? "#93c5fd" : "#60a5fa")
      : (isDark ? "#e5e7eb" : "#fff");

  const strokeColor = isDark ? "#374151" : "#1f2937";

  return (
    <g
      className="waypoint-handle"
      style={{ cursor: "move" }}
      onMouseDown={(e) => onMouseDown && onMouseDown(e, index)}
      onMouseEnter={(e) => onMouseEnter && onMouseEnter(e, index)}
      onMouseLeave={(e) => onMouseLeave && onMouseLeave(e, index)}
      onDoubleClick={(e) => onDoubleClick && onDoubleClick(e, index)}
      onContextMenu={(e) => onContextMenu && onContextMenu(e, index)}
    >
      <circle
        cx={x}
        cy={y}
        r={radius}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        className="waypoint-circle"
      />
      {/* Larger invisible hit area for easier interaction */}
      <circle
        cx={x}
        cy={y}
        r={radius + 4}
        fill="transparent"
        stroke="none"
        className="waypoint-hitarea"
      />
    </g>
  );
}

/**
 * Virtual bend component - renders a semi-transparent point where a new waypoint can be added
 * Appears at the midpoint of line segments
 */
export function VirtualBend({
  x,
  y,
  segmentIndex,
  isHovered = false,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
}) {
  const theme = localStorage.getItem("theme");
  const isDark = theme === darkBgTheme;

  const radius = 5;
  const opacity = isHovered ? 0.8 : 0.4;

  const fillColor = isDark ? "#60a5fa" : "#3b82f6";
  const strokeColor = isDark ? "#374151" : "#1f2937";

  return (
    <g
      className="virtual-bend"
      style={{ cursor: "pointer" }}
      onMouseDown={(e) => onMouseDown && onMouseDown(e, segmentIndex)}
      onMouseEnter={(e) => onMouseEnter && onMouseEnter(e, segmentIndex)}
      onMouseLeave={(e) => onMouseLeave && onMouseLeave(e, segmentIndex)}
    >
      <circle
        cx={x}
        cy={y}
        r={radius}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={1}
        opacity={opacity}
        className="virtual-bend-circle"
      />
      {/* Larger invisible hit area */}
      <circle
        cx={x}
        cy={y}
        r={radius + 4}
        fill="transparent"
        stroke="none"
        className="virtual-bend-hitarea"
      />
    </g>
  );
}

/**
 * Container component that renders all waypoints for a relationship
 */
export function WaypointContainer({
  waypoints = [],
  relationshipId,
  selectedWaypointIndex = null,
  hoveredWaypointIndex = null,
  onWaypointMouseDown,
  onWaypointMouseEnter,
  onWaypointMouseLeave,
  onWaypointDoubleClick,
  onWaypointContextMenu,
  showVirtualBends = false,
  virtualBends = [],
  hoveredVirtualBendIndex = null,
  onVirtualBendMouseDown,
  onVirtualBendMouseEnter,
  onVirtualBendMouseLeave,
}) {
  return (
    <g className="waypoint-container">
      {/* Render virtual bends first (so they appear below waypoints) */}
      {showVirtualBends && virtualBends.map((vb, index) => (
        <VirtualBend
          key={`vb-${index}`}
          x={vb.x}
          y={vb.y}
          segmentIndex={index}
          isHovered={hoveredVirtualBendIndex === index}
          onMouseDown={onVirtualBendMouseDown}
          onMouseEnter={onVirtualBendMouseEnter}
          onMouseLeave={onVirtualBendMouseLeave}
        />
      ))}

      {/* Render actual waypoints */}
      {waypoints.map((wp, index) => (
        <WaypointHandle
          key={wp.id || `wp-${index}`}
          x={wp.x}
          y={wp.y}
          index={index}
          relationshipId={relationshipId}
          isSelected={selectedWaypointIndex === index}
          isHovered={hoveredWaypointIndex === index}
          onMouseDown={onWaypointMouseDown}
          onMouseEnter={onWaypointMouseEnter}
          onMouseLeave={onWaypointMouseLeave}
          onDoubleClick={onWaypointDoubleClick}
          onContextMenu={onWaypointContextMenu}
        />
      ))}
    </g>
  );
}
