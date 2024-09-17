// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT

import { expect, it } from 'vitest'

import ajvValidate from "../ajvValidate"

// Based on the example in their README https://github.com/ajv-validator/ajv
const schema = {
  type: "object",
  properties: {
    foo: {type: "integer"}
  },
  required: ["foo"],
  additionalProperties: false,
}


it("returns the validate function if the data is valid",() => {
  const data = { foo: 1 }

  expect(ajvValidate(schema,data,"Test premessage.").name.indexOf("validate")).toEqual(0)
})


it("throws an Error with a formatted message on invalid data",() => {
  const data = { foo: "1" }

  expect(() => {
    ajvValidate(schema,data,"Test invalid schema premessage.")
  }).toThrow("Test invalid schema premessage. /foo must be integer")
})

it("throws an Error with a formatted message on missing fields",() => {
  const data = { }

  expect(() => {
    ajvValidate(schema,data,"Test missing field premessage.")
  }).toThrow("Test missing field premessage. must have required property 'foo'")
})


it("can ingest multiple schemas",() => {
  const schema = {
    $id: "http://example.com/schemas/schema.json",
    type: "object",
    properties: {
      foo: {$ref: "defs.json#/definitions/int"},
      bar: {$ref: "defs.json#/definitions/str"},
    },
  }
  
  const defsSchema = {
    $id: "http://example.com/schemas/defs.json",
    definitions: {
      int: {type: "integer"},
      str: {type: "string"},
    },
  }

  const data = { foo: 1 }

  expect(ajvValidate([defsSchema,schema],data,"Test premessage.").name.indexOf("validate")).toEqual(0)
})

it("throws an error if the schemas array is empty",() => {
  expect(() => {
    ajvValidate([],{},"")
  }).toThrow("Must provide at least one schema")
})

it("throws an Error with a formatted message for multiple schemas",() => {
  const schema = {
    $id: "http://example.com/schemas/schema.json",
    type: "object",
    properties: {
      foo: {$ref: "defs.json#/definitions/int"},
      bar: {$ref: "defs.json#/definitions/str"},
    },
  }
  
  const defsSchema = {
    $id: "http://example.com/schemas/defs.json",
    definitions: {
      int: {type: "integer"},
      str: {type: "string"},
    },
  }

  const data = { foo: "1" }

  expect(() => {
    ajvValidate([defsSchema,schema],data,"Test multiple schemas premessage.")
  }).toThrow("Test multiple schemas premessage. /foo must be integer")
})