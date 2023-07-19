// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import React from 'react'
import { BrowserRouter } from "react-router-dom"
import { fireEvent, screen } from '@testing-library/react'
import { render  } from 'redux/testUtils'
import { waitFor } from '@testing-library/dom'
import fetchMock from 'fetch-mock'


import Landing from 'Components/Landing/Landing'
import generateString from "utils/generateString"

describe('<Landing/>', () => {
  let tmpConsoleError = null
  beforeAll(() => {
    tmpConsoleError = console.error
    console.error = () => {}
    process.env.REACT_APP_SERVER_URL = `http://localhost`
  })
  afterEach(() => {
    fetchMock.restore()
  })
  afterAll(() => {
    console.error = tmpConsoleError
  })

  it('should render an error message', async () => {
    fetchMock.post(`http://localhost/graphql`,{
      status: 200,
      body: JSON.stringify({data:{models:[]}})
    })

    render(<BrowserRouter><Landing connectionStatus="error"/></BrowserRouter>)

    await waitFor(() => {
      expect(screen.queryByText("Error Connecting to Server")).toBeInTheDocument()
    })
  })

  it('should render a message to upload files first', async () => {
    fetchMock.post(`http://localhost/graphql`,{
      status: 200,
      body: JSON.stringify({data:{models:[]}})
    })

    render(<BrowserRouter><Landing connectionStatus="connected"/></BrowserRouter>)

    await waitFor(() => {
      expect(screen.queryByText("To analyze files, first upload your file(s)")).toBeInTheDocument()
    })
  })

  //TODO should render an error message if upload failed?

  it('should render the run pipeline button after files have been selected', async () => {
    fetchMock.post(`http://localhost/graphql`,{
      status: 200,
      body: JSON.stringify({data:{models:[]}})
    })

    const { store } = render(<BrowserRouter><Landing connectionStatus="connected"/></BrowserRouter>)

    const {
      fileContents,
      files,
    } = await selectFiles()

    await waitFor(() => {
      expect(screen.queryByText("Analyze Files")).toBeInTheDocument()
    })

    const runPipelineButton = screen.getByText("Analyze Files")
    fireEvent.click(runPipelineButton)
  })

  it('should render a connecting message after files have been uploaded', async () => {
    fetchMock.post(`http://localhost/graphql`,{
      status: 200,
      body: JSON.stringify({data:{models:[]}})
    })

    const { store } = render(<BrowserRouter><Landing connectionStatus="connecting"/></BrowserRouter>)

    const {
      fileContents,
      files,
    } = await selectFiles()

    await waitFor(() => {
      expect(screen.queryByText("Connecting...")).toBeInTheDocument()
    })
  })
})


async function selectFiles(connectionStatus:string) {
  //simulate a file selection through the OS Finder
  //https://github.com/testing-library/react-testing-library/issues/93
  const {
    fileContents,
    files,
  } = makeFilesFromStringLengths([10,100,1000])
  const dataInput = await waitFor(() => {
    const dataInput = screen.getByLabelText("Select File(s)")
    expect(dataInput).toBeInTheDocument()
    return dataInput
  })
  Object.defineProperty(dataInput, 'files', {
    value: files
  })
  fireEvent.change(dataInput)

  return {
    fileContents,
    files,
  }
}


function makeFilesFromStringLengths(stringLengths:number[]) {
  const fileContents = stringLengths.map(length => generateString(length))

  const files = fileContents.map(f => //generate files from file contents
    new Blob([f], {type : 'text/plain'})
  )

  return {
    fileContents,
    files,
  }
}
