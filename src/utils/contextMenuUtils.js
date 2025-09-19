// Utility function to calculate safe menu position within viewport
export const calculateSafePosition = (
  x,
  y,
  menuWidth = 200,
  menuHeight = 300,
) => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const padding = 10;

  let safeX = x;
  let safeY = y;

  if (x + menuWidth > viewportWidth - padding) {
    safeX = Math.max(padding, x - menuWidth);
    if (safeX < padding) {
      safeX = Math.max(padding, viewportWidth - menuWidth - padding);
    }
  }

  if (y + menuHeight > viewportHeight - padding) {
    safeY = Math.max(padding, y - menuHeight);
    if (safeY < padding) {
      safeY = Math.max(padding, viewportHeight - menuHeight - padding);
    }
  }

  safeX = Math.max(
    padding,
    Math.min(safeX, viewportWidth - menuWidth - padding),
  );
  safeY = Math.max(
    padding,
    Math.min(safeY, viewportHeight - menuHeight - padding),
  );

  return { x: safeX, y: safeY };
};
