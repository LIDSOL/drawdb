# Waypoint System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DrawDB with Waypoints                         │
│                     (Inspired by drawio/mxGraph)                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTIONS                            │
├─────────────────────────────────────────────────────────────────────┤
│  1. Select relationship → Waypoint handles appear                    │
│  2. Click virtual bend → Add waypoint                                │
│  3. Drag waypoint → Move it (with grid snap)                         │
│  4. Double-click waypoint → Remove it                                │
│  5. Move table → Connection points update automatically              │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         REACT COMPONENTS                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Relationship.jsx                                           │   │
│  │  ┌────────────────────────────────────────────────────┐    │   │
│  │  │ - Renders relationship path with waypoints         │    │   │
│  │  │ - Uses useWaypointEditor hook                      │    │   │
│  │  │ - Calculates perimeter points                      │    │   │
│  │  │ - Shows/hides waypoint handles on selection       │    │   │
│  │  └────────────────────────────────────────────────────┘    │   │
│  │                          │                                  │   │
│  │                          ▼                                  │   │
│  │  ┌────────────────────────────────────────────────────┐    │   │
│  │  │ WaypointContainer                                  │    │   │
│  │  │ ├─ WaypointHandle (draggable circles)            │    │   │
│  │  │ └─ VirtualBend (add waypoint indicators)         │    │   │
│  │  └────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           REACT HOOKS                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  useWaypointEditor(relationship, tables, onUpdate)           │  │
│  │  ┌──────────────────────────────────────────────────────┐   │  │
│  │  │ State Management:                                     │   │  │
│  │  │ - isDragging, draggedWaypointIndex                   │   │  │
│  │  │ - hoveredWaypointIndex, hoveredVirtualBendIndex      │   │  │
│  │  │ - showWaypoints (based on selection)                 │   │  │
│  │  │                                                        │   │  │
│  │  │ Event Handlers:                                       │   │  │
│  │  │ - onWaypointMouseDown → Start drag                   │   │  │
│  │  │ - onMouseMove → Update position                      │   │  │
│  │  │ - onMouseUp → Save changes                           │   │  │
│  │  │ - onWaypointDoubleClick → Remove waypoint            │   │  │
│  │  │ - onVirtualBendMouseDown → Add waypoint              │   │  │
│  │  │                                                        │   │  │
│  │  │ Returns: waypoints, handlers, state                  │   │  │
│  │  └──────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                  │                                    │
│                                  ▼                                    │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  useConnectionPoints(startTable, endTable, waypoints)        │  │
│  │  ┌──────────────────────────────────────────────────────┐   │  │
│  │  │ - Calculates perimeter connection points              │   │  │
│  │  │ - Returns: { startPoint, endPoint, points }           │   │  │
│  │  └──────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          CORE UTILITIES                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  edgeHandler.js (from drawio mxEdgeHandler.js)              │  │
│  │  ┌──────────────────────────────────────────────────────┐   │  │
│  │  │ Classes:                                              │   │  │
│  │  │                                                        │   │  │
│  │  │ Waypoint                                              │   │  │
│  │  │ ├─ x, y, id                                           │   │  │
│  │  │ └─ toObject(), fromObject()                           │   │  │
│  │  │                                                        │   │  │
│  │  │ EdgeHandler                                           │   │  │
│  │  │ ├─ loadWaypoints()                                    │   │  │
│  │  │ ├─ getAbsolutePoints()                                │   │  │
│  │  │ ├─ getSegments()                                      │   │  │
│  │  │ ├─ findWaypointAt(x, y)                               │   │  │
│  │  │ ├─ findVirtualBendAt(x, y)                            │   │  │
│  │  │ ├─ addWaypoint(x, y, index)                           │   │  │
│  │  │ ├─ removeWaypoint(index)                              │   │  │
│  │  │ ├─ moveWaypoint(index, x, y)                          │   │  │
│  │  │ ├─ isPointNearEdge(x, y)                              │   │  │
│  │  │ └─ getWaypointsData()                                 │   │  │
│  │  │                                                        │   │  │
│  │  │ ConnectionHandler (for creating new relationships)    │   │  │
│  │  │ ├─ start(table, x, y)                                 │   │  │
│  │  │ ├─ addWaypoint(x, y)                                  │   │  │
│  │  │ ├─ updatePosition(x, y)                               │   │  │
│  │  │ └─ complete(targetTable) → waypoints[]                │   │  │
│  │  └──────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                  │                                    │
│                                  ▼                                    │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  perimeter.js (from drawio mxPerimeter.js)                   │  │
│  │  ┌──────────────────────────────────────────────────────┐   │  │
│  │  │ Classes:                                              │   │  │
│  │  │ - Point(x, y)                                         │   │  │
│  │  │ - Bounds(x, y, width, height)                         │   │  │
│  │  │                                                        │   │  │
│  │  │ Functions:                                            │   │  │
│  │  │ rectanglePerimeter(bounds, next, orthogonal)          │   │  │
│  │  │ ┌─────────────────────────────────────────────┐      │   │  │
│  │  │ │ 1. Calculate angle from center to next      │      │   │  │
│  │  │ │ 2. Determine which edge (L/T/R/B)           │      │   │  │
│  │  │ │ 3. Calculate intersection point              │      │   │  │
│  │  │ │ 4. Apply orthogonal constraints if needed   │      │   │  │
│  │  │ └─────────────────────────────────────────────┘      │   │  │
│  │  │                                                        │   │  │
│  │  │ getTablePerimeterPoint(table, target)                 │   │  │
│  │  │ getConnectionPoints(startTable, endTable, waypoints)  │   │  │
│  │  │                                                        │   │  │
│  │  │ Helpers:                                              │   │  │
│  │  │ - distance(p1, p2)                                    │   │  │
│  │  │ - isPointNearLine(point, start, end, tolerance)       │   │  │
│  │  │ - snapToGrid(point, gridSize)                         │   │  │
│  │  └──────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        STATE MANAGEMENT                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  DiagramContext (Modified)                                    │  │
│  │  ┌──────────────────────────────────────────────────────┐   │  │
│  │  │ relationships: [                                      │   │  │
│  │  │   {                                                    │   │  │
│  │  │     id: 1,                                            │   │  │
│  │  │     startTableId: 0,                                  │   │  │
│  │  │     endTableId: 1,                                    │   │  │
│  │  │     waypoints: [                    ← NEW!            │   │  │
│  │  │       { x: 300, y: 200, id: 'wp_...' },             │   │  │
│  │  │       { x: 400, y: 300, id: 'wp_...' }              │   │  │
│  │  │     ],                                                │   │  │
│  │  │     ...                                               │   │  │
│  │  │   }                                                    │   │  │
│  │  │ ]                                                      │   │  │
│  │  │                                                        │   │  │
│  │  │ New function:                                         │   │  │
│  │  │ updateRelationshipWaypoints(id, waypoints)            │   │  │
│  │  └──────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                          DATA FLOW                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  User Action → Event Handler → EdgeHandler → Hook State             │
│       │              │               │              │                 │
│       │              │               │              ▼                 │
│       │              │               │        Re-render UI            │
│       │              │               │              │                 │
│       │              │               ▼              │                 │
│       │              │         Update waypoints     │                 │
│       │              │               │              │                 │
│       │              ▼               │              │                 │
│       │        Calculate deltas      │              │                 │
│       │              │               │              │                 │
│       ▼              │               │              │                 │
│  onMouseDown ────────┼───────────────┼──────────────┘                │
│  onMouseMove ────────┤               │                                │
│  onMouseUp ──────────┼───────────────┼─→ Save to Context             │
│  onDoubleClick ──────┘               └─→ Calculate points             │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                       RENDERING PIPELINE                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  1. Get tables from context                                          │
│  2. Load waypoints from relationship data                            │
│  3. Calculate connection points (with perimeter math)                │
│       ├─ Start point: startTable + first waypoint/endTable          │
│       └─ End point: endTable + last waypoint/startTable             │
│  4. Build point array: [startPoint, ...waypoints, endPoint]         │
│  5. Generate SVG path: M x1 y1 L x2 y2 L x3 y3 ...                 │
│  6. Render path                                                      │
│  7. If selected:                                                     │
│       ├─ Calculate virtual bend positions (segment midpoints)       │
│       ├─ Render waypoint handles                                    │
│       └─ Render virtual bends                                       │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    KEY ALGORITHMS (from drawio)                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  1. PERIMETER INTERSECTION (mxPerimeter.js:84-158)                   │
│     ┌──────────────────────────────────────────────────────────┐   │
│     │ Input: Rectangle bounds, Next point                       │   │
│     │ Output: Point on rectangle edge                           │   │
│     │                                                            │   │
│     │ alpha = atan2(dy, dx)  // Angle to next point             │   │
│     │ t = atan2(height, width)  // Rectangle diagonal angle     │   │
│     │                                                            │   │
│     │ if alpha in [-π+t, π-t]: Left edge                        │   │
│     │ elif alpha < -t: Top edge                                 │   │
│     │ elif alpha < t: Right edge                                │   │
│     │ else: Bottom edge                                         │   │
│     │                                                            │   │
│     │ Calculate intersection using tan(alpha) or tan(beta)      │   │
│     └──────────────────────────────────────────────────────────┘   │
│                                                                       │
│  2. WAYPOINT SNAPPING (mxConnectionHandler.js:1707-1716)             │
│     ┌──────────────────────────────────────────────────────────┐   │
│     │ point = new Point(                                        │   │
│     │   graph.snap(mouseX / scale) * scale,                     │   │
│     │   graph.snap(mouseY / scale) * scale                      │   │
│     │ )                                                          │   │
│     │ waypoints.push(point)                                     │   │
│     └──────────────────────────────────────────────────────────┘   │
│                                                                       │
│  3. HIT DETECTION                                                    │
│     ┌──────────────────────────────────────────────────────────┐   │
│     │ Point-to-point: sqrt((x2-x1)² + (y2-y1)²) <= radius       │   │
│     │ Point-to-line: Project point onto line, calc distance     │   │
│     └──────────────────────────────────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                          VISUAL ELEMENTS                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Relationship Line                                                   │
│  ════════════════════════════════════════════                        │
│  ├─ Main path (stroke, visible)                                     │
│  └─ Hit area path (transparent, wider for easier clicking)          │
│                                                                       │
│  Waypoint Handle                                                     │
│  ●────────────────────────────────────────────────                   │
│  ├─ Visible circle (6px radius)                                     │
│  │  ├─ Fill: white/blue (normal/selected)                           │
│  │  └─ Stroke: dark border                                          │
│  └─ Hit area circle (10px radius, transparent)                      │
│                                                                       │
│  Virtual Bend                                                        │
│  ◉────────────────────────────────────────────────                   │
│  ├─ Semi-transparent circle (5px radius)                            │
│  │  ├─ Fill: blue, opacity 0.4                                      │
│  │  └─ Hover: opacity 0.8                                           │
│  └─ Hit area circle (9px radius, transparent)                       │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         FILE DEPENDENCIES                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Relationship.jsx                                                    │
│      ↓ imports                                                       │
│      ├─ useWaypoints.js                                             │
│      │      ↓ imports                                               │
│      │      ├─ edgeHandler.js                                       │
│      │      │      ↓ imports                                        │
│      │      │      └─ perimeter.js                                  │
│      │      └─ perimeter.js                                         │
│      ├─ WaypointHandle.jsx                                          │
│      └─ useDiagram (from context)                                   │
│             ↓ provides                                               │
│             └─ updateRelationshipWaypoints()                        │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Legend

- `═` : Main data/control flow
- `─` : Import/dependency
- `┌┐└┘├┤` : Component/module boundaries
- `▼` : Flow direction
- `●` : Waypoint handle (draggable)
- `◉` : Virtual bend (clickable to add waypoint)

## Key Takeaways

1. **Perimeter calculations** replace center-to-center connections
2. **EdgeHandler** manages all waypoint operations (CRUD)
3. **React hook** bridges utility logic with component state
4. **Event delegation** handles all user interactions
5. **Virtual bends** provide intuitive UX for adding waypoints
6. **Grid snapping** ensures clean, aligned waypoints
7. **State management** persists waypoints in relationship data
