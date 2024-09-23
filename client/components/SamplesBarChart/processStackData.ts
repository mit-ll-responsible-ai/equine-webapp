// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT

import type { ClassProbabilitiesType, SampleType } from "@/redux/inferenceSettings"

type StackDataType = {
  name: string,
  data: [string, number][],
}[]

const processStackData = (
  oodThresholds: number[],
  processedClassesProbabilities: ClassProbabilitiesType[],
  samples: SampleType[],
):StackDataType => {
  if(
    oodThresholds.length === 0 
    && samples.length > 0
  ) {
    throw new Error("OodThresholds must have some elements if there are samples")
  }

  if(processedClassesProbabilities.length !== samples.length) {
    throw new Error(`The lengths of processedClassesProbabilities (${processedClassesProbabilities.length}) and samples (${samples.length}) should match.`)
  }

  //temporarily use a data structure where the field "data" is a key object pair
  //later we convert it into an array for Chartkick
  const tmpStackData:{
    name: string,
    data: {[label:string]: number}
  }[] = oodThresholds.map((t,i) => { //for each threshold
    const nextValue = oodThresholds[i + 1] || 1

    let name_text = `These samples are within ${OodPercent(t)} - ${OodPercent(nextValue)}% of the bounds of the training data`
    if (i === 0) {
      name_text = `These samples are similar to up to ${OodPercent(nextValue)}% of the training data`
    }
    else if ( i === oodThresholds.length -1 ){
      name_text = `These samples are more extreme than ${OodPercent(t)}% of the training data`
    }

    return {
      name: name_text,
      data: {}, //initialize an empty object
    }
  })

  samples.forEach((s,sIdx) => { //for each sample
    //get the index of the oodThreshold given the sample's ood value
    //force the index to be valid, in case ood is 1
    //const oodIndex = Math.min(Math.floor((s.ood || 0) * oodThresholds.length), oodThresholds.length-1)
    let oodIndex = oodThresholds.findIndex( threshold => threshold > s.ood )
    oodIndex = (oodIndex === -1 ) ? oodThresholds.length-1 : oodIndex - 1

    const processedClassProbabilities = processedClassesProbabilities[sIdx]
    Object.entries(processedClassProbabilities).forEach(([label, value]) => { //for processed class probabilities
      if(tmpStackData[oodIndex].data[label] === undefined) { //if we have not seen this oodIndex and label pair
        tmpStackData[oodIndex].data[label] = 0 //initialize it to zero
      }
      tmpStackData[oodIndex].data[label] += value //sum the values for this oodIndex and label pair
    })
  })

  //convert the tmp data into a format for Chartkick
  return tmpStackData.map(d => ({
    name: d.name,
    data: Object.entries(d.data) //convert the key-value object into an array of entries
  }))
}

export default processStackData

/**
 * Given an OOD value, make it a percent
 * @param oodValue  out of distribution value
 * @returns         OOD value as a percent
 */
function OodPercent(oodValue: number) {
  return Math.round(oodValue * 100)
}
