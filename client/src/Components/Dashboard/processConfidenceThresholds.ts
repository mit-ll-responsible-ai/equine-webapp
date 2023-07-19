// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import type { AppClassType, SampleType } from "redux/inferenceSettings"

/**
 * given an array of samples]
 * then process the app_class based on the tresholds
 * @param samples                   array of samples from the redux
 * @param classConfidenceThreshold  0 - 100 value set by the user
 * @param inDistributionThreshold   0 - 100 value set by the user
 * @returns                         processedAppClasses values
 */
export default function processConfidenceThresholds(
  samples: SampleType[], 
  classConfidenceThreshold: number,
  inDistributionThreshold: number,
):AppClassType[] {
  //calculate the new app_class values given the new confience threshold
  return samples.map(sample => setProcessedAppClass(
    sample, 
    classConfidenceThreshold, 
    inDistributionThreshold,
  ))
}

/**
 * Given the original app class and confidence threshold, set a new procesed app class.
 * If a sample does not meet the OOD threshold, set all its values to 0 and set OTHER to 1.
 * Set a samples class labels to 1 or 0 depending on the class confidence threshold.
 * If all the labels become 0, set OTHER to 1.
 * @param app_class                 app class of the unprocessed sample
 * @param classConfidenceThreshold  0 - 100 value set by the user
 * @param inDistributionThreshold   0 - 100 value set by the user
 */
export function setProcessedAppClass(
  sample:SampleType, 
  classConfidenceThreshold:number,
  inDistributionThreshold: number,
) {
  let isOther = true //initially assume that this is an other
  const app_class = sample.app_class
  const processed_app_class:AppClassType = {}

  const isAboveOODThreshold = (
    (( sample.ood ) >= inDistributionThreshold/100) //meets threshold
    && (inDistributionThreshold < 100) //if the threshold is 100, consider all samples to be "OTHER"
  )
  //isOther = isAboveOODThreshold 
  if(!isAboveOODThreshold) { //if this sample meets the OOD threshold
    for(const label in app_class) { //loop through the classes
      //if the value is greater than the confidence, it is effectively 1, else 0
      const meetsClassConfidenceThreshold = (
        (app_class[label] >= classConfidenceThreshold/100)
        && (classConfidenceThreshold < 100) //if the threshold is 100, consider all samples to be "OTHER"
      )
      if(meetsClassConfidenceThreshold) {
        isOther = false
        processed_app_class[label] = 1
      }
      else {
        processed_app_class[label] = 0
      }
    }
  }
  else { //else this sample is too OOD, effectively set all the class labels to 0
    for(const label in app_class) { //loop through the classes
      processed_app_class[label] = 0 //set the value to 0
    }
  }


  //if none of the labels were valid, we classify this as an other
  processed_app_class.OTHER = isOther ? 1 : 0

  return processed_app_class
}