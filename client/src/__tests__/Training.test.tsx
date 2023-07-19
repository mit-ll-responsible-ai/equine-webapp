// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import React from 'react'
import { Route, Router } from "react-router-dom"
import { createEvent, fireEvent, screen } from '@testing-library/react'
import { render  } from 'redux/testUtils'
import { waitFor } from '@testing-library/dom'
import { createMemoryHistory } from "history"
import fetchMock from 'fetch-mock'

import { createServer } from "http";
import { io as Client } from "socket.io-client";
import { Server } from "socket.io"

import FeedbackModal from 'Components/FeedbackModal/FeedbackModal'
import Training, { formatRemainingTime } from 'Components/Training/Training'

import { ROUTES } from "App"
import { INITIAL_STATE } from 'redux/reducers/uiSettings'

describe('<Training/>', () => {
  let server:any = null
  let serverSocket:any = null
  let clientSocket:any = null

  //https://socket.io/docs/v4/testing/, but keep in mind we aren't using v4
  beforeAll((done) => {
    const httpServer = createServer();
    server = new Server(httpServer);
    httpServer.listen(() => {
      const port = httpServer.address().port;
      clientSocket = new Client(`http://localhost:${port}`);
      server.on("connection", (socket) => {
        serverSocket = socket;
      });
      clientSocket.on("connect", done);
    });
  })
  afterAll(() => {
    server.close()
    clientSocket.close()
  })

  it('can make a training request and shows the success page', async () => {
    const {store, utils} = await renderTrainingSuccess()
  })

  test('after success, can redirect to landing page with model name in query', async () => {
    const {history, store, utils} = await renderTrainingSuccess()
    fireEvent.click(screen.getByText("Analyze files with this Model"))
    expect(history.location.pathname).toEqual(`${ROUTES.LANDING}`)
    expect(history.location.search).toEqual(`?modelName=FakeNewModelName.h5`)
  })

  test('after success, can redirect to respective model summary page', async () => {
    const {history, store, utils} = await renderTrainingSuccess()
    fireEvent.click(screen.getByText("See Model Summary"))
    expect(history.location.pathname).toEqual(`${ROUTES.MODEL_SUMMARY_PAGE}/FakeNewModelName.h5`)
  })

  test('after success, can train another model', async () => {
    const {history, store, utils} = await renderTrainingSuccess()
    fireEvent.click(screen.getByText("Train Another Model"))
    expect(history.location.pathname).toEqual(`${ROUTES.TRAINING}`) //no redirect

    const text = [
      "Model Name", "Add a New Label",
      "C1", "C2", //"OTHER",
      "You must upload files before training", //cannot submit form without uploaded files
    ]
    text.forEach(t => {
      expect(screen.queryByText(t)).toBeInTheDocument()
    })

    expect(screen.queryByText("Your Model Trained Successfully!")).not.toBeInTheDocument()
  })

  test('after success, can go to download page', async () => {
    const {history, store, utils} = await renderTrainingSuccess()
    fireEvent.click(screen.getByText("See All Models on Server"))
    expect(history.location.pathname).toEqual(`${ROUTES.DOWNLOAD_PAGE}`)
  })




  it('can add a new label', async () => {
    const { store, utils } = renderTraining()

    //can change model name
    const newLabelInput = screen.getByLabelText("Add a New Label")
    expect(newLabelInput.value).toBe("")
    fireEvent.change(newLabelInput, { target: { value:"CUSTOMLABEL" } })
    expect(newLabelInput.value).toBe("CUSTOMLABEL")
    fireEvent.click(screen.getByText("Add Label"))
    expect(newLabelInput.value).toBe("") //input was cleared

    expect(screen.queryByText("CUSTOMLABEL")).toBeInTheDocument() //custom label was added
  })

  it('cannot add an existing label', async () => {
    const { store, utils } = renderTraining()

    expect(screen.queryAllByText("C2").length).toEqual(1) //C2 already exists

    //can change model name
    const newLabelInput = screen.getByLabelText("Add a New Label")
    expect(newLabelInput.value).toBe("")
    fireEvent.change(newLabelInput, { target: { value:"C2" } })
    expect(newLabelInput.value).toBe("C2")
    fireEvent.click(screen.getByText("Add Label"))
    expect(newLabelInput.value).toBe("C2") //input unchanged

    expect(screen.queryAllByText("C2").length).toEqual(1) //C2 was not added

    expect(screen.queryByText("You already have label C2 added")).toBeInTheDocument() //modal
  })

  it('cannot add an empty label', async () => {
    const { store, utils } = renderTraining()

    //can change model name
    const newLabelInput = screen.getByLabelText("Add a New Label")
    fireEvent.change(newLabelInput, { target: { value:"" } })
    fireEvent.click(screen.getByText("Add Label"))

    expect(screen.queryByText("Please enter a meaningful label")).toBeInTheDocument() //modal
  })

  it('cannot add a white space label', async () => {
    const { store, utils } = renderTraining()

    //can change model name
    const newLabelInput = screen.getByLabelText("Add a New Label")
    fireEvent.change(newLabelInput, { target: { value:"    " } })
    fireEvent.click(screen.getByText("Add Label"))
    
    expect(screen.queryByText("Please enter a meaningful label")).toBeInTheDocument() //modal
  })

  it('can delete labels', async () => {
    const { store, utils } = renderTraining()

    const labels = [
      "C1", "C2",
    ]

    for(let i=0; i<labels.length+1; ++i) {
      labels.slice(0,i).forEach(l =>
        expect(screen.queryByText(l)).not.toBeInTheDocument()
      )
      labels.slice(i,labels.length).forEach(l =>
        expect(screen.queryByText(l)).toBeInTheDocument()
      )

      const label = labels[i]
      if(label) {
        fireEvent.click(screen.getByTestId(`removeLabel${label}`))
      }
    }
  })




  it('cannot add multiple of the same file name', async () => {
    const { store, utils } = renderTraining()

    const file1 = new File([""], "fakeFileName.data", {type : 'text/plain'})
    const input1 = screen.getAllByLabelText("Add File(s)")[1]
    Object.defineProperty(input1, 'files', {
      value: [file1]
    })
    fireEvent.change(input1)
    expect(screen.queryAllByText("fakeFileName.data").length).toEqual(1)


    const file2 = new File([""], "fakeFileName.data", {type : 'text/plain'})
    const input2 = screen.getAllByLabelText("Add File(s)")[1]
    Object.defineProperty(input2, 'files', {
      value: [file2]
    })
    fireEvent.change(input2)
    expect(screen.queryByText("You have already selected these files:")).toBeInTheDocument() //modal
    expect(screen.queryAllByText("fakeFileName.data").length).toEqual(2) //first instance is from Training, second is from modal
    expect(screen.queryByTestId("trainingLabelC2")).toContainHTML("fakeFileName.data")
  })


  it('can drag and drop files between labels', async () => {
    process.env.REACT_APP_SERVER_URL = `http://localhost`
    let triggerFetchResponse = null
    const mockFetchPromise = new Promise((resolve, reject) => {
      triggerFetchResponse = () => resolve({ ok: true }) //save the resolve to be manually triggered later
    })
    jest.spyOn(global, 'fetch').mockImplementation(() => mockFetchPromise)

    const { store, utils } = renderTraining()

    const file1 = new File([""], "fakeFileName.data", {type : 'text/plain'})
    const input1 = screen.getAllByLabelText("Add File(s)")[1]
    Object.defineProperty(input1, 'files', {
      value: [file1]
    })
    fireEvent.change(input1)
    expect(screen.queryByTestId("trainingLabelC2")).toContainHTML("fakeFileName.data") //file starts in C2
    expect(screen.queryByTestId("trainingLabelC1")).not.toContainHTML("fakeFileName.data") //file is not in C1

    //dataTransfer is undefined by default, so we need to create an event, then manually add dataTransfer and setData
    const mockDragStart = createEvent.dragStart(screen.getByText("fakeFileName.data"))
    let data: string = ""
    Object.assign(mockDragStart, {
      dataTransfer: {
        setData: (type:string, str: string) => {
          data = str
        }
      }
    })
    fireEvent(screen.getByText("fakeFileName.data"), mockDragStart)
    expect(data).toEqual(`[0,"C2"]`) //fileNameIndex and startLabel

    fireEvent.dragOver(screen.getByTestId("trainingLabelC1"))

    const mockDrop = createEvent.drop(screen.getByTestId("trainingLabelC1"))
    Object.assign(mockDrop, {
      dataTransfer: {
        files: { length: 0 },
        getData: (type: string) => data,
      }
    })
    fireEvent(screen.getByTestId("trainingLabelC1"), mockDrop)
    expect(screen.queryByTestId("trainingLabelC2")).not.toContainHTML("fakeFileName.data") //file is no longer in C2
    expect(screen.queryByTestId("trainingLabelC1")).toContainHTML("fakeFileName.data") //file is now in C1

    const newModelNameInput = screen.getByLabelText("Model Name")
    expect(newModelNameInput.value).toBe("My New Model")

    fireEvent.click(screen.getByText("Start Training!"))

    //submitting form sends proper request
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(global.fetch.mock.calls[0][0]).toEqual(`http://localhost/graphql`)
    validateFormData(
      global.fetch.mock.calls[0][1].body,
      "My New Model",
      [ { files: ["fakeFileName.data"], label: "C1" } ] //the file name is attached to C1, not C2, empty labels are omitted
    )

    global.fetch.mockClear()
  })

  it('can change the model type', async () => {
    process.env.REACT_APP_SERVER_URL = `http://localhost`
    let triggerFetchResponse = null
    const mockFetchPromise = new Promise((resolve, reject) => {
      triggerFetchResponse = () => resolve({ ok: true }) //save the resolve to be manually triggered later
    })
    jest.spyOn(global, 'fetch').mockImplementation(() => mockFetchPromise)

    const { store, utils } = renderTraining()

    const file = new File([""], "fakeFileName.data", {type : 'text/plain'})
    const filesC2 = screen.getAllByLabelText("Add File(s)")[1]
    Object.defineProperty(filesC2, 'files', { value: [file] })
    fireEvent.change(filesC2)
    expect(screen.queryByTestId("trainingLabelC2")).toContainHTML("fakeFileName.data")

    //can change model name
    const modelNameInput = screen.getByLabelText("Model Name")
    fireEvent.change(modelNameInput, { target: { value:"My New Ensemble Model" } })

    //can change model type
    const modelTypeDropdown = screen.getByLabelText("Model Type")
    fireEvent.change(modelTypeDropdown, { target: { value:"proto_ensemble" } })

    fireEvent.click(screen.getByText("Start Training!"))

    //submitting form sends proper request
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(global.fetch.mock.calls[0][0]).toEqual(`http://localhost/graphql`)
    const formData = global.fetch.mock.calls[0][1].body
    expect(formData.constructor.name).toEqual("FormData")
    expect(JSON.parse(formData.get("operations"))).toMatchObject({
      variables: {
        episodes: 10000,
        labels: [{files: ["fakeFileName.data"], label: "C2"}],
        modelName: "My New Ensemble Model",
        trainModelType: "proto_ensemble",
      }
    })
    expect(formData.has("fakeFileName.data")).toEqual(true)
    expect(formData.has("map")).toEqual(true)

    global.fetch.mockClear()
  })

  it('can re-upload a file originally under a label that was just deleted', async () => {
    const { store, utils } = renderTraining()

    //add the first file to C2
    const file1 = new File([""], "fakeFileName.data", {type : 'text/plain'})
    const input1 = screen.getAllByLabelText("Add File(s)")[1]
    Object.defineProperty(input1, 'files', {
      value: [file1]
    })
    fireEvent.change(input1)
    expect(screen.queryAllByText("fakeFileName.data").length).toEqual(1)

    //delete C2
    fireEvent.click(screen.getByTestId(`removeLabelC2`))
    expect(screen.queryAllByText("fakeFileName.data").length).toEqual(0)

    //add a file with the same name again
    const file2 = new File([""], "fakeFileName.data", {type : 'text/plain'})
    const input2 = screen.getAllByLabelText("Add File(s)")[0]
    Object.defineProperty(input2, 'files', {
      value: [file2]
    })
    fireEvent.change(input2)
    expect(screen.queryAllByText("fakeFileName.data").length).toEqual(1) //the file was added
  })


  function renderTraining() {
    const history = createMemoryHistory({ initialEntries: [ROUTES.TRAINING] })
    expect(history.location.pathname).toEqual(ROUTES.TRAINING)


    const { store, utils } = render(
      <Router history={history}>
        <FeedbackModal/>
        <Route path={ROUTES.TRAINING}>
          <Training socket={clientSocket}/>
        </Route>
      </Router>
    )

    const text = [
      "Model Name", "Add a New Label",
      "C1", "C2", //"OTHER",
      "You must upload files before training", //cannot submit form without uploaded files
    ]

    text.forEach(t => {
      expect(screen.queryByText(t)).toBeInTheDocument()
    })

    return { history, store, utils }
  }

  async function renderTrainingSuccess() {
    process.env.REACT_APP_SERVER_URL = `http://localhost`
    let triggerFetchResponse = null
    const mockFetchPromise = new Promise((resolve) => {
      //save the resolve to be manually triggered later
      triggerFetchResponse = () => resolve({
        json: async () => ({ success: true })
      }) 
    })
    jest.spyOn(global, 'fetch').mockImplementation(() => mockFetchPromise)


    const { history, store, utils } = renderTraining()

    //can change model name
    const newModelNameInput = screen.getByLabelText("Model Name")
    expect(newModelNameInput.value).toBe("My New Model")
    fireEvent.change(newModelNameInput, { target: { value:"FakeNewModelName" } })
    expect(newModelNameInput.value).toBe("FakeNewModelName")

    //can add data files
    const dataFile = new File([""], "fakeFileName.data", {type : 'text/plain'})
    const dataInput = screen.getAllByLabelText("Add File(s)")[0]
    Object.defineProperty(dataInput, 'files', {
      value: [dataFile]
    })
    fireEvent.change(dataInput)
    expect(screen.queryByText("fakeFileName.data")).toBeInTheDocument()


    const startButton = await waitFor(() => {
      const startButton = screen.getByText("Start Training!")
      return startButton
    })

    fireEvent.click(startButton)

    //submitting form sends proper request
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(global.fetch.mock.calls[0][0]).toEqual(`http://localhost/graphql`)
    validateFormData(
      global.fetch.mock.calls[0][1].body,
      "FakeNewModelName",
      [ { files: ["fakeFileName.data"], label: "C1" } ] //empty labels are omitted
    )

    //modal
    expect(screen.queryByText("Training...")).toBeInTheDocument()
    let percentage = 0
    while(percentage < 100) {
      serverSocket.emit("episode update", {progress: percentage/100})
      await waitFor(() => expect(screen.queryByText(`${percentage}% complete`)).toBeInTheDocument())
      percentage += 5
    }
    //TODO test time estimate

    triggerFetchResponse()

    //test success page
    await waitFor(() => {
      expect(screen.queryByText("Your Model Trained Successfully!")).toBeInTheDocument()
      expect(screen.queryByText("Analyze files with this Model")).toBeInTheDocument()
      expect(screen.queryByText("See Model Summary")).toBeInTheDocument()
      expect(screen.queryByText("Download Model")).toBeInTheDocument()
      expect(screen.queryByText("Train Another Model")).toBeInTheDocument()
      expect(screen.queryByText("See All Models on Server")).toBeInTheDocument()
    })

    expect(history.location.pathname).toEqual(ROUTES.TRAINING)


    global.fetch.mockClear()

    return { history, store, utils }
  }


  function validateFormData(
    formData: FormData,
    expectedModelName: string,
    expectedLabels: {files:string[], label:string}[]
  ) {
    expect(formData.constructor.name).toEqual("FormData") //this is a FormData object type
    expect(JSON.parse(formData.get("operations"))).toMatchObject({
      variables: {
        episodes: 10000,
        labels: expectedLabels,
        modelName: expectedModelName,
        trainModelType: "protonet",
      }
    })
    expect(formData.has("map")).toEqual(true)


    //all the files specified in labels are present in the FormData
    Object.values(expectedLabels).map(l => l.files).flat().forEach(fileName => {
      console.log("test",fileName)
      expect(formData.has(fileName)).toEqual(true) //file is present (I haven't figured out a better way to test this yet)
    })
  }
})

describe('formatRemainingTime', () => {
  it("formats time less than a minute", () => {
    expect(formatRemainingTime(0)).toEqual("0 seconds")
    expect(formatRemainingTime(1)).toEqual("1 second")
    expect(formatRemainingTime(1000)).toEqual("1 second")
    expect(formatRemainingTime(1001)).toEqual("2 seconds")
    expect(formatRemainingTime(15000)).toEqual("15 seconds")
    expect(formatRemainingTime(59000)).toEqual("59 seconds")
  })

  it("formats time greater than a minute", () => {
    expect(formatRemainingTime(59001)).toEqual("1m 0s")
    expect(formatRemainingTime(60000)).toEqual("1m 0s")
    expect(formatRemainingTime(67000)).toEqual("1m 7s")
    expect(formatRemainingTime(121000)).toEqual("2m 1s")
    expect(formatRemainingTime(1234567)).toEqual("20m 35s")
  })
})
