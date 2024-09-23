import { GetPrototypeSupportEmbeddingsQuery } from "@/graphql/generated"
import { ClassProbabilitiesType } from "@/redux/inferenceSettings"
import { SAMPLE_CONDITIONS } from "./determineSampleCondition"

/**
 * This function returns only the relevant prototype support embeddings
 * for a sample given the sample condition
 * Ex, if the sample is confident or OOD, only show the closest class
 * If the sample is class confusion, show the two closest classes
 * @param labelsSortedByDistance      the labels sorted by closest to farthest from the sample
 * @param processedClassProbabilities           ex {C1: 0, C2:1, ..., CLASS_CONFUSION: 0, OOD: 0}
 * @param sampleCondition             the use case of the sample (confident, class confusion, OOD)
 * @param prototypeSupportEmbeddings  all the prototype support embeddings
 * @returns                           the prototype support embeddings relevant to the sample given the sample condition
 */
export function getRelevantPrototypeSupportEmbeddingsForSample(
  labelsSortedByDistance: GetPrototypeSupportEmbeddingsQuery["getPrototypeSupportEmbeddings"],
  processedClassProbabilities: ClassProbabilitiesType,
  sampleCondition: SAMPLE_CONDITIONS,
  prototypeSupportEmbeddings?: GetPrototypeSupportEmbeddingsQuery,
):GetPrototypeSupportEmbeddingsQuery | undefined {
  if(prototypeSupportEmbeddings) { //if we have prototype support embeddings data
    switch (sampleCondition) {
      //if this sample is in distribution and confident
      case SAMPLE_CONDITIONS.IN_DISTRO_CONFIDENT: {
        return {
          ...prototypeSupportEmbeddings,
          //filter by the prototypeSupportEmbeddings with a processedClassProbabilities of 1
          getPrototypeSupportEmbeddings: prototypeSupportEmbeddings.getPrototypeSupportEmbeddings.filter(label => processedClassProbabilities[label.label] === 1)
        }
      }
      //if this sample is indsitribution but class confusion
      case SAMPLE_CONDITIONS.CLASS_CONFUSION: {
        return {
          ...prototypeSupportEmbeddings,
          //show the two closest classes
          getPrototypeSupportEmbeddings: labelsSortedByDistance.slice(0,2),
        }
      }
      //else assume this sample is OOD
      default: { //SAMPLE_CONDITIONS.OOD
        return {
          ...prototypeSupportEmbeddings,
          //show the closest class
          getPrototypeSupportEmbeddings: labelsSortedByDistance.slice(0,1),
        }
      }
    }
  }

  return prototypeSupportEmbeddings
}