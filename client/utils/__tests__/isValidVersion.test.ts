// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT

import { expect, it } from 'vitest'

import isValidVersion from "../isValidVersion"

it("returns true for valid versions", () => {
  expect(isValidVersion("1.2.3","1.2.3")).toEqual(true)
  expect(isValidVersion("1.2.3","1.2.4")).toEqual(true)
  expect(isValidVersion("1.2.3","1.2.5")).toEqual(true)

  expect(isValidVersion("10.27.0","10.27.0")).toEqual(true)
  expect(isValidVersion("10.27.0","10.27.1")).toEqual(true)
  expect(isValidVersion("10.27.0","10.27.5")).toEqual(true)
  expect(isValidVersion("10.27.0","10.27.100")).toEqual(true)
})


it("returns false for invalid versions", () => {
  expect(isValidVersion("1.2.3","1.3.3")).toEqual(false)
  expect(isValidVersion("1.2.3","1.4.3")).toEqual(false)
  expect(isValidVersion("1.2.3","1.5.3")).toEqual(false)

  expect(isValidVersion("10.27.0","11.27.0")).toEqual(false)
  expect(isValidVersion("10.27.0","12.27.0")).toEqual(false)
  expect(isValidVersion("10.27.0","13.27.0")).toEqual(false)
  expect(isValidVersion("10.27.0","14.27.0")).toEqual(false)
})


it("returns false for malformed versions", () => {
  expect(isValidVersion("1.2","1.2.3")).toEqual(false) //too short
  expect(isValidVersion("blah","1.2.5")).toEqual(false) //too short
  expect(isValidVersion("10.27.0","test")).toEqual(false) //too short
  expect(isValidVersion("1.2.3","1.2.3.4")).toEqual(false) //too long
  expect(isValidVersion("1.2.3.4","1.2.3")).toEqual(false) //too long
})
