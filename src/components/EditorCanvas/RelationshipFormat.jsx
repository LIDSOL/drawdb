export function CrowOM(pathRef, notation, cardinalityvar, cardinalityEndX, cardinalityEndY, cardinalityStartX, cardinalityStartY,  direction, cardinalityStart, cardinalityEnd){
    return(
        pathRef && notation === 'crows_foot' && (cardinalityvar==2)  &&(
            <>
              <line
                x1={cardinalityEndX-(20*direction)}
                y1={cardinalityEndY+15}
                x2={cardinalityEndX-(20*direction)}
                y2={cardinalityEndY-15}
                stroke="gray"
                strokeWidth='2'
                className="group-hover:fill-sky-700"
              />
                <line
                    x1={cardinalityEndX-(20*direction)}
                    y1={cardinalityEndY}
                    x2={cardinalityEndX+1}
                    y2={cardinalityEndY-10}
                    stroke="gray"
                    strokeWidth='2'
                    className="group-hover:fill-sky-700"
                />
                <line
                    x1={cardinalityEndX-20*direction}
                    y1={cardinalityEndY}
                    x2={cardinalityEndX+1}
                    y2={cardinalityEndY+10}
                    stroke="gray"
                    strokeWidth='2'
                    className="group-hover:fill-sky-700"
                />
                <text
                    x={cardinalityStartX}
                    y={cardinalityStartY-10}
                    fill="black"
                    strokeWidth="0.5"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                >
                    {cardinalityStart}
                </text>
                <text
                    x={cardinalityEndX-15}
                    y={cardinalityEndY-15}
                    fill="black"
                    strokeWidth="0.5"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                >
                    {cardinalityEnd}
                </text>
                <line
                  x1={cardinalityStartX-(15*direction)}
                  y1={cardinalityStartY+10}
                  x2={cardinalityStartX-(15*direction)}
                  y2={cardinalityStartY-10}
                  stroke="gray"
                  strokeWidth='2'
                  className="group-hover:fill-sky-700"
                />
                <line
                  x1={cardinalityStartX-(10*direction)}
                  y1={cardinalityStartY+10}
                  x2={cardinalityStartX-(10*direction)}
                  y2={cardinalityStartY-10}
                  stroke="gray"
                  strokeWidth='2'
                  className="group-hover:fill-sky-700"
                />
            </>
        )
    )
}

export function CrowOO(pathRef, notation, cardinalityvar, cardinalityEndX, cardinalityEndY, cardinalityStartX, cardinalityStartY,  direction, cardinalitySart, cardinalityEnd){
    return(
        pathRef && notation === 'crows_foot' && cardinalityvar==3  &&(
            <>
            <line
              x1={cardinalityEndX-(15*direction)}
              y1={cardinalityEndY+10}
              x2={cardinalityEndX-(15*direction)}
              y2={cardinalityEndY-10}
              stroke="gray"
              strokeWidth='2'
              className="group-hover:fill-sky-700"
            />

            <line
              x1={cardinalityEndX-(10*direction)}
              y1={cardinalityEndY+10}
              x2={cardinalityEndX-(10*direction)}
              y2={cardinalityEndY-10}
              stroke="gray"
              strokeWidth='2'
              className="group-hover:fill-sky-700"
            />
            <line
              x1={cardinalityStartX-(15*direction)}
              y1={cardinalityStartY+10}
              x2={cardinalityStartX-(15*direction)}
              y2={cardinalityStartY-10}
              stroke="gray"
              strokeWidth='2'
              className="group-hover:fill-sky-700"
            />
            <line
              x1={cardinalityStartX-(10*direction)}
              y1={cardinalityStartY+10}
              x2={cardinalityStartX-(10*direction)}
              y2={cardinalityStartY-10}
              stroke="gray"
              strokeWidth='2'
              className="group-hover:fill-sky-700"
            />

            <text
              x={cardinalityStartX}
              y={cardinalityStartY-15}
              fill="black"
              strokeWidth="0.5"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {cardinalitySart}
            </text>
            <text
                x={cardinalityEndX-15}
                y={cardinalityEndY-15}
                fill="black"
                strokeWidth="0.5"
                textAnchor="middle"
                alignmentBaseline="middle"
            >
                {cardinalityEnd}
            </text>
            </>
        )
    )
}


export function CrowZM(pathRef, notation, cardinalityvar, cardinalityEndX, cardinalityEndY, cardinalityStartX, cardinalityStartY,  direction, cardinalityStart, cardinalityEnd){
  return(
      pathRef && notation === 'crows_foot' && (cardinalityvar==1)  &&(
          <>
            <circle
              cx={cardinalityEndX-24}
              cy={cardinalityEndY}
              r="4"
              stroke="gray"
              strokeWidth='2'
              fill="none"
              className="group-hover:fill-sky-700"
            />
              <line
                  x1={cardinalityEndX-(20*direction)}
                  y1={cardinalityEndY}
                  x2={cardinalityEndX+1}
                  y2={cardinalityEndY-10}
                  stroke="gray"
                  strokeWidth='2'
                  className="group-hover:fill-sky-700"
              />
              <line
                  x1={cardinalityEndX-20*direction}
                  y1={cardinalityEndY}
                  x2={cardinalityEndX+1}
                  y2={cardinalityEndY+10}
                  stroke="gray"
                  strokeWidth='2'
                  className="group-hover:fill-sky-700"
              />
              <text
                  x={cardinalityStartX}
                  y={cardinalityStartY-10}
                  fill="black"
                  strokeWidth="0.5"
                  textAnchor="middle"
                  alignmentBaseline="middle"
              >
                  {cardinalityStart}
              </text>
              <text
                  x={cardinalityEndX-15}
                  y={cardinalityEndY-15}
                  fill="black"
                  strokeWidth="0.5"
                  textAnchor="middle"
                  alignmentBaseline="middle"
              >
                  {cardinalityEnd}
              </text>
              <line
                x1={cardinalityStartX-(15*direction)}
                y1={cardinalityStartY+10}
                x2={cardinalityStartX-(15*direction)}
                y2={cardinalityStartY-10}
                stroke="gray"
                strokeWidth='2'
                className="group-hover:fill-sky-700"
              />
              <line
                x1={cardinalityStartX-(10*direction)}
                y1={cardinalityStartY+10}
                x2={cardinalityStartX-(10*direction)}
                y2={cardinalityStartY-10}
                stroke="gray"
                strokeWidth='2'
                className="group-hover:fill-sky-700"
              />
          </>
      )
  )
}

export function DefaultNotation(pathRef, notation, cardinalityEndX, cardinalityEndY, cardinalityStartX, cardinalityStartY,  cardinalityStart, cardinalityEnd){
  return(
      pathRef && notation === 'default' && (
        <>
            <circle
              cx={cardinalityStartX}
              cy={cardinalityStartY}
              r="12"
              fill="grey"
              className="group-hover:fill-sky-700"
            />
            <text
              x={cardinalityStartX}
              y={cardinalityStartY}
              fill="white"
              strokeWidth="0.5"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {cardinalityStart}
            </text>
            <circle
              cx={cardinalityEndX}
              cy={cardinalityEndY}
              r="12"
              fill="grey"
              className="group-hover:fill-sky-700"
            />
            <text
              x={cardinalityEndX}
              y={cardinalityEndY}
              fill="white"
              strokeWidth="0.5"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {cardinalityEnd}
            </text>
          </>
      )
  )
}
