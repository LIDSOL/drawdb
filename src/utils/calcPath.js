export function calcPath(r, tableWidth = 200, zoom = 1) {
  const width = tableWidth * zoom;
  const offset = 20 * zoom; // 🔥 Segmento recto inicial y final

  const x1 = r.startTable.x;
  const y1 = r.startTable.y;
  const x2 = r.endTable.x;
  const y2 = r.endTable.y;

  const radius = 10 * zoom;
  const isRecursiveLike = Math.abs(x1 - x2) < 1;

  const useCustomBreakpoints = Array.isArray(r.breakpoints) && r.breakpoints.length === 2;
  const breakpoints = useCustomBreakpoints ? r.breakpoints : [];

  // 🧠 Determinar de qué lado sale y entra la línea
  const startIsLeft = x1 + width <= x2;
  const startIsRight = !startIsLeft;

  const endIsLeft = x2 + width <= x1;
  const endIsRight = !endIsLeft;

  // 🔸 Punto de salida desde la tabla
  const startX = startIsLeft ? x1 + width : x1;
  const startY = y1;
  const startOutX = startIsLeft ? startX + offset : startX - offset;
  const startOutY = startY;

  // 🔸 Punto de entrada hacia la tabla destino
  const endX = endIsLeft ? x2 + width : x2;
  const endY = y2;
  const endInX = endIsLeft ? endX + offset : endX - offset;
  const endInY = endY;

  // 🔄 🔥 CASO RECURSIVO (misma tabla)
  if (isRecursiveLike) {
    const loopOutwardDistance = Math.max(40 * zoom, width / 4);
    const verticalMidpoint = (y1 + y2) / 2;

    const bp = useCustomBreakpoints ? breakpoints : [
      { x: x1 + width + loopOutwardDistance, y: y1 },
      { x: x1 + width + loopOutwardDistance, y: verticalMidpoint }
    ];
    if (!useCustomBreakpoints) breakpoints.push(...bp);

    const path = `M ${startX} ${startY} ` +
                 `L ${startOutX} ${startOutY} ` + // Recto inicial
                 `L ${bp[0].x} ${bp[0].y} ` +
                 `L ${bp[1].x} ${bp[1].y} ` +
                 `L ${endInX} ${endInY} ` +       // Recto final
                 `L ${endX} ${endY}`;
    return { path, breakpoints,
            startAttach: { x: startOutX, y: startOutY },
            endAttach: { x: endInX, y: endInY } 
           };
  }

  // ➕ 🔥 Si están muy cerca en Y (horizontalmente alineadas), línea simple
  if (Math.abs(y1 - y2) <= 36 * zoom) {
    const rTemp = Math.abs(y2 - y1) / 3;
    const rFinal = rTemp > 2 ? radius : rTemp;

    if (rFinal <= 2) {
      if (startIsLeft) {
        const path = `M ${startX} ${startY} L ${startOutX} ${startOutY} L ${endInX} ${endInY} L ${endX} ${endY}`;
        return { path, breakpoints,
            startAttach: { x: startOutX, y: startOutY },
            endAttach: { x: endInX, y: endInY } 
           };
      } else if (endIsLeft) {
        const path = `M ${startX} ${startY} L ${startOutX} ${startOutY} L ${endInX} ${endInY} L ${endX} ${endY}`;
        return { path, breakpoints,
            startAttach: { x: startOutX, y: startOutY },
            endAttach: { x: endInX, y: endInY } 
           };
      }
    }
  }

  const midX = (startOutX + endInX) / 2;

  // 🔽 Si y1 <= y2 (de arriba hacia abajo)
  if (y1 <= y2) {
    let bp = useCustomBreakpoints ? breakpoints : [];

    if (!useCustomBreakpoints) {
      if (startIsLeft) {
        bp = [
          { x: midX, y: y1 + radius },
          { x: midX, y: y2 - radius }
        ];
      } else if (x2 <= x1 + width && x1 <= x2) {
        bp = [
          { x: x1 + width + radius * 2, y: y1 + radius },
          { x: x1 + width + radius * 2, y: y2 - radius }
        ];
      } else if (x2 + width >= x1 && x2 + width <= x1 + width) {
        bp = [
          { x: x1 - radius * 2, y: y1 + radius },
          { x: x1 - radius * 2, y: y2 - radius }
        ];
      } else {
        bp = [
          { x: midX, y: y1 + radius },
          { x: midX, y: y2 - radius }
        ];
      }
      breakpoints.push(...bp);
    }

    const path = `M ${startX} ${startY} ` +
                 `L ${startOutX} ${startOutY} ` +
                 `L ${bp[0].x} ${bp[0].y} ` +
                 `L ${bp[1].x} ${bp[1].y} ` +
                 `L ${endInX} ${endInY} ` +
                 `L ${endX} ${endY}`;
    return { path, breakpoints,
            startAttach: { x: startOutX, y: startOutY },
            endAttach: { x: endInX, y: endInY } 
           };
  }

  // 🔼 Si y1 > y2 (de abajo hacia arriba)
  else {
    let bp = useCustomBreakpoints ? breakpoints : [];

    if (!useCustomBreakpoints) {
      if (startIsLeft) {
        bp = [
          { x: midX, y: y1 - radius },
          { x: midX, y: y2 + radius }
        ];
      } else if (x1 + width >= x2 && x1 + width <= x2 + width) {
        bp = [
          { x: x1 - radius * 3, y: y1 - radius },
          { x: x1 - radius * 3, y: y2 + radius }
        ];
      } else if (x1 >= x2 && x1 <= x2 + width) {
        bp = [
          { x: x1 + width + radius * 2, y: y1 - radius },
          { x: x1 + width + radius * 2, y: y2 + radius }
        ];
      } else {
        bp = [
          { x: midX, y: y1 - radius },
          { x: midX, y: y2 + radius }
        ];
      }
      breakpoints.push(...bp);
    }

    const path = `M ${startX} ${startY} ` +
                 `L ${startOutX} ${startOutY} ` +
                 `L ${bp[0].x} ${bp[0].y} ` +
                 `L ${bp[1].x} ${bp[1].y} ` +
                 `L ${endInX} ${endInY} ` +
                 `L ${endX} ${endY}`;
    return { path, breakpoints,
            startAttach: { x: startOutX, y: startOutY },
            endAttach: { x: endInX, y: endInY } 
          };
  }
}

