// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
/**
 * given a procssed_app_class object from a sample, return the first encountered valid label (ie score === 1)
 * @param  procssed_app_class from data sample
 * @return                    the first label with value 1, else an empty string ""
 */
export default function getFirstValidLabel(procssed_app_class:{[label:string]: number}) {
  for(const label in procssed_app_class) {
    if(procssed_app_class[label] === 1) {
      return label
    }
  }
  return ""
}
