/**
 * Perimeter calculation utilities inspired by mxGraph/drawio
 * Used to calculate anchor points on table boundaries for relationship connections
 */

/**
 * Point class for coordinates
 */
export class Point {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  clone() {
    return new Point(this.x, this.y);
  }
}

/**
 * Rectangle bounds class
 */
export class Bounds {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  getCenterX() {
    return this.x + this.width / 2;
  }

  getCenterY() {
    return this.y + this.height / 2;
  }

  getCenter() {
    return new Point(this.getCenterX(), this.getCenterY());
  }

  contains(x, y) {
    return x >= this.x && x <= this.x + this.width &&
           y >= this.y && y <= this.y + this.height;
  }
}

/**
 * Rectangle perimeter calculation
 * Calculates the intersection point on a rectangle's perimeter given:
 * - bounds: Rectangle bounds (x, y, width, height)
 * - next: The next point along the line (determines which edge to intersect)
 * - orthogonal: Whether to use orthogonal routing
 *
 * Based on mxPerimeter.RectanglePerimeter from drawio
 */
export function rectanglePerimeter(bounds, next, orthogonal = false) {
  const cx = bounds.getCenterX();
  const cy = bounds.getCenterY();
  const dx = next.x - cx;
  const dy = next.y - cy;

  const alpha = Math.atan2(dy, dx);
  const p = new Point(0, 0);
  const pi = Math.PI;
  const pi2 = Math.PI / 2;
  const beta = pi2 - alpha;
  const t = Math.atan2(bounds.height, bounds.width);

  // Determine which edge the line intersects
  if (alpha < -pi + t || alpha > pi - t) {
    // Left edge
    p.x = bounds.x;
    p.y = cy - (bounds.width * Math.tan(alpha)) / 2;
  } else if (alpha < -t) {
    // Top edge
    p.y = bounds.y;
    p.x = cx - (bounds.height * Math.tan(beta)) / 2;
  } else if (alpha < t) {
    // Right edge
    p.x = bounds.x + bounds.width;
    p.y = cy + (bounds.width * Math.tan(alpha)) / 2;
  } else {
    // Bottom edge
    p.y = bounds.y + bounds.height;
    p.x = cx + (bounds.height * Math.tan(beta)) / 2;
  }

  // Apply orthogonal constraints
  if (orthogonal) {
    if (next.x >= bounds.x && next.x <= bounds.x + bounds.width) {
      p.x = next.x;
    } else if (next.y >= bounds.y && next.y <= bounds.y + bounds.height) {
      p.y = next.y;
    }

    if (next.x < bounds.x) {
      p.x = bounds.x;
    } else if (next.x > bounds.x + bounds.width) {
      p.x = bounds.x + bounds.width;
    }

    if (next.y < bounds.y) {
      p.y = bounds.y;
    } else if (next.y > bounds.y + bounds.height) {
      p.y = bounds.y + bounds.height;
    }
  }

  return p;
}

/**
 * Get perimeter point for a table given a target point
 * This is the main function to use for calculating where a relationship line
 * should connect to a table's edge
 */
export function getTablePerimeterPoint(table, targetPoint, orthogonal = false) {
  const bounds = new Bounds(
    table.x,
    table.y,
    table.width || 200,
    table.height || 100
  );

  return rectanglePerimeter(bounds, targetPoint, orthogonal);
}

/**
 * Calculate connection points for a relationship between two tables
 * Returns { startPoint, endPoint } representing where the line should connect
 */
export function getConnectionPoints(startTable, endTable, waypoints = []) {
  // Get next point after start (first waypoint or end table center)
  const endCenter = new Point(
    endTable.x + (endTable.width || 200) / 2,
    endTable.y + (endTable.height || 100) / 2
  );

  const nextAfterStart = waypoints.length > 0
    ? new Point(waypoints[0].x, waypoints[0].y)
    : endCenter;

  // Get previous point before end (last waypoint or start table center)
  const startCenter = new Point(
    startTable.x + (startTable.width || 200) / 2,
    startTable.y + (startTable.height || 100) / 2
  );

  const prevBeforeEnd = waypoints.length > 0
    ? new Point(waypoints[waypoints.length - 1].x, waypoints[waypoints.length - 1].y)
    : startCenter;

  return {
    startPoint: getTablePerimeterPoint(startTable, nextAfterStart),
    endPoint: getTablePerimeterPoint(endTable, prevBeforeEnd),
  };
}

/**
 * Calculate distance between two points
 */
export function distance(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if a point is near a line segment
 * Returns true if point is within tolerance distance of the line
 */
export function isPointNearLine(point, lineStart, lineEnd, tolerance = 10) {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }

  const dx = point.x - xx;
  const dy = point.y - yy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  return dist <= tolerance;
}

/**
 * Snap point to grid
 */
export function snapToGrid(point, gridSize = 10) {
  return new Point(
    Math.round(point.x / gridSize) * gridSize,
    Math.round(point.y / gridSize) * gridSize
  );
}
