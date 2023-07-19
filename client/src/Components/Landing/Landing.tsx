// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT

import React, { useEffect } from "react"

import SettingsForm from "./SettingsForm/SettingsForm"

import setDocumentTitle from "utils/setDocumentTitle"

import "./landing.scss"


const Landing = () => {
  useEffect(() => {
    setDocumentTitle("Home")
  }, [])

  return (
    <div id="landing">
      <br/><br/><br/><br/>
      <img src="EQUI(NE)^2_Full_Logo.svg" alt="EQUINE"/>

      <div id="landingSettingsFormContainer">
        <SettingsForm/>
      </div>
    </div>
  )
}

export default Landing
