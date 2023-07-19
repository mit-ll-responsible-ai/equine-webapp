// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
/**
 * this function is used to handle the response after calling fetch
 * since fetch throws an error ONLY on network errors
 * this function will also handle responses with errors (ie 4xx, 5xx, etc)
 * @param  res Response from fetch
 * @return     if the response is ok, this returns the response, else throws an error
 */
export default async function handleFetchResponse(res: Response) {
  if(!res.ok) { //if the response was not ok
    //try to throw something meaningful from the response
    throw new Error(await res.text() || res.statusText || res.status.toString())
  }
  return res
}
