// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT

import { expect, test } from 'vitest'


import processStackData from "../processStackData"
import { SampleType } from '@/redux/inferenceSettings'

const DEFAULT_SAMPLE:SampleType = {
  classProbabilities: {},
  coordinates: [],
  inputData: {dataIndex: 0},
  ood: 0.5,
}

test("empty oodThresholds and samples", () => {
  expect(processStackData([], [], [])).toStrictEqual([])
})

test("1 threshold, empty samples", () => {
  expect(processStackData([0], [], [])).toStrictEqual([
    {data: [], name: "These samples are similar to up to 100% of the training data"}
  ])
})

test("different length processedClassesProbabilities abd samples should throw", () => {
  expect(
    () => processStackData([], [], [DEFAULT_SAMPLE])
  ).toThrow("OodThresholds must have some elements if there are samples")
})

test("empty oodThresholds, some samples, should throw", () => {
  expect(
    () => processStackData([], [{}], [DEFAULT_SAMPLE])
  ).toThrow("OodThresholds must have some elements if there are samples")
})


test("4 thresholds, no overlapping samples", () => {
  expect(
    processStackData(
      [0, 0.25, 0.5, 0.75], 
      [
        { C2: 1, C1: 0, C3: 1},
        { C2: 0, C1: 1, C3: 1}
      ], 
      [
        { ...DEFAULT_SAMPLE, ood: 0.8 },
        { ...DEFAULT_SAMPLE, ood: 0.4 },
      ]
    )
  ).toStrictEqual([
    {
      name: "These samples are similar to up to 25% of the training data",
      data: []
    },
    {
      name: "These samples are within 25 - 50% of the bounds of the training data",
      data: [
        ["C2", 0],
        ["C1", 1],
        ["C3", 1],
      ]
    },
    {
      name: "These samples are within 50 - 75% of the bounds of the training data",
      data: []
    },
    {
      name: "These samples are more extreme than 75% of the training data",
      data: [
        ["C2", 1],
        ["C1", 0],
        ["C3", 1],
      ]
    },
  ])
})



test("4 thresholds, some overlapping samples", () => {
  expect(
    processStackData(
      [0, 0.25, 0.5, 0.75],
      [
        { C2: 1, C1: 0, C3: 1 },
        { C2: 0, C1: 1, C3: 1 },
        { C2: 0, C1: 1, C3: 1 },
        { C2: 1, C1: 0, C3: 1 }
      ],
      [
        { ...DEFAULT_SAMPLE, ood: 0.8 },
        { ...DEFAULT_SAMPLE, ood: 0.4 },
        { ...DEFAULT_SAMPLE, ood: 0.95 },
        { ...DEFAULT_SAMPLE, ood: 0.79 },
      ]
    )
  ).toStrictEqual([
    {
      name: "These samples are similar to up to 25% of the training data",
      data: []
    },
    {
      name: "These samples are within 25 - 50% of the bounds of the training data",
      data: [
        ["C2", 0],
        ["C1", 1],
        ["C3", 1],
      ]
    },
    {
      name: "These samples are within 50 - 75% of the bounds of the training data",
      data: []
    },
    {
      name: "These samples are more extreme than 75% of the training data",
      data: [
        ["C2", 2],
        ["C1", 1],
        ["C3", 3],
      ]
    },
  ])
})



test("1 threshold, some samples", () => {
  expect(
    processStackData(
      [0], 
      [
        { C2: 1, C1: 0, C3: 1 },
        { C2: 0, C1: 1, C3: 1 }
      ], 
      [
        { ...DEFAULT_SAMPLE, ood: 0.8 },
        { ...DEFAULT_SAMPLE, ood: 0.4 },
      ]
    )
  ).toStrictEqual([
    {
      name: "These samples are similar to up to 100% of the training data",
      data: [
        ["C2", 1],
        ["C1", 1],
        ["C3", 2],
      ]
    },
  ])
})