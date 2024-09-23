// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT

import { InputData } from "@/graphql/generated"
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export const INPUT_DATA_TYPES = ["Tabular", "Image"] as const
export type InputDataType = typeof INPUT_DATA_TYPES[number]

export interface ReduxInferenceSettingsState {
  inputDataType: InputDataType,
  modelName: string,
  runId: number,
  sampleFilenames: string[],
  samples: SampleType[],
}

const INITIAL_STATE: ReduxInferenceSettingsState = {
  inputDataType: "Tabular",
  modelName: "",
  runId: -1,
  sampleFilenames: [],
  samples: [],
}



export type ClassProbabilitiesType = {
  [label:string]: number
}

export type SampleType = {
  classProbabilities: ClassProbabilitiesType,
  coordinates: number[],
  inputData: InputData,
  ood: number, //out of distribution
}

export const rawSampleSchema = { //TODO
  $id: "/rawSampleSchema",
  type: "object",
  properties: {
    classProbabilities: {
      type: "object",
      additionalProperties: {
        type: "number", minimum: 0, maximum: 1
      }
    },
    ood: { type: "number", minimum: 0, maximum: 1 },
  },
  required: [
    "classProbabilities", "ood"
  ]
}


const inferenceSettingsSlice = createSlice({
  name: 'inferenceSettings',
  initialState: INITIAL_STATE,
  reducers: {
    setInputDataType: (state, action: PayloadAction<InputDataType>) => {
      state.inputDataType = action.payload
    },
    setModelName: (state, action: PayloadAction<string>) => {
      state.modelName = action.payload
    },
    setRunId: (state, action: PayloadAction<number>) => {
      state.runId = action.payload
    },
    setSampleFileNames: (state, action: PayloadAction<string[]>) => {
      state.sampleFilenames = action.payload
    },
    setSamples: (state, action: PayloadAction<SampleType[]>) => {
      state.samples = action.payload
    },
  },
})

export const { setInputDataType, setModelName, setRunId, setSampleFileNames, setSamples } = inferenceSettingsSlice.actions
export default inferenceSettingsSlice.reducer
