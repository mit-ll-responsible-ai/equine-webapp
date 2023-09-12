// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
/**
 * Keep the given value between the given mins and maxes.
 * Useful for handle a value that uses multiple filters,
 * such as in the DoubleSlider component.
 * @param  value value to possibly be clamped
 * @param  mins  array of mins
 * @param  maxes array of maxes
 * @return       clamped value
 */
export default function clampValue(value:number, mins:number[], maxes:number[]) {
  return Math.max(...mins, Math.min(...maxes, value))
}
