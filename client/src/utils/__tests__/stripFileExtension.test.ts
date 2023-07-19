// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import stripFileExtension from "../stripFileExtension"

it("strips the file extensions properly", () => {
  expect(stripFileExtension("testing123.h5")).toEqual("testing123")
  expect(stripFileExtension("some.thing.h5")).toEqual("some.thing")
  expect(stripFileExtension("1.2.3.4.5.6.7.8.9.0")).toEqual("1.2.3.4.5.6.7.8.9")

  expect(stripFileExtension("")).toEqual("")
  expect(stripFileExtension("testing")).toEqual("testing")
  expect(stripFileExtension("testing123")).toEqual("testing123")
})
