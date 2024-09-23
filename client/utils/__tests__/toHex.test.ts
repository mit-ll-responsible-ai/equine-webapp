// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT

import { describe, expect, it, test } from 'vitest'

import toHex, { decToHex } from "../toHex"

describe("toHex", () => {
  test("returns HEX strings as is", () => {
    const hexes = ["#000000", "#123456", "#789ABC", "#ABCDEF"]
    hexes.forEach(h => {
      expect(toHex(h)).toEqual(h)
    })
  })

  test("converts RGB to HEX", () => {
    expect(toHex("rgb(0,0,0)")).toEqual("#000000")
    expect(toHex("rgb(1,2,3)")).toEqual("#010203")
    expect(toHex("rgb(18, 52, 86)")).toEqual("#123456")
    expect(toHex("rgb(120,154,188)")).toEqual("#789ABC")
    expect(toHex("rgb(171,205,239)")).toEqual("#ABCDEF")
  })

  test("for other strings, returns black with a warning", () => {
    expect(toHex("#fff")).toEqual("#000000")
    expect(toHex("testing")).toEqual("#000000")
  })
})

describe("decToHex", () => {
  it("converts decimal strings to hex with zero padding", () => {
    expect(decToHex("0")).toEqual("00")
    expect(decToHex("1")).toEqual("01")
    expect(decToHex("2")).toEqual("02")
    expect(decToHex("3")).toEqual("03")
    expect(decToHex("4")).toEqual("04")
    expect(decToHex("5")).toEqual("05")
    expect(decToHex("10")).toEqual("0A")
    expect(decToHex("11")).toEqual("0B")
    expect(decToHex("15")).toEqual("0F")
    expect(decToHex("16")).toEqual("10")
    expect(decToHex("100")).toEqual("64")
    expect(decToHex("200")).toEqual("C8")
    expect(decToHex("255")).toEqual("FF")
  })

  test("invalid strings are returned as 00", () => {
    expect(decToHex("")).toEqual("00")
    expect(decToHex(" ")).toEqual("00")
    expect(decToHex("A")).toEqual("00")
    expect(decToHex("testing")).toEqual("00")
  })
})