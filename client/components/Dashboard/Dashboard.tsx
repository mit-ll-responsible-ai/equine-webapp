// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import React, { useEffect, useMemo, useState } from "react"
import Button from 'react-bootstrap/Button'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'
import { faDownload, faNewspaper } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks"
import type { AppClassType, SampleType } from "@/redux/inferenceSettings"
import { showModal } from "@/redux/modal"

import { GetPrototypeSupportEmbeddingsQuery, useGetPrototypeSupportEmbeddingsQuery } from "@/graphql/generated"

import ControlBar from "@/components/ControlBar/ControlBar"
import EmptyDashboard, { DashboardDataType } from "./EmptyDashboard"
import Filters from "@/components/Filters/Filters"
import FilteredTable from "@/components/FilteredTable/FilteredTable"
import InfoTooltip from "@/components/InfoTooltip/InfoTooltip"
import SamplesBarChart from "@/components/SamplesBarChart/SamplesBarChart"

import useFilters, { sampleMatchesFilters } from "@/hooks/useFilters"

import { downloadStringAsFile } from "@/utils/downloadFile"
import formatModelName from "@/utils/formatModelName"
import getLocalStorageItem from "@/utils/localStorage/getLocalStorageItem"
import { ROUTES } from "@/utils/routes"
import setDocumentTitle from "@/utils/setDocumentTitle"
import setLocalStorageItem from "@/utils/localStorage/setLocalStorageItem"

import packageJson from "@/package.json"

import getAppClassCounts from "./getAppClassCounts"
import processConfidenceThresholds from "./processConfidenceThresholds"

import styles from "./Dashboard.module.scss"
import Link from "next/link"
import ScatterUQ from "../ScatterUQ/ScatterUQ"
import ScatterUQDataWrapper from "../ScatterUQ/ScatterUQDataWrapper"
import { getPlotDataForSample } from "@/utils/getPlotDataForSample"


export default function Dashboard() {
  //initialize state from local storage
  const [classConfidenceThreshold, setClassConfidenceThreshold] = useState<number>(getLocalStorageItem("classConfidenceThreshold", 95))
  const [inDistributionThreshold, setInDistributionThreshold] = useState<number>(getLocalStorageItem("inDistributionThreshold", 95))

  const dispatch = useAppDispatch()
  const {
    inputDataType,
    modelName,
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
  } = useGetPrototypeSupportEmbeddingsQuery({modelName}, {staleTime: Infinity})


  const downloadData = (samples: SampleType[], runId: number, fileName: string) => {
    if(modelName === "") {
      dispatch(showModal({
        body: `This could indicate a bug in the app state. This data file should still mostly work. But if you were to upload this data file later, the app will not know what model was used.`,
        canClose: true,
        header: "Warning: No Model Name was Found in State",
      }))
    }

    const data:DashboardDataType = {
      modelName,
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
      //filter the samples depending on the selections the user made in the filters
      const filteredPlotDataForSamples = samples.map((sample,i) => ({
        sample,
        processedAppClass: processedAppClasses[i],
      })).filter(
        ({sample, processedAppClass}) => sampleMatchesFilters(filters, processedAppClass)
      ).map(
        //we want to run getPlotDataForSample here, once for each sample,
        //because it's used for each local plot and for the global plot
        ({sample, processedAppClass}) => getPlotDataForSample(sample,processedAppClass,prototypeSupportEmbeddings)
      )
      const filteredSamples = filteredPlotDataForSamples.map(d => d.sample)
      const filteredProcessedAppClasses = filteredPlotDataForSamples.map(d => d.processedAppClass)
      

      return (
        <div id={styles.isData}>
          <div className="box">
            <h2>Results for model: {formatModelName(modelName)}</h2>

            <div>
              <Link href={`${ROUTES.MODEL_SUMMARY_PAGE}?${new URLSearchParams({modelName,inputDataType})}`}>
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
                <Button id={styles.downloadButton} variant="secondary" onClick={() => downloadData(samples, runId, "equine_data.json")}>
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
            plotDataForSamples={filteredPlotDataForSamples}
            inDistributionThreshold={inDistributionThreshold}
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
              else if(filteredSamples.length === 0) {
                return <p>No data to display</p>
              }
              
              //Each local plot has its one or two relevant prototypeSupportEmbeddings.
              //We need to merge all of them together for the global plot.
              //This is basically a set merging operation.
              const mergedPrototypeSupportEmbeddings = Object.values(
                filteredPlotDataForSamples.reduce((acc,d) => {
                  d.getPrototypeSupportEmbeddings?.getPrototypeSupportEmbeddings.forEach(pse => {
                    acc[pse.label] = pse //add this relevant PSE to the set
                  })
                  return acc
                }, {} as {[label:string]: GetPrototypeSupportEmbeddingsQuery["getPrototypeSupportEmbeddings"][number]})
              )

              return (
                <ScatterUQDataWrapper
                  inDistributionThreshold={inDistributionThreshold}
                  inputDataType={inputDataType}
                  method="umap"
                  modelName={modelName}
                  processedAppClasses={filteredProcessedAppClasses}
                  prototypeSupportEmbeddings={{
                    getPrototypeSupportEmbeddings: mergedPrototypeSupportEmbeddings
                  }}
                  runId={runId}
                  samples={filteredSamples}
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
    <div id={styles.dashboard}>
      {getContent()}
    </div>
  )
}
