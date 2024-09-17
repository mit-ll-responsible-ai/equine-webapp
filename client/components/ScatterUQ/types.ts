import { GetPrototypeSupportEmbeddingsQuery, RenderInferenceFeatureDataQuery, RenderSupportFeatureDataQuery } from "@/graphql/generated";
import { ClassProbabilitiesType, InputDataType, SampleType } from "@/redux/inferenceSettings";

export type Coordinate2DType = {x: number, y: number}
export type WeightedCoordinate2DType = Coordinate2DType & {weight: number}

export type StructuredDimRedOutputType = {
  labels: {
      prototype: WeightedCoordinate2DType;
      trainingExamples: WeightedCoordinate2DType[];
  }[];
  samples: Coordinate2DType[]; // samples are not included in contours so weight doesn't matter
}


export type ScatterUQDataProps = {
  continuity: number,
  getInferenceSampleImageSrc: (dataIndex: number) => string,
  getInferenceSampleTabularData: (dataIndex: number) => Promise<RenderInferenceFeatureDataQuery | undefined>,
  getSupportExampleImageSrc: (dataIndex: number) => string,
  getSupportExampleTabularData: (dataIndex: number) => Promise<RenderSupportFeatureDataQuery | undefined>,
  inDistributionThreshold?: number, //possibly undefined from the model summary page
  inputDataType: InputDataType,
  stress: number,
  processedClassesProbabilities?: ClassProbabilitiesType[], //possibly undefined from the model summary page
  prototypeSupportEmbeddings: GetPrototypeSupportEmbeddingsQuery,
  samples?: SampleType[], //possibly undefined from the model summary page
  scree?: number[] | null,
  srho: number,
  structuredEmbeddings: StructuredDimRedOutputType,
  trustworthiness: number,
}