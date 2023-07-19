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

import ModelSummaryPage from 'Components/ModelSummaryPage/ModelSummaryPage'
import { INITIAL_STATE } from 'redux/reducers/uiSettings'

describe('<ModelSummaryPage/>', () => {
  beforeAll(() => {
    process.env.REACT_APP_SERVER_URL = `http://localhost`
  })
  afterEach(() => {
    fetchMock.restore()
  })

  test("display error", async () => {
    await act(async () => {
      const modelName = "testing.h5"
      fetchMock.post(`http://localhost/graphql`,{
        status: 200,
        body: JSON.stringify({
          "errors": [ { "message": "Model does not exist" } ],
          "data": null
        })
      })

      const { store, utils } = renderModelSummaryPage(modelName)

      await waitFor(() => {
        expect(fetchMock.calls().length).toBeGreaterThanOrEqual(1)
        expect(JSON.parse(fetchMock.calls()[0][1].body).variables).toMatchObject({modelName})
        expect(screen.queryByText("Error: Model does not exist")).toBeInTheDocument()
      }, {timeout: 15000}) //react query makes several attempts to request the data so we need to wait for it to give up
      expect(screen.queryByText("Date Trained:")).not.toBeInTheDocument()
    })
  }, 20000)



  test("model name didn't match", async () => {
    await act(async () => {
      const modelName = "testing.h5"
      fetchMock.post(`http://localhost/graphql`,{
        status: 200,
        body: getExampleResponse("notTesting.h5")
      })

      const { store, utils } = renderModelSummaryPage(modelName)


      await waitFor(() => {
        expect(fetchMock.calls().length).toEqual(1)
        expect(
          screen.queryByText("Error: Requested data for 'testing.h5' but received data for 'notTesting.h5'")
        ).toBeInTheDocument()
      })
      expect(screen.queryByText("Date Trained:")).not.toBeInTheDocument()
    })
  })



  test("model was found, no sample data in redux", async () => {
    const tmpConsoleError = console.error
    console.error = () => {}

  
    await act(async () => {
      const modelName = "testing.h5"
      fetchMock.post(`http://localhost/graphql`,{
        status: 200,
        body: getExampleResponse(modelName)
      })

      const { history, store, utils } = renderModelSummaryPage(modelName)


      await waitFor(() => {
        expect(fetchMock.calls().length).toEqual(1)
        const texts = ["Analyze files with this Model"].concat(EXPECTED_TEXT)
        texts.forEach(t => {
          expect(screen.getAllByText(t)[0]).toBeInTheDocument()
        })
        expect(screen.queryByText("Go to Dashboard Page")).not.toBeInTheDocument()
      })
      expect(screen.queryByText("Error:")).not.toBeInTheDocument()

      //test redirect
      expect(history.location.pathname).toEqual(`${ROUTES.MODEL_SUMMARY_PAGE}/testing.h5`)
      fireEvent.click(screen.queryByText("Analyze files with this Model"))
      expect(history.location.pathname).toEqual("/")
      expect(history.location.search).toEqual("?modelName=testing.h5")
    })

    console.error = tmpConsoleError
  })



  test("model was found, with sample data in redux", async () => {
    const tmpConsoleError = console.error
    console.error = () => {}

    await act(async () => {
      const modelName = "testing.h5"
      fetchMock.post(`http://localhost/graphql`,{
        status: 200,
        body: getExampleResponse(modelName)
      })

      const { history, store, utils } = renderModelSummaryPage(modelName)
      store.dispatch( addSamples(sampleData.samples) ) //add sample data into redux

      await waitFor(() => {
        expect(fetchMock.calls().length).toEqual(1)
        const texts = ["Go to Dashboard Page"].concat(EXPECTED_TEXT)
        texts.forEach(t => {
          expect(screen.getAllByText(t)[0]).toBeInTheDocument()
        })
        expect(screen.queryByText("Analyze files with this Model")).not.toBeInTheDocument()
      })
      expect(screen.queryByText("Error:")).not.toBeInTheDocument()

      //test redirect
      expect(history.location.pathname).toEqual(`${ROUTES.MODEL_SUMMARY_PAGE}/testing.h5`)
      fireEvent.click(screen.queryByText("Go to Dashboard Page"))
      expect(history.location.pathname).toEqual(ROUTES.DASHBOARD)
    })

    console.error = tmpConsoleError
  })
})


function renderModelSummaryPage(modelName) {
  const route = `${ROUTES.MODEL_SUMMARY_PAGE}/${modelName}`
  const history = createMemoryHistory({ initialEntries: [route] })
  expect(history.location.pathname).toEqual(route)

  const { store, utils } = render(
    <Router history={history}><Route path={`${ROUTES.MODEL_SUMMARY_PAGE}/:modelName`}><ModelSummaryPage/></Route></Router>
  )
  expect(screen.queryByText(`Summary for ${modelName}`)).toBeInTheDocument()
  expect(screen.queryByText("Upload a Different Model")).toBeInTheDocument()

  return {
    history,
    store,
    utils,
  }
}


const getExampleResponse = (modelName:string) => ({
  data: {
    modelSummary: {
      "accuracy": 0.95,
      "confusionMatrix": [
          [0.9, 0.1, 0.1, 0.2, 0.1],
          [0.1, 0.9, 0.1, 0.1, 0.1],
          [0.1, 0.1, 0.6, 0.4, 0.1],
          [0.1, 0.1, 0.4, 0.6, 0.1],
          [0.1, 0.15, 0.1, 0.1, 0.9],
      ],
      "dateTrained": "1970-01-01T00:00:00.000Z",
      "lastModified": 0,
      "microF1Score": 0.5,
      "modelType": "Protonet",
      modelName,
      "numTestExamples": [
        { label: "C1", numExamples: 1 },
        { label: "C2", numExamples: 1 },
        { label: "C3", numExamples: 1 },
        { label: "C4", numExamples: 1 },
        { label: "C5", numExamples: 1 },
      ],
      "numTrainingExamples": [
        { label: "C1", numExamples: 20 },
        { label: "C2", numExamples: 10 },
        { label: "C3", numExamples: 18 },
        { label: "C4", numExamples: 43 },
        { label: "C5", numExamples: 7 },
      ],
      "trainingLabelFiles": [
        { label: "C1", files: ["example_file_3.data","example_file_4.data","example_file_5.data"] },
        { label: "C2", files: ["example_file_1.data","example_file_2.data"] },
        { label: "C3", files: ["example_file_6.data","example_file_7.data"] },
        { label: "C4", files: ["example_file_8.data","example_file_9.data"] },
        { label: "C5", files: ["example_file_10.data"] },
      ],
      "validation": "20% Holdout",
    }
  }
})


const EXPECTED_TEXT = [
  "Date Trained:", "December 31, 1969 19:00:00", 
  "Accuracy:", "95%", 
  "Micro F1 Score:", "0.50", 
  "Model Type:", "Protonet",
  'Validation Strategy:', "20% Holdout",
  "Confusion Matrix:",
  "C2", "C1", "C3", "C4", "C5",
  "example_file_1.data","example_file_2.data", "example_file_3.data","example_file_4.data","example_file_5.data",
  "example_file_6.data","example_file_7.data", "example_file_8.data","example_file_9.data","example_file_10.data",
]