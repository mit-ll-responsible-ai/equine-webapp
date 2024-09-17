// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT

import { expect, it } from 'vitest'

import roundSigDigits from "../roundSigDigits"

it("rounds integers properly", () => {
  expect(roundSigDigits(1234567890, 1)).toEqual(1000000000)
  expect(roundSigDigits(1234567890, 2)).toEqual(1200000000)
  expect(roundSigDigits(1234567890, 3)).toEqual(1230000000)
  expect(roundSigDigits(1234567890, 4)).toEqual(1235000000) //the 4 should get rounded up
  expect(roundSigDigits(1234567890, 5)).toEqual(1234600000) //the 5 should get rounded up
  expect(roundSigDigits(1234567890, 6)).toEqual(1234570000) //the 6 should get rounded up
  expect(roundSigDigits(1234567890, 7)).toEqual(1234568000) //the 7 should get rounded up
  expect(roundSigDigits(1234567890, 8)).toEqual(1234567900) //the 8 should get rounded up
  expect(roundSigDigits(1234567890, 9)).toEqual(1234567890)
  expect(roundSigDigits(1234567890, 10)).toEqual(1234567890)
})


it("rounds decimals properly", () => {
  expect(roundSigDigits(0.123456789000, 1)).toEqual(0.1)
  expect(roundSigDigits(0.123456789000, 2)).toEqual(0.12)
  expect(roundSigDigits(0.123456789000, 3)).toEqual(0.123)
  expect(roundSigDigits(0.123456789000, 4)).toEqual(0.1235)
  expect(roundSigDigits(0.123456789000, 5)).toEqual(0.12346)
  expect(roundSigDigits(0.123456789000, 6)).toEqual(0.123457)
  expect(roundSigDigits(0.123456789000, 7)).toEqual(0.1234568)
  expect(roundSigDigits(0.123456789000, 8)).toEqual(0.12345679)
  expect(roundSigDigits(0.123456789000, 9)).toEqual(0.123456789)
  expect(roundSigDigits(0.123456789000, 10)).toEqual(0.123456789)

  expect(roundSigDigits(0.00123456789000, 1)).toEqual(0.001)
  expect(roundSigDigits(0.00123456789000, 2)).toEqual(0.0012)
  expect(roundSigDigits(0.00123456789000, 3)).toEqual(0.00123)
  expect(roundSigDigits(0.00123456789000, 4)).toEqual(0.001235)
  expect(roundSigDigits(0.00123456789000, 5)).toEqual(0.0012346)
  expect(roundSigDigits(0.00123456789000, 6)).toEqual(0.00123457)
  expect(roundSigDigits(0.00123456789000, 7)).toEqual(0.001234568)
  expect(roundSigDigits(0.00123456789000, 8)).toEqual(0.0012345679)
  expect(roundSigDigits(0.00123456789000, 9)).toEqual(0.00123456789)
  expect(roundSigDigits(0.00123456789000, 10)).toEqual(0.00123456789)
})

it("rounds smaller decimals properly", () => {
  expect(roundSigDigits(0.00123456789000, 1)).toEqual(0.001)
  expect(roundSigDigits(0.00123456789000, 2)).toEqual(0.0012)
  expect(roundSigDigits(0.00123456789000, 3)).toEqual(0.00123)
  expect(roundSigDigits(0.00123456789000, 4)).toEqual(0.001235)
  expect(roundSigDigits(0.00123456789000, 5)).toEqual(0.0012346)
  expect(roundSigDigits(0.00123456789000, 6)).toEqual(0.00123457)
  expect(roundSigDigits(0.00123456789000, 7)).toEqual(0.001234568)
  expect(roundSigDigits(0.00123456789000, 8)).toEqual(0.0012345679)
  expect(roundSigDigits(0.00123456789000, 9)).toEqual(0.00123456789)
  expect(roundSigDigits(0.00123456789000, 10)).toEqual(0.00123456789)
})


it("rounds floats properly", () => {
  expect(roundSigDigits(123000.0456789, 1)).toEqual(100000)
  expect(roundSigDigits(123000.0456789, 2)).toEqual(120000)
  expect(roundSigDigits(123000.0456789, 3)).toEqual(123000)
  expect(roundSigDigits(123000.0456789, 4)).toEqual(123000)
  expect(roundSigDigits(123000.0456789, 5)).toEqual(123000)
  expect(roundSigDigits(123000.0456789, 6)).toEqual(123000)
  expect(roundSigDigits(123000.0456789, 7)).toEqual(123000)
  expect(roundSigDigits(123000.0456789, 8)).toEqual(123000.05)
  expect(roundSigDigits(123000.0456789, 9)).toEqual(123000.046)
  expect(roundSigDigits(123000.0456789, 10)).toEqual(123000.0457)
  expect(roundSigDigits(123000.0456789, 11)).toEqual(123000.04568)
  expect(roundSigDigits(123000.0456789, 12)).toEqual(123000.045679)
  expect(roundSigDigits(123000.0456789, 13)).toEqual(123000.0456789)
  expect(roundSigDigits(123000.0456789, 14)).toEqual(123000.0456789)
})
