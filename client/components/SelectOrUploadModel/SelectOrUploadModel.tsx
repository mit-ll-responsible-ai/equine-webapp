// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT

import React, { useEffect } from "react"
import Link from "next/link"

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUpload, faSitemap } from '@fortawesome/free-solid-svg-icons'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'

import { ROUTES } from "@/utils/routes"

import { useModelsQuery } from "@/graphql/generated"

import { closeModal, showModal } from "@/redux/modal"
import { useAppDispatch } from "@/redux/reduxHooks"

import styles from "./SelectOrUploadModel.module.scss"
import { useRouter } from "next/router"


export const CUSTOM_MODEL_VALUE="custom"

// this component abstracts querying available models on the server to let the user pick one
// or to let the user upload a new model file
export default function SelectOrUploadModel({
  customUploadText="Upload My Own EQUI(NE)² Model",
  modelExtension,
  modelName,
  setModelName,
  setUploadModelFile,
  showTrainModelButton=true,
  uploadModelFile,
  title
}:{
  customUploadText?: string,
  modelExtension?: string,
  modelName: string, //the name of the model, can be "custom"
  setModelName: React.Dispatch<React.SetStateAction<string>>, //set the name of the model to use
  setUploadModelFile: React.Dispatch<React.SetStateAction<File | null>>, //set the file to upload
  showTrainModelButton?: boolean,
  uploadModelFile: File | null, //the file to be uploaded
  title:string,
}) {
  const dispatch = useAppDispatch()
  const router = useRouter()

  const { data:availableModels, error, isLoading } = useModelsQuery(
    {extension: modelExtension || ""}, 
    {staleTime: Infinity}
  )
  useEffect(() => {
    //check the URL to see if we need to pull out a model name
    if(typeof router.query.modelName === "string") {// if there is a model name in the URL
      setModelName(router.query.modelName) // preset the model name in the UI dropdown
    }
    else if(availableModels && availableModels.models[0]) { //else if there are available models
      setModelName(availableModels.models[0].name) //auto set to the first one
    }
    else {
      setModelName(CUSTOM_MODEL_VALUE) //otherwise set to custom
    }
  },[availableModels, router.query.modelName, setModelName])
  
  useEffect(() => {
    if(error) {
      dispatch(showModal({
        body: (error as Error).message,
        canClose: true,
        header: "Error Requesting the available models",
      }))
    }
    else {
      dispatch(closeModal())
    }
  }, [dispatch, error])

  

  const onChangeUploadModelFile = async (e:React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if(files && files[0]) { // if there are files selected
      setUploadModelFile(files[0]) // save the full model file into this component's state
      // note that modelName should still be "custom"
    }

    e.target.value = ""
  }

  const showUploadModelButton = () => {
    if(modelName === CUSTOM_MODEL_VALUE) {
      return (
        <div>
          <div id={styles.uploadModelContainer}>
            <span>
              {/* THIS MUST BE A LABEL FOR loadEquineModelFile */}
              <label htmlFor={styles.loadEquineModelFile} className="btn btn-primary">{customUploadText} <FontAwesomeIcon icon={faUpload}/></label> &nbsp;
              <input id={styles.loadEquineModelFile} type="file" accept=".eq" onChange={onChangeUploadModelFile}/>
            </span>
            {uploadModelFile && (
              <p>{uploadModelFile.name}</p>
            )}
          </div>
          <br/>
          <div>
            {showTrainModelButton && (
              <Link href={ROUTES.TRAINING}>
                <Button variant="secondary">Train a New Model <FontAwesomeIcon icon={faSitemap}/></Button>
              </Link>
            )}
          </div>
        </div>
      )
    }
  }
  


  if(isLoading) {
    return <p style={{textAlign:"center"}}>Loading Available Models...</p>
  }
  return (
    <div className={styles.selectOrUploadModel}>
      <Form.Group controlId="model">
        <Form.Label>{title}</Form.Label>
        <Form.Control as="select" value={modelName} onChange={
          (e) => setModelName(e.target.value)
        }>
          {availableModels?.models.map(modelData => 
            <option key={modelData.name} value={modelData.name}>{modelData.name}</option>
          )}
          <option value={CUSTOM_MODEL_VALUE}>{customUploadText}</option>
        </Form.Control>
      </Form.Group>
      
      {showUploadModelButton()}
    </div>
  )
}
