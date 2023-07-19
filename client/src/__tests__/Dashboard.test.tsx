// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import React from 'react'
import { BrowserRouter, Route, Router } from "react-router-dom"
import { fireEvent, screen } from '@testing-library/react'
import { render  } from 'redux/testUtils'
import { waitFor } from '@testing-library/dom'
import { createMemoryHistory } from "history"

import Dashboard from 'Components/Dashboard/Dashboard'

import { ROUTES } from "App"
import { addSamples } from 'redux/actions/samples'
import { setStringValue as pipelineSetStringValue } from "redux/actions/inferenceSettings"
import sampleData from "sampleData/sampleData.json"

describe('<Dashboard/>', () => {
  beforeEach(() => {
    window.history.pushState({}, "title", "/dashboard")
  })

  it('should render the empty dashboard with no data', async () => {
    const { store, utils } = render(
      <BrowserRouter>
        <Dashboard/>
      </BrowserRouter>
    )
    expect(screen.queryByText("Home Page")).toBeInTheDocument()
    expect(screen.queryByText("Upload JSON File")).toBeInTheDocument()
  })

  it('should render the dashboard with data', async () => {
    const tmpConsoleError = console.error
    console.error = () => {}


    const history = createMemoryHistory({ initialEntries: [ROUTES.DASHBOARD] })
    expect(history.location.pathname).toEqual(ROUTES.DASHBOARD)

    const { store, utils } = render(
      <Router history={history}>
        <Route path={ROUTES.DASHBOARD}>
          <Dashboard/>
        </Route>
      </Router>
    )

    expect(store.getState().filters.labels).toStrictEqual({}) //there are no labels checked

    store.dispatch(addSamples(sampleData.samples))
    store.dispatch(pipelineSetStringValue("load_model_path","testModel.h5"))

    expect(screen.queryByText("Results for model: testModel.h5")).toBeInTheDocument()
    expect(screen.queryByText("Number of Samples in Each Label")).toBeInTheDocument()
    expect(screen.queryByText("Samples")).toBeInTheDocument()

    //upon getting the data, the dashboard checks all the labels
    expect(store.getState().filters.labels).toStrictEqual({
      "C2": true,
      "C1": true,
      "C3": true,
      "OTHER": true,
      "C4": true,
      "C5": true,
    })
      
    //test redirect
    expect(history.location.pathname).toEqual(ROUTES.DASHBOARD)
    fireEvent.click(screen.queryByText("Go to Model Summary Page"))
    expect(history.location.pathname).toEqual(`${ROUTES.MODEL_SUMMARY_PAGE}/testModel.h5`)


    console.error = tmpConsoleError
  })

  //TODO test dashboard with data
  //TODO integration test in App to make sure uploading in EmptyDashboard will show data on the dashboard
})
