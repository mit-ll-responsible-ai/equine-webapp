// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import clampValue from '../clampValue'

it("returns the value if it is in the middle",() => {
  expect(clampValue(10, [0,1,2], [11,12,13])).toEqual(10)
})

it("clamps the value using the highest min ",() => {
  expect(clampValue(-10, [-3,-4,-5],[1,2,3])).toEqual(-3)
})

it("clamps the value using the lowest min ",() => {
  expect(clampValue(51, [0,2,1],[18,17.7])).toEqual(17.7)
})
