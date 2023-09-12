// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import sampleData from "sampleData/sampleData.json"

import getAppClassCounts from "../getAppClassCounts"


const DEFAULT_SAMPLE = {
  ...sampleData.samples[0],
  ood: 0.5,
  processed_app_class: sampleData.samples[0].app_class,
}

test("basic example", () => {
  const samples = [
    {
      ...DEFAULT_SAMPLE,
      processed_app_class: {
        "C2": 1,
        "C1": 0
      }
    },
    {
      ...DEFAULT_SAMPLE,
      processed_app_class: {
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