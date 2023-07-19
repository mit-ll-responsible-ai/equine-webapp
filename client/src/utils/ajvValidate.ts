// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import Ajv from 'ajv'
import type { ValidateFunction } from 'ajv'

/**
 * Uses AJV to validate one or multiple schemas
 * If there is an error, this function will throw an Error with a formatted message based on the first error
 * If there is no error, this function returns the validate function
 * @param schema      one or an array of schemas
 * @param data        the data to be validated
 * @param preMessage  the pre message to be added at the front of the error message
 * @returns           AJV validate function
 */
export default function ajvValidate(
  schema:any|any[],
  data:any,
  preMessage?:string
) {
  const ajv = new Ajv() //create a new ajv instance
  let validate:ValidateFunction
  if(Array.isArray(schema)) { //if schema is an array
    if(schema.length === 0) { //input validation
      throw new Error(`Must provide at least one schema`) 
    }

    //compile all the schemas and get the last validate function
    validate = schema.reduce((_,s) => ajv.compile(s),null) as ValidateFunction
  }
  else {
    validate = ajv.compile(schema) //compile the schema
  }

  const result = validate(data) //validate the data
  if(!result && validate.errors) { //if there are errors
    const firstError = validate.errors[0] //get the first error
    const additionalProperty = firstError.params?.additionalProperty || "" //check if there are additional property errors
    const details = `${firstError.instancePath} ${firstError.message} ${additionalProperty?`'${additionalProperty}'`:""}`.trim()
    throw new Error(`${preMessage} ${details}`.trim())
  }
  return validate
}