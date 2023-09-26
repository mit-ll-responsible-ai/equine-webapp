// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import React from "react"
import Form from 'react-bootstrap/Form'
import { Typeahead } from 'react-bootstrap-typeahead'

import "./filterInput.scss"

type Props = {
  inputId: string,
  label: string,
  options: string[],
  placeholder: string,
  setFilterValues: (values:string[]) => void,
}

const FilterInput = (props:Props) => {
  const {
    inputId,
    label,
    options,
    placeholder,
    setFilterValues,
  } = props

  return (
    <div className="filterInput">
      <div>
        <Form.Group controlId={inputId}>
          <Form.Label><b>{label}</b></Form.Label>
          <Typeahead
            id={inputId}
            multiple
            onChange={(values) => setFilterValues(values as string[])}
            options={options}
            placeholder={placeholder}
          />
        </Form.Group>
      </div>
    </div>
  )
}

export default FilterInput;
