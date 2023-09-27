// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT

import React, { useEffect } from "react"

import SettingsForm from "./SettingsForm/SettingsForm"

import setDocumentTitle from "@/utils/setDocumentTitle"

import logo from "@/public/EQUI(NE)^2_Full_Logo.svg"

import styles from "./Landing.module.scss"

const Landing = () => {
  useEffect(() => {
    setDocumentTitle("Home")
  }, [])

  return (
    <div id={styles.landing}>
      <br/><br/><br/><br/>
      <img src={logo.src} alt="EQUINE"/>

      <div id={styles.landingSettingsFormContainer}>
        <SettingsForm/>
      </div>
    </div>
  )
}

export default Landing
