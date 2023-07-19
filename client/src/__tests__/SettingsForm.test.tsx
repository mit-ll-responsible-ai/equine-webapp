// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import React from 'react'
import { BrowserRouter } from "react-router-dom"
import { fireEvent, screen } from '@testing-library/react'
import { render  } from 'redux/testUtils'
import { waitFor } from '@testing-library/dom'

import SettingsForm from 'Components/Landing/SettingsForm/SettingsForm'
import { act } from 'react-dom/test-utils'

import fetchMock from 'fetch-mock'


describe('<SettingsForm/>', () => {
  afterEach(() => {
    fetchMock.restore()
  })

  it('should render the settings for the pipeline', async () => {
    process.env.REACT_APP_SERVER_URL = `http://localhost`
    fetchMock.post(`http://localhost/graphql`,{
      status: 200,
      body: JSON.stringify({data:{models:[]}})
    })

    const { store } = render(<BrowserRouter><SettingsForm connectionStatus="connected"/></BrowserRouter>)

    await waitFor(() => {
      const dataInput = screen.getByLabelText("Select File(s)")
      expect(dataInput).toBeInTheDocument()
    })
  })

  it('should let the user select different models', async () => {
    const models = [
      {name: "model1.h5", last_modified: 1000},
      {name: "model2.h5", last_modified: 1000},
    ]
    process.env.REACT_APP_SERVER_URL = `http://localhost`
    fetchMock.post(`http://localhost/graphql`,{
      status: 200,
      body: JSON.stringify({data:{models}})
    })

    const { store } = render(<BrowserRouter><SettingsForm connectionStatus="connected"/></BrowserRouter>)

    //test mode dropdown
    const modelSelect = await waitFor(() => {
      const modelSelect = screen.getByLabelText("Select a Model to Use for Analysis")
      expect(modelSelect).toBeInTheDocument()
      return modelSelect
    })
    const modelSelectOptions = {
      //the models should appear as options
      "model1.h5": async () => {},
      "model2.h5": async () => {},
      // default_rf: async () => {},
      custom: async () => {
        expect(screen.queryByText("Train a New Model")).toBeInTheDocument()

        //can upload a model file
        const file1 = new File(["testing"], "myModel.h5")
        const selectModelInput = screen.queryByLabelText("Select EQUI(NE)² Model File")
        Object.defineProperty(selectModelInput, 'files', {
          value: [file1]
        })
        act(() => {
          fireEvent.change(selectModelInput)
        })
        expect(screen.queryByText("myModel.h5")).toBeInTheDocument() //model file name appears on screen
      },
    }

    //wait for the options to appear
    await waitFor(() => {
      expect(screen.queryByText("model1.h5")).toBeInTheDocument()
    })
    for(const option in modelSelectOptions) {
      act(() => {
        fireEvent.change(modelSelect, { target: { value:option } })
      })
      expect(modelSelect.value).toBe(option)

      await modelSelectOptions[option]()
    }
  })
})
