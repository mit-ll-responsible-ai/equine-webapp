// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import { GetPrototypeSupportEmbeddingsQuery } from "@/graphql/generated"
import { ClassProbabilitiesType } from "@/redux/inferenceSettings"

export enum SAMPLE_CONDITIONS { //the model thinks that this sample is
  IN_DISTRO_CONFIDENT="IN_DISTRO_CONFIDENT", //in distribution and part of the class(es)
  CLASS_CONFUSION="CLASS_CONFUSION", //in distribution but not sure which class
  OOD="OOD", //out of distribution
}

/**
 * This function determines which condition the sample is in, ie which of SAMPLE_CONDITIONS
 * @param processedClassProbabilities       processed class probabilities from the sample 
 * @returns                       one of SAMPLE_CONDITIONS
 */
export default function determineSampleCondition(processedClassProbabilities: ClassProbabilitiesType):SAMPLE_CONDITIONS {
  if(processedClassProbabilities[SAMPLE_CONDITIONS.OOD] === 1) {
    return SAMPLE_CONDITIONS.OOD
  }
  else if(processedClassProbabilities[SAMPLE_CONDITIONS.CLASS_CONFUSION] === 1) {
    return SAMPLE_CONDITIONS.CLASS_CONFUSION
  }
  return SAMPLE_CONDITIONS.IN_DISTRO_CONFIDENT
}

export function getSampleConditionText(
  condition: SAMPLE_CONDITIONS,
  sortedLabels: GetPrototypeSupportEmbeddingsQuery["getPrototypeSupportEmbeddings"],
) {
  if(sortedLabels.length === 0) return ""
  
  const closestClass = sortedLabels[0].label
  switch (condition) {
    case SAMPLE_CONDITIONS.IN_DISTRO_CONFIDENT:
      return `Based on your selected thresholds, the model is confident that this sample is in distribution and of class ${closestClass} because it is closest to the ${closestClass} prototype and lands in the middle of other ${closestClass} training examples.`
    case SAMPLE_CONDITIONS.CLASS_CONFUSION:
      const secondClass = sortedLabels[1].label

      return `Based on your selected thresholds, the model is confident that this sample is in distribution but not confident about its class. This is because the sample lands in between the ${closestClass} and ${secondClass} prototypes and training examples. As an ML Consumer, you should be careful using the class prediction and make the final determination. As an ML Engineer, you may need additional training data or refactor your labels.`
    default: //SAMPLE_CONDITIONS.OOD
      return `Based on your selected thresholds, the model thinks this sample is out of distribution because the sample lands far away from the other training examples in the high dimensional latent space. It lands closest to the ${closestClass} prototype. As an ML Consumer, you should be careful using the class prediction and make the final determination. As an ML Engineer, you may be able to recognize the introduction of a new class label.`
  }
}