// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import dynamicFormatSeconds from "../dynamicFormatSeconds"

it("returns proper formats", () => {
  expect(dynamicFormatSeconds(1)).toEqual("1 second")
  expect(dynamicFormatSeconds(20.48)).toEqual("20.48 seconds")
  expect(dynamicFormatSeconds(40.96)).toEqual("40.96 seconds")
  expect(dynamicFormatSeconds(60)).toEqual("1 minute")
  expect(dynamicFormatSeconds(61.44)).toEqual("1.024 minutes")
  expect(dynamicFormatSeconds(3600)).toEqual("1 hour")
  expect(dynamicFormatSeconds(3601)).toEqual("1 hour")
  expect(dynamicFormatSeconds(4000)).toEqual("1.111 hours")
  expect(dynamicFormatSeconds(86400)).toEqual("1 day")
  expect(dynamicFormatSeconds(100000)).toEqual("1.157 days")
})
