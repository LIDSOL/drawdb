/**
 * Perimeter Points System for Table Relationships
 *
 * This module calculates perimeter connection points for each field/row in a table.
 * Each field gets 4 connection points (top, right, bottom, left) on the table's perimeter.
 */

import {
  tableHeaderHeight,
  tableFieldHeight,
  tableColorStripHeight
} from '../data/constants';

/**
 * Calculate perimeter points for a specific field/row
 * @param {Object} table - Table object with x, y, width, height
 * @param {number} fieldIndex - Index of the field (0-based)
 * @param {number} totalFields - Total number of fields in the table
 * @param {boolean} hasColorStrip - Whether the table has a color strip (notation dependent)
 * @returns {Object} Object with top, right, bottom, left points
 */
export function getFieldPerimeterPoints(table, fieldIndex, totalFields, hasColorStrip = false) {
  const effectiveColorStripHeight = hasColorStrip ? tableColorStripHeight : 0;
  const headerHeight = tableHeaderHeight + effectiveColorStripHeight;

  // Calculate the Y position of the field's center
  const fieldCenterY = table.y + headerHeight + (fieldIndex * tableFieldHeight) + (tableFieldHeight / 2);

  // Table bounds
  const tableLeft = table.x;
  const tableRight = table.x + table.width;
  const tableTop = table.y + headerHeight; // Top of first field (after header)
  const tableBottom = table.y + headerHeight + (totalFields * tableFieldHeight);
  const tableCenterX = table.x + (table.width / 2);

  return {
    // Left side point (at field's vertical center)
    left: {
      x: tableLeft,
      y: fieldCenterY,
      side: 'left',
      fieldIndex
    },
    // Right side point (at field's vertical center)
    right: {
      x: tableRight,
      y: fieldCenterY,
      side: 'right',
      fieldIndex
    },
    // Top side point (at table's horizontal center, but only if this is the first field)
    top: fieldIndex === 0 ? {
      x: tableCenterX,
      y: tableTop,
      side: 'top',
      fieldIndex
    } : null,
    // Bottom side point (at table's horizontal center, but only if this is the last field)
    bottom: fieldIndex === totalFields - 1 ? {
      x: tableCenterX,
      y: tableBottom,
      side: 'bottom',
      fieldIndex
    } : null
  };
}

/**
 * Get all perimeter points for a table
 * @param {Object} table - Table object
 * @param {boolean} hasColorStrip - Whether the table has a color strip
 * @returns {Array} Array of all perimeter points
 */
export function getAllTablePerimeterPoints(table, hasColorStrip = false) {
  if (!table || !table.fields || table.fields.length === 0) {
    return [];
  }

  const points = [];
  const totalFields = table.fields.length;

  table.fields.forEach((field, index) => {
    const fieldPoints = getFieldPerimeterPoints(table, index, totalFields, hasColorStrip);

    // Add left and right points (always present)
    points.push(fieldPoints.left);
    points.push(fieldPoints.right);

    // Add top point (only for first field)
    if (fieldPoints.top) {
      points.push(fieldPoints.top);
    }

    // Add bottom point (only for last field)
    if (fieldPoints.bottom) {
      points.push(fieldPoints.bottom);
    }
  });

  return points;
}

/**
 * Find the closest perimeter point to a given coordinate
 * @param {Array} points - Array of perimeter points
 * @param {number} x - Mouse X coordinate
 * @param {number} y - Mouse Y coordinate
 * @param {number} threshold - Maximum distance to consider (default: 30)
 * @returns {Object|null} Closest point or null if none within threshold
 */
export function findClosestPerimeterPoint(points, x, y, threshold = 30) {
  if (!points || points.length === 0) {
    return null;
  }

  let closestPoint = null;
  let minDistance = threshold;

  points.forEach(point => {
    const dx = point.x - x;
    const dy = point.y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < minDistance) {
      minDistance = distance;
      closestPoint = { ...point, distance };
    }
  });

  return closestPoint;
}

/**
 * Calculate orthogonal path between two points
 * Uses Manhattan routing (right angles only) and avoids crossing tables
 * @param {Object} start - Start point {x, y, side}
 * @param {Object} end - End point {x, y, side}
 * @param {Array} waypoints - Optional intermediate waypoints
 * @returns {string} SVG path string
 */
export function calculateOrthogonalPath(start, end, waypoints = []) {
  if (!start || !end) {
    return '';
  }

  // If there are waypoints, create path through them
  if (waypoints && waypoints.length > 0) {
    const points = [start, ...waypoints, end];
    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }

    return path;
  }

  // Simple orthogonal routing based on connection sides
  const path = [];
  path.push(`M ${start.x} ${start.y}`);

  // Determine routing based on sides
  const startSide = start.side || 'right';
  const endSide = end.side || 'left';

  // Calculate offset distance to clear the table edges
  const offsetDistance = 30;

  // Route based on start and end sides
  if (startSide === 'left') {
    const exitX = start.x - offsetDistance;
    path.push(`L ${exitX} ${start.y}`);

    if (endSide === 'right') {
      const enterX = end.x + offsetDistance;
      const midY = (start.y + end.y) / 2;
      path.push(`L ${exitX} ${midY}`);
      path.push(`L ${enterX} ${midY}`);
      path.push(`L ${enterX} ${end.y}`);
    } else if (endSide === 'left') {
      const midY = (start.y + end.y) / 2;
      const minX = Math.min(exitX, end.x - offsetDistance);
      path.push(`L ${minX} ${start.y}`);
      path.push(`L ${minX} ${midY}`);
      path.push(`L ${end.x - offsetDistance} ${midY}`);
      path.push(`L ${end.x - offsetDistance} ${end.y}`);
    } else {
      // top or bottom
      path.push(`L ${exitX} ${end.y}`);
    }
  } else if (startSide === 'right') {
    const exitX = start.x + offsetDistance;
    path.push(`L ${exitX} ${start.y}`);

    if (endSide === 'left') {
      const enterX = end.x - offsetDistance;
      const midY = (start.y + end.y) / 2;
      path.push(`L ${exitX} ${midY}`);
      path.push(`L ${enterX} ${midY}`);
      path.push(`L ${enterX} ${end.y}`);
    } else if (endSide === 'right') {
      const midY = (start.y + end.y) / 2;
      const maxX = Math.max(exitX, end.x + offsetDistance);
      path.push(`L ${maxX} ${start.y}`);
      path.push(`L ${maxX} ${midY}`);
      path.push(`L ${end.x + offsetDistance} ${midY}`);
      path.push(`L ${end.x + offsetDistance} ${end.y}`);
    } else {
      // top or bottom
      path.push(`L ${exitX} ${end.y}`);
    }
  } else if (startSide === 'top') {
    const exitY = start.y - offsetDistance;
    path.push(`L ${start.x} ${exitY}`);

    if (endSide === 'bottom') {
      const enterY = end.y + offsetDistance;
      const midX = (start.x + end.x) / 2;
      path.push(`L ${midX} ${exitY}`);
      path.push(`L ${midX} ${enterY}`);
      path.push(`L ${end.x} ${enterY}`);
    } else if (endSide === 'top') {
      const midX = (start.x + end.x) / 2;
      const minY = Math.min(exitY, end.y - offsetDistance);
      path.push(`L ${start.x} ${minY}`);
      path.push(`L ${midX} ${minY}`);
      path.push(`L ${end.x} ${minY}`);
      path.push(`L ${end.x} ${end.y - offsetDistance}`);
    } else {
      // left or right - need to route around
      const midX = (start.x + end.x) / 2;
      path.push(`L ${midX} ${exitY}`);
      path.push(`L ${midX} ${end.y}`);
    }
  } else if (startSide === 'bottom') {
    const exitY = start.y + offsetDistance;
    path.push(`L ${start.x} ${exitY}`);

    if (endSide === 'top') {
      const enterY = end.y - offsetDistance;
      const midX = (start.x + end.x) / 2;
      path.push(`L ${midX} ${exitY}`);
      path.push(`L ${midX} ${enterY}`);
      path.push(`L ${end.x} ${enterY}`);
    } else if (endSide === 'bottom') {
      const midX = (start.x + end.x) / 2;
      const maxY = Math.max(exitY, end.y + offsetDistance);
      path.push(`L ${start.x} ${maxY}`);
      path.push(`L ${midX} ${maxY}`);
      path.push(`L ${end.x} ${maxY}`);
      path.push(`L ${end.x} ${end.y + offsetDistance}`);
    } else {
      // left or right - need to route around
      const midX = (start.x + end.x) / 2;
      path.push(`L ${midX} ${exitY}`);
      path.push(`L ${midX} ${end.y}`);
    }
  }

  path.push(`L ${end.x} ${end.y}`);

  return path.join(' ');
}
