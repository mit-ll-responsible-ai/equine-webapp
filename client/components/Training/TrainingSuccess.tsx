// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import React from "react"
import Link from "next/link"
import Button from 'react-bootstrap/Button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faDatabase,
  faDownload,
  faHome,
  faNewspaper,
  faRedo,
} from '@fortawesome/free-solid-svg-icons'

import { showModal } from "@/redux/modal"
import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks"

import { ROUTES } from "@/utils/routes"

import { downloadUrlAsFile } from "@/utils/downloadFile"

import styles from "./Training.module.scss"

type Props = {
  modelName: string,
  trainAnother: Function,
}

const TrainingSuccess = ({
  modelName,
  trainAnother,
}: Props) => {
  const modelNameWithExtension = modelName + ".eq"

  const dispatch = useAppDispatch()
  const serverUrl = useAppSelector(state => state.uiSettings.serverUrl)

  const downloadModel = () => {
    downloadUrlAsFile(
      `${serverUrl}${ROUTES.API_DOWNLOAD_MODEL}/${modelNameWithExtension}`,
      `${modelNameWithExtension}`,
    ).catch(err => {
      dispatch(
        showModal({
          body: err.message,
          canClose: true,
          header: "Error Downloading Model",
        })
      )
    })
  }

  return (
    <React.Fragment>
      <div id={styles.trainSuccess}>
        <div>
          <h3><pre style={{marginTop: "1rem"}}>{modelNameWithExtension}</pre> Trained Successfully!</h3>
          <br/><br/>
          <Link href={`${ROUTES.LANDING}?modelName=${modelNameWithExtension}`}><Button variant="primary">Analyze files with this Model <FontAwesomeIcon icon={faHome}/></Button></Link>
          <br/><br/>
          <Link href={`${ROUTES.MODEL_SUMMARY_PAGE}/${modelNameWithExtension}`}><Button variant="primary">See Model Summary <FontAwesomeIcon icon={faNewspaper}/></Button></Link>
          <br/><br/>
          <Button variant="primary" onClick={e => downloadModel()}>
            Download Model <FontAwesomeIcon icon={faDownload}/>
          </Button>
          <br/><br/>
          <Button variant="secondary" onClick={e => trainAnother()}>Train Another Model <FontAwesomeIcon icon={faRedo}/></Button>
          <br/><br/>
          <Link href={ROUTES.DOWNLOAD_PAGE}><Button variant="secondary">See All Models on Server <FontAwesomeIcon icon={faDatabase}/></Button></Link>
        </div>
      </div>
    </React.Fragment>
  )
}

export default TrainingSuccess