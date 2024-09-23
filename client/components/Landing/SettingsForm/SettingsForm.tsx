// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT

import React, { useState } from "react"
import { useRouter } from "next/router"

import Button from 'react-bootstrap/Button'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

import { useMutation } from "@tanstack/react-query"

import { ClassProbabilitiesType, setModelName, setRunId } from "@/redux/inferenceSettings"
import { showModal } from "@/redux/modal"
import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks"

import { useProcessAndSetSamples } from "@/hooks/useProcessAndSetSamples"

import { ROUTES } from "@/utils/routes"
import uploadModelAndSampleFiles from "@/utils/uploadModelAndSampleFiles"

import { RunInferenceDocument, RunInferenceMutation, RunInferenceMutationVariables } from "@/graphql/generated"
import graphqlMultipartFormFetcher from "@/utils/graphqlMultipartFormFetcher"

import SelectInputDataType from "@/components/SelectInputDataType/SelectInputDataType"
import SelectOrUploadModel, { CUSTOM_MODEL_VALUE } from "@/components/SelectOrUploadModel/SelectOrUploadModel"
import UploadSampleFiles from "@/components/UploadSampleFiles/UploadSampleFiles"

import styles from "./SettingsForm.module.scss"


export default function SettingsForm() {
  const router = useRouter()

  const dispatch = useAppDispatch()
  const processAndSetSamples = useProcessAndSetSamples()
  const modelName = useAppSelector(state => state.inferenceSettings.modelName)

  const [uploadModelFile, setUploadModelFile] = useState<File | null>(null)
  const [modelSelection, setModelSelection] = useState<string>(modelName)//preset the dropdown to the value from redux
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
          modelName: runPipelineModelName,
          sampleFilenames: sampleFiles.map(d => d.name),
        }
      )()


      /* Save data and go to dashboard */
      processAndSetSamples(
        data.runInference.samples.map(s => ({
          classProbabilities: s.labels.reduce((acc, l) => {
            acc[l.label] = l.confidence
            return acc
          }, {} as ClassProbabilitiesType),
          coordinates: s.coordinates,
          inputData: s.inputData,
          ood: s.ood,
        }))
      )
      dispatch(setRunId(data.runInference.runId))
      dispatch(setModelName(runPipelineModelName))
      router.push(ROUTES.DASHBOARD) //redirect to dashboard
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
    <div id={styles.settingsForm}>
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
