// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
/**
 * this function parses the query string in the url into a JS object with string values
 * ie "?modelName=testing&anotherKey=123" becomes {modelName: "testing", anotherKey: "123"}
 * @param  urlQuery query string (ie react router location.search)
 * @return          parsed object with string values
 */
export default function parseUrlQuery(urlQuery: string) {
  const query:{[key: string]: string} = {}

  const removeFirstQuestionMark = urlQuery.slice(urlQuery.indexOf("?") + 1) //slice off the first question mark
  if(removeFirstQuestionMark !== "") {
    //queries are deliminated by & characters
    removeFirstQuestionMark.split("&").forEach(d => {
      if(d !== "") {
        const split = d.split("=") //key and value are separated by = character
        query[decodeURIComponent(split[0])] = decodeURIComponent(split[1])
      }
    })
  }

  return query
}
