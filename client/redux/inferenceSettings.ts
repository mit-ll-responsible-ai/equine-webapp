// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT

import { InputData } from "graphql/generated"
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export const INPUT_DATA_TYPES = ["Tabular", "Image"] as const
export type InputDataType = typeof INPUT_DATA_TYPES[number]

export interface ReduxInferenceSettingsState {
  inputDataType: InputDataType,
  modelFilename: string,
  runId: number,
  sampleFilenames: string[],
  samples: SampleType[],
}

const INITIAL_STATE: ReduxInferenceSettingsState = {
  inputDataType: "Tabular",
  modelFilename: "",
  runId: -1,
  sampleFilenames: [],
  samples: [],
}



export type AppClassType = {
  [label:string]: number
}

export type SampleType = {
  app_class: AppClassType,
  coordinates: number[],
  inputData: InputData,
  ood: number, //out of distribution
}

export const rawSampleSchema = { //TODO
  $id: "/rawSampleSchema",
  type: "object",
  properties: {
    app_class: {
      type: "object",
      additionalProperties: {
        type: "number", minimum: 0, maximum: 1
      }
    },
    ood: { type: "number", minimum: 0, maximum: 1 },
  },
  required: [
    "app_class", "ood"
  ]
}


const inferenceSettingsSlice = createSlice({
  name: 'inferenceSettings',
  initialState: INITIAL_STATE,
  reducers: {
    setInputDataType: (state, action: PayloadAction<InputDataType>) => {
      state.inputDataType = action.payload
    },
    setModelFileName: (state, action: PayloadAction<string>) => {
      state.modelFilename = action.payload
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

export const { setInputDataType, setModelFileName, setRunId, setSampleFileNames, setSamples } = inferenceSettingsSlice.actions
export default inferenceSettingsSlice.reducer
