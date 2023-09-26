// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import getLocalStorageItem from "./getLocalStorageItem"
import setLocalStorageItem from "./setLocalStorageItem"
import clientPackageJson from "@/package.json"

//if the site version is different
if(getLocalStorageItem("version","") !== clientPackageJson.version) {
  window.localStorage.clear() //clear local storage
}
setLocalStorageItem("version", clientPackageJson.version) //set the version in local storage
