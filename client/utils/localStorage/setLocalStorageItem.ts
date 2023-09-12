// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT

/**
 * tries to set the value from local storage
 * @param  {String} key                       key
 * @param  {String | Number | Object} value   value to save
 * @return {Boolean}                          whether the operation was successful
 */
function setLocalStorageItem(key:string, value:any) {
  if(typeof value === "object") { //if this is an object
    value = JSON.stringify(value) //stringify the object first
  }
  try { //the value might exceed the local storage capacity
    window.localStorage.setItem(key, value)
    return true
  }
  catch(error) {
    console.error(error)
    return false
  }
}

export default setLocalStorageItem
