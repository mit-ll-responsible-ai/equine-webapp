// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT

/**
 * tries to get the value from local storage, else returns the default value
 * @param  key            key
 * @param  defaultValue   the default value
 * @return                either the parsed local storage value or the default value
 */
export default function getLocalStorageItem(key:string, defaultValue:string | number | boolean | object) { //TODO add test
  return parseStringValue(
    typeof window!=="undefined" ? window.localStorage.getItem(key) : null, //get the value as a string or null
    defaultValue
  )
}

/**
 * given a string value and the default value, will try to parse the string value into the same type, else return the default value
 * @param  value         the string value to parse
 * @param  defaultValue  the default value to get the type from
 * @return               the parsed string value or the default value
 */
export function parseStringValue(value:string | null, defaultValue:string | number | boolean | object) {
  if(value !== null) { //if the value is not null
    if(typeof defaultValue === "number") { //if this is a number
      const num = parseFloat(value) //try to parse the string
      if(!isNaN(num)) { //if this is a number
        return num
      }
    }
    else if(typeof defaultValue === "object") { //if this is an object
      try {
        const obj = JSON.parse(value) //JSON parse the string
        if(typeof obj === "object") { //if the value is not an object type
          return obj
        }
      }
      catch(err) {
        console.error("There was an error trying to JSON parse this string:", value, err)
      }
    }
    else if(typeof defaultValue === "boolean") { //if this is a boolean
      if(value === "true") {
        return true
      }
      else if(value === "false") {
        return false
      }
      //else the string is not valid, return the default value
    }
    else { //else return the string
      return value
    }
  }

  return defaultValue //return the default value
}
