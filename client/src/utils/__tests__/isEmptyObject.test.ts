// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import isEmptyObject from "../isEmptyObject";

describe("isEmptyObject", () => {
  it("should return true to empty objects", () => {
    expect(isEmptyObject({})).toEqual(true)
  })

  it("should return false for non empty objects", () => {
    expect(isEmptyObject({
      a: "test",
      b: 123,
    })).toEqual(false)

    expect(isEmptyObject({
      testing: () => {},
      a: "test",
      b: 123,
    })).toEqual(false)

    expect(isEmptyObject({
      testing: {
        a: "test",
        b: 123,
      }
    })).toEqual(false)
  })
})
