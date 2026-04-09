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