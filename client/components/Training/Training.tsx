// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"

import Button from 'react-bootstrap/Button'
import Col from 'react-bootstrap/Col'
import Container from 'react-bootstrap/Container'
import Form from 'react-bootstrap/Form'
import FormLabel from 'react-bootstrap/FormLabel'
import Row from 'react-bootstrap/Row'

import { useMutation } from "@tanstack/react-query"

import { ShowModalArgsType, closeModal, showModal } from "@/redux/modal"
import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks"

import InputError from "@/components/Input/InputError"

import setDocumentTitle from "@/utils/setDocumentTitle"
import stripFileExtension from "@/utils/stripFileExtension"
import uploadModelAndSampleFiles from "@/utils/uploadModelAndSampleFiles"


import {
  StartTrainingDocument,
  StartTrainingMutation,
  StartTrainingMutationVariables
} from "@/graphql/generated"
import graphqlMultipartFormFetcher from "@/utils/graphqlMultipartFormFetcher"

import SelectOrUploadModel, { CUSTOM_MODEL_VALUE } from "@/components/SelectOrUploadModel/SelectOrUploadModel"
import TrainingSuccess from "./TrainingSuccess"
import UploadSampleFiles from "@/components/UploadSampleFiles/UploadSampleFiles"

import styles from "./Training.module.scss"
import { useRouter } from "next/router"
import InfoTooltip from "../InfoTooltip/InfoTooltip"
import { ButtonGroup } from "react-bootstrap"


const Training = () => {
  /* State for GraphQL */
  const [episodes, setEpisodes] = useState<number>(10000)
  const [embOutDimAutoDetect, setEmbOutDimAutoDetect] = useState<boolean>(true)
  const [embOutDim, setNumInputFeatures] = useState<number>(0)
  const [newModelName, setNewModelName] = useState<string>("")
  const [trainModelType, setTrainModelType] = useState<"EquineGP" | "EquineProtonet">("EquineGP")
  const [sampleFiles, setSampleFiles] = useState<File[]>([])


  /* State for UI */
  const [modelName, setModelName] = useState<string>("")
  // const [retrainMode, setRetrainMode] = useState<string>("continue_training")
  const [uploadModelFile, setUploadModelFile] = useState<File | null>(null)

  const newModelNameError = useMemo(() => {
    if(newModelName.trim()==="") return "Model Name must be meaningful"
    if(["*","/","\\"].some(c => newModelName.indexOf(c)>=0)) return "Model Name name cannot contain * or slashes"
    return ""
  }, [newModelName])
  const episodeNumberError = isNaN(episodes) ? "Invalid number of episodes to train for" : ""

  /* Redux setup */
  const serverUrl = useAppSelector(state => state.uiSettings.serverUrl)
  const dispatch = useAppDispatch()
  const dispatchShowModal = useCallback(
    (options: ShowModalArgsType) => dispatch(showModal(options)),
    [dispatch]
  )

  /* Retraining */
  const router = useRouter() //use the location to get the retrain model name
  const retrainModelName = useMemo( //get the retrain model name from the location
    () => typeof router.query.retrainModelName==="string"? router.query.retrainModelName : "", 
    [router.query.retrainModelName]
  )
  useEffect(() => {
    (async function() { //create an async function
      if(retrainModelName) { //if we are retraining
        //TODO request data about the model being retrained
      }
    })() //self invoking
  }, [dispatch, dispatchShowModal, newModelName, retrainModelName, serverUrl])
  
  /* Misc */
  const initTrainTime = useRef<number>(new Date().getTime()) //used to estimate how much time is remaining
  useEffect(() => setDocumentTitle("Training"), []) //set the document title
  
  //TODO model training progress

  const {canStartTraining, buttonText} = (() => {
    if(newModelNameError) {
      return {
        canStartTraining: false,
        buttonText: "Model Name Error",
      }
    }
    else if(modelName === "") {
      return {
        canStartTraining: false,
        buttonText: "Upload Model File",
      }
    }
    else if(sampleFiles.length === 0) {
      return {
        canStartTraining: false,
        buttonText: "Upload Labeled Data Files",
      }
    }
    return {
      canStartTraining: true,
      buttonText: retrainModelName ? "Retrain!" : "Start Training!",
    }
  })()

  /* Training Mutation */
  const {data:trainingResponse, mutate:startTraining, reset} = useMutation({
    mutationFn: async () => {
      if(!canStartTraining || !modelName) { //if we cannot start training
        return false
      }
      await uploadModelAndSampleFiles( //first upload the model and sample files
        modelName===CUSTOM_MODEL_VALUE ? uploadModelFile : null,
        sampleFiles
      )
  
      const embedModelName = (uploadModelFile!==null) && (modelName===CUSTOM_MODEL_VALUE) ? uploadModelFile.name : modelName
      const variables:StartTrainingMutationVariables = {
        embedModelName,
        episodes,
        newModelName,
        embOutDim: embOutDimAutoDetect ? 0 : embOutDim,
        sampleFilenames: sampleFiles.map(s => s.name),
        trainModelType,
      }
  
      initTrainTime.current = new Date().getTime() //mark the time in case the server doesn't send a 0% progress update
      
      if(retrainModelName) { //if we are retraining a modal
        //TODO
        return false
      }
      else {
        dispatchShowModal({
          canClose: false,
          header: "Training...",
        })
        const data = await graphqlMultipartFormFetcher<StartTrainingMutation, StartTrainingMutationVariables>(
          StartTrainingDocument, variables
        )()
        dispatch(closeModal()) //close the modal
        if(!data.startTraining.success) {
          throw new Error("Training was not successful")
        }
        return data.startTraining.success
      }
    },
    onError: (error) => {
      dispatch(showModal({
        body: (error as Error).message,
        canClose: true,
        header: "Error During Training",
      }))
    }
  })

  /* Initialize state dynamically */
  const initState = useCallback(() => { //this is passed to the training success component
    setNewModelName(
      retrainModelName //if we are retraining
      //strip the file extension then add some post text
      ? `${stripFileExtension(retrainModelName)} - Retrained ${formatDate(new Date())}`
      : "My New Model" //else default text
    )
    reset()
    setSampleFiles([])
  }, [reset, retrainModelName])
  useEffect(initState, [initState]) //initialize the state dynamically


  const renderContent = () => {
    if(trainingResponse) {
      return (
        <TrainingSuccess
          modelName={newModelName}
          trainAnother={initState}
        />
      )
    }


    // const getRetrainFormOptions = () => {
    //   if(retrainModelName) { //if we are retraining a modal
    //     return (
    //       <Form.Group controlId="retrainMode">
    //         <Form.Label>Retraining Mode</Form.Label>
    //         <Form.Control as="select" value={retrainMode}>
    //           <option value="extend_model">Extend Model</option>
    //           <option value="continue_training">Continue Training</option>
    //           <option value="transfer_model">Transfer Model</option>
    //         </Form.Control>
    //       </Form.Group>
    //     )
    //   }
    //   return null
    // }


    return (
      <React.Fragment>
        <h3>{retrainModelName ? `Retrain "${retrainModelName}"` : "Train an EQUI(NE)² Model"}</h3>
        <br/>
        <Container>
          <Row>
            <Col sm={12} lg={6}>
              <Form.Group controlId="newModelName">
                <Form.Label>New Model Name</Form.Label>
                <Form.Control
                  isInvalid={newModelNameError.length > 0}
                  onChange={e => setNewModelName(e.target.value)}
                  placeholder="Model Name"
                  type="text"
                  value={newModelName}
                />
                <InputError error={newModelNameError}/>
              </Form.Group>

              <br/>

              <Form.Group controlId="trainModelType">
                <Form.Label>Model Type</Form.Label>
                <Form.Control as="select" value={trainModelType} onChange={(e:React.ChangeEvent<HTMLInputElement>) => setTrainModelType(e.target.value as "EquineProtonet" | "EquineGP")}>
                  <option value="EquineProtonet">Equine Protonet</option>
                  <option value="EquineGP">Equine Gaussian Processes</option>
                </Form.Control>
              </Form.Group>
              <br/>

              {/* {getRetrainFormOptions()} */}
            </Col>
            <Col sm={12} lg={6}>
              <Form.Group controlId="episodes">
                <Form.Label>Episodes</Form.Label>
                <Form.Control
                  isInvalid={isNaN(episodes)}
                  onChange={e => setEpisodes(parseInt(e.target.value))}
                  placeholder="Episodes"
                  step={1}
                  type="number"
                  value={episodes}
                />
                <InputError error={episodeNumberError}/>
              </Form.Group>
              <br/>
              <Form.Group controlId="embOutDim">
                <Form.Label>
                  Embedding Output Dimension &nbsp;
                  <InfoTooltip
                    placement="top"
                    tooltipContent={<p style={{paddingBottom: 0}}>This is the number of deep features from the feature embedding. You can let the server auto detect your embedding output dimension or set a custom value. Documentation is <a href={trainModelType==="EquineGP"?"https://mit-ll-responsible-ai.github.io/equine/reference/equine/equine_gp/":"https://mit-ll-responsible-ai.github.io/equine/reference/equine/equine_protonet/"} target="_blank">here</a></p>}
                  />
                </Form.Label>
                <br/>
                <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                  <ButtonGroup aria-label="Embedding Output Dimension">
                    <Button variant={embOutDimAutoDetect ? "secondary" : "outline-secondary"} onClick={() => {
                      setEmbOutDimAutoDetect(true)
                    }}>Auto Detect</Button>
                    <Button variant={embOutDimAutoDetect ? "outline-secondary" : "secondary"} onClick={() => {
                      setEmbOutDimAutoDetect(false)
                    }}>Custom</Button>
                  </ButtonGroup>
                  {!embOutDimAutoDetect && (
                    <Form.Control
                      isInvalid={isNaN(embOutDim)}
                      onChange={e => setNumInputFeatures(parseInt(e.target.value))}
                      placeholder="Episodes"
                      step={1}
                      min={0}
                      type="number"
                      value={embOutDim}
                      style={{
                        display: "inline-block",
                        width: "calc(100% - 205px)",
                      }}
                    />
                  )}
                </div>
                <InputError error={isNaN(embOutDim) ? "Number of Input Features must be a number" : ""}/>
              </Form.Group>
            </Col>
          </Row>

          <hr/>

          <SelectOrUploadModel
            customUploadText="Upload my own .jit file"
            modelExtension=".jit"
            modelName={modelName}
            setModelName={setModelName}
            setUploadModelFile={setUploadModelFile}
            showTrainModelButton={false}
            uploadModelFile={uploadModelFile}
            title="Select existing .jit Model File"
          />

          <br/>

          <FormLabel>Upload Labeled Data Files</FormLabel>
          <p>Note that if you upload a .csv file, your headings MUST contain a column with the heading &quot;label&quot;</p>
          <UploadSampleFiles
            sampleFiles={sampleFiles}
            setSampleFiles={setSampleFiles}
            title="Upload Labeled Data"
          />

          <hr/>
        </Container>


        <div id={styles.submitButtonContainer}>
          <Button variant="primary" disabled={!canStartTraining} onClick={() => startTraining()}>
            {buttonText}
          </Button>
        </div>
      </React.Fragment>
    )
  }

  return (
    <div id={styles.training}>
      {renderContent()}
    </div>
  )
}

export default Training


export function formatRemainingTime(milliseconds: number) {
  const seconds = Math.ceil(milliseconds / 1000)
  if(seconds < 60) {
    return `${seconds} second${seconds===1?"":"s"}`
  }

  return `${Math.floor(seconds/60)}m ${seconds%60}s`
}

export function formatDate(date: Date) {
  return `${date.getMonth() + 1}-${date.getDate()}-${date.getFullYear()}`
}