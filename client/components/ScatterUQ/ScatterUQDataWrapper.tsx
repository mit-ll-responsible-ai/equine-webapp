import React, { useMemo } from 'react'

import { ClassProbabilitiesType, InputDataType, SampleType } from '@/redux/inferenceSettings'

import { GetPrototypeSupportEmbeddingsQuery, RenderInferenceFeatureDataDocument, RenderInferenceFeatureDataQuery, RenderInferenceFeatureDataQueryVariables, RenderSupportFeatureDataDocument, RenderSupportFeatureDataQuery, RenderSupportFeatureDataQueryVariables, fetcher, useDimensionalityReductionQuery } from '@/graphql/generated'

import determineSampleCondition, { SAMPLE_CONDITIONS } from '@/utils/determineSampleCondition'
import { ROUTES } from '@/utils/routes'

import { Coordinate2DType, ScatterUQDataProps, StructuredDimRedOutputType, WeightedCoordinate2DType } from './types'

type Props = {
  children: React.FC<ScatterUQDataProps>,
  // classConfidenceThreshold?: number,
  inDistributionThreshold?: number, //possibly undefined from the model summary page
  inputDataType: InputDataType,
  method?: string,
  modelName: string,
  processedClassesProbabilities?: ClassProbabilitiesType[], //possibly undefined from the model summary page
  prototypeSupportEmbeddings: GetPrototypeSupportEmbeddingsQuery,
  runId: number,
  samples?: SampleType[], //possibly undefined from the model summary page
  serverUrl: string,
}


export default function ScatterUQDataWrapper({
  children,
  // classConfidenceThreshold,
  inDistributionThreshold,
  inputDataType,
  method="pca",
  modelName,
  processedClassesProbabilities,
  prototypeSupportEmbeddings,
  runId,
  samples,
  serverUrl,
}:Props) {
  const flattenedVectors = useMemo(
    () => flattenVectors(prototypeSupportEmbeddings?.getPrototypeSupportEmbeddings,samples),
    [prototypeSupportEmbeddings, samples]
  )

  const { data: dimRedQueryData, error: dimRedError, isLoading: dimRedIsLoading } = useDimensionalityReductionQuery(
    {method, data:flattenedVectors, nNeighbors: 5},
    {staleTime: Infinity} //this is important otherwise useQuery will keep refetching and bog down the server
  )

  const structuredEmbeddings = restructureVectors(
    dimRedQueryData?.dimensionalityReduction?.embeddings as [number,number][] | undefined, 
    prototypeSupportEmbeddings?.getPrototypeSupportEmbeddings,
    samples,
    processedClassesProbabilities,
    inDistributionThreshold,
  )

  if(dimRedIsLoading) {
    return <p>Loading...</p>
  }
  else if(dimRedError) {
    return <p>Error: {(dimRedError as Error).message}</p>
  }
  else if (dimRedQueryData && prototypeSupportEmbeddings && structuredEmbeddings.labels.length > 0) {
    const childProps:ScatterUQDataProps = {
      continuity: dimRedQueryData.dimensionalityReduction.continuity,
      getInferenceSampleImageSrc: (dataIndex: number) => `${serverUrl}${ROUTES.API_INFERENCE_IMAGE}/${runId}/${dataIndex}`,
      getInferenceSampleTabularData: async (dataIndex: number) => {
        return fetcher<RenderInferenceFeatureDataQuery, RenderInferenceFeatureDataQueryVariables>(
          RenderInferenceFeatureDataDocument, {dataIndex, modelName, runId}
        )()
      },
      getSupportExampleImageSrc: (dataIndex: number) => `${serverUrl}${ROUTES.API_SUPPORT_IMAGE}/${modelName}/${dataIndex}`,
      getSupportExampleTabularData: async (dataIndex: number) => {
        return fetcher<RenderSupportFeatureDataQuery, RenderSupportFeatureDataQueryVariables>(
          RenderSupportFeatureDataDocument, {dataIndex, modelName}
        )()
      },
      inDistributionThreshold,
      inputDataType,
      stress: dimRedQueryData.dimensionalityReduction.stress,
      processedClassesProbabilities,
      samples,
      scree: dimRedQueryData.dimensionalityReduction.scree,
      srho: dimRedQueryData.dimensionalityReduction.srho,
      structuredEmbeddings,
      trustworthiness: dimRedQueryData.dimensionalityReduction.trustworthiness,
      prototypeSupportEmbeddings,
    }

    return children(childProps) //call children as a function so that we can separate data fetching and rendering props
  }
  return null
}


/**
 * this function flattens all the multi-D float vectors from the labels (prototypes and training examples) and inference samples into one big array of vectors
 * @param prototypeSupportEmbeddings         data.uqViz from the grapqhl UqViz query
 * @param dashboardSamples  samples data from graphql runPipeline mutation
 * @returns                 flattened array of vectors ready to use as input to dimensionality reduction
 */
function flattenVectors(
  prototypeSupportEmbeddings?: GetPrototypeSupportEmbeddingsQuery["getPrototypeSupportEmbeddings"],
  dashboardSamples?: SampleType[],
):number[][] {
  let dimRedVectors:number[][] = [] //this array will hold all the float vectors of the points we want to run in dimensionality reduction

  //if we have prototype and support embeddings
  if(prototypeSupportEmbeddings) {
    //we want to add all the vectors from the model (prototypes and training examples)
    //but we need to flatten them
    prototypeSupportEmbeddings.forEach(l => {
      //create an array of vectors
      // [
      //    prototype vector,
      //    ...training example vectors,
      // ]
      const coordinatesFromLabel: number[][] = [l.prototype].concat(l.trainingExamples.map(t => t.coordinates))

      dimRedVectors = dimRedVectors.concat(coordinatesFromLabel) //concat all the vectors into the overall dimensionality reduction vector
    })
  }

  //if we have samples
  if(dashboardSamples) {
    dimRedVectors = dimRedVectors.concat( //concat the sample vectors
      dashboardSamples.map(s => s.coordinates)
    )
  }

  //now dimRedVectors should contain all the vectors in the order
    // [
    //   prototype 1 vector,
    //   ...all the support vectors for prototype 1,
    //   prototype 2 vector,
    //   ...,
    //   ...all the sample vectors
    // ]

  return dimRedVectors
}

/**
 * this function restructures the 2D embedding vectors output from dimensionality reduction
 * @param embeddings2D                2D vectors output of dimensionality reduction
 * @param prototypeSupportEmbeddings  data.getPrototypeSupportEmbeddings from the grapqhl GetPrototypeSupportEmbeddingsQuery query
 * @param dashboardSamples            samples data from graphql runPipeline mutation
 * @returns                           structured 2D dimensionality reduction embedding vectors and class confidence weights for the labels and samples
 */
function restructureVectors(
  embeddings2D?: [number, number][],
  prototypeSupportEmbeddings?: GetPrototypeSupportEmbeddingsQuery["getPrototypeSupportEmbeddings"],
  dashboardSamples?: SampleType[],
  processedClassesProbabilities?: ClassProbabilitiesType[],
  inDistributionThreshold?: number,
  ):StructuredDimRedOutputType {
  //if we have the proper data
  if(embeddings2D && prototypeSupportEmbeddings) {
    //true if we should weight by confidence, else false we should weight by 1 - OOD score
    const weightByOOD = shouldWeightByOOD(dashboardSamples, processedClassesProbabilities, inDistributionThreshold)

    //we flattened all the vectors to run dimensionality reduction
    //but now we want to re-structure the 2D embedding vectors
    let startIdx = 0 //this tracks the starting index of the vectors for a given label
    const labels:{
      prototype: WeightedCoordinate2DType,
      trainingExamples: WeightedCoordinate2DType[],
    }[] = prototypeSupportEmbeddings.map(l => { //this map function over all the labels isn't pure, but it works
      //calculate when the vectors for this label ends
      //endIdx = the current startIdx + 1 prototype + number of training examples for this label
      const endIdx = startIdx + 1 + l.trainingExamples.length

      const dimRedCoordinatesForLabel = {
        prototype: {
          weight: 1, //the weight for all prototypes is the maximal 1
          x: embeddings2D[startIdx][0],
          y: embeddings2D[startIdx][1],
        }, //get the embeddings for the prototype
        trainingExamples: embeddings2D.slice(startIdx + 1, endIdx).map(([x,y], training_example_idx) => {
          //for this training example, find the prediction for this label
          const trainingExample = l.trainingExamples[training_example_idx]
          const predictiveLabel = trainingExample.labels.find(
            predictiveLabel => predictiveLabel.label === l.label
          )
          if(!predictiveLabel) throw new Error(`Training example for label ${l.label} did not have a prediction value for this label`)
          return {
            //weight this example by 1 - the OOD score or by how confident the model is 
            weight: weightByOOD ? 1 - trainingExample.ood : predictiveLabel.confidence,
            x, 
            y,
          }
        }), //get the embeddings for all the training examples
      }

      startIdx = endIdx //set startIdx to endIdx for the next iteration

      return dimRedCoordinatesForLabel //return the structured 2D embeddings for this label
    })

    if(dashboardSamples) { //if we have samples data
      //the remaining number of embedding vectors should match the number of samples
      if(embeddings2D.length - startIdx !== dashboardSamples.length) {
        throw new Error("Something went wrong when restructuring the 2D embeddings. Not enough remaining vectors for the samples.")
      }

      const samples:Coordinate2DType[] = embeddings2D.slice(startIdx, embeddings2D.length).map(
        ([x,y]) => ({x, y})
      )
      return { labels, samples } //we have labels and samples, ex dashboard
    }

    return { labels, samples: [] } //we have labels but no samples, ex model summary page
  }

  return { labels: [], samples: [] } //we have no labels or samples, ex loading data
}


/**
 * If every sample is OOD, we should weight by the 1-OOD score
 * Else if there are no samples or some non-OOD samples, when we should weight by confidence
 * @param dashboardSamples 
 * @param processedClassesProbabilities 
 * @param inDistributionThreshold 
 * @returns 
 */
function shouldWeightByOOD(
  dashboardSamples?: SampleType[],
  processedClassesProbabilities?: ClassProbabilitiesType[],
  inDistributionThreshold?: number,
):boolean {
  //if we have samples data
  if(dashboardSamples && processedClassesProbabilities && inDistributionThreshold) {
    //return true if every sample is OOD
    return dashboardSamples.every((s,sIdx) => //check if every sample is in the OOD condition
      //check if this sample is in the OOD condition
      determineSampleCondition(processedClassesProbabilities[sIdx]) === SAMPLE_CONDITIONS.OOD
    )
  }
  return false //we don't have samples data, weight by confidence
}
