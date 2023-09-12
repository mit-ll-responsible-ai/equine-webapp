// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import React from 'react'

import './coloredLabel.scss'

type Props = {
  color: string,
  label: string,
}

const ColoredLabel = (props:Props) => (
  <span className="coloredLabel" style={{backgroundColor:props.color}}>{props.label}</span>
)

export default ColoredLabel