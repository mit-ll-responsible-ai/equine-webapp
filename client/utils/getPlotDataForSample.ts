import { AppClassType, SampleType } from "@/redux/inferenceSettings"
import getLabelsSortedByProbability from "./getLabelsSortedByProbability"
import determineSampleCondition, { SAMPLE_CONDITIONS } from "./determineSampleCondition"
import { getRelevantPrototypeSupportEmbeddingsForSample } from "./getRelevantPrototypeSupportEmbeddingsForSample"
import { GetPrototypeSupportEmbeddingsQuery } from "@/graphql/generated";


export type PlotDataForSample = {
  getPrototypeSupportEmbeddings?: GetPrototypeSupportEmbeddingsQuery,
  labelsSortedByProbability: GetPrototypeSupportEmbeddingsQuery["getPrototypeSupportEmbeddings"],
  processedAppClass: AppClassType,
  sample: SampleType,
  sampleCondition: SAMPLE_CONDITIONS,
}

/**
 * @param sample                      the sample we want to visualize
 * @param processedAppClass           ex {C1: 0, C2:1, ..., CLASS_CONFUSION: 0, OOD: 0}
 * @param prototypeSupportEmbeddings  all the prototype support embeddings
 * @returns                           all the plot data needed for one sample
 */
export function getPlotDataForSample(
  sample: SampleType,
  processedAppClass: AppClassType,
  prototypeSupportEmbeddings?: GetPrototypeSupportEmbeddingsQuery,
):PlotDataForSample {
  const labelsSortedByProbability = getLabelsSortedByProbability(sample, prototypeSupportEmbeddings)
  const sampleCondition = determineSampleCondition(processedAppClass)

  return {
    getPrototypeSupportEmbeddings: getRelevantPrototypeSupportEmbeddingsForSample(
      labelsSortedByProbability,
      processedAppClass,
      sampleCondition,
      prototypeSupportEmbeddings
    ),
    labelsSortedByProbability,
    processedAppClass,
    sample,
    sampleCondition,
  }
}
