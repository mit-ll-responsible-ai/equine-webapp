// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
/**
 * return true if the object has no fields
 * @param  obj input object
 * @return     true/false whether the object is emtpy
 */
export default function isEmptyObject(obj:object) {
  //iterate through the object's fields
  for(const field in obj) {
    return false //the object has fields, return false
  }

  return true //the object has no fields, return trie
}
