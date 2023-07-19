// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
/**
 * this function strips the file extension from a string using a regex
 * https://stackoverflow.com/questions/4250364/how-to-trim-a-file-extension-from-a-string-in-javascript/4250408#4250408
 * @param  fileName
 * @return          fileName with everything removed after the last "."
 */
export default function stripFileExtension(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, "")
}
