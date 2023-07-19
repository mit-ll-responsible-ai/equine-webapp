// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import React from 'react'

type Props = {
  error?: React.ReactNode,
}

const InputError = (props: Props) => (
  props.error
  ? <div style={{color: "#EC7063", fontSize: "0.9em"}}>{props.error}</div>
  : null
)

export default InputError