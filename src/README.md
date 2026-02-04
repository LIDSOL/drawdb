# draw.io: Shapes, Connections, Waypoints and Edge Editing — Code Map

This README documents where in the draw.io (jgraph/drawio) codebase to find the logic that:

- Renders vertex shapes (squares, circles, custom shapes).
- Renders edges / connectors (lines, arrows, wire shapes).
- Computes anchor/connection points (perimeter math and connection constraints).
- Creates and stores breakpoints / waypoints during connection creation.
- Supports interactive editing: moving waypoints, moving the start/end terminals of edges.

Use this as a navigation / change guide when you want to inspect or modify behavior (visuals, snapping, attachment, editing) related to shapes and edges.

---

## High-level flow (how connection creation & editing works)

1. User starts creating a connection:
   - `mxConnectionHandler` creates a preview shape and computes source/target perimeter points for the preview.
2. While previewing, intermediate points (waypoints) can be added; these are stored in the handler while creating the edge.
3. When the edge is inserted, the edge's `mxGeometry` is created with `relative = true` and the waypoints are stored in `geometry.points`.
4. After creation, `mxEdgeHandler` is used to edit existing edges:
   - It creates draggable handles for waypoints and for the start/end terminals.
   - Moving handles updates edge geometry and recomputes `state.absolutePoints`.
5. Rendering reads `state.absolutePoints` (or waypoints) and paints the polyline/connector using shape painters.

---

## Files of interest (what each implements + direct links)

- Shapes & waypoint visuals (many vertex shapes + edge-shape implementations)
  - src/main/webapp/js/grapheditor/Shapes.js
    https://github.com/jgraph/drawio/blob/34466eba2331b75cbf409b09240b01009cb4f600/src/main/webapp/js/grapheditor/Shapes.js
  - Notes: registers shapes, implements `WaypointShape` (visual for breakpoints), `WireShape`, `LinkShape` and many vertex shape `paintVertexShape` / `redrawPath` functions.

- Base shape rendering used by vertex and edge shapes
  - src/main/webapp/mxgraph/src/shape/mxShape.js
    https://github.com/jgraph/drawio/blob/34466eba2331b75cbf409b09240b01009cb4f600/src/main/webapp/mxgraph/src/shape/mxShape.js
  - Notes: decides whether to paint an edge (by checking `getWaypoints()` and `pts`) or a vertex; calls `paintEdgeShape` with the computed points.

- Cell renderer (shape creation + lifecycle)
  - src/main/webapp/mxgraph/src/view/mxCellRenderer.js
    https://github.com/jgraph/drawio/blob/34466eba2331b75cbf409b09240b01009cb4f600/src/main/webapp/mxgraph/src/view/mxCellRenderer.js
  - Notes: creates shapes from states and manages DOM nodes.

- Perimeter math (anchor point calculation for shapes)
  - src/main/webapp/mxgraph/src/view/mxPerimeter.js
    https://github.com/jgraph/drawio/blob/34466eba2331b75cbf409b09240b01009cb4f600/src/main/webapp/mxgraph/src/view/mxPerimeter.js
  - Notes: contains perimeter functions (Rectangle, Circle, Ellipse, Rhombus, Triangle, custom). Perimeter functions compute intersection on shape boundary given a `next` point (point along the edge).

- Graph view: calling perimeter functions and computing perimeter points
  - src/main/webapp/mxgraph/src/view/mxGraphView.js
    https://github.com/jgraph/drawio/blob/34466eba2331b75cbf409b09240b01009cb4f600/src/main/webapp/mxgraph/src/view/mxGraphView.js
  - Notes: `mxGraphView.prototype.getPerimeterPoint` calls the perimeter function; also provides `getPerimeterBounds`.

- Connection constraint object (fixed anchor points)
  - src/main/webapp/mxgraph/src/view/mxConnectionConstraint.js
    https://github.com/jgraph/drawio/blob/34466eba2331b75cbf409b09240b01009cb4f600/src/main/webapp/mxgraph/src/view/mxConnectionConstraint.js
  - Notes: `mxConnectionConstraint` stores a relative point and whether it should be projected to the perimeter.

- Graph-level helpers for connection points, style flags and connection constraint handling
  - src/main/webapp/mxgraph/src/view/mxGraph.js
    https://github.com/jgraph/drawio/blob/34466eba2331b75cbf409b09240b01009cb4f600/src/main/webapp/mxgraph/src/view/mxGraph.js
  - Notes: `getConnectionPoint`, `getConnectionConstraint`, `setConnectionConstraint` and style flags for entry / exit perimeter (`STYLE_ENTRY_PERIMETER`, `STYLE_EXIT_PERIMETER`), `ENTRY_DX` / `ENTRY_DY`, `EXIT_DX` / `EXIT_DY`.

- Connection creation & preview (adding waypoints while creating an edge)
  - src/main/webapp/mxgraph/src/handler/mxConnectionHandler.js
    https://github.com/jgraph/drawio/blob/34466eba2331b75cbf409b09240b01009cb4f600/src/main/webapp/mxgraph/src/handler/mxConnectionHandler.js
  - Notes:
    - Creates preview `shape` (polyline) and updates `shape.points` as it moves.
    - Has `this.waypoints` and pushes snapped `mxPoint` entries during connection creation: `this.waypoints.push(point)`.
    - Uses `getSourcePerimeterPoint` / `getTargetPerimeterPoint` to compute terminal attach points for preview.

- Constraint UI (displaying fixed anchor points on hover)
  - src/main/webapp/mxgraph/src/handler/mxConstraintHandler.js
    https://github.com/jgraph/drawio/blob/34466eba2331b75cbf409b09240b01009cb4f600/src/main/webapp/mxgraph/src/handler/mxConstraintHandler.js
  - Notes: shows small points/icons on vertices and snaps to them when creating connections.

- Edge editing (moving waypoints, moving start/end terminals)
  - src/main/webapp/mxgraph/src/handler/mxEdgeHandler.js
    https://github.com/jgraph/drawio/blob/34466eba2331b75cbf409b09240b01009cb4f600/src/main/webapp/mxgraph/src/handler/mxEdgeHandler.js
  - Notes:
    - Creates bend handles and virtual bends.
    - Handles hit detection for bends and virtual bends.
    - Handles `mouseDown`, `start`, `getPointForEvent`, snapping behavior, adding/removing points and moving handles.
    - Uses `this.bends` and `this.virtualBends` arrays for current handles.

- Where edge waypoints are stored in the model
  - Edge geometry: `mxGeometry.points` on the edge `mxCell` contains the waypoints (absolute or relative depending on geometry). Edge handlers and graph methods manage persisting these to the model.

---

## Key code spots to inspect / edit for common tasks

- Change how vertex shapes render (square/circle/custom):
  - Edit the specific shape implementation in `Shapes.js` (e.g., `CubeShape`, `IsoRectangleShape`, `StateShape`, `Ellipse`/`Circle` implementations).
  - If you need global behavior changes, inspect `mxShape` in `mxShape.js`.

- Change how anchor points are calculated (where edges attach on a vertex):
  - Add/modify perimeter functions inside `mxPerimeter.js`. Add the new function to `mxPerimeter` and register via `mxStyleRegistry` if needed.
  - Adjust how `mxGraphView.getPerimeterPoint` uses the perimeter (e.g., border handling, orthogonal behavior, or transform for rotation).

- Add or change fixed connection points (named connection points / explicit anchors):
  - `mxConnectionConstraint` is the data object. See where constraints are read/written in `mxGraph.getConnectionConstraint` & `mxGraph.setConnectionConstraint`.
  - Modify `mxConstraintHandler` to change UI for showing anchor points or snapping behavior.

- Change how waypoints are created when drawing a new edge:
  - Edit `mxConnectionHandler`: it creates `this.waypoints` and pushes snapped points. You can modify snapping, quantization, or add alternate ways to create/remove waypoints here.

- Change how breakpoints (waypoints) are moved after creation:
  - Edit `mxEdgeHandler`: the drag behavior (snap tolerance, handle shapes, movement constraints, whether terminals can be disconnected) is implemented here. `getPointForEvent` contains snap-to-terminal logic.

- Change how start/end terminals move around the object:
  - This behavior uses `getConnectionPoint` + `getPerimeterPoint` to compute where the terminal should move to when dragged, and `mxEdgeHandler` orchestrates the drag. Look at `mxEdgeHandler.start` and the code changing the edge's terminal (reconnecting logic) and `mxConnectionHandler.updateEdgeState`.

---

## Example references (specific small code excerpts)
- Waypoint visual (paint): WaypointShape in Shapes.js — search for `WaypointShape.prototype.paintVertexShape` in `Shapes.js`.
  Link: Shapes.js (see waypoint sections)
  https://github.com/jgraph/drawio/blob/34466eba2331b75cbf409b09240b01009cb4f600/src/main/webapp/js/grapheditor/Shapes.js

- Where waypoints are pushed during connection creation:
  - In `mxConnectionHandler` there is code that does:
    ```
    if (this.waypoints == null) { this.waypoints = []; }
    var point = new mxPoint(this.graph.snap(me.getGraphX() / scale) * scale,
            this.graph.snap(me.getGraphY() / scale) * scale);
    this.waypoints.push(point);
    ```
  - Search for `this.waypoints.push` in `mxConnectionHandler.js`.
  Link: mxConnectionHandler.js
  https://github.com/jgraph/drawio/blob/34466eba2331b75cbf409b09240b01009cb4f600/src/main/webapp/mxgraph/src/handler/mxConnectionHandler.js

- Edge editing / bend handles: `mxEdgeHandler` manages detection and dragging of bend handles. Search for `getHandleForEvent`, `mouseDown`, `start`, and `getPointForEvent`.
  Link: mxEdgeHandler.js
  https://github.com/jgraph/drawio/blob/34466eba2331b75cbf409b09240b01009cb4f600/src/main/webapp/mxgraph/src/handler/mxEdgeHandler.js

- Perimeter intersection math is implemented in `mxPerimeter.js`. Look for `RectanglePerimeter`, `EllipsePerimeter`, `CenterPerimeter`, or other functions depending on the shape.
  Link: mxPerimeter.js
  https://github.com/jgraph/drawio/blob/34466eba2331b75cbf409b09240b01009cb4f600/src/main/webapp/mxgraph/src/view/mxPerimeter.js

---

## Practical next steps / suggestions

- To change visual appearance of waypoints:
  - Edit `WaypointShape` in `Shapes.js` (change size, stroke, fill).
- To add a new anchor behavior (e.g., fixed named ports on a vertex):
  - Add a new perimeter function or use `mxConnectionConstraint` with `perimeter=false` and compute the offset in `mxGraph.getConnectionPoint`.
- To customize snapping when moving bend handles:
  - Edit `mxEdgeHandler.getPointForEvent` (it currently uses `getSnapToTerminalTolerance` and `snapToPoint`).
- To change how the start/end attachment moves around rotated shapes:
  - Review `mxConnectionHandler.getSourcePerimeterPoint` and `getTargetPerimeterPoint` (they rotate/perimeter-project points).
- To persist custom data for attachments (e.g., named ports):
  - Use edge style entries or store attributes in the cell (edge or vertex) and adjust `mxGraph.getConnectionPoint` and `mxConnectionHandler` to consult them.

---

## If you want, I can:
- Produce specific code snippets/patches for one of the tasks above (e.g., add a new perimeter function, change waypoint visuals, tweak snap tolerance).
- Create a short PR that implements a minimal, well-scoped change (please tell me which repo/branch to target).
- Walk through the exact lines to change for a chosen behavior and explain the implications (model vs view vs handler changes).

Tell me which specific change you want implemented and I will prepare a minimal concrete patch (or step-by-step edits) for that work.