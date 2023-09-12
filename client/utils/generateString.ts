// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
/**
 * given a desired string length, generate a string
 * this is primarily used for testing to generate test strings
 * don't use this for cryptographic purposes, apparently Math.random has vulnerabilities, use the crypto package instead
 * @param  length desired string length
 * @return        randomly generated string
 */
export default function generateString(length:number) {
   let result = ''
   const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
   const charactersLength = characters.length
   for(let i=0; i<length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength))
   }
   return result
}
