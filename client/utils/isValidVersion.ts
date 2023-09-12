// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
/**
 * Given two version strings, check whether the versions are compatible on the patch version.
 * Return true if
 *   - both strings have the structure Major.Minor.Patch 
 *   - Major and Minor versions are the same
 * Else return false
 * https://docs.npmjs.com/about-semantic-versioning
 * @param version1 ex "1.2.3"
 * @param version2 ex "1.2.4"
 * @returns 
 */
export default function isValidVersion(version1:string, version2:string) {
  try {
    const split1 = version1.split(".")
    const split2 = version2.split(".")

    return split1.length===3
    && split2.length===3
    && split1[0]===split2[0] //same major version
    && split1[1]===split2[1] //same minor version
    //patch versions are ok to mismatch
  }
  catch(err) {
    console.error("There was an error comparing the versions", version1, version2, err)
    return false
  }
}
