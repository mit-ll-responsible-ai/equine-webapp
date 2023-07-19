// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { scaleLinear } from "d3-scale"

import DoubleSlider from 'Components/DoubleSlider/DoubleSlider'
import { DEFAULT_WIDTH } from 'Components/ResponsiveWidth/ResponsiveWidth'

describe('<DoubleSlider/>', () => {
  it('should render a double slider', async () => {
    renderDoubleSlider()
  })

  it("doesn't call changeValues if there was no mousedown", () => {
    const {
      changeValues,
      doubleSlider,
    } = renderDoubleSlider()

    fireEvent.mouseMove(doubleSlider, {clientX: 10})

    expect(changeValues).toHaveBeenCalledTimes(0)
  })

  it("should call changeValue if the left slider was moved", () => {
    const {
      changeValues,
      doubleSlider,
      max, min,
      sliders,
    } = renderDoubleSlider()

    const leftSlider = sliders[0]
    const scale = getValueToPixelScale(min, max)
    fireEvent.mouseDown(leftSlider)

    const clientX1 = 100
    const expectedValue1 = scale.invert(clientX1)
    fireEvent.mouseMove(doubleSlider, {clientX: clientX1})
    expect(changeValues).toHaveBeenCalledTimes(1)
    expect(changeValues).toHaveBeenCalledWith(expectedValue1, undefined)

    const clientX2 = 200
    const expectedValue2 = scale.invert(clientX2)
    fireEvent.mouseMove(doubleSlider, {clientX: clientX2})
    expect(changeValues).toHaveBeenCalledTimes(2)
    expect(changeValues).toHaveBeenCalledWith(expectedValue2, undefined)
  })


  it("should limit the left value by the min and minValueDifference", () => {
    const {
      changeValues,
      doubleSlider,
      max, min,
      minValueDifference,
      sliders,
    } = renderDoubleSlider()

    const leftSlider = sliders[0]
    fireEvent.mouseDown(leftSlider)

    const tooLowClientX = -100
    fireEvent.mouseMove(doubleSlider, {clientX: tooLowClientX})
    expect(changeValues).toHaveBeenCalledTimes(1)
    expect(changeValues).toHaveBeenCalledWith(min, undefined)

    const tooHighClientX = 10000
    fireEvent.mouseMove(doubleSlider, {clientX: tooHighClientX})
    expect(changeValues).toHaveBeenCalledTimes(2)
    expect(changeValues).toHaveBeenCalledWith(max-minValueDifference, undefined)
  })

  it("should limit the left value by the right value and minValueDifference", () => {
    const {
      changeValues,
      doubleSlider,
      minValueDifference,
      rightValue,
      sliders,
    } = renderDoubleSlider(undefined,undefined,undefined,undefined,51) //right value is 51

    const leftSlider = sliders[0]
    fireEvent.mouseDown(leftSlider)

    const tooHighClientX = 10000
    fireEvent.mouseMove(doubleSlider, {clientX: tooHighClientX})
    expect(changeValues).toHaveBeenCalledTimes(1)
    expect(changeValues).toHaveBeenCalledWith(rightValue-minValueDifference, undefined)
  })




  it("should call changeValue if the right slider was moved", () => {
    const {
      changeValues,
      doubleSlider,
      max, min,
      sliders,
    } = renderDoubleSlider()

    const rightSlider = sliders[1]
    const scale = getValueToPixelScale(min, max)
    fireEvent.mouseDown(rightSlider)

    const clientX1 = 400
    const expectedValue1 = scale.invert(clientX1)
    fireEvent.mouseMove(doubleSlider, {clientX: clientX1})
    expect(changeValues).toHaveBeenCalledTimes(1)
    expect(changeValues).toHaveBeenCalledWith(undefined, expectedValue1)

    const clientX2 = 300
    const expectedValue2 = scale.invert(clientX2)
    fireEvent.mouseMove(doubleSlider, {clientX: clientX2})
    expect(changeValues).toHaveBeenCalledTimes(2)
    expect(changeValues).toHaveBeenCalledWith(undefined, expectedValue2)
  })


  it("should limit the right value by the minValueDifference and max", () => {
    const {
      changeValues,
      doubleSlider,
      max, min,
      minValueDifference,
      sliders,
    } = renderDoubleSlider()

    const rightSlider = sliders[1]
    fireEvent.mouseDown(rightSlider)

    const tooLowClientX = -100
    fireEvent.mouseMove(doubleSlider, {clientX: tooLowClientX})
    expect(changeValues).toHaveBeenCalledTimes(1)
    expect(changeValues).toHaveBeenCalledWith(undefined, min+minValueDifference)

    const tooHighClientX = 10000
    fireEvent.mouseMove(doubleSlider, {clientX: tooHighClientX})
    expect(changeValues).toHaveBeenCalledTimes(2)
    expect(changeValues).toHaveBeenCalledWith(undefined, max)
  })

  it("should limit the right value by the left value and minValueDifference", () => {
    const {
      changeValues,
      doubleSlider,
      leftValue,
      minValueDifference,
      sliders,
    } = renderDoubleSlider(27) //left value is 27

    const rightSlider = sliders[1]
    fireEvent.mouseDown(rightSlider)

    const tooLowClientX = -1000
    fireEvent.mouseMove(doubleSlider, {clientX: tooLowClientX})
    expect(changeValues).toHaveBeenCalledTimes(1)
    expect(changeValues).toHaveBeenCalledWith(undefined, leftValue+minValueDifference)
  })



  it("should not move the bar if there was no mouse down", () => {
    const {
      bar,
      changeValues,
      doubleSlider,
    } = renderDoubleSlider()

    fireEvent.mouseMove(bar, {clientX: 30})
    expect(changeValues).toHaveBeenCalledTimes(0)
  })

  it("should move the bar left", () => {
    const initialLeftValue = 20
    const initialRightValue = 70
    const {
      bar,
      changeValues,
      doubleSlider,
      rightValue,
      max,min,
      sliders,
    } = renderDoubleSlider(initialLeftValue,undefined,undefined,undefined,initialRightValue)

    const scale = getValueToPixelScale(min, max)
    let clientX = 100
    fireEvent.mouseDown(bar, {clientX})

    clientX = 80
    const difference = scale.invert(100 - clientX)
    fireEvent.mouseMove(doubleSlider, {clientX})
    expect(changeValues).toHaveBeenCalledTimes(1)
    expect(changeValues).toHaveBeenCalledWith(initialLeftValue-difference, initialRightValue-difference)
  })

  it("should move the bar right", () => {
    const initialLeftValue = 20
    const initialRightValue = 70
    const {
      bar,
      changeValues,
      doubleSlider,
      rightValue,
      max,min,
      sliders,
    } = renderDoubleSlider(initialLeftValue,undefined,undefined,undefined,initialRightValue)

    const scale = getValueToPixelScale(min, max)
    let clientX = 100
    fireEvent.mouseDown(bar, {clientX})

    clientX = 125
    let difference = scale.invert(clientX - 100)
    fireEvent.mouseMove(doubleSlider, {clientX})
    expect(changeValues).toHaveBeenCalledTimes(1)
    expect(changeValues).toHaveBeenCalledWith(initialLeftValue+difference, initialRightValue+difference)
  })

  it("should not move the bar if is bounded on both sides", () => {
    const {
      bar,
      changeValues,
      doubleSlider,
      max,min,
      sliders,
    } = renderDoubleSlider()

    fireEvent.mouseDown(bar, {clientX: 50})

    fireEvent.mouseMove(doubleSlider, {clientX: 60})
    expect(changeValues).toHaveBeenCalledTimes(1)
    expect(changeValues).toHaveBeenCalledWith(min, max)

    fireEvent.mouseMove(doubleSlider, {clientX: 40})
    expect(changeValues).toHaveBeenCalledTimes(2)
    expect(changeValues).toHaveBeenCalledWith(min, max)
  })


  it("should not move the bar if is right bounded", () => {
    const initialLeftValue = 36
    const {
      bar,
      changeValues,
      doubleSlider,
      leftValue,
      max,min,
      sliders,
    } = renderDoubleSlider(initialLeftValue) //left value is 36

    const scale = getValueToPixelScale(min, max)
    let clientX = 100
    fireEvent.mouseDown(bar, {clientX})

    clientX = 120
    fireEvent.mouseMove(doubleSlider, {clientX})
    expect(changeValues).toHaveBeenCalledTimes(1)
    expect(changeValues).toHaveBeenCalledWith(leftValue, max)

    let newLeftValue = 30
    let difference = initialLeftValue - newLeftValue
    clientX -= scale(difference)
    fireEvent.mouseMove(doubleSlider, {clientX})
    expect(changeValues).toHaveBeenCalledTimes(2)
    expect(changeValues).toHaveBeenCalledWith(newLeftValue, max-difference)
  })


  it("should not move the bar if is left bounded", () => {
    const initialRightValue = 70
    const {
      bar,
      changeValues,
      doubleSlider,
      rightValue,
      max,min,
      sliders,
    } = renderDoubleSlider(undefined,undefined,undefined,undefined,initialRightValue) //right value is 70

    const scale = getValueToPixelScale(min, max)
    let clientX = 100
    fireEvent.mouseDown(bar, {clientX})

    clientX = 80
    fireEvent.mouseMove(doubleSlider, {clientX})
    expect(changeValues).toHaveBeenCalledTimes(1)
    expect(changeValues).toHaveBeenCalledWith(min, rightValue)

    let newRightValue = 85
    let difference = newRightValue - initialRightValue
    clientX += scale(difference)
    fireEvent.mouseMove(doubleSlider, {clientX})
    expect(changeValues).toHaveBeenCalledTimes(2)
    expect(changeValues).toHaveBeenCalledWith(min + difference, newRightValue)
  })
})


function renderDoubleSlider(
  leftValue:number=0,
  max:number=100,
  min:number=0,
  minValueDifference: number = 1,
  rightValue:number=100,
) {
  const changeValues = jest.fn()

  const utils = render(
    <DoubleSlider
      changeValues={changeValues}
      leftValue={leftValue}
      max={max}
      min={min}
      minValueDifference={minValueDifference}
      rightValue={rightValue}
    />
  )


  const doubleSliders = utils.container.querySelectorAll('.doubleSlider')
  expect(doubleSliders.length).toEqual(1)
  const doubleSlider = doubleSliders[0]

  expect(utils.container.querySelectorAll('.rail').length).toEqual(1)

  const bars = utils.container.querySelectorAll('.bar')
  expect(bars.length).toEqual(1)
  const bar = bars[0]

  const sliders = utils.container.querySelectorAll('.slider')
  expect(sliders.length).toEqual(2)

  return {
    bar,
    changeValues,
    doubleSlider,
    leftValue,
    max,
    min,
    minValueDifference,
    rightValue,
    utils,
    sliders,
  }
}

function getValueToPixelScale(min:number, max:number) {
  return scaleLinear().domain([min, max]).range([0, DEFAULT_WIDTH])
}
