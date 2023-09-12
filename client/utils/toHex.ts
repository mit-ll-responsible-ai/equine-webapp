// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
/**
 * Given a color string, try to return its equivalent in 6 digit HEX
 * @param colorString could be HEX or RGB string, ie "rgb(12,34,56)"
 * @returns           HEX equivalent, ie "#123456"
 */
export default function toHex(colorString:string) {
  //regex to test hex code
  //https://stackoverflow.com/questions/8027423/how-to-check-if-a-string-is-a-valid-hex-color-representation
  if(/^#[0-9A-F]{6}$/i.test(colorString)) { //if this a hex string
    return colorString //return the hex string
  }

  //check if this is an RGB string
  const match = colorString.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/)
  if(match) { //if this is an RGB string
    return `#${decToHex(match[1])}${decToHex(match[2])}${decToHex(match[3])}` //convert it to HEX
  }

  //return #000000 with a warning
  console.warn(`'${colorString}' is not HEX or RGB. Returning #000000.`)
  return "#000000"
}

/**
 * Given a string in decimal, return its equivalent in HEX
 * @param str decimal string, ie "10"
 * @returns   hex equivalent with zero padding, ie "0A"
 */
export function decToHex(str:string) {
  const int = parseInt(str) || 0
  const hex = int.toString(16).toUpperCase()
  return hex.length === 1 ? `0${hex}` : hex
}