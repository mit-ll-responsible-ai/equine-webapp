// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT

import React, { useEffect, useState } from "react"
import { useHistory } from "react-router-dom"

import Button from 'react-bootstrap/Button'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

import { useMutation } from "@tanstack/react-query"

import { AppClassType, setSamples, setModelFileName, setRunId } from "redux/inferenceSettings"
import { showModal } from "redux/modal"
import { useAppDispatch, useAppSelector } from "redux/reduxHooks"

import { ROUTES } from "App"
import parseUrlQuery from "utils/parseUrlQuery"
import uploadModelAndSampleFiles from "utils/uploadModelAndSampleFiles"

import { RunInferenceDocument, RunInferenceMutation, RunInferenceMutationVariables } from "graphql/generated"
import graphqlMultipartFormFetcher from "utils/graphqlMultipartFormFetcher"

import SelectInputDataType from "Components/SelectInputDataType/SelectInputDataType"
import SelectOrUploadModel, { CUSTOM_MODEL_VALUE } from "Components/SelectOrUploadModel/SelectOrUploadModel"
import UploadSampleFiles from "Components/UploadSampleFiles/UploadSampleFiles"

import "./settingsForm.scss"


export default function SettingsForm() {
  const history = useHistory()

  const dispatch = useAppDispatch()
  const modelFilename = useAppSelector(state => state.inferenceSettings.modelFilename)

  const [uploadModelFile, setUploadModelFile] = useState<File | null>(null)
  const [modelSelection, setModelSelection] = useState<string>(modelFilename)//preset the dropdown to the value from redux
  const [sampleFiles, setSampleFiles] = useState<File[]>([])

  const {mutate:runPipeline, isLoading: runPipelineIsLoading} = useMutation({
    mutationFn: async () => {
      await uploadModelAndSampleFiles( //first upload the model and sample files
        modelSelection===CUSTOM_MODEL_VALUE ? uploadModelFile : null,
        sampleFiles
      )

      /* Run pipeline */
      const runPipelineModelName = (uploadModelFile!==null) && (modelSelection===CUSTOM_MODEL_VALUE) ? uploadModelFile.name : modelSelection
      const data = await graphqlMultipartFormFetcher<RunInferenceMutation, RunInferenceMutationVariables>(
        RunInferenceDocument, 
        { 
          modelFilename: runPipelineModelName,
          sampleFilenames: sampleFiles.map(d => d.name),
        }
      )()


      /* Save data and go to dashboard */
      dispatch(setSamples( //process and add the samples to redux
        data.runInference.samples.map(s => ({
          app_class: s.labels.reduce((acc, l) => {
            acc[l.label] = l.confidence
            return acc
          }, {} as AppClassType),
          coordinates: s.coordinates,
          inputData: s.inputData,
          ood: s.ood,
        }))
      ))
      dispatch(setRunId(data.runInference.runId))
      dispatch(setModelFileName(runPipelineModelName))
      history.push(ROUTES.DASHBOARD) //redirect to dashboard
    },
    onError: (error) => {
      dispatch(showModal({
        body: (error as Error).message,
        canClose: true,
        header: "Error Running Pipeline",
      }))
    }
  })

  const { disabled, text } = (():{
    text: string,
    disabled: boolean,
  } => {
    if(runPipelineIsLoading) { //if the user has not uploaded files yet
      return {
        disabled: true,
        text: "Analyzing...",
      }
    }
    else if(
      modelSelection === "custom"
      && uploadModelFile === null
    ) { //if the user has not uploaded files yet
      return {
        disabled: true,
        text: "To analyze files, upload your EQUI(NE)\u{00B2} model",
      }
    }
    else if(
      sampleFiles.length === 0
    ) { //if the user has not uploaded files yet
      return {
        disabled: true,
        text: "To analyze files, upload your input data file(s)",
      }
    }
    else {
      return {
        disabled: false,
        text: "4) Analyze Files",
      }
    }
  })()

  return (
    <div id="settingsForm">
      <h2>Analysis Settings</h2>

      <br/>

      <Row>
        <Col>
          <SelectOrUploadModel
            modelName={modelSelection}
            setModelName={setModelSelection}
            setUploadModelFile={setUploadModelFile}
            uploadModelFile={uploadModelFile}
            title="1) Select a Model to Use for Analysis"
          />

          <hr/>

          <SelectInputDataType/>

          <hr/>
          
          <UploadSampleFiles
            sampleFiles={sampleFiles}
            setSampleFiles={setSampleFiles}
            title="3) Select Data File(s)"
          />
        </Col>
      </Row>


      <hr/>

      <Button variant="primary" onClick={() => !disabled && runPipeline()} disabled={disabled}>{text}</Button>
      <br/>
    </div>
  )
}
