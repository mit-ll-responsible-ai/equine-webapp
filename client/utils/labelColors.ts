// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import { scalePow } from 'd3'

import getLocalStorageItem from '@/utils/localStorage/getLocalStorageItem'
import toHex from '@/utils/toHex'
import { COLORS, COLOR_BLIND_COLORS } from './colors'
import { SAMPLE_CONDITIONS } from './determineSampleCondition'

export const DEFAULT_OOD_COLOR_INTERVALS = 5
export const DEFAULT_CONFIDENCE_FLOOR = 0.8
export const DEFAULT_OOD_COLOR_THRESHOLDS = [0.0, DEFAULT_CONFIDENCE_FLOOR, 0.9, 0.95, 0.99]
export const DEFAULT_OOD_COLOR_MODE = getLocalStorageItem("oodColorMode", true)

export const labels: string[] = []


//basic key-value object to map a label to a color
export type MapLabelToColorType = {[label:string]:(oodValue: number) => string}

//manually picked out colors from https://github.com/ankane/chartkick.js/blob/master/src/adapters/chartjs.js
export const colors = [
  COLORS.BLUE,
  COLORS.RED,
  COLORS.ORANGE,
  COLORS.GREEN,
  COLORS.PURPLE,
]

export const mapLabelToColor:MapLabelToColorType = createLabelColorsMap(labels, colors)



//Palette 1 from https://medium.com/cafe-pixo/inclusive-color-palettes-for-the-web-bbfe8cf2410e
export const colorBlindColors = [
  COLOR_BLIND_COLORS.BLUE,
  COLOR_BLIND_COLORS.RED,
  COLOR_BLIND_COLORS.ORANGE,
  COLOR_BLIND_COLORS.GREEN,
  COLOR_BLIND_COLORS.PURPLE,
]

export const mapLabelToColorBlindColor:MapLabelToColorType = createLabelColorsMap(labels, colorBlindColors)


/**
 * Creates or modifies a key-value object that maps labels to color functions
 * @param labels        array of labels, ex [ "C1", "C2", ... ]
 * @param colors        array of available colors, ex [ "red", "#123456", ... ]
 * @param oodColorMode  whether we are enabling or disabling ood threshold color mode, optional
 * @param map           object that maps labels to functions that return a color given an ood value, optional
 * @returns 
 */
export function createLabelColorsMap(
  labels: string[],
  colors: string[],
  oodColorMode: boolean = DEFAULT_OOD_COLOR_MODE,
  map: MapLabelToColorType = {},
):MapLabelToColorType {
  const processedLabels = labels.filter(label => {
    if(label.toUpperCase() === SAMPLE_CONDITIONS.OOD) {
      console.warn(`'${SAMPLE_CONDITIONS.OOD}' is a reserved label and will be skipped`)
      return false
    }
    else if(label.toUpperCase() === SAMPLE_CONDITIONS.CLASS_CONFUSION) {
      console.warn(`'${SAMPLE_CONDITIONS.CLASS_CONFUSION}' is a reserved label and will be skipped`)
      return false
    }
    return true
  })

  //input validation
  if(processedLabels.length === 0) console.warn("No valid labels.")
  if(colors.length === 0) console.warn("No valid colors. All labels will be #999999")
  if(colors.length === 1) console.warn(`Only one color provided. All labels will have the same color ${colors[0]}`)

  //reset the map
  Object.keys(map).forEach(label => {
    delete map[label] //delete all the labels
  })

  //give each label a color
  processedLabels.forEach((label, i) => {
    //if there are too many labels, modulo the index to reuse colors
    //uppercase all labels
    //default to #999999
    const color = colors[i % colors.length] || "#999999"
    const upperCaseLabel = label.toUpperCase()

    if(oodColorMode) { //if we are in ood color mode
      //set a function to interpolate between the color and white
      // const interp = interpolateLab(color, "white")
      // const ood_thresholds =  Array.from(Array(oodColorIntervals).keys()).map(n => n/oodColorIntervals).concat(1)
      // const range = ood_thresholds.map(t => interp(t))
      // console.log(ood_thresholds, range)
      //@ts-ignore
      //const scale = scaleLinear().domain([0, 1]).range([color, "white"]) as (n: number) => string
      const scale = scalePow().exponent(3).domain([0, 1]).range([color, "white"]) as (n: number) => string
      map[upperCaseLabel] = (threshold: number) => toHex(scale(threshold)) //  1-threshold for inverse
    }
    else {
      map[upperCaseLabel] = () => toHex(color) //else set a function that simply returns the color
    }
  })

  map[SAMPLE_CONDITIONS.CLASS_CONFUSION] = () => "#999999"
  map[SAMPLE_CONDITIONS.OOD] = () => "#999999"

  return map
}

/**
 * Given the desired colors, oodColorMode, and current label-to-color map,
 * returns the getColorFromLabel function
 * @param colors        array of available colors to use. New labels will wrap around to the start
 * @param oodColorMode  whether we are coloring by ood thresholds
 * @param map           the current label-to-color map
 * @returns             getColorFromLabel function
 */
export function buildGetColorFromLabelFunction(
  colors: string[],
  oodColorMode: boolean,
  map: MapLabelToColorType,
) {
  //recreate the map in case anything (ie oodColorMode) changed
  createLabelColorsMap(labels, colors, oodColorMode, map)

  /**
   * Given a label and optional ood value, return the appropriate color
   * If the label is new, recalculate the color map to add the new label
   * @param label    ie "C1", "C2", etc
   * @param oodValue optional, defaults to 0 
   * @returns        color string
   */
  return function getColorFromLabel(label: string, oodValue: number = 0) {
    if(oodValue < 0 || oodValue > 1) {
      console.warn(`Expected ood value between 0 and 1. Received ${oodValue}`)
    }

    const upperCaseLabel = label.toUpperCase()

    //try to get the value for this label
    let value = map[upperCaseLabel]

    //if we have not seen this label yet
    if(typeof value !== "function") {
      labels.push(label) //add the new label
      createLabelColorsMap(labels, colors, oodColorMode, map) //recreate the map to include this new label

      value = map[upperCaseLabel] //now get the value for this label
      if(typeof value !== "function") {
        console.warn(`Value is unexpectedly falsey again. Defaulting to #999999`)
        return "#999999"
      }
    }

    return value(oodValue)
  }
}