// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT

import { expect, it } from 'vitest'

import copyArrayThenDelete from "../copyArrayThenDelete"

it("deletes elements in a copy of the array", () => {
  const N = 50
  const arr = Array.from(Array(N).keys()) //make an array [0,1,2,...,N-1]

  arr.forEach((e,i) => {
    expect(arr).toMatchObject(Array.from(Array(N).keys())) //the original array should be untouched

    const expectedCopy = arr.slice()
    expectedCopy.splice(i,1)
    expect(copyArrayThenDelete(arr, i)).toMatchObject(expectedCopy)
  })
})
