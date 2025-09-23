import { createContext, useState, useCallback } from "react";
import { Action } from "../data/constants";

export const UndoRedoContext = createContext({
  undoStack: [],
  redoStack: [],
  pushUndo: () => {},
  pushRedo: () => {},
  clearUndoRedo: () => {},
});

export default function UndoRedoContextProvider({ children }) {
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Configuration
  const MAX_STACK_SIZE = 200; // keep memory bounded

  // Helper to check array id equality (order-sensitive)
  const arrayIdsEqual = (a, b) => {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  };

  // Helper to push an action into the undo stack with improved filtering and coalescing
  const pushUndo = useCallback((action) => {
    // IMPORTANT: prefer `pushUndo(action)` from UI/components when you need
    // to append a simple action and clear redo. `pushUndo` centralizes
    // validation, deduplication and coalescing logic. However, the raw
    // `setUndoStack`/`setRedoStack` setters are intentionally exported and
    // used by internal modules that need low-level control (popping the
    // stack, re-inserting composite actions, performing undo/redo effects
    // atomically). Do NOT blindly replace all `setUndoStack(...)` calls with
    // `pushUndo(...)` — convert only the simple append+clear patterns.
    if (!action) return;

    // Only accept real mutation actions to avoid recording trivial UI interactions
  const allowedActionNames = new Set(["MOVE", "ADD", "DELETE", "EDIT"]);
  const allowedActionNums = new Set([Action.MOVE, Action.ADD, Action.DELETE, Action.EDIT]);

    // Validate action.action (number or string)
    if (typeof action.action === 'number') {
      if (!allowedActionNums.has(action.action)) return;
    } else if (typeof action.action === 'string') {
      if (!allowedActionNames.has(action.action)) return;
    } else {
      return;
    }

    const last = undoStack[undoStack.length - 1];

    // Fast dedupe by explicit id when provided
    if (action.id !== undefined && last && last.id !== undefined && action.id === last.id) {
      return;
    }

    // Deduplicate by (action, element, message) which is cheap and usually sufficient
    if (
      last &&
      last.action === action.action &&
      last.element === action.element &&
      action.message &&
      last.message === action.message
    ) {
      return;
    }

    // Coalesce consecutive MOVE actions for the same elements: update the last entry instead of pushing
    try {
      if (action.action === Action.MOVE && last && last.action === Action.MOVE && last.element === action.element) {
        // Single-element moves
        if (!Array.isArray(action.id) && !Array.isArray(last.id) && action.id === last.id) {
          setUndoStack((prev) => {
            const copy = [...prev];
            const idx = copy.length - 1;
            const base = { ...copy[idx] };
            // ensure 'from' exists
            base.from = base.from || action.from || base.from;
            base.to = action.to || base.to;
            copy[idx] = base;
            return copy;
          });
          setRedoStack([]);
          return;
        }

        // Multi-element moves where ids arrays match exactly
        if (Array.isArray(action.id) && Array.isArray(last.id) && arrayIdsEqual(action.id, last.id)) {
          setUndoStack((prev) => {
            const copy = [...prev];
            const idx = copy.length - 1;
            const base = { ...copy[idx] };
            base.originalPositions = base.originalPositions || action.originalPositions || base.originalPositions;
            base.newPositions = action.newPositions || base.newPositions;
            copy[idx] = base;
            return copy;
          });
          setRedoStack([]);
          return;
        }
      }
    } catch (e) {
      // if anything fails, fallthrough to normal push
    }

    // Fallback dedupe using JSON stringify, but guarded
    try {
      const sLast = last ? JSON.stringify(last) : null;
      const sAction = JSON.stringify(action);
      if (sLast === sAction) return;
    } catch (e) {
      // Non-serializable payload; skip JSON dedupe
    }

    // Push and trim to MAX_STACK_SIZE
    setUndoStack((prev) => {
      const next = [...prev, action];
      if (next.length > MAX_STACK_SIZE) {
        // drop the oldest
        next.shift();
      }
      return next;
    });

    // pushing a new undo clears redo
    setRedoStack([]);
  }, [undoStack]);

  const pushRedo = useCallback((action) => {
    if (!action) return;
    const last = redoStack[redoStack.length - 1];

    // Fast dedupe by id
    if (action.id !== undefined && last && last.id !== undefined && action.id === last.id) return;

    // Cheap dedupe by action+element+message
    if (last && last.action === action.action && last.element === action.element && action.message && last.message === action.message) return;

    // JSON fallback dedupe
    try {
      const sLast = last ? JSON.stringify(last) : null;
      const sAction = JSON.stringify(action);
      if (sLast === sAction) return;
    } catch (e) {
      // ignore
    }

    setRedoStack((prev) => {
      const next = [...prev, action];
      if (next.length > MAX_STACK_SIZE) next.shift();
      return next;
    });
  }, [redoStack]);

  const clearUndoRedo = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  return (
    <UndoRedoContext.Provider
      value={{ undoStack, redoStack, setUndoStack, setRedoStack, pushUndo, pushRedo, clearUndoRedo }}
    >
      {children}
    </UndoRedoContext.Provider>
  );
}
