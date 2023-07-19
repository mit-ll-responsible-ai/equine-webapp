// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import React from 'react'
import { BrowserRouter } from "react-router-dom"
import fetchMock from 'fetch-mock'
import { fireEvent, screen } from '@testing-library/react'
import { render  } from 'redux/testUtils'
import { waitFor } from '@testing-library/dom'
import { createServer } from "http";
import { Server } from "socket.io"

import App from 'App'
import sampleData from "sampleData/sampleData.json"
import generateString from "utils/generateString"
import { act } from 'react-dom/test-utils'
import { INITIAL_STATE } from 'redux/reducers/uiSettings'


describe('<App/>', () => {
  const tmpConsoleError = console.error
  beforeAll(() => {
    console.error = () => {}
  })
  afterAll(() => {
    console.error = tmpConsoleError
  })

  beforeEach(() => {
    window.history.pushState({}, "title", "/") //reset the url so we render the landing page first
  })
  afterEach(() => {
    fetchMock.restore()
  })


  it('should request and render data when the run pipeline button is clicked', async () => {
    await runDataRunPipeline(async (store, utils) => {
      //wait for the data to be rendered
      await waitFor(() => {
        expect(screen.queryByText(/Class Confidence Threshold/)).toBeInTheDocument()
      }, { timeout: 3000 })

      await waitFor(() => {
      const canvases = utils.container.querySelectorAll('canvas')
      expect(canvases.length).toEqual(1)
      }, { timeout: 3000 })
    })
  })


  it('should put everything into other if the confidence threshold is 100%', async () => {
    await runDataRunPipeline(async (store, utils) => {
      //wait for the data to be rendered
      await waitFor(() => {
        expect(screen.queryByText(/Class Confidence Threshold/)).toBeInTheDocument()
      }, { timeout: 3000 })

      const input = utils.getByLabelText('classConfidenceThresholdInput')
      fireEvent.change(input, { target: { value: '99' } })
      expect(input.value).toBe('99')

      return
    })
  }, 30000)
})


async function runDataRunPipeline(callback: Function) {
  //set up a socket server for testing so we don't need to depend on a hard-coded port
  const {port, server} = await new Promise((resolve) => {
    const httpServer = createServer()
    const server = new Server(httpServer)
    httpServer.listen(() => {
      const port = httpServer.address().port;
      resolve({port,server})
    });
  })

  process.env.REACT_APP_SERVER_URL = `http://localhost:${port}`

  fetchMock.post(`http://localhost:${port}/graphql`,{
    status: 200,
    body: JSON.stringify({data:{models:[]}})
  })

  let store = null
  let utils = null
  act(() => {
    const result = render(
      <BrowserRouter><App/></BrowserRouter>,
      {
        initialState: {
          uiSettings: {
            ...INITIAL_STATE,
            serverUrl: `http://localhost:${port}`
          }
        }
      }
    )
    store = result.store
    utils = result.utils
  })
  

  expect(fetchMock.calls().length).toEqual(1)

  expect(screen.queryByAltText("EQUINE")).toBeInTheDocument() //image

  // const modeSelect = screen.getByLabelText("Mode")
  // fireEvent.change(modeSelect, { target: { value:"run_pipeline" } })
  // expect(modeSelect.value).toBe("run_pipeline")

  //simulate a file selection through the OS Finder
  //https://github.com/testing-library/react-testing-library/issues/93
  const file = new Blob([generateString(1000)], {type : 'text/plain'})
  const dataInput = await waitFor(() => {
    const dataInput = screen.getByLabelText("Select File(s)")
    expect(dataInput).toBeInTheDocument()
    return dataInput
  })
  Object.defineProperty(dataInput, 'files', {
    value: [file]
  })
  fireEvent.change(dataInput)

  const button = await waitFor(() => {
    const button = screen.queryByText("Analyze Files")
    expect(button).toBeInTheDocument()
    return button
  })

  fetchMock.post(`http://localhost:${port}/graphql`,{
    status: 200,
    body: JSON.stringify({data:{}}) //TODO update with real data?
  }, {overwriteRoutes:true})

  fireEvent.click(button)

  expect(fetchMock.calls().length).toEqual(2)
  const runPipelineCall = fetchMock.calls()[1]
  expect(runPipelineCall[0]).toEqual(`http://localhost:${port}/graphql`)
  expect(runPipelineCall[1].method).toEqual("POST")
  const formData = runPipelineCall[1].body
  expect(formData.constructor.name).toEqual("FormData")

  server.sockets.emit("run pipeline response",{ //send back a response
    resp: sampleData.samples[0],
  })

  await callback(store, utils)

  server.close()
}
