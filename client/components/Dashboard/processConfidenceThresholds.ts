// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import type { ClassProbabilitiesType, SampleType } from "@/redux/inferenceSettings"
import { SAMPLE_CONDITIONS } from "@/utils/determineSampleCondition"

/**
 * given an array of samples]
 * then process the classProbabilities based on the thresholds
 * @param samples                   array of samples from the redux
 * @param classConfidenceThreshold  0 - 100 value set by the user
 * @param inDistributionThreshold   0 - 100 value set by the user
 * @returns                         processedClassesProbabilities values
 */
export default function processConfidenceThresholds(
  samples: SampleType[], 
  classConfidenceThreshold: number,
  inDistributionThreshold: number,
):ClassProbabilitiesType[] {
  //calculate the new classProbabilities values given the new confience threshold
  return samples.map(sample => getProcessedClassProbabilities(
    sample, 
    classConfidenceThreshold, 
    inDistributionThreshold,
  ))
}

/**
 * Given the original class probabilities and confidence threshold, set a new processed class probabilities.
 * If a sample does not meet the OOD threshold, set all its values to 0 and set SAMPLE_CONDITIONS.OOD to 1.
 * Set a samples class labels to 1 or 0 depending on the class confidence threshold.
 * If all the labels become 0, set SAMPLE_CONDITIONS.CLASS_CONFUSION to 1.
 * @param classProbabilities        class probabilities for the unprocessed sample
 * @param classConfidenceThreshold  0 - 100 value set by the user
 * @param inDistributionThreshold   0 - 100 value set by the user
 */
export function getProcessedClassProbabilities(
  sample:SampleType, 
  classConfidenceThreshold:number,
  inDistributionThreshold: number,
) {
  const classProbabilities = sample.classProbabilities
  const processedClassProbabilities:ClassProbabilitiesType = {}

  const isOOD = (
    (( sample.ood   ) >= inDistributionThreshold/100) //meets threshold
    && (inDistributionThreshold < 100) //if the threshold is 100, consider all samples to be OOD
  )
  let isClassConfusion = false

  if(isOOD) { //if this sample is out of distribution
    for(const label in classProbabilities) { //loop through the classes
      processedClassProbabilities[label] = 0 //set the value to 0
    }
  }
  else { //this sample is considered in distribution
    //now we need to determine which classes this sample qualifies for
    //or if it belonds in the class confusion use case

    //loop through all the classes and find the max class probability value
    let maxClassProbability = 0
    let maxLabel = ""
    for(const label in classProbabilities) { //loop through the classes
      processedClassProbabilities[label] = 0 //set all the processed class probabilities to 0 for now
      
      //find the max class probability value
      const classProbabilityValue = classProbabilities[label]
      if(classProbabilityValue > maxClassProbability) { //if this value is higher
        maxClassProbability = classProbabilityValue
        maxLabel = label
      }
    }

    //if the max class probability is greater than the confidence, it is effectively 1, else 0
    const meetsClassConfidenceThreshold = (
      (maxClassProbability >= classConfidenceThreshold/100)
      && (classConfidenceThreshold < 100) //if the threshold is 100, consider all samples to be CLASS_CONFUSION
    )
    if(meetsClassConfidenceThreshold) { //if the probability needs the threshold
      processedClassProbabilities[maxLabel] = 1 //set the processed class value for this label to 1
    }
    isClassConfusion = !meetsClassConfidenceThreshold
  }
  //if we meet the class confidence threshold, we are in the IN_DISTRO_CONFIDENT use case
  //else we are in the CLASS_CONFUSION use case
  processedClassProbabilities[SAMPLE_CONDITIONS.CLASS_CONFUSION] = isClassConfusion ? 1 : 0

  processedClassProbabilities[SAMPLE_CONDITIONS.OOD] = isOOD ? 1 : 0

  return processedClassProbabilities
}