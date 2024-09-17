// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import sampleData from "sampleData/sampleData.json"

import getAppClassCounts from "../getAppClassCounts"


const DEFAULT_SAMPLE = {
  ...sampleData.samples[0],
  ood: 0.5,
  processedClassProbabilities: sampleData.samples[0].classProbabilities,
}

test("basic example", () => {
  const samples = [
    {
      ...DEFAULT_SAMPLE,
      processedClassProbabilities: {
        "C2": 1,
        "C1": 0
      }
    },
    {
      ...DEFAULT_SAMPLE,
      processedClassProbabilities: {
        "C2": 1,
        "C3": 1
      }
    },
  ]

  expect(getAppClassCounts(samples)).toEqual({
    appClassCounts: { C2: 2, C1: 0, C3: 1 },
    labels: [ "C2", "C1", "C3" ]
  })
})