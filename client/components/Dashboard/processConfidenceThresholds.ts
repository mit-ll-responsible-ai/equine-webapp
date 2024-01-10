// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import type { AppClassType, SampleType } from "@/redux/inferenceSettings"
import { SAMPLE_CONDITIONS } from "@/utils/determineSampleCondition"

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
 * If a sample does not meet the OOD threshold, set all its values to 0 and set SAMPLE_CONDITIONS.OOD to 1.
 * Set a samples class labels to 1 or 0 depending on the class confidence threshold.
 * If all the labels become 0, set SAMPLE_CONDITIONS.CLASS_CONFUSION to 1.
 * @param app_class                 app class of the unprocessed sample
 * @param classConfidenceThreshold  0 - 100 value set by the user
 * @param inDistributionThreshold   0 - 100 value set by the user
 */
export function setProcessedAppClass(
  sample:SampleType, 
  classConfidenceThreshold:number,
  inDistributionThreshold: number,
) {
  const app_class = sample.app_class
  const processed_app_class:AppClassType = {}

  const isOOD = (
    (( sample.ood   ) >= inDistributionThreshold/100) //meets threshold
    && (inDistributionThreshold < 100) //if the threshold is 100, consider all samples to be OOD
  )

  processed_app_class[SAMPLE_CONDITIONS.OOD] = isOOD ? 1 : 0
  if(isOOD) { //if this sample is out of distribution
    for(const label in app_class) { //loop through the classes
      processed_app_class[label] = 0 //set the value to 0
    }
  }
  else { //this sample is considered in distribution
    //now we need to determine which classes this sample qualifies for
    //or if it belonds in the class confusion use case
    let isClassConfusion = true //initially assume we are in the class confusion use case
    for(const label in app_class) { //loop through the classes
      //if the value is greater than the confidence, it is effectively 1, else 0
      const meetsClassConfidenceThreshold = (
        (app_class[label] >= classConfidenceThreshold/100)
        && (classConfidenceThreshold < 100) //if the threshold is 100, consider all samples to be CLASS_CONFUSION
      )
      if(meetsClassConfidenceThreshold) { //if the probability meeds the threshold
        processed_app_class[label] = 1
        isClassConfusion = false //we are not in the class confusion use case
      }
      else { //the probability is not high enough
        processed_app_class[label] = 0
      }
    }
    
    processed_app_class[SAMPLE_CONDITIONS.CLASS_CONFUSION] = isClassConfusion ? 1 : 0
  }

  return processed_app_class
}