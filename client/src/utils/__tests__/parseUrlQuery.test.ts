// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import parseUrlQuery from "../parseUrlQuery"

it("parses queries properly", () => {
  expect(parseUrlQuery("?")).toEqual({})
  expect(parseUrlQuery("?modelName=testing")).toEqual({modelName: "testing"})
  expect(parseUrlQuery("?modelName=testing&anotherKey=123")).toEqual({modelName: "testing", anotherKey: "123"})
  expect(parseUrlQuery("?modelName=")).toEqual({modelName: ""})
})

it("handles URI encoded strings", () => {
  expect(parseUrlQuery("?model%20name=MyNewModel")).toEqual({"model name": "MyNewModel"})
  expect(parseUrlQuery("?modelName=My%20New%20Model")).toEqual({modelName: "My New Model"})
  expect(parseUrlQuery("?model%20name=My%20New%20Model")).toEqual({"model name": "My New Model"})
})

it("ignores everything before the first question mark", () => {
  expect(parseUrlQuery("modelName=testing?test=value")).toEqual({test: "value"})
})

it("parses strings without question marks", () => {
  expect(parseUrlQuery("")).toEqual({})
  expect(parseUrlQuery("modelName=testing")).toEqual({modelName: "testing"})
  expect(parseUrlQuery("modelName=testing&anotherKey=123")).toEqual({modelName: "testing", anotherKey: "123"})
  expect(parseUrlQuery("modelName=")).toEqual({modelName: ""})
})
