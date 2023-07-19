// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT

import React from "react"
import memoize from "memoize-one"
import { scaleLinear, ScaleLinear } from "d3-scale"
import { withResponsiveWidth } from "Components/ResponsiveWidth/ResponsiveWidth"
import clampValue from "utils/clampValue"
import getRelativePositionFromEvent from "utils/getRelativePositionFromEvent"
import "./doubleSlider.scss"

type Props = {
  changeValues: (leftValue:number|undefined, rightValue: number|undefined) => any,
  leftValue: number,
  max: number,
  min: number,
  minValueDifference: number, //the minimum difference between the left and right values
  rightValue: number,
  width: number
}

class DoubleSlider extends React.Component<Props, {}> {
  containerRef: React.RefObject<HTMLDivElement> = React.createRef()
  mouseDownBar: number | null = null //this number value is necessary for tracking changes in movement of the bar
  mouseDownLeftSlider: number | null = null //this number value is not strictly needed, it could be a boolean instead
  mouseDownRightSlider: number | null = null //this number value is not strictly needed, it could be a boolean instead

  //given the event and scale, return the value from the x position (ie invert the scale)
  getValueFromPosition = (e: React.MouseEvent<HTMLDivElement>, scale:ScaleLinear<number, number>) => {
    if(this.containerRef.current) {
      return scale.invert( //invert the value of the mouse clientX - left bound of the container
        getRelativePositionFromEvent(e, this.containerRef.current).x
      )
    }

    return 0
  }

  onMouseMove = (e: React.MouseEvent<HTMLDivElement>, scale:ScaleLinear<number, number>) => {
    const {
      changeValues,
      leftValue,
      max,
      min,
      minValueDifference,
      rightValue,
    } = this.props

    const value = this.getValueFromPosition(e, scale)


    if(this.mouseDownBar !== null) { //if we are moving the bar
      const barValueSize = rightValue-leftValue //maintain the size of the bar
      const dValue = value - this.mouseDownBar //get the change in position of the bar
      changeValues( //restrict the values by the min and max bounds but also to maintain the bar size
        clampValue(leftValue+dValue, [min], [rightValue, max - barValueSize]),
        clampValue(rightValue+dValue, [leftValue, min + barValueSize], [max])
      )
      this.mouseDownBar = value //record this value in case the user moves the bar again
    }
    else if(this.mouseDownLeftSlider !== null) { //if we are moving the left slider
      changeValues(
        clampValue(value, [min], [max,rightValue-minValueDifference]), //update the left slider value
        undefined //don't have to update the right slider
      )
    }
    else if(this.mouseDownRightSlider !== null) { //else if we are moving the right slider
      changeValues(
        undefined, //don't have to update the left slider
        clampValue(value, [min,leftValue+minValueDifference], [max]) //update the right slider value
      )
    }
  }

  resetMouseTrackers = () => {
    this.mouseDownBar = null
    this.mouseDownLeftSlider = null
    this.mouseDownRightSlider = null
  }


  getScale = memoize(
    (min:number, max:number, width:number) => scaleLinear().domain([min, max]).range([0, width])
  )

  render() {
    const scale = this.getScale(this.props.min, this.props.max, this.props.width)

    const leftPosition = scale(this.props.leftValue)
    const rightPosition = scale(this.props.rightValue)

    return (
      <div
        className="doubleSlider"
        onMouseMove={e => this.onMouseMove(e, scale)}
        onMouseUp={e => this.resetMouseTrackers()}
        // onMouseOut={e => this.resetMouseTrackers()}
        onMouseLeave={e => this.resetMouseTrackers()}
        ref={this.containerRef}
      >
        <div className="rail"></div>
        <div className="bar" style={{left: leftPosition, right: this.props.width-rightPosition}} onMouseDown={e => this.mouseDownBar=this.getValueFromPosition(e,scale)}></div>
        <div className="slider" style={{left: leftPosition}} onMouseDown={e => this.mouseDownLeftSlider=this.getValueFromPosition(e,scale)}></div>
        <div className="slider" style={{left: rightPosition}} onMouseDown={e => this.mouseDownRightSlider=this.getValueFromPosition(e,scale)}></div>
      </div>
    )
  }
}

export default withResponsiveWidth(DoubleSlider)
