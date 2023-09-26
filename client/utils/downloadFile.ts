// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import handleFetchResponse from "@/utils/handleFetchResponse"

/**
 * @param  data     data as a string to be put into file
 * @param  fileName filename
 * @param  type     file type
 */
export function downloadStringAsFile(
  data:string="",
  fileName:string="data.json",
  type:string="data:text/json;charset=utf-8",
) {
  const file = new Blob([data], {type: type}) //build a Blob file to download

  downloadBlobAsFile(file, fileName)
}

/**
 * this function fetches a url, then tries to download the response as a file
 * anchors will automatically download href urls if they are a file type
 * but this function is necessary for downloading a file from an API
 * otherwise the anchor would simply redirect to the api url
 * @param  nonFileUrl url that is not a explicitly a file
 * @param  fileName   filename
 * @return            Fetch Promise
 */
export function downloadUrlAsFile(
  nonFileUrl:string,
  fileName: string,
) {
  return fetch(nonFileUrl).then(
    handleFetchResponse
  ).then(
    resp => resp.blob() //convert the response data into a blob
  ).then(blob => {
    downloadBlobAsFile( //download the blob
      blob,
      fileName
    )
  })
  .catch(err => {
    throw err
  })
}


/**
 * @param  data     data as a string to be put into file
 * @param  fileName filename
 * @param  type     file type
 */
export function downloadBlobAsFile(
  blob: Blob,
  fileName: string,
) {
  const url = window.URL.createObjectURL(blob) //convert the file into a url string
  downloadFile(url, fileName)
}


/**
 * @param  url      url to download
 * @param  fileName filename
 */
export default function downloadFile(
  url: string,
  fileName: string,
) {
  const a = document.createElement("a") //make a dummy anchor element

  //set the data on the anchor
  a.href = url
  a.download = fileName

  document.body.appendChild(a) //append the anchor to the DOM
  a.click() //click the anchor to download the file
  setTimeout( //set a timeout to run ASAP
    function() {
      document.body.removeChild(a) //remove the anchor from the DOM
      window.URL.revokeObjectURL(url)
    },
    0
  )
}
