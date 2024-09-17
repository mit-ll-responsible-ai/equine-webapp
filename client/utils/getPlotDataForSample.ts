import { ClassProbabilitiesType, SampleType } from "@/redux/inferenceSettings"
import getLabelsSortedByProbability from "./getLabelsSortedByProbability"
import determineSampleCondition, { SAMPLE_CONDITIONS } from "./determineSampleCondition"
import { getRelevantPrototypeSupportEmbeddingsForSample } from "./getRelevantPrototypeSupportEmbeddingsForSample"
import { GetPrototypeSupportEmbeddingsQuery } from "@/graphql/generated";


export type PlotDataForSample = {
  getPrototypeSupportEmbeddings?: GetPrototypeSupportEmbeddingsQuery,
  labelsSortedByProbability: GetPrototypeSupportEmbeddingsQuery["getPrototypeSupportEmbeddings"],
  processedClassProbabilities: ClassProbabilitiesType,
  sample: SampleType,
  sampleCondition: SAMPLE_CONDITIONS,
}

/**
 * @param sample                      the sample we want to visualize
 * @param processedClassProbabilities           ex {C1: 0, C2:1, ..., CLASS_CONFUSION: 0, OOD: 0}
 * @param prototypeSupportEmbeddings  all the prototype support embeddings
 * @returns                           all the plot data needed for one sample
 */
export function getPlotDataForSample(
  sample: SampleType,
  processedClassProbabilities: ClassProbabilitiesType,
  prototypeSupportEmbeddings?: GetPrototypeSupportEmbeddingsQuery,
):PlotDataForSample {
  const labelsSortedByProbability = getLabelsSortedByProbability(sample, prototypeSupportEmbeddings)
  const sampleCondition = determineSampleCondition(processedClassProbabilities)

  return {
    getPrototypeSupportEmbeddings: getRelevantPrototypeSupportEmbeddingsForSample(
      labelsSortedByProbability,
      processedClassProbabilities,
      sampleCondition,
      prototypeSupportEmbeddings
    ),
    labelsSortedByProbability,
    processedClassProbabilities,
    sample,
    sampleCondition,
  }
}
