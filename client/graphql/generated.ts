import { useMutation, useQuery, UseMutationOptions, UseQueryOptions } from '@tanstack/react-query';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };

function fetcher<TData, TVariables>(query: string, variables?: TVariables) {
  return async (): Promise<TData> => {
    const res = await fetch(localStorage.getItem('serverUrl')+'/graphql' as string, {
    method: "POST",
    ...({"headers":{"Content-Type":"application/json"}}),
      body: JSON.stringify({ query, variables }),
    });

    const json = await res.json();

    if (json.errors) {
      const { message } = json.errors[0];

      throw new Error(message);
    }

    return json.data;
  }
}
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Upload: { input: any; output: any; }
};

export type DimensionalityReductionOutput = {
  __typename?: 'DimensionalityReductionOutput';
  continuity: Scalars['Float']['output'];
  embeddings: Array<Array<Scalars['Float']['output']>>;
  scree?: Maybe<Array<Scalars['Float']['output']>>;
  srho: Scalars['Float']['output'];
  stress: Scalars['Float']['output'];
  trustworthiness: Scalars['Float']['output'];
};

export type FeatureData = {
  __typename?: 'FeatureData';
  columnHeaders: Array<Scalars['String']['output']>;
  featureData: Array<Scalars['Float']['output']>;
};

export type InputData = {
  __typename?: 'InputData';
  dataIndex: Scalars['Int']['output'];
  file?: Maybe<Scalars['String']['output']>;
};

export type LabelExamplesType = {
  __typename?: 'LabelExamplesType';
  label: Scalars['String']['output'];
  numExamples: Scalars['Int']['output'];
};

export type LabelFilesType = {
  __typename?: 'LabelFilesType';
  files: Array<Scalars['String']['output']>;
  label: Scalars['String']['output'];
};

export type LabelPoints = {
  __typename?: 'LabelPoints';
  label: Scalars['String']['output'];
  prototype: Array<Scalars['Float']['output']>;
  trainingExamples: Array<Sample>;
};

export type ModelSummaryType = {
  __typename?: 'ModelSummaryType';
  dateTrained: Scalars['String']['output'];
  lastModified: Scalars['Float']['output'];
  modelType: Scalars['String']['output'];
  numTrainExamples: Array<LabelExamplesType>;
};

export type Models = {
  __typename?: 'Models';
  lastModified: Scalars['Float']['output'];
  name: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  runInference: RunPipelineResult;
  startTraining: StartTrainingResult;
  uploadFile?: Maybe<UploadFileResult>;
  uploadModel?: Maybe<UploadModelResult>;
};


export type MutationRunInferenceArgs = {
  modelName: Scalars['String']['input'];
  sampleFilenames: Array<InputMaybe<Scalars['String']['input']>>;
};


export type MutationStartTrainingArgs = {
  embOutDim?: InputMaybe<Scalars['Int']['input']>;
  embedModelName: Scalars['String']['input'];
  episodes: Scalars['Int']['input'];
  newModelName: Scalars['String']['input'];
  sampleFilenames: Array<InputMaybe<Scalars['Upload']['input']>>;
  trainModelType: Scalars['String']['input'];
};


export type MutationUploadFileArgs = {
  file: Scalars['Upload']['input'];
};


export type MutationUploadModelArgs = {
  modelFile: Scalars['Upload']['input'];
};

export type PredictiveConfidence = {
  __typename?: 'PredictiveConfidence';
  confidence: Scalars['Float']['output'];
  label: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  dimensionalityReduction: DimensionalityReductionOutput;
  getPrototypeSupportEmbeddings: Array<LabelPoints>;
  modelSummary?: Maybe<ModelSummaryType>;
  models: Array<Models>;
  renderInferenceFeatureData: FeatureData;
  renderSupportFeatureData: FeatureData;
  trainingProgress?: Maybe<Scalars['Float']['output']>;
};


export type QueryDimensionalityReductionArgs = {
  data: Array<Array<Scalars['Float']['input']>>;
  method: Scalars['String']['input'];
  nNeighbors: Scalars['Int']['input'];
  random_state?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGetPrototypeSupportEmbeddingsArgs = {
  modelName: Scalars['String']['input'];
};


export type QueryModelSummaryArgs = {
  modelName: Scalars['String']['input'];
};


export type QueryModelsArgs = {
  extension?: InputMaybe<Scalars['String']['input']>;
};


export type QueryRenderInferenceFeatureDataArgs = {
  dataIndex: Scalars['Int']['input'];
  modelName: Scalars['String']['input'];
  runId: Scalars['Int']['input'];
};


export type QueryRenderSupportFeatureDataArgs = {
  dataIndex: Scalars['Int']['input'];
  modelName: Scalars['String']['input'];
};


export type QueryTrainingProgressArgs = {
  modelName: Scalars['String']['input'];
};

export type RunPipelineResult = {
  __typename?: 'RunPipelineResult';
  runId: Scalars['Int']['output'];
  samples: Array<Sample>;
  version: Scalars['String']['output'];
};

export type Sample = {
  __typename?: 'Sample';
  coordinates: Array<Scalars['Float']['output']>;
  inputData: InputData;
  labels: Array<PredictiveConfidence>;
  ood: Scalars['Float']['output'];
};

export type StartRetrainingResult = {
  __typename?: 'StartRetrainingResult';
  success: Scalars['Boolean']['output'];
};

export type StartTrainingResult = {
  __typename?: 'StartTrainingResult';
  success: Scalars['Boolean']['output'];
};

export type UploadFileResult = {
  __typename?: 'UploadFileResult';
  success: Scalars['Boolean']['output'];
};

export type UploadModelResult = {
  __typename?: 'UploadModelResult';
  success: Scalars['Boolean']['output'];
};

export type RunInferenceMutationVariables = Exact<{
  modelName: Scalars['String']['input'];
  sampleFilenames: Array<InputMaybe<Scalars['String']['input']>> | InputMaybe<Scalars['String']['input']>;
}>;


export type RunInferenceMutation = { __typename?: 'Mutation', runInference: { __typename?: 'RunPipelineResult', runId: number, version: string, samples: Array<{ __typename?: 'Sample', coordinates: Array<number>, ood: number, inputData: { __typename?: 'InputData', file?: string | null, dataIndex: number }, labels: Array<{ __typename?: 'PredictiveConfidence', label: string, confidence: number }> }> } };

export type StartTrainingMutationVariables = Exact<{
  embedModelName: Scalars['String']['input'];
  episodes: Scalars['Int']['input'];
  newModelName: Scalars['String']['input'];
  sampleFilenames: Array<Scalars['Upload']['input']> | Scalars['Upload']['input'];
  trainModelType: Scalars['String']['input'];
  embOutDim?: InputMaybe<Scalars['Int']['input']>;
}>;


export type StartTrainingMutation = { __typename?: 'Mutation', startTraining: { __typename?: 'StartTrainingResult', success: boolean } };

export type UploadModelMutationVariables = Exact<{
  modelFile: Scalars['Upload']['input'];
}>;


export type UploadModelMutation = { __typename?: 'Mutation', uploadModel?: { __typename?: 'UploadModelResult', success: boolean } | null };

export type UploadSampleFileMutationVariables = Exact<{
  file: Scalars['Upload']['input'];
}>;


export type UploadSampleFileMutation = { __typename?: 'Mutation', uploadFile?: { __typename?: 'UploadFileResult', success: boolean } | null };

export type DimensionalityReductionQueryVariables = Exact<{
  method: Scalars['String']['input'];
  data: Array<Array<Scalars['Float']['input']> | Scalars['Float']['input']> | Array<Scalars['Float']['input']> | Scalars['Float']['input'];
  nNeighbors: Scalars['Int']['input'];
}>;


export type DimensionalityReductionQuery = { __typename?: 'Query', dimensionalityReduction: { __typename?: 'DimensionalityReductionOutput', continuity: number, embeddings: Array<Array<number>>, stress: number, scree?: Array<number> | null, srho: number, trustworthiness: number } };

export type GetPrototypeSupportEmbeddingsQueryVariables = Exact<{
  modelName: Scalars['String']['input'];
}>;


export type GetPrototypeSupportEmbeddingsQuery = { __typename?: 'Query', getPrototypeSupportEmbeddings: Array<{ __typename?: 'LabelPoints', label: string, prototype: Array<number>, trainingExamples: Array<{ __typename?: 'Sample', coordinates: Array<number>, ood: number, inputData: { __typename?: 'InputData', file?: string | null, dataIndex: number }, labels: Array<{ __typename?: 'PredictiveConfidence', label: string, confidence: number }> }> }> };

export type ModelSummaryQueryVariables = Exact<{
  modelName: Scalars['String']['input'];
}>;


export type ModelSummaryQuery = { __typename?: 'Query', modelSummary?: { __typename?: 'ModelSummaryType', dateTrained: string, lastModified: number, modelType: string, numTrainExamples: Array<{ __typename?: 'LabelExamplesType', label: string, numExamples: number }> } | null };

export type ModelsQueryVariables = Exact<{
  extension: Scalars['String']['input'];
}>;


export type ModelsQuery = { __typename?: 'Query', models: Array<{ __typename?: 'Models', lastModified: number, name: string }> };

export type RenderInferenceFeatureDataQueryVariables = Exact<{
  runId: Scalars['Int']['input'];
  modelName: Scalars['String']['input'];
  dataIndex: Scalars['Int']['input'];
}>;


export type RenderInferenceFeatureDataQuery = { __typename?: 'Query', renderInferenceFeatureData: { __typename?: 'FeatureData', featureData: Array<number>, columnHeaders: Array<string> } };

export type RenderSupportFeatureDataQueryVariables = Exact<{
  modelName: Scalars['String']['input'];
  dataIndex: Scalars['Int']['input'];
}>;


export type RenderSupportFeatureDataQuery = { __typename?: 'Query', renderSupportFeatureData: { __typename?: 'FeatureData', featureData: Array<number>, columnHeaders: Array<string> } };


export const RunInferenceDocument = `
    mutation RunInference($modelName: String!, $sampleFilenames: [String]!) {
  runInference(modelName: $modelName, sampleFilenames: $sampleFilenames) {
    runId
    samples {
      coordinates
      inputData {
        file
        dataIndex
      }
      labels {
        label
        confidence
      }
      ood
    }
    version
  }
}
    `;
export const useRunInferenceMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<RunInferenceMutation, TError, RunInferenceMutationVariables, TContext>) =>
    useMutation<RunInferenceMutation, TError, RunInferenceMutationVariables, TContext>(
      ['RunInference'],
      (variables?: RunInferenceMutationVariables) => fetcher<RunInferenceMutation, RunInferenceMutationVariables>(RunInferenceDocument, variables)(),
      options
    );
export const StartTrainingDocument = `
    mutation StartTraining($embedModelName: String!, $episodes: Int!, $newModelName: String!, $sampleFilenames: [Upload!]!, $trainModelType: String!, $embOutDim: Int) {
  startTraining(
    embedModelName: $embedModelName
    episodes: $episodes
    newModelName: $newModelName
    sampleFilenames: $sampleFilenames
    trainModelType: $trainModelType
    embOutDim: $embOutDim
  ) {
    success
  }
}
    `;
export const useStartTrainingMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<StartTrainingMutation, TError, StartTrainingMutationVariables, TContext>) =>
    useMutation<StartTrainingMutation, TError, StartTrainingMutationVariables, TContext>(
      ['StartTraining'],
      (variables?: StartTrainingMutationVariables) => fetcher<StartTrainingMutation, StartTrainingMutationVariables>(StartTrainingDocument, variables)(),
      options
    );
export const UploadModelDocument = `
    mutation UploadModel($modelFile: Upload!) {
  uploadModel(modelFile: $modelFile) {
    success
  }
}
    `;
export const useUploadModelMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<UploadModelMutation, TError, UploadModelMutationVariables, TContext>) =>
    useMutation<UploadModelMutation, TError, UploadModelMutationVariables, TContext>(
      ['UploadModel'],
      (variables?: UploadModelMutationVariables) => fetcher<UploadModelMutation, UploadModelMutationVariables>(UploadModelDocument, variables)(),
      options
    );
export const UploadSampleFileDocument = `
    mutation UploadSampleFile($file: Upload!) {
  uploadFile(file: $file) {
    success
  }
}
    `;
export const useUploadSampleFileMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<UploadSampleFileMutation, TError, UploadSampleFileMutationVariables, TContext>) =>
    useMutation<UploadSampleFileMutation, TError, UploadSampleFileMutationVariables, TContext>(
      ['UploadSampleFile'],
      (variables?: UploadSampleFileMutationVariables) => fetcher<UploadSampleFileMutation, UploadSampleFileMutationVariables>(UploadSampleFileDocument, variables)(),
      options
    );
export const DimensionalityReductionDocument = `
    query DimensionalityReduction($method: String!, $data: [[Float!]!]!, $nNeighbors: Int!) {
  dimensionalityReduction(method: $method, data: $data, nNeighbors: $nNeighbors) {
    continuity
    embeddings
    stress
    scree
    srho
    trustworthiness
  }
}
    `;
export const useDimensionalityReductionQuery = <
      TData = DimensionalityReductionQuery,
      TError = unknown
    >(
      variables: DimensionalityReductionQueryVariables,
      options?: UseQueryOptions<DimensionalityReductionQuery, TError, TData>
    ) =>
    useQuery<DimensionalityReductionQuery, TError, TData>(
      ['DimensionalityReduction', variables],
      fetcher<DimensionalityReductionQuery, DimensionalityReductionQueryVariables>(DimensionalityReductionDocument, variables),
      options
    );
export const GetPrototypeSupportEmbeddingsDocument = `
    query GetPrototypeSupportEmbeddings($modelName: String!) {
  getPrototypeSupportEmbeddings(modelName: $modelName) {
    label
    prototype
    trainingExamples {
      coordinates
      inputData {
        file
        dataIndex
      }
      labels {
        label
        confidence
      }
      ood
    }
  }
}
    `;
export const useGetPrototypeSupportEmbeddingsQuery = <
      TData = GetPrototypeSupportEmbeddingsQuery,
      TError = unknown
    >(
      variables: GetPrototypeSupportEmbeddingsQueryVariables,
      options?: UseQueryOptions<GetPrototypeSupportEmbeddingsQuery, TError, TData>
    ) =>
    useQuery<GetPrototypeSupportEmbeddingsQuery, TError, TData>(
      ['GetPrototypeSupportEmbeddings', variables],
      fetcher<GetPrototypeSupportEmbeddingsQuery, GetPrototypeSupportEmbeddingsQueryVariables>(GetPrototypeSupportEmbeddingsDocument, variables),
      options
    );
export const ModelSummaryDocument = `
    query ModelSummary($modelName: String!) {
  modelSummary(modelName: $modelName) {
    dateTrained
    lastModified
    modelType
    numTrainExamples {
      label
      numExamples
    }
  }
}
    `;
export const useModelSummaryQuery = <
      TData = ModelSummaryQuery,
      TError = unknown
    >(
      variables: ModelSummaryQueryVariables,
      options?: UseQueryOptions<ModelSummaryQuery, TError, TData>
    ) =>
    useQuery<ModelSummaryQuery, TError, TData>(
      ['ModelSummary', variables],
      fetcher<ModelSummaryQuery, ModelSummaryQueryVariables>(ModelSummaryDocument, variables),
      options
    );
export const ModelsDocument = `
    query Models($extension: String!) {
  models(extension: $extension) {
    lastModified
    name
  }
}
    `;
export const useModelsQuery = <
      TData = ModelsQuery,
      TError = unknown
    >(
      variables: ModelsQueryVariables,
      options?: UseQueryOptions<ModelsQuery, TError, TData>
    ) =>
    useQuery<ModelsQuery, TError, TData>(
      ['Models', variables],
      fetcher<ModelsQuery, ModelsQueryVariables>(ModelsDocument, variables),
      options
    );
export const RenderInferenceFeatureDataDocument = `
    query RenderInferenceFeatureData($runId: Int!, $modelName: String!, $dataIndex: Int!) {
  renderInferenceFeatureData(
    runId: $runId
    modelName: $modelName
    dataIndex: $dataIndex
  ) {
    featureData
    columnHeaders
  }
}
    `;
export const useRenderInferenceFeatureDataQuery = <
      TData = RenderInferenceFeatureDataQuery,
      TError = unknown
    >(
      variables: RenderInferenceFeatureDataQueryVariables,
      options?: UseQueryOptions<RenderInferenceFeatureDataQuery, TError, TData>
    ) =>
    useQuery<RenderInferenceFeatureDataQuery, TError, TData>(
      ['RenderInferenceFeatureData', variables],
      fetcher<RenderInferenceFeatureDataQuery, RenderInferenceFeatureDataQueryVariables>(RenderInferenceFeatureDataDocument, variables),
      options
    );
export const RenderSupportFeatureDataDocument = `
    query RenderSupportFeatureData($modelName: String!, $dataIndex: Int!) {
  renderSupportFeatureData(modelName: $modelName, dataIndex: $dataIndex) {
    featureData
    columnHeaders
  }
}
    `;
export const useRenderSupportFeatureDataQuery = <
      TData = RenderSupportFeatureDataQuery,
      TError = unknown
    >(
      variables: RenderSupportFeatureDataQueryVariables,
      options?: UseQueryOptions<RenderSupportFeatureDataQuery, TError, TData>
    ) =>
    useQuery<RenderSupportFeatureDataQuery, TError, TData>(
      ['RenderSupportFeatureData', variables],
      fetcher<RenderSupportFeatureDataQuery, RenderSupportFeatureDataQueryVariables>(RenderSupportFeatureDataDocument, variables),
      options
    );
export { fetcher }