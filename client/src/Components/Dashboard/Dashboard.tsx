// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import React, { useEffect, useMemo, useState } from "react"
import Button from 'react-bootstrap/Button'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'
import { Link } from "react-router-dom"
import { faDownload, faNewspaper } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { useAppDispatch, useAppSelector } from "redux/reduxHooks"
import type { AppClassType, SampleType } from "redux/inferenceSettings"
import { showModal } from "redux/modal"

import { useGetPrototypeSupportEmbeddingsQuery } from "graphql/generated"

import ControlBar from "Components/ControlBar/ControlBar"
import EmptyDashboard, { DashboardDataType } from "./EmptyDashboard"
import Filters from "Components/Filters/Filters"
import FilteredTable from "Components/FilteredTable/FilteredTable"
import InfoTooltip from "Components/InfoTooltip/InfoTooltip"
import SamplesBarChart from "Components/SamplesBarChart/SamplesBarChart"
import ScatterUQ from "Components/ScatterUQ/ScatterUQ"
import ScatterUQDataWrapper from "Components/ScatterUQ/ScatterUQDataWrapper"

import useFilters, { sampleMatchesFilters } from "hooks/useFilters"

import { ROUTES } from "App"

import { downloadStringAsFile } from "utils/downloadFile"
import formatModelName from "utils/formatModelName"
import getLocalStorageItem from "utils/localStorage/getLocalStorageItem"
import setDocumentTitle from "utils/setDocumentTitle"
import setLocalStorageItem from "utils/localStorage/setLocalStorageItem"

import packageJson from "../../../package.json"

import getAppClassCounts from "./getAppClassCounts"
import processConfidenceThresholds from "./processConfidenceThresholds"

import "./dashboard.scss"


export default function Dashboard() {
  //initialize state from local storage
  const [classConfidenceThreshold, setClassConfidenceThreshold] = useState<number>(getLocalStorageItem("classConfidenceThreshold", 95))
  const [inDistributionThreshold, setInDistributionThreshold] = useState<number>(getLocalStorageItem("inDistributionThreshold", 95))

  const dispatch = useAppDispatch()
  const {
    inputDataType,
    modelFilename,
    runId,
    samples,
  } = useAppSelector(state => state.inferenceSettings)
  const serverUrl = useAppSelector(state => state.uiSettings.serverUrl)

  useEffect(() => setDocumentTitle("Dashboard"))

  //memoize processing the samples and application class counts
  const processedAppClasses = useMemo(() => processConfidenceThresholds(
    samples,
    classConfidenceThreshold,
    inDistributionThreshold,
  ),[classConfidenceThreshold,inDistributionThreshold,samples])
  const { appClassCounts, labels } = useMemo(() => getAppClassCounts(processedAppClasses), [processedAppClasses])
  
  const { filters, setFilters, toggleFilter } = useFilters(labels)

  //TODO the uq viz query can be combined with another query to avoid an extra request
  const {
    data:prototypeSupportEmbeddings, 
    error: uqVizError, 
    isLoading: uqVizIsLoading,
  } = useGetPrototypeSupportEmbeddingsQuery({modelFilename}, {staleTime: Infinity})


  const downloadData = (samples: SampleType[], runId: number, fileName: string) => {
    if(modelFilename === "") {
      dispatch(showModal({
        body: `This could indicate a bug in the app state. This data file should still mostly work. But if you were to upload this data file later, the app will not know what model was used.`,
        canClose: true,
        header: "Warning: No Model Name was Found in State",
      }))
    }

    const data:DashboardDataType = {
      modelFilename,
      runId,
      samples,
      version: packageJson.version,
    }
    downloadStringAsFile(
      JSON.stringify(data),
      fileName,
    )
  }


  const getContent = () => {
    if(samples.length > 0) {
      const {
        filteredSamples,
        // filteredProcessedAppClasses,
      } = samples.map((sample,i) => ({
        sample,
        processedAppClass: processedAppClasses[i],
      })).filter(
        ({sample, processedAppClass}) => sampleMatchesFilters(filters, processedAppClass)
      ).reduce(
        (acc, {sample, processedAppClass}) => {
          acc.filteredSamples.push(sample)
          acc.filteredProcessedAppClasses.push(processedAppClass)
          return acc
        },
        {filteredSamples:[], filteredProcessedAppClasses:[]} as {
          filteredSamples: SampleType[],
          filteredProcessedAppClasses: AppClassType[],
        }
      )

      return (
        <div id="isData">
          <div className="box">
            <h2>Results for model: {formatModelName(modelFilename)}</h2>

            <div>
              <Link to={`${ROUTES.MODEL_SUMMARY_PAGE}/${modelFilename}`}>
                <Button variant="secondary">Go to Model Summary Page <FontAwesomeIcon icon={faNewspaper}/></Button>
              </Link>

              <OverlayTrigger
                overlay={
                  <Tooltip id="downloadAllDataTooltip">
                    Download all data as JSON file
                  </Tooltip>
                }
                placement="bottom"
              >
                <Button id="downloadButton" variant="secondary" onClick={() => downloadData(samples, runId, "equine_data.json")}>
                  <FontAwesomeIcon icon={faDownload}/>
                </Button>
              </OverlayTrigger>
            </div>            
          </div>

          <div className="box">
            <ControlBar
              classConfidenceThreshold={classConfidenceThreshold}
              inDistributionThreshold={inDistributionThreshold}
              changeClassConfidenceThreshold={(newThreshold: number) => {
                setLocalStorageItem("classConfidenceThreshold", newThreshold)
                setClassConfidenceThreshold(newThreshold)
              }}
              changeInDistributionThreshold={(newThreshold: number) => {
                setLocalStorageItem("inDistributionThreshold", newThreshold)
                setInDistributionThreshold(newThreshold)
              }}
            />
          </div>

          <div className="box">
            <h3>
              Number of Samples in Each Label &nbsp;
              <InfoTooltip placement="top" tooltipContent="This chart shows the breakdown of samples-per-label based on the above confidence thresholds."/>
            </h3>
            <SamplesBarChart
              labels={labels}
              processedAppClasses={processedAppClasses}
              samples={samples}
            />
          </div>

          <Filters
            appClassCounts={appClassCounts}
            filters={filters}
            labels={labels}
            setFilters={setFilters}
            toggleFilter={toggleFilter}
          />

          <FilteredTable
            downloadFilteredData={() => downloadData(
              filteredSamples,
              runId,
              "equine_filtered_data.json",
            )}
            filteredSamples={filteredSamples}
            inDistributionThreshold={inDistributionThreshold}
            processedAppClasses={processedAppClasses}
            prototypeSupportEmbeddings={prototypeSupportEmbeddings}
          />

          <div className="box">
            <h4>Global Scatterplot with UMAP</h4>
            {(() => {
              if(uqVizIsLoading) {
                return <p>Loading...</p>
              }
              else if(uqVizError) {
                return <p>Error: {(uqVizError as Error).message}</p>
              }
              return (
                <ScatterUQDataWrapper
                  inDistributionThreshold={inDistributionThreshold}
                  inputDataType={inputDataType}
                  method="umap"
                  modelName={modelFilename}
                  processedAppClasses={processedAppClasses}
                  prototypeSupportEmbeddings={prototypeSupportEmbeddings}
                  runId={runId}
                  samples={samples}
                  serverUrl={serverUrl}
                >
                  {props => (
                    <ScatterUQ
                      {...props}
                      startingHeight={600}
                      startingWidth={800}
                      thresholds={5}
                    />
                  )}
                </ScatterUQDataWrapper>
              )
            })()}
          </div>
          
        </div>
      )
    }

    return <EmptyDashboard/>
  }

  return (
    <div id="dashboard">
      {getContent()}
    </div>
  )
}
