// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
/**
 * round a number using toPrecision given the value and the number of significant digits to keep
 * @param  value     number value to be rounded
 * @param  sigDigits number of significant digits to keep
 * @return           rounded value
 */
export default function roundSigDigits(value:number, sigDigits: number) {
  return parseFloat(value.toPrecision(sigDigits))
}
