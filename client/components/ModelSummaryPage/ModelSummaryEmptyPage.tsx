// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import React, { useState, useEffect } from 'react'

import Button from 'react-bootstrap/Button'

import {
  UploadModelDocument,
  UploadModelMutation,
  UploadModelMutationVariables,
} from '@/graphql/generated'
import graphqlMultipartFormFetcher from '@/utils/graphqlMultipartFormFetcher'


import { showModal } from '@/redux/modal'
import { useAppDispatch } from '@/redux/reduxHooks'

import SelectInputDataType from '@/components/SelectInputDataType/SelectInputDataType'
import SelectOrUploadModel from '@/components/SelectOrUploadModel/SelectOrUploadModel'

import { ROUTES } from "@/utils/routes"
import setDocumentTitle from "@/utils/setDocumentTitle"

import styles from "./ModelSummaryEmptyPage.module.scss"
import { useRouter } from 'next/router'


const EmptyPage = () => {
  const dispatch = useAppDispatch()
  const router = useRouter()

  const [customModelFile, setCustomModelFile] = useState<File | null>(null)
  const [selectedModel, setSelectedModel] = useState<string>("")

  useEffect(() => setDocumentTitle("Model Summary"), [])

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if(selectedModel === "custom" && customModelFile) {
      graphqlMultipartFormFetcher<UploadModelMutation, UploadModelMutationVariables>(
        UploadModelDocument, { modelFile: customModelFile }
      )().then(data => {
        if(data.uploadModel?.success) {
          //then redirect to the newly uploaded model (without file extension)
          router.push(`${ROUTES.MODEL_SUMMARY_PAGE}?modelName=${customModelFile.name}`)
        }
        else {
          throw new Error("Did not receive a success response")
        }
      }).catch(err => {
        dispatch(showModal({
          body: err.message,
          canClose: true,
          header: "There was an error uploading the model"
        }))
      })

    }
    else if(selectedModel !== "") {
      //redirect to the model summary page with this model name
      router.push(`${ROUTES.MODEL_SUMMARY_PAGE}?modelName=${selectedModel}`)
    }
    else {
      dispatch(showModal({
        canClose: true,
        header: "You must select a EQUI(NE)\u{00B2} model"
      }))
    }
  }

  const submitButtonDisabled = selectedModel==="" || (selectedModel==="custom" && !customModelFile)

  return (
    <div id={styles.modelSummaryEmptyPage}>
      <form onSubmit={submit}>
        <h1>Model Summary Page</h1>

        <br/>

        <SelectOrUploadModel
          modelName={selectedModel}
          setModelName={setSelectedModel}
          setUploadModelFile={setCustomModelFile}
          uploadModelFile={customModelFile}
          title="1) Select a Model to Explore"
        />

        <SelectInputDataType/>

        <br/>

        <Button type="submit" disabled={submitButtonDisabled}>
          {submitButtonDisabled ? "To View Model Summary, select a EQUI(NE)\u{00B2} model" : "View Summary for This Model"}
        </Button>
      </form>
    </div>
  )
}

export default EmptyPage
