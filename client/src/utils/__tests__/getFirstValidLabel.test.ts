// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import getFirstValidLabel from "../getFirstValidLabel"

it("returns the first label with value 1", () => {
  expect(
    getFirstValidLabel({test: 1})
  ).toEqual("test")

  expect(
    getFirstValidLabel({
      ignore: 0,
      disregard: 0.5,
      no: 0.999,
      skip: 2,
      test: 1,
      never: 1,
    })
  ).toEqual("test")
})

it("returns an empty string if no labels are 1", () => {
  expect(
    getFirstValidLabel({test: 1})
  ).toEqual("test")

  expect(
    getFirstValidLabel({
      ignore: 0,
      disregard: 0.5,
      no: 0.999,
      skip: 2,
    })
  ).toEqual("")
})
