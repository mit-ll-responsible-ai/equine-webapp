// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import roundSigDigits from "utils/roundSigDigits"

/**
 * this function tries to format seconds
 * by using the highest time unit (ie minute, hour, etc) that is >= 1
 * @param  seconds   time in seconds to format
 * @param  sigDigits number of significant digits to keep
 * @return           formatted time string
 */
export default function dynamicFormatSeconds(
  seconds: number,
  sigDigits:number=4,
) {
  let label = "second"
  let time = seconds

  if(time >= 60) { //if this is more than a minute
    time /= 60
    label = "minute"

    if(time >= 60) { //if this is more than an hour
      time /= 60
      label = "hour"

      if(time >= 24) { //if this is more than a day
        time /= 24
        label = "day"
      }

      //in theory more threshold could be added
    }
  }

  const rounded = roundSigDigits(time, sigDigits) //round the time so we don't have too many digits

  return `${rounded} ${label}${rounded===1?"":"s"}` //return the formatted string, with plurality taken into account
}
