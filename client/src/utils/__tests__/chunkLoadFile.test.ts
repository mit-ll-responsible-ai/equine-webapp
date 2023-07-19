// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import chunkLoadFile from "../chunkLoadFile"
import generateString from "utils/generateString"

describe("chunkLoadFile", () => {
  it("should load a file for various file/chunk sizes in the right chunk order", async () => {
    const fileChunkSizePairs = [ //file size, chunk size
      [10,1], //10 byte file, 1 byte chunk size
      [1234,1024],
      [5000,1024],
      [10000,2000],
    ]

    for(const pair of fileChunkSizePairs) {
      const fileSize = pair[0]
      const chunkSize = pair[1]

      //set up the test
      const fileContents = generateString(fileSize) //generate test file content
      const file = new Blob([fileContents], {type : 'text/plain'}) //create a test file
      const readAsBinaryStringSpy = jest.spyOn(FileReader.prototype, 'readAsBinaryString') //spy on the file reader function
      const numExpectedChunks = Math.ceil(fileContents.length / chunkSize) //the expected number of chunks
      let callbackIndex = 0 //used to determine expected file content and number of function calls

      await chunkLoadFile(
        file,
        (result) => {
          const currentIndex = chunkSize*callbackIndex //get the start index for the file content
          const expectedResult = fileContents.slice(currentIndex,currentIndex+chunkSize) //get the expected string

          expect(result).toEqual(expectedResult) //test that the function is calling back the expected chunk in the right order
          expect(readAsBinaryStringSpy).toHaveBeenLastCalledWith(new Blob())

          callbackIndex++ //increment out callback idnex
        },
        chunkSize
      )

      expect(callbackIndex).toEqual(numExpectedChunks) //make sure our callback function was called
      expect(readAsBinaryStringSpy).toHaveBeenCalledTimes(numExpectedChunks) //make sure the file reader was called

      jest.clearAllMocks() //clear the mocks for the next test
    }
  })
})
