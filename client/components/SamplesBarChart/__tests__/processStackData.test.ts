// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import sampleData from "sampleData/sampleData.json"


import processStackData from "../processStackData"

const DEFAULT_SAMPLE = {
  ...sampleData.samples[0],
  ood: 0.5,
  processedClassProbabilities: sampleData.samples[0].classProbabilities,
}

test("empty oodThresholds and samples", () => {
  expect(processStackData([], [])).toStrictEqual([])
})

test("1 threshold, empty samples", () => {
  expect(processStackData([0], [])).toStrictEqual([
    {data: [], name: "These samples are similar to up to 100% of the training data"}
  ])
})

test("empty oodThresholds, some samples, should throw", () => {
  expect(
    () => processStackData([], [DEFAULT_SAMPLE])
  ).toThrow("OodThresholds must have some elements if there are samples")
})


test("4 thresholds, no overlapping samples", () => {
  const samples = [
    {
      ...DEFAULT_SAMPLE,
      ood: 0.8,
      processedClassProbabilities: {
        C2: 1,
        C1: 0,
        C3: 1,
      }
    },
    {
      ...DEFAULT_SAMPLE,
      ood: 0.4,
      processedClassProbabilities: {
        C2: 0,
        C1: 1,
        C3: 1,
      }
    },
  ]
  expect(
    processStackData([0, 0.25, 0.5, 0.75], samples)
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
  const samples = [
    {
      ...DEFAULT_SAMPLE,
      ood: 0.8,
      processedClassProbabilities: {
        C2: 1,
        C1: 0,
        C3: 1,
      }
    },
    {
      ...DEFAULT_SAMPLE,
      ood: 0.4,
      processedClassProbabilities: {
        C2: 0,
        C1: 1,
        C3: 1,
      }
    },
    {
      ...DEFAULT_SAMPLE,
      ood: 0.95,
      processedClassProbabilities: {
        C2: 0,
        C1: 1,
        C3: 1,
      }
    },
    {
      ...DEFAULT_SAMPLE,
      ood: 0.79,
      processedClassProbabilities: {
        C2: 1,
        C1: 0,
        C3: 1,
      }
    },
  ]
  expect(
    processStackData([0, 0.25, 0.5, 0.75], samples)
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
  const samples = [
    {
      ...DEFAULT_SAMPLE,
      ood: 0.8,
      processedClassProbabilities: {
        C2: 1,
        C1: 0,
        C3: 1,
      }
    },
    {
      ...DEFAULT_SAMPLE,
      ood: 0.4,
      processedClassProbabilities: {
        C2: 0,
        C1: 1,
        C3: 1,
      }
    },
  ]
  expect(
    processStackData([0], samples)
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