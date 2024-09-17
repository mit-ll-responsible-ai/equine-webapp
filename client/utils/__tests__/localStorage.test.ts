// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT

import { afterEach, describe, expect, it } from 'vitest'

import getLocalStorageItem, { parseStringValue } from "../localStorage/getLocalStorageItem"
import setLocalStorageItem from "../localStorage/setLocalStorageItem"

afterEach(() => {
  localStorage.clear()
})

describe("getLocalStorageItem and setLocalStorageItem",() => {
  it('parses string values properly', () => {
    expect(getLocalStorageItem("aaa","default")).toEqual("default") //resort to default if item is empty

    //test valid items
    setLocalStorageItem("aaa","")
    expect(getLocalStorageItem("aaa","default")).toEqual("")

    setLocalStorageItem("aaa","test")
    expect(getLocalStorageItem("aaa","default")).toEqual("test")
  })

  it('parses number values properly', () => {
    expect(getLocalStorageItem("aaa",10)).toEqual(10) //resort to default if item is empty

    //resort to default if item is invalid
    setLocalStorageItem("aaa","not a number")
    expect(getLocalStorageItem("aaa",10)).toEqual(10)

    //test valid items
    setLocalStorageItem("aaa",1)
    expect(getLocalStorageItem("aaa",10)).toEqual(1)

    setLocalStorageItem("aaa",1000)
    expect(getLocalStorageItem("aaa",10)).toEqual(1000)

    setLocalStorageItem("aaa",17.2)
    expect(getLocalStorageItem("aaa",10)).toEqual(17.2)
  })

  it('parses object values properly', () => {
    const tmpConsoleError = console.error
    console.error = () => {}

    expect(getLocalStorageItem("aaa",{})).toMatchObject({}) //resort to default if item is empty

    //resort to default if item is invalid
    setLocalStorageItem("aaa","not an object")
    expect(getLocalStorageItem("aaa",{})).toEqual({})

    //test valid items
    setLocalStorageItem("aaa",["a","b","c"])
    expect(getLocalStorageItem("aaa",{})).toMatchObject(["a","b","c"])

    setLocalStorageItem("aaa",{"a":1,"b":2,"c":3})
    expect(getLocalStorageItem("aaa",{})).toMatchObject({"a":1,"b":2,"c":3})

    console.error = tmpConsoleError
  })

  it('parses boolean values properly', () => {
    //resort to default if item is empty
    expect(getLocalStorageItem("aaa",true)).toEqual(true)
    expect(getLocalStorageItem("aaa",false)).toEqual(false)

    //resort to default if item is invalid
    setLocalStorageItem("aaa","not an boolean")
    expect(getLocalStorageItem("aaa",true)).toEqual(true)
    expect(getLocalStorageItem("aaa",false)).toEqual(false)

    //test valid items
    setLocalStorageItem("aaa",true)
    expect(getLocalStorageItem("aaa",true)).toEqual(true)
    setLocalStorageItem("aaa",true)
    expect(getLocalStorageItem("aaa",false)).toEqual(true)

    setLocalStorageItem("aaa",false)
    expect(getLocalStorageItem("aaa",true)).toEqual(false)
    setLocalStorageItem("aaa",false)
    expect(getLocalStorageItem("aaa",false)).toEqual(false)
  })
})


describe("parseStringValue", () => {
  it('parses string values properly', () => {
    expect(parseStringValue("test","default")).toEqual("test")
    expect(parseStringValue("","default")).toEqual("") //empty string
  })

  it('parses number values properly', () => {
    expect(parseStringValue("ABC",10)).toEqual(10) //use default value

    expect(parseStringValue("1",10)).toEqual(1)
    expect(parseStringValue("17.2",10)).toEqual(17.2) //float
    expect(parseStringValue("1000",10)).toEqual(1000)
  })

  it('parses object values properly', () => {
    expect(parseStringValue("1000",{})).toEqual({}) //use default value

    expect(parseStringValue('["a","b","c"]',[])).toEqual(["a","b","c"]) //array
    expect(parseStringValue('{"a":1,"b":2,"c":3}',{})).toEqual({"a":1,"b":2,"c":3}) //object
  })

  it('parses boolean values properly', () => {
    //use default values
    expect(parseStringValue("",true)).toEqual(true)
    expect(parseStringValue("",false)).toEqual(false)
    expect(parseStringValue("1000",true)).toEqual(true)
    expect(parseStringValue("1000",false)).toEqual(false)

    expect(parseStringValue('true',true)).toEqual(true)
    expect(parseStringValue('true',false)).toEqual(true)
    expect(parseStringValue('false',true)).toEqual(false)
    expect(parseStringValue('false',false)).toEqual(false)

  })
})
