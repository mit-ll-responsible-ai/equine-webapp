// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import { ClassProbabilitiesType } from "@/redux/inferenceSettings"

export type LabelCounter = {[label:string]: number}

/**
 * Given an array of samples, return the labels encountered and the classCounts object
 * @param samples array of samples
 * @returns       {
 *   classCounts: { C1: 4, C2: 5, ... },
 *   labels: ["C1", "C2", ...]
 * }
 */
export default function getClassCounts(processedClassesProbabilities:ClassProbabilitiesType[]) {
  const classCounts:LabelCounter = {} //initialize an empty counter

  processedClassesProbabilities.forEach((thresholds:ClassProbabilitiesType) => { //for each sample
    for(const label in thresholds) { //for each label in this sample
      initLabelInCounter(label, classCounts) //initialize the count if necessary

      //if we are confident about this label
      if(thresholds[label] === 1) {
        classCounts[label]++ //increment this label count
      }
    }
  })

  const labels:string[] = Object.keys(classCounts) //get the labels as an array of strings

  return {
    classCounts,
    labels,
  }
}

function initLabelInCounter(label:string, counter: LabelCounter) {
  if(counter[label] === undefined) { //if we have not encountered this label yet
    counter[label] = 0 //initialize the count to 0
  }
}