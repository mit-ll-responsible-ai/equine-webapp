// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import React from 'react'
import { createMemoryHistory } from "history"
import { Route, Router } from "react-router-dom"
import fetchMock from 'fetch-mock'
import { act, fireEvent, screen } from '@testing-library/react'
import { addSamples } from 'redux/actions/samples'
import { render  } from 'redux/testUtils'
import { waitFor } from '@testing-library/dom'

import { ROUTES } from "App"
import sampleData from "sampleData/sampleData.json"

import FeedbackModal from "Components/FeedbackModal/FeedbackModal"
import ModelSummaryEmptyPage from 'Components/ModelSummaryPage/ModelSummaryEmptyPage'
import { INITIAL_STATE } from 'redux/reducers/uiSettings'

describe('<ModelSummaryEmptyPage/>', () => {
  beforeAll(() => {
    process.env.REACT_APP_SERVER_URL = `http://localhost`
  })
  afterEach(() => {
    fetchMock.restore()
  })

  test("no data", async () => {
    await act(async () => {
      fetchMock.post(`http://localhost/graphql`,{
        status: 200,
        body: JSON.stringify({
          "errors": [ { "message": "Not Found" } ],
          "data": null
        })
      })

      const { store, utils } = renderModelSummaryEmptyPage()


      await waitFor(() => {
        expect(fetchMock.calls().length).toBeGreaterThanOrEqual(1)

        expect(screen.queryByText("Error Requesting the available models")).toBeInTheDocument()
        expect(screen.queryByText("Not Found")).toBeInTheDocument()
      }, {timeout: 15000}) //react query makes several attempts to request the data so we need to wait for it to give up
    })
  }, 20000)

  test("redirect to model summary page with model name param", async () => {
    await act(async () => {
      fetchMock.post(`http://localhost/graphql`,{
        status: 200,
        body: {
          data: { models: [
            { name: "testing.h5", lastModified: 0 }
          ]}
        }
      })

      const { history, store, utils } = renderModelSummaryEmptyPage()


      await waitFor(() => {
        expect(fetchMock.calls().length).toEqual(1)
        
        const option = "testing.h5"
        const modelSelect = screen.getByLabelText("Select a Model to Explore")
        fireEvent.change(modelSelect, { target: { value:option } })
        expect(modelSelect.value).toBe(option)        
      })

      //redirect to model summary page with model name param
      expect(history.location.pathname).toEqual(ROUTES.MODEL_SUMMARY_PAGE)
      fireEvent.click(screen.queryByText("View Summary for This Model"))
      expect(history.location.pathname).toEqual(`${ROUTES.MODEL_SUMMARY_PAGE}/testing.h5`)
    })
  })



  test("upload custom model", async () => {
    await act(async () => {
      fetchMock.post(`http://localhost/graphql`,{
        status: 200,
        body: { data: {models: []} }
      })

      

      const { history, store, utils } = renderModelSummaryEmptyPage()


      await waitFor(() => {
        const calls = fetchMock.calls()
        expect(calls.length).toEqual(1)
        expect(calls[0][0]).toEqual(`http://localhost/graphql`)

        const option = "custom"
        const modelSelect = screen.getByLabelText("Select a Model to Explore")
        fireEvent.change(modelSelect, { target: { value:option } })
        expect(modelSelect.value).toBe(option)   
      })

      fetchMock.post(`http://localhost/graphql`,{
        status: 200,
        body: { data: { uploadModel: { success: true } } }
      }, {overwriteRoutes: true})

      const file = new File(["testing"], "customModel.h5")
      const selectModelInput = screen.queryByLabelText("Select Model File")
      Object.defineProperty(selectModelInput, 'files', {
        value: [file]
      })
      fireEvent.change(selectModelInput)
      expect(screen.queryByText("customModel.h5")).toBeInTheDocument() //model file name appears on screen


      //click the button to upload the file
      expect(history.location.pathname).toEqual(ROUTES.MODEL_SUMMARY_PAGE)
      fireEvent.click(screen.queryByText("View Summary for This Model"))

      //validate the request
      const calls = fetchMock.calls()
      expect(calls.length).toEqual(2)
      const uploadModelCall = calls[1]
      expect(uploadModelCall[0]).toEqual(`http://localhost/graphql`)
      expect(uploadModelCall[1].body.constructor.name).toEqual("FormData")
      expect(Array.from(uploadModelCall[1].body.keys())).toEqual([ 'customModel.h5', 'map', 'operations' ])
      expect(uploadModelCall[1].body.get('customModel.h5')).toEqual(file)

      //redirect to model summary page with model name param
      await waitFor(() => {
        expect(history.location.pathname).toEqual(`${ROUTES.MODEL_SUMMARY_PAGE}/customModel.h5`)
      })
    })
  })
})


function renderModelSummaryEmptyPage() {
  const route = `${ROUTES.MODEL_SUMMARY_PAGE}`
  const history = createMemoryHistory({ initialEntries: [route] })
  expect(history.location.pathname).toEqual(route)

  const { store, utils } = render(
    <Router history={history}>
      <FeedbackModal/>
      <Route path={`${ROUTES.MODEL_SUMMARY_PAGE}`}><ModelSummaryEmptyPage/></Route>
    </Router>
  )
  expect(screen.queryByText("Model Summary Page")).toBeInTheDocument()
  expect(screen.queryByText("Select a Model to Explore")).toBeInTheDocument()
  expect(screen.queryByText("To View Model Summary, select a EQUI(NE)\u{00B2} model")).toBeInTheDocument()

  return {
    history,
    store,
    utils,
  }
}