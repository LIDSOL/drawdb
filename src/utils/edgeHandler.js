/**
 * Waypoint and edge handler utilities inspired by mxEdgeHandler from drawio
 * Handles creation, editing, and interaction with waypoints on relationships
 */

import { Point, distance, isPointNearLine, snapToGrid } from './perimeter';

/**
 * Waypoint class representing a breakpoint on a relationship line
 */
export class Waypoint {
  constructor(x, y, id = null) {
    this.x = x;
    this.y = y;
    this.id = id || `wp_${Date.now()}_${Math.random()}`;
  }

  clone() {
    return new Waypoint(this.x, this.y, this.id);
  }

  toObject() {
    return { x: this.x, y: this.y, id: this.id };
  }

  static fromObject(obj) {
    return new Waypoint(obj.x, obj.y, obj.id);
  }
}

/**
 * Edge handler for managing waypoint interaction
 */
export class EdgeHandler {
  constructor(relationship, tables, options = {}) {
    this.relationship = relationship;
    this.tables = tables;
    this.options = {
      snapToGrid: true,
      gridSize: 10,
      waypointRadius: 6,
      virtualBendEnabled: true,
      tolerance: 10,
      ...options,
    };

    this.waypoints = this.loadWaypoints();
    this.selectedWaypoint = null;
    this.hoveredWaypoint = null;
    this.hoveredVirtualBend = null;
  }

  /**
   * Load waypoints from relationship data
   */
  loadWaypoints() {
    if (!this.relationship.waypoints || !Array.isArray(this.relationship.waypoints)) {
      return [];
    }
    return this.relationship.waypoints.map(wp => Waypoint.fromObject(wp));
  }

  /**
   * Get absolute points for the edge (start, waypoints, end)
   */
  getAbsolutePoints() {
    const startTable = this.tables[this.relationship.startTableId];
    const endTable = this.tables[this.relationship.endTableId];

    if (!startTable || !endTable) {
      return [];
    }

    const points = [];

    // Start point (table center for now, will be refined with perimeter calc)
    points.push(new Point(
      startTable.x + (startTable.width || 200) / 2,
      startTable.y + (startTable.height || 100) / 2
    ));

    // Waypoints
    this.waypoints.forEach(wp => {
      points.push(new Point(wp.x, wp.y));
    });

    // End point
    points.push(new Point(
      endTable.x + (endTable.width || 200) / 2,
      endTable.y + (endTable.height || 100) / 2
    ));

    return points;
  }

  /**
   * Get all segments of the edge
   * Returns array of { start, end } segment objects
   */
  getSegments() {
    const points = this.getAbsolutePoints();
    const segments = [];

    for (let i = 0; i < points.length - 1; i++) {
      segments.push({
        start: points[i],
        end: points[i + 1],
        startIndex: i,
        endIndex: i + 1,
      });
    }

    return segments;
  }

  /**
   * Find waypoint at given coordinates
   */
  findWaypointAt(x, y) {
    const point = new Point(x, y);
    const radius = this.options.waypointRadius;

    for (let i = 0; i < this.waypoints.length; i++) {
      const wp = this.waypoints[i];
      if (distance(point, new Point(wp.x, wp.y)) <= radius) {
        return { waypoint: wp, index: i };
      }
    }

    return null;
  }

  /**
   * Find virtual bend location (midpoint of segment where new waypoint can be added)
   */
  findVirtualBendAt(x, y) {
    if (!this.options.virtualBendEnabled) {
      return null;
    }

    const point = new Point(x, y);
    const segments = this.getSegments();

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];

      // Skip first and last segment (connected to tables) for now
      // Can be enabled later if needed
      if (i === 0 || i === segments.length - 1) {
        continue;
      }

      const midpoint = new Point(
        (segment.start.x + segment.end.x) / 2,
        (segment.start.y + segment.end.y) / 2
      );

      if (distance(point, midpoint) <= this.options.waypointRadius) {
        return {
          midpoint,
          segmentIndex: i,
          waypointIndex: i, // Insert after this index
        };
      }
    }

    return null;
  }

  /**
   * Add a waypoint at the given position
   * If insertIndex is provided, insert at that position, otherwise add to end
   */
  addWaypoint(x, y, insertIndex = null) {
    const point = this.options.snapToGrid
      ? snapToGrid(new Point(x, y), this.options.gridSize)
      : new Point(x, y);

    const waypoint = new Waypoint(point.x, point.y);

    if (insertIndex !== null && insertIndex >= 0 && insertIndex <= this.waypoints.length) {
      this.waypoints.splice(insertIndex, 0, waypoint);
    } else {
      this.waypoints.push(waypoint);
    }

    return waypoint;
  }

  /**
   * Remove waypoint at index
   */
  removeWaypoint(index) {
    if (index >= 0 && index < this.waypoints.length) {
      const removed = this.waypoints.splice(index, 1);
      return removed[0];
    }
    return null;
  }

  /**
   * Move waypoint to new position
   */
  moveWaypoint(index, x, y) {
    if (index >= 0 && index < this.waypoints.length) {
      const point = this.options.snapToGrid
        ? snapToGrid(new Point(x, y), this.options.gridSize)
        : new Point(x, y);

      this.waypoints[index].x = point.x;
      this.waypoints[index].y = point.y;

      return this.waypoints[index];
    }
    return null;
  }

  /**
   * Check if point is near any segment of the edge
   */
  isPointNearEdge(x, y) {
    const point = new Point(x, y);
    const segments = this.getSegments();

    for (const segment of segments) {
      if (isPointNearLine(point, segment.start, segment.end, this.options.tolerance)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get waypoints as plain objects for storage
   */
  getWaypointsData() {
    return this.waypoints.map(wp => wp.toObject());
  }

  /**
   * Clear all waypoints
   */
  clearWaypoints() {
    this.waypoints = [];
  }

  /**
   * Detect if a click should add a waypoint on a virtual bend
   */
  handleClick(x, y) {
    // Check if clicking on existing waypoint
    const existingWp = this.findWaypointAt(x, y);
    if (existingWp) {
      return { type: 'select-waypoint', ...existingWp };
    }

    // Check if clicking on virtual bend (to add new waypoint)
    const virtualBend = this.findVirtualBendAt(x, y);
    if (virtualBend) {
      const newWp = this.addWaypoint(x, y, virtualBend.waypointIndex);
      return { type: 'add-waypoint', waypoint: newWp, index: virtualBend.waypointIndex };
    }

    // Check if clicking near edge (for selection)
    if (this.isPointNearEdge(x, y)) {
      return { type: 'select-edge' };
    }

    return { type: 'none' };
  }

  /**
   * Handle double-click to remove waypoint
   */
  handleDoubleClick(x, y) {
    const wp = this.findWaypointAt(x, y);
    if (wp) {
      this.removeWaypoint(wp.index);
      return { type: 'remove-waypoint', ...wp };
    }
    return { type: 'none' };
  }
}

/**
 * Connection handler for creating new relationships with waypoints
 * Inspired by mxConnectionHandler from drawio
 */
export class ConnectionHandler {
  constructor(options = {}) {
    this.options = {
      snapToGrid: true,
      gridSize: 10,
      waypointsEnabled: true,
      ...options,
    };

    this.waypoints = [];
    this.isConnecting = false;
    this.sourceTable = null;
    this.currentPoint = null;
  }

  /**
   * Start creating a connection from a table
   */
  start(table, x, y) {
    this.isConnecting = true;
    this.sourceTable = table;
    this.waypoints = [];
    this.currentPoint = new Point(x, y);
  }

  /**
   * Add a waypoint during connection creation
   */
  addWaypoint(x, y) {
    if (!this.options.waypointsEnabled || !this.isConnecting) {
      return null;
    }

    const point = this.options.snapToGrid
      ? snapToGrid(new Point(x, y), this.options.gridSize)
      : new Point(x, y);

    const waypoint = new Waypoint(point.x, point.y);
    this.waypoints.push(waypoint);

    return waypoint;
  }

  /**
   * Update current mouse position during connection creation
   */
  updatePosition(x, y) {
    this.currentPoint = new Point(x, y);
  }

  /**
   * Complete the connection
   */
  complete() {
    const waypoints = this.getWaypointsData();
    this.reset();
    return waypoints;
  }

  /**
   * Cancel connection creation
   */
  cancel() {
    this.reset();
  }

  /**
   * Reset handler state
   */
  reset() {
    this.isConnecting = false;
    this.sourceTable = null;
    this.waypoints = [];
    this.currentPoint = null;
  }

  /**
   * Get waypoints as plain objects
   */
  getWaypointsData() {
    return this.waypoints.map(wp => wp.toObject());
  }

  /**
   * Get preview points for rendering
   */
  getPreviewPoints(startTable, endX, endY) {
    const points = [];

    // Start point
    if (startTable) {
      points.push(new Point(
        startTable.x + (startTable.width || 200) / 2,
        startTable.y + (startTable.height || 100) / 2
      ));
    }

    // Waypoints
    this.waypoints.forEach(wp => {
      points.push(new Point(wp.x, wp.y));
    });

    // Current end point
    points.push(new Point(endX, endY));

    return points;
  }
}
