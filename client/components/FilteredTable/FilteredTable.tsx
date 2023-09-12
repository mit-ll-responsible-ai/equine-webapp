// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import React, { useMemo } from "react";
import DataTable from 'react-data-table-component';

import type { AppClassType, SampleType } from "@/redux/inferenceSettings"
import { useAppSelector } from "@/redux/reduxHooks";

import Button from 'react-bootstrap/Button'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload } from '@fortawesome/free-solid-svg-icons'

import NoDataMessage from "@/components/NoDataMessage"
import ScatterUQ from "@/components/ScatterUQ/ScatterUQ";
import ScatterUQDataWrapper from "@/components/ScatterUQ/ScatterUQDataWrapper";

import determineSampleCondition, { getSampleConditionText, SAMPLE_CONDITIONS } from "@/utils/determineSampleCondition";
import getLabelsSortedByProbability from "@/utils/getLabelsSortedByProbability";

import { GetPrototypeSupportEmbeddingsQuery } from "@/graphql/generated";

import styles from "./FilteredTable.module.scss"

//https://www.npmjs.com/package/react-data-table-component
//https://github.com/jbetancur/react-data-table-component/blob/master/src/DataTable/themes.js

const COLUMNS = [
  {
    name: 'Local Dimensionality Reduction Plots using PCA',
    selector: 'dim_red',
    sortable: false,
  },
];

type Props = {
  downloadFilteredData: () => void,
  filteredSamples: SampleType[],
  inDistributionThreshold: number,
  processedAppClasses: AppClassType[],
  prototypeSupportEmbeddings?: GetPrototypeSupportEmbeddingsQuery,
}

const FilteredTable = ({
  downloadFilteredData,
  filteredSamples,
  inDistributionThreshold,
  processedAppClasses,
  prototypeSupportEmbeddings,
}: Props) => {
  const darkMode = useAppSelector(state => state.uiSettings.darkMode)

  const tableData = useMemo(() => (
    filteredSamples.map((sample:SampleType, sampleIndex: number) => {
      const processedAppClass = processedAppClasses[sampleIndex]
      
      return {
        id: sampleIndex,
        labels: Object.keys(processedAppClass).filter((label:string) => processedAppClass[label]===1).join(", "),
        dim_red: (
          <LocalUMAP
            inDistributionThreshold={inDistributionThreshold}
            processedAppClass={processedAppClass}
            sample={sample}
            prototypeSupportEmbeddings={prototypeSupportEmbeddings}
          />
        ),
      }
    })
  ), [filteredSamples, inDistributionThreshold, processedAppClasses, prototypeSupportEmbeddings])


  return (
    <div className="row">
      <div className="col">
        <div id={styles.filteredTable} className="box">
          <div>
            <span style={{float: "right"}}>
              <OverlayTrigger
                overlay={
                  <Tooltip id="downloadFilteredDataTooltip">
                    Download filtered data as JSON file
                  </Tooltip>
                }
                placement="top"
              >
                <Button variant="secondary" onClick={e => downloadFilteredData()}><FontAwesomeIcon icon={faDownload}/></Button>
              </OverlayTrigger>
            </span>

            <h3>Scatter UQ Inference Samples</h3>
          </div>

          <DataTable
            columns={COLUMNS}
            data={tableData}
            noDataComponent={<div className={styles.filteredTableNoData}><NoDataMessage/></div>}
            noHeader
            pagination
            theme={darkMode ? "dark" : ""}
          />
        </div>
      </div>
    </div>
  )
}

export default FilteredTable



function LocalUMAP({
  inDistributionThreshold,
  processedAppClass,
  prototypeSupportEmbeddings,
  sample,
}:{
  inDistributionThreshold: number,
  processedAppClass: AppClassType,
  sample: SampleType,
  prototypeSupportEmbeddings?: GetPrototypeSupportEmbeddingsQuery,
}) {
  const {
    inputDataType,
    modelFilename,
    runId,
  } = useAppSelector(state => state.inferenceSettings)
  const serverUrl = useAppSelector(state => state.uiSettings.serverUrl)

  const labelsSortedByProbability = getLabelsSortedByProbability(sample, prototypeSupportEmbeddings)
  
  const sampleCondition = determineSampleCondition(inDistributionThreshold,processedAppClass, sample)
  const confidenceMsg: React.ReactNode = getSampleConditionText(sampleCondition, labelsSortedByProbability)

  return (
    <div>
      <br/>
      {(
        <div>
          <p style={{width: "calc(900px + 2em)"}}>{confidenceMsg}</p>
          <ScatterUQDataWrapper
            inDistributionThreshold={inDistributionThreshold}
            inputDataType={inputDataType}
            modelName={modelFilename}
            processedAppClasses={[processedAppClass]}
            prototypeSupportEmbeddings={
              filterUqVizData(
                labelsSortedByProbability,
                processedAppClass,
                sampleCondition,
                prototypeSupportEmbeddings
              )
            }
            runId={runId}
            samples={[sample]}
            serverUrl={serverUrl}
          >
            {props => <ScatterUQ {...props}/>}
          </ScatterUQDataWrapper>
        </div>
      )}

      <br/>
    </div>
  )
}


function filterUqVizData(
  labelsSortedByDistance: GetPrototypeSupportEmbeddingsQuery["getPrototypeSupportEmbeddings"],
  processedAppClass: AppClassType,
  sampleCondition: SAMPLE_CONDITIONS,
  prototypeSupportEmbeddings?: GetPrototypeSupportEmbeddingsQuery,
):GetPrototypeSupportEmbeddingsQuery | undefined {
  if(prototypeSupportEmbeddings) {

    switch (sampleCondition) {
      case SAMPLE_CONDITIONS.IN_DISTRO_CONFIDENT: {
        return {
          ...prototypeSupportEmbeddings,
          getPrototypeSupportEmbeddings: prototypeSupportEmbeddings.getPrototypeSupportEmbeddings.filter(label => processedAppClass[label.label] === 1)
        }
      }
      case SAMPLE_CONDITIONS.IN_DISTRO_UNSURE: {
        return {
          ...prototypeSupportEmbeddings,
          getPrototypeSupportEmbeddings: labelsSortedByDistance.slice(0,2),
        }
      }
      default: { //SAMPLE_CONDITIONS.OOD
        return {
          ...prototypeSupportEmbeddings,
          getPrototypeSupportEmbeddings: labelsSortedByDistance.slice(0,1),
        }
      }
    }
  }

  return prototypeSupportEmbeddings
}



