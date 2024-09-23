// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import { expect, test } from 'vitest'

import getClassCounts from "../getClassCounts"


test("basic example", () => {
  const processedClassesProbabilities = [
    { C1: 0, C2: 0, C3: 1 },
    { C1: 1, C2: 0, C3: 0 },
    { C1: 0, C2: 1, C3: 0 },
    { C1: 1, C2: 0, C3: 0 },
    { C1: 0, C2: 0, C3: 1 },
    { C1: 0, C2: 0, C3: 1 },
  ]

  expect(getClassCounts(processedClassesProbabilities)).toEqual({
    classCounts: { C1: 2, C2: 1, C3: 3 },
    labels: [ "C1", "C2", "C3" ]
  })
})

