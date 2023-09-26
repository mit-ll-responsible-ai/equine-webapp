// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import { GetPrototypeSupportEmbeddingsQuery } from "@/graphql/generated"
import { AppClassType, SampleType } from "@/redux/inferenceSettings"

export enum SAMPLE_CONDITIONS { //the model thinks that this sample is
  IN_DISTRO_CONFIDENT="IN_DISTRO_CONFIDENT", //in distribution and part of the class(es)
  IN_DISTRO_UNSURE="IN_DISTRO_UNSURE", //in distribution but not sure which class
  OOD="OOD", //out of distribution
}

/**
 * This function determines which condition the sample is in, ie which of SAMPLE_CONDITIONS
 * @param inDistributionThreshold set by the user
 * @param processedAppClass       this is kind of weird since it's derived from samples, inDistributionThreshold, and classConfidenceThreshold 
 * @param sample                  array of samples
 * @returns                       one of SAMPLE_CONDITIONS
 */
export default function determineSampleCondition(
  inDistributionThreshold: number,
  processedAppClass: AppClassType,
  sample: SampleType
):SAMPLE_CONDITIONS {
  if(processedAppClass["OTHER"] === 0) {
    return SAMPLE_CONDITIONS.IN_DISTRO_CONFIDENT
  }
  //else if this sample has a low class confidence and high in distribution confidence
  else if(sample.ood*100 < inDistributionThreshold) {
    return SAMPLE_CONDITIONS.IN_DISTRO_UNSURE
  }
  //else if this sample has a high class confidence and low in distribution confidence
  else {
    return SAMPLE_CONDITIONS.OOD
  }
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
    case SAMPLE_CONDITIONS.IN_DISTRO_UNSURE:
      const secondClass = sortedLabels[1].label

      return `Based on your selected thresholds, the model is confident that this sample is in distribution but not confident about it's class. This is because the sample lands in between the ${closestClass} and ${secondClass} prototypes and training examples. As an ML Consumer, you should be careful using the class prediction and make the final determination. As an ML Engineer, you may need additional training data or refactor your labels.`
    default: //SAMPLE_CONDITIONS.OOD
      return `Based on your selected thresholds, the model thinks this sample is out of distribution because the sample lands far away from the other training examples in the high dimensional latent space. It lands closest to the ${closestClass} prototype. As an ML Consumer, you should be careful using the class prediction and make the final determination. As an ML Engineer, you may be able to recognize the introduction of a new class label.`
  }
}