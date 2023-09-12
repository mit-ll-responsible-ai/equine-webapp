// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import React from "react"

import "./progressBar.scss"

type Props = {
  percentage: number,
}

const ProgressBar = (props: Props) => (
  <div className="progressBarContainer">
    <div className="progressBar" style={{width: `${props.percentage}%`}}></div>
  </div>
)

export default ProgressBar
