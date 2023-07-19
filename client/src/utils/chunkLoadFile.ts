// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
/**
 * given a file and callback, return a Promise to read the file in chunks
 * we do this in case the user wants to send a huge file that would exceed the browser memory capacity
 * this is conceptually the same as "stream reading" a file
 * code modified from https://stackoverflow.com/questions/25810051/filereader-api-on-big-files
 * @param  file      file to read
 * @param  callback  callback with the file chunk as the argument
 * @param  chunkSize in bytes, defaults to 10KB
 * @return           Promise
 */
export default (
  file: File,
  callback: (result:FileReader["result"]) => void,
  chunkSize:number = 10240 //default 10KB
) => new Promise((resolve, reject) => {
  let currentIndex = 0

  const fr = new FileReader() //create the file reader
  fr.onload = () => { //callback that runs when the chunk is done reading
    try {
      callback(fr.result) //set the chunk result to the callback
    }
    catch(error) { //if there is an error from the callback, don't worry about it
      console.error(error)
    }
    currentIndex += chunkSize //move to the next chunk
    readNextChunk() //move to read the next chunk
  }
  fr.onerror = (ev:ProgressEvent<FileReader>) => {
    console.log("ev",ev)
    reject(ev)
  }

  function readNextChunk() {
    if(currentIndex >= file.size) { //if we have reached the end of the file
      resolve() //we are done reading
    }
    else {
      //read the next chunk of the file
      const slice = file.slice(currentIndex, currentIndex + chunkSize)
      fr.readAsBinaryString(slice)
    }
  }

  readNextChunk() //start reading the first chunk
})
