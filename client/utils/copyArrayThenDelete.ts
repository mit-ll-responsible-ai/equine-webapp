// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
/**
 * This function makes a shallow copy of the array with slice,
 * then deletes the element at the deleteIndex.
 * This is useful for deleting array elements in React component state,
 * which should not be deleted in place.
 * @param  arr         array to be copied
 * @param  deleteIndex index of element to be deleted
 * @return             copied array with element deleted
 */
export default function copyArrayThenDelete(arr: any[], deleteIndex: number) {
  const copy = arr.slice()
  copy.splice(deleteIndex, 1)
  return copy
}
