// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import React from 'react'

import Form from 'react-bootstrap/Form'

import { INPUT_DATA_TYPES, InputDataType, setInputDataType } from '@/redux/inferenceSettings'
import { useAppDispatch, useAppSelector } from '@/redux/reduxHooks'

export default function SelectInputDataType({
  title="2) Select Your Input Data Type"
}:{
  title?: string,
}) {
  const inputDataType = useAppSelector(state => state.inferenceSettings.inputDataType)
  const dispatch = useAppDispatch()

  return (
    <Form.Group controlId="inputDataType">
      <Form.Label>{title}</Form.Label>
      <Form.Control as="select" value={inputDataType} onChange={
        (e) => dispatch(
          setInputDataType(e.target.value as InputDataType)
        )
      }>
        {INPUT_DATA_TYPES.map(t => 
          <option key={t} value={t}>{t}</option>
        )}
      </Form.Control>
    </Form.Group>
  )
}
