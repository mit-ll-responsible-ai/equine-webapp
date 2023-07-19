// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import React from 'react'
import { scaleBand } from "d3-scale";

import "./matrix.scss";

const SCROLLBAR_SIZE = 17;

type DataType = {r: number, c: number, z: number, fill?: string}
type HeadingType = {name: string, count: number}

type Props = {
  //required props
  columns: HeadingType[], //[strings of the vertical column texts]
  data: DataType[][],
  orderBy: string,
  orders: {
    rows: { [orderBy: string]: number[], },
    columns: { [orderBy: string]: number[], },
  },
  rows: HeadingType[],

  //optional props
  colorFunction: (value: number) => string,
  defaultHighlight: boolean,
  font: string, //optional string to do text pixel size calculations, defaults to "16px Arial"
  formatColHeading: (text:string, count:number) => [string, string],
  formatRowHeading: (text:string, count:number) => [string, string],
  getTooltipContent: (mouseoverRowIndex: number, mouseoverColIndex: number) => React.ReactNode,
  gridLinesColor: string, //optional string for the color of the grid lines
  height: number, //optional number of the maximum number of pixels that the content takes up before scrolling
  linesHighlightedWidth: number,
  linesNotHighlightedWidth: number,
  minRectSize: number,
  normalOpacity: string | number,
  notHighlightedOpacity: string | number,
  onClickHandler: Function,
  onMouseOutHandler: Function,
  onMouseOverHandler: Function,
  textOffset: number,
  transition: string,
}

type State = {
  clientX: number,
  clientY: number,
  width: number,
  mouseoverRowIndex: number,
  mouseoverColIndex: number,
}

export default class Matrix extends React.Component<Props, State> {
  static defaultProps = {
    colorFunction: (value: number) => "#fff",
    defaultHighlight: true,
    font: "16px Arial",
    formatColHeading: (text:string, count:number) => [text, (count>0 ? "("+count+")" : "")],
    formatRowHeading: (text:string, count:number) => [text, (count>0 ? "("+count+")" : "")],
    getTooltipContent: (mouseoverRowIndex: number, mouseoverColIndex: number) => "",
    gridLinesColor: "gray",
    height: 500,
    linesHighlightedWidth: 3,
    linesNotHighlightedWidth: 1,
    minRectSize: 20,
    normalOpacity: 1,
    notHighlightedOpacity: 0.25,
    onClickHandler: function(e:React.MouseEvent<SVGRectElement>, rowIndex:number, colIndex:number) {},
    onMouseOutHandler: function(e:React.MouseEvent<SVGRectElement>) {},
    onMouseOverHandler: function(e:React.MouseEvent<SVGRectElement>, rowIndex:number, colIndex:number) {},
    textOffset: 5,
    transition: "1s",
  }

  ctx: CanvasRenderingContext2D
  matrixRef: React.RefObject<HTMLDivElement>

  constructor(props:Props) {
    super(props);

    this.state = {
      clientX: 0,
      clientY: 0,
      
      width: 500,

      mouseoverRowIndex: -1,
      mouseoverColIndex: -1,
    };

    //@ts-ignore
    this.ctx = document.createElement('canvas').getContext("2d");
    this.matrixRef = React.createRef();
  }

  componentDidMount() {
    window.addEventListener('resize', this.resize); //add resize listener for responsiveness

    this.resize(); //initial resize
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resize);
  }


  resize = () => {
    if(this.matrixRef.current) {
      this.setState({
        width: this.matrixRef.current.clientWidth, //responsive chart width
      });
    }
  }

  mouseover = (e:React.MouseEvent<SVGRectElement>, rowIndex:number, colIndex:number) => {
    this.setState({
      mouseoverRowIndex: rowIndex,
      mouseoverColIndex: colIndex
    });

    this.props.onMouseOverHandler(e, rowIndex, colIndex);
  }

  mousemove = (e: React.MouseEvent<HTMLDivElement>) => this.setState({
    clientX: e.clientX,
    clientY: e.clientY,
  })

  mouseout = (e:React.MouseEvent<HTMLDivElement>) => {
    this.setState({
      mouseoverRowIndex: -1,
      mouseoverColIndex: -1
    });

    this.props.onMouseOutHandler(e);
  }

  getTooltip = () => {
    const {
      getTooltipContent
    } = this.props

    const {
      clientX,
      clientY,
      mouseoverColIndex,
      mouseoverRowIndex,
    } = this.state

    if(mouseoverColIndex>=0 && mouseoverRowIndex>=0) {
      return (
        <div className={"matrixTooltip tooltip bs-tooltip-top"} style={{
          top: clientY,
          left: clientX,
        }}>
          <div className="arrow"></div>
          <div className="tooltip-inner">
            {getTooltipContent(mouseoverRowIndex, mouseoverColIndex)}
          </div>
        </div>
      )
    }
  }


  render() {
    const {
      data,
      rows,
      columns,
      orders,
      orderBy,
      colorFunction,

      height,
      font,
      formatColHeading,
      formatRowHeading,
      gridLinesColor,
      linesHighlightedWidth,
      linesNotHighlightedWidth,
      minRectSize,
      normalOpacity,
      notHighlightedOpacity,
      onClickHandler,
      //onMouseOutHandler not used here
      //onMouseOverHandler not used here
      textOffset,
      transition,
    } = this.props

    this.ctx.font = font;

    //get text label lengths
    const horizontalTextSize = getTextSize(this.ctx, rows, formatRowHeading, textOffset);
    const verticalTextSize = getTextSize(this.ctx, columns, formatColHeading, textOffset);

    const minHeight = verticalTextSize + rows.length*minRectSize;
    const effectiveHeight = Math.max(minHeight, height);
    const gridHeight = effectiveHeight - verticalTextSize - 10;
    const tooTall = minHeight > height
    const minWidth = horizontalTextSize + columns.length*minRectSize + (tooTall?SCROLLBAR_SIZE:0);
    const effectiveWidth = Math.max(minWidth, this.state.width);
    const gridWidth = effectiveWidth - horizontalTextSize - (tooTall?SCROLLBAR_SIZE:0);


    //in svg, y is rows and x is columns
    //@ts-ignore
    const x = scaleBand().range([0, gridWidth]).domain(orders.columns[orderBy]);
    //@ts-ignore
    const y = scaleBand().range([0, gridHeight]).domain(orders.rows[orderBy]);

    const rectWidth = x.bandwidth();
    const rectHeight = y.bandwidth();


    return (
      <div className="matrix" ref={this.matrixRef} onMouseMove={this.mousemove} onMouseLeave={this.mouseout} style={{font: this.props.font}}>
        <svg width={effectiveWidth} height={verticalTextSize}>
          <g transform={`translate(${horizontalTextSize}, ${verticalTextSize})`}>
            {columns.map((d, i) =>
              <ColHeading key={i}
                data={d}
                defaultHighlight={this.props.defaultHighlight}
                formatColHeading={formatColHeading}
                index={i}
                normalOpacity={normalOpacity}
                notHighlightedOpacity={notHighlightedOpacity}
                rectWidth={rectWidth}
                textOffset={textOffset}
                transition={transition}
                verticalTextSize={verticalTextSize}
                xScale={x}

                mouseover={this.mouseover}
                mouseoverColIndex={this.state.mouseoverColIndex}
                mouseoverRowIndex={this.state.mouseoverRowIndex}
                onClickHandler={onClickHandler}
              />
            )}
          </g>
        </svg>

        <div style={height<effectiveHeight ? {"maxHeight":height,"overflowY":"auto","width":effectiveWidth} : {}}>
          <svg width={effectiveWidth - (tooTall?SCROLLBAR_SIZE:0)} height={gridHeight}>
            <g transform={`translate(${horizontalTextSize})`}>
              {data.map((d, i) =>
                <Row
                  key={i}

                  data={d}
                  chartWidth={gridWidth}
                  colorFunction={colorFunction}
                  columns={columns}
                  defaultHighlight={this.props.defaultHighlight}
                  formatRowHeading={formatRowHeading}
                  gridLinesColor={gridLinesColor}
                  heading={rows[i]}
                  horizontalTextSize={horizontalTextSize}
                  index={i}
                  linesHighlightedWidth={linesHighlightedWidth}
                  linesNotHighlightedWidth={linesNotHighlightedWidth}
                  normalOpacity={normalOpacity}
                  notHighlightedOpacity={notHighlightedOpacity}
                  rectHeight={rectHeight}
                  rectWidth={rectWidth}
                  textOffset={textOffset}
                  transition={transition}
                  xScale={x}
                  yScale={y}


                  mouseover={this.mouseover}
                  mouseoverColIndex={this.state.mouseoverColIndex}
                  mouseoverRowIndex={this.state.mouseoverRowIndex}
                  onClickHandler={onClickHandler}
                />
              )}

              {this.props.columns.map((d, i) =>
                <ColGrid key={i}
                  chartHeight={gridHeight}
                  index={i}
                  gridLinesColor={gridLinesColor}
                  linesHighlightedWidth={linesHighlightedWidth}
                  linesNotHighlightedWidth={linesNotHighlightedWidth}
                  rectWidth={rectWidth}
                  xScale={x}

                  mouseoverColIndex={this.state.mouseoverColIndex}
                />
              )}
            </g>
          </svg>

          {this.getTooltip()}
        </div>
      </div>
    );
  }
}



const Row = (props: {
  data: DataType[],
  chartWidth: number,
  colorFunction:Function,
  columns: HeadingType[],
  defaultHighlight: boolean,
  formatRowHeading: Function,
  gridLinesColor: string,
  heading: HeadingType,
  horizontalTextSize: number,
  index: number,
  linesHighlightedWidth: number,
  linesNotHighlightedWidth: number,
  normalOpacity: string | number,
  notHighlightedOpacity: string | number,
  rectHeight: number,
  rectWidth: number,
  textOffset: number,
  transition: string,
  xScale:Function,
  yScale:Function,

  mouseover: Function,
  mouseoverColIndex: number,
  mouseoverRowIndex: number,
  onClickHandler: Function,
}) => {
  const {
    data,
    chartWidth,
    colorFunction,
    // columns,
    defaultHighlight,
    formatRowHeading,
    gridLinesColor,
    heading,
    // horizontalTextSize,
    index,
    linesHighlightedWidth,
    linesNotHighlightedWidth,
    normalOpacity,
    notHighlightedOpacity,
    rectHeight,
    rectWidth,
    textOffset,
    transition,
    xScale,
    yScale,

    mouseover,
    mouseoverColIndex,
    mouseoverRowIndex,
    onClickHandler,
  } = props

  const formattedHeading = formatRowHeading(heading.name, heading.count)
  const fullName = heading.name + " " + formattedHeading[1]
  const rowIsFullOpacity = index===mouseoverRowIndex || (mouseoverRowIndex===-1&&mouseoverColIndex===-1&&defaultHighlight)
  const rowIsHightlighted = index===mouseoverRowIndex

  return (
    <g
      style={{
        transform: "translateY(" + yScale(index) + "px)",
        transition: transition,
        transitionProperty: "transform",
      }}
    >
      {data.map((d, i) => {
        const x = xScale(d.c)

        return (
          <g key={i}>
            <rect
              fill={d.fill || colorFunction(d.z)}
              x={x}
              y={0}
              width={rectWidth}
              height={rectHeight}

              onMouseOver={e => mouseover(e, index, i)}
              onClick={e => onClickHandler(e, index, i)}

              style={{
                opacity:(rowIsFullOpacity || i===mouseoverColIndex) ? normalOpacity : notHighlightedOpacity,
                transition: transition,
                transitionProperty: "x",
              }}
            >
              {/* <title>{heading.name + ", " + columns[i].name + ": " + d.z}</title> */}
            </rect>

            <text textAnchor="middle" x={x + rectWidth/2} y={rectHeight / 2} dy="0.5em">{d.z} </text>
          </g>
        )
      })}


      <line x2={chartWidth} stroke={gridLinesColor} strokeWidth={rowIsHightlighted ? linesHighlightedWidth :linesNotHighlightedWidth}></line>
      <line x2={chartWidth} y1={rectHeight} y2={rectHeight} stroke={gridLinesColor} strokeWidth={rowIsHightlighted ? linesHighlightedWidth : linesNotHighlightedWidth}></line>

      <g
        onMouseOver={e => mouseover(e, index, -1)}
        onClick={e => onClickHandler(e, index, -1)}
        opacity={rowIsFullOpacity ? normalOpacity : notHighlightedOpacity}
        transform={"translate(-"+(textOffset)+","+(rectHeight/2)+")"}
      >
        <text
          className="heading"
          x={-5}
          y={0}
          dy="0.35em"
          textAnchor="end"

          style={{
            fontWeight: (index===mouseoverRowIndex) ? "bold" : "normal",
          }}
        >
          <title>{fullName}</title>
          {formattedHeading[0]}
        </text>

        <text
          className="heading"
          x={0}
          y={0}
          dy="0.35em"
          textAnchor="end"
        >
          <title>{fullName}</title>
          {formattedHeading[1]}
        </text>
      </g>
    </g>
  );
}

const ColGrid = (props:{
  chartHeight: number,
  gridLinesColor: string,
  index: number,
  linesHighlightedWidth: number,
  linesNotHighlightedWidth: number,
  mouseoverColIndex: number,
  rectWidth: number,
  xScale: Function,
}) => {
  const {
    chartHeight,
    gridLinesColor,
    index,
    linesHighlightedWidth,
    linesNotHighlightedWidth,
    mouseoverColIndex,
    rectWidth,
    xScale,
  } = props

  const colIsHighlighted = index === mouseoverColIndex

  return (
    <g transform={"translate(" + xScale(index) + ") rotate(-90)"}>
      <line x1={-1*chartHeight} stroke={gridLinesColor} strokeWidth={colIsHighlighted ? linesHighlightedWidth : linesNotHighlightedWidth}></line>
      <line x1={-1*chartHeight} y1={rectWidth} y2={rectWidth} stroke={gridLinesColor} strokeWidth={colIsHighlighted ? linesHighlightedWidth : linesNotHighlightedWidth}></line>
    </g>
  );
}

const ColHeading = (props: {
  data: HeadingType,
  defaultHighlight: boolean,
  formatColHeading: Function,
  index: number,
  mouseover: Function,
  mouseoverColIndex: number,
  mouseoverRowIndex: number,
  normalOpacity: string | number,
  notHighlightedOpacity: string | number,
  onClickHandler: Function,
  rectWidth: number,
  textOffset: number,
  transition: string,
  verticalTextSize: number,
  xScale: Function,
}) => {
  const {
    data,
    defaultHighlight,
    formatColHeading,
    index,
    mouseover,
    mouseoverColIndex,
    mouseoverRowIndex,
    normalOpacity,
    notHighlightedOpacity,
    onClickHandler,
    rectWidth,
    textOffset,
    transition,
    verticalTextSize,
    xScale,
  } = props

  const formattedHeading = formatColHeading(data.name, data.count)
  const fullName = data.name + " " + formattedHeading[1]
  return (
    <g
      onMouseOver={e => mouseover(e, -1, index)}
      onClick={e => onClickHandler(e, -1, index)}

      style={{
        opacity: (index===mouseoverColIndex || (mouseoverRowIndex===-1&&mouseoverColIndex===-1&&defaultHighlight)) ? normalOpacity : notHighlightedOpacity,
        fontWeight: (index===mouseoverColIndex) ? "bold" : "normal",
        transform: "translateX(" + xScale(index) + "px) rotate(-90deg)",
        transition,
        transitionProperty: "transform",
      }}
    >
      <text className="heading" x={textOffset} y={rectWidth/2} dy="0.32em" textAnchor="start">
        <title>{fullName}</title>
        {formattedHeading[0]}
      </text>

      <text className="heading" x={textOffset + verticalTextSize - 10} y={rectWidth/2} dy="0.32em" textAnchor="end">
        <title>{fullName}</title>
        {formattedHeading[1]}
      </text>
    </g>
  );
}


//given a canvas context and some text, return the longest length in pixels
function getTextSize(ctx: CanvasRenderingContext2D, headings:HeadingType[], formatText:Function, textOffset: number) {
  let longestLength = 0;
  for(let i=0; i<headings.length; ++i) {
    const length = ctx.measureText(formatText(headings[i].name, headings[i].count).join("  ")).width;
    if(length > longestLength) {
      longestLength = length;
    }
  }

  return longestLength + textOffset;
}
