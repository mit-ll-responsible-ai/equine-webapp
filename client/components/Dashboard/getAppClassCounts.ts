// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import { AppClassType } from "@/redux/inferenceSettings"

export type LabelCounter = {[label:string]: number}

/**
 * Given an array of samples, return the labels encountered and the appClassCounts object
 * @param samples array of samples
 * @returns       {
 *   appClassCounts: { C1: 4, C2: 5, ... },
 *   labels: ["C1", "C2", ...]
 * }
 */
export default function getAppClassCounts(processedAppClasses:AppClassType[]) {
  const appClassCounts:LabelCounter = {} //initialize an empty counter

  processedAppClasses.forEach((tresholds:AppClassType) => { //for each sample
    for(const label in tresholds) { //for each label in this sample
      initLabelInCounter(label, appClassCounts) //initialize the count if necessary

      //if we are confident about this label
      if(tresholds[label] === 1) {
        appClassCounts[label]++ //increment this label count
      }
    }
  })

  const labels:string[] = Object.keys(appClassCounts) //get the labels as an array of strings

  return {
    appClassCounts,
    labels,
  }
}

function initLabelInCounter(label:string, counter: LabelCounter) {
  if(counter[label] === undefined) { //if we have not encountered this label yet
    counter[label] = 0 //initialize the count to 0
  }
}