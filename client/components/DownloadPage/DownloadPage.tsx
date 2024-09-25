// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import React, { useEffect } from "react"

import { showModal } from "@/redux/modal"
import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks"

import Button from 'react-bootstrap/Button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload } from '@fortawesome/free-solid-svg-icons'
import { timeFormat } from 'd3'

import { downloadUrlAsFile } from "@/utils/downloadFile"
import { ROUTES } from "@/utils/routes"
import setDocumentTitle from "@/utils/setDocumentTitle"

import { useModelsQuery } from "@/graphql/generated"

import styles from "./DownloadPage.module.scss"


function DownloadPage() {
  const dispatch = useAppDispatch()
  const serverUrl = useAppSelector(state => state.uiSettings.serverUrl)

  const { data:modelsData, error:modelsError } = useModelsQuery({extension: ""})

  useEffect(() => setDocumentTitle("Download"), [])
  useEffect(() => {
    if(modelsError) {
      dispatch(showModal({
        body: (modelsError as Error).message,
        canClose: true,
        header: "Error requesting the available models",
      }))
    }
  }, [dispatch, modelsError])

  const downloadModel = (modelName: string) => {
    downloadUrlAsFile(
      `${serverUrl}${ROUTES.API_DOWNLOAD_MODEL}/${modelName}`,
      `${modelName}`,
    ).catch(err => {
      dispatch(showModal({
        body: err.message,
        canClose: true,
        header: "Error downloading model",
      }))
    })
  }

  const formatTime = timeFormat("%B %d, %Y %H:%M:%S")

  return (
    <div id={styles.downloadPage}>
      <h3>Available Models</h3>
      <table>
        <thead>
          <tr>
            <th>Model Name</th>
            <th>Last Modified</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {modelsData?.models.map(m =>
            <tr key={m.name}>
              <td>{m.name}</td>
              <td>{formatTime(new Date(m.lastModified*1000))}</td>
              <td>
                <Button variant="secondary" onClick={e => downloadModel(m.name)} size="sm">
                  <FontAwesomeIcon icon={faDownload}/>
                </Button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {modelsData?.models.length===0 && <b>There are no available models on the server.</b>}
    </div>
  )
}

export default DownloadPage
