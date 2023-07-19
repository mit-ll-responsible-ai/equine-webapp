// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import generateString from "../generateString"

describe("generateString", () => {
  it("generates strings of the proper length", () => {
    [0,10,50,100,500,1000,5000,10000].forEach(length => {
      const str = generateString(length)

      expect(typeof str).toEqual("string")
      expect(str.length).toEqual(length)
    })
  })

  it("generates an empty string for negative length values", () => {
    [-1,-2,-5,-10,-20,-100,-500,-1000,-100000].forEach(length => {
      const str = generateString(length)

      expect(typeof str).toEqual("string")
      expect(str.length).toEqual(0)
    })
  })
})
