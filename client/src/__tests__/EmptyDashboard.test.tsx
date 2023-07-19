// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import React from 'react'
import { createMemoryHistory } from "history"
import { Router } from "react-router-dom"
import { cleanup, fireEvent, screen } from '@testing-library/react'
import { render  } from 'redux/testUtils'
import { waitFor } from '@testing-library/dom'

import packageJson from "../../package.json"
import { ROUTES } from "App"

import EmptyDashboard from 'Components/Dashboard/EmptyDashboard'

import sampleData from "sampleData/sampleData.json"


describe('<EmptyDashboard/>', () => {
  const version = "0.0.0"

  it('should render the empty dashboard', async () => {
    const { history, store, utils } = renderEmptyDashboard()

    fireEvent.click(screen.queryByText("Home Page"))

    expect(store.getState().samples).toEqual([]) //samples state is unchanged
    expect(history.location.pathname).toEqual(ROUTES.LANDING) //redirect
  })


  
  it('should let a user upload a sample file', async () => {
    const { history, store, utils } = renderEmptyDashboard()

    const jsonInput = screen.getByLabelText("Upload JSON File")

    const file = new Blob([JSON.stringify({
      modelName: "test.h5",
      samples: [VALID_SAMPLE],
      version,
    })], {type : 'text/plain'})
    Object.defineProperty(jsonInput, 'files', {
      value: [file],
    })
    fireEvent.change(jsonInput)

    expect(store.getState().modal).toMatchObject({header: "Reading File...", show: true})
    expect(store.getState().inferenceSettings.load_model_path).toEqual("default_proto")
    await waitFor(() => {
      expect(store.getState().modal).toMatchObject({
        show: true,
        body: `The uploaded file version 0.0.0 is different from the current app version ${packageJson.version}. You may encounter bugs.`
      })
      expect(store.getState().inferenceSettings.load_model_path).toEqual("test.h5") //the model file name is set to state
    })

    expect(store.getState().inferenceSettings.samples).toEqual([{
      ...VALID_SAMPLE,
      processed_app_class: VALID_SAMPLE.app_class
    }]) //sample was added to state
    expect(history.location.pathname).toEqual(ROUTES.DASHBOARD)
  })



  it('should successfully upload all of our sample data sets', async () => {
    const data = [
      sampleData,
    ].map(d => d.samples)

    for(const samples of data) {
      const { history, store, utils } = renderEmptyDashboard()

      const jsonInput = screen.getByLabelText("Upload JSON File")


      const file = new Blob([JSON.stringify({
        modelName: "test.h5",
        samples,
        version,
      })], {type : 'text/plain'})
      Object.defineProperty(jsonInput, 'files', {
        value: [file],
      })
      fireEvent.change(jsonInput)

      expect(store.getState().modal).toMatchObject({header: "Reading File...", show: true})
      expect(store.getState().inferenceSettings.load_model_path).toEqual("default_proto")
      await waitFor(() => {
        expect(store.getState().modal).toMatchObject({
          show: true,
          body: `The uploaded file version 0.0.0 is different from the current app version ${packageJson.version}. You may encounter bugs.`
        })
        expect(store.getState().inferenceSettings.load_model_path).toEqual("test.h5") //the model file name is set to state
      })

      expect(store.getState().samples).toEqual( //sample was added to state
        samples.map(s => ({
          ...s,
          processed_app_class: s.app_class
        }))
      ) 
      expect(history.location.pathname).toEqual(ROUTES.DASHBOARD)

      cleanup() //clean up the dom for the next iteration
    }
  })



  it('should show an error if the data is empty', async () => {
    const { history, store, utils } = renderEmptyDashboard()

    const file = new Blob([JSON.stringify({
      modelName: "should not be set to state.h5",
      samples: [],
      version
    })], {type : 'text/plain'})
    const jsonInput = screen.getByLabelText("Upload JSON File")
    Object.defineProperty(jsonInput, 'files', {
      value: [file]
    })
    fireEvent.change(jsonInput)

    expect(store.getState().modal).toMatchObject({header: "Reading File...", show: true})
    await waitFor(() => {
      expect(store.getState().modal).toMatchObject({body: "The uploaded file has no data", header: "Error Reading File", show: true})
    })

    expect(store.getState().inferenceSettings.load_model_path).toEqual("default_proto") //model name is unchanged
    expect(store.getState().samples).toEqual([])
    expect(history.location.pathname).toEqual(ROUTES.DASHBOARD)
  })

  it('should show an error if the data schema is bad', async () => {
    const { history, store, utils } = renderEmptyDashboard()

    const jsonInput = screen.getByLabelText("Upload JSON File")

    const file = new Blob([JSON.stringify([])], {type : 'text/plain'})
    Object.defineProperty(jsonInput, 'files', {
      value: [file],
      configurable: true,
    })
    fireEvent.change(jsonInput)

    expect(store.getState().modal).toMatchObject({header: "Reading File...", show: true})
    await waitFor(() => {
      expect(store.getState().modal).toMatchObject({body: "The uploaded file has an invalid schema. must be object", header: "Error Reading File", show: true})
    })

    expect(store.getState().inferenceSettings.load_model_path).toEqual("default_proto") //model name is unchanged
    expect(store.getState().samples).toEqual([]) //samples state is unchanged
    expect(history.location.pathname).toEqual(ROUTES.DASHBOARD)
  })


  
  it('should show an error if the sample schema is bad', async () => {
    const { history, store, utils } = renderEmptyDashboard()

    const jsonInput = screen.getByLabelText("Upload JSON File")

    for(const field in VALID_SAMPLE) { //iterate over all fields
      const invalidSample = {...VALID_SAMPLE} //copy the valid sample
      delete invalidSample[field] //delete a field

      //make sure this invalid data is not accepted

      const file = new Blob([JSON.stringify({
        modelName: "should not be set to state.h5",
        samples: [invalidSample],
        version
      })], {type : 'text/plain'})
      Object.defineProperty(jsonInput, 'files', {
        value: [file],
        configurable: true,
      })
      fireEvent.change(jsonInput)

      expect(store.getState().modal).toMatchObject({header: "Reading File...", show: true})
      await waitFor(() => {
        expect(store.getState().modal).toMatchObject({
          body: `The uploaded file has an invalid schema. /samples/0 must have required property '${field}'`,
          header: "Error Reading File",
          show: true
        })
      })
    }

    expect(store.getState().inferenceSettings.load_model_path).toEqual("default_proto") //model name is unchanged
    expect(store.getState().samples).toEqual([]) //samples state is unchanged
    expect(history.location.pathname).toEqual(ROUTES.DASHBOARD)
  })
})


function renderEmptyDashboard() {
  const history = createMemoryHistory({ initialEntries: [ROUTES.DASHBOARD] })
  expect(history.location.pathname).toEqual(ROUTES.DASHBOARD)

  const { store, utils } = render(<Router history={history}><EmptyDashboard/></Router>)
  expect(screen.queryByText("Home Page")).toBeInTheDocument()
  expect(screen.queryByText("Upload JSON File")).toBeInTheDocument()

  return {
    history,
    store,
    utils,
  }
}


const VALID_SAMPLE = {
  "app_class": {
    "C2": 0.00004384172468394855,
    "C1": 0.9994855042656815,
    "C3": 0.000017988526682561748,
    "C4": 0.0004501380879592873,
    "C5": 0.0000025273949925715064
  },
  "ood": 0
}