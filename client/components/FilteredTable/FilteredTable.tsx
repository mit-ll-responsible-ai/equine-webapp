// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import React, { useMemo } from "react";
import DataTable from 'react-data-table-component';

import { useAppSelector } from "@/redux/reduxHooks";

import Button from 'react-bootstrap/Button'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload } from '@fortawesome/free-solid-svg-icons'

import NoDataMessage from "@/components/NoDataMessage"
import ScatterUQ from "@/components/ScatterUQ/ScatterUQ";
import ScatterUQDataWrapper from "@/components/ScatterUQ/ScatterUQDataWrapper";

import { getSampleConditionText } from "@/utils/determineSampleCondition";

import styles from "./FilteredTable.module.scss"
import { PlotDataForSample } from "@/utils/getPlotDataForSample";

//https://www.npmjs.com/package/react-data-table-component
//https://github.com/jbetancur/react-data-table-component/blob/master/src/DataTable/themes.js

type TableRowType = {
  id: number;
  labels: string;
  dim_red: React.JSX.Element;
}

const COLUMNS = [
  {
    name: 'Local Dimensionality Reduction Plots using PCA',
    selector: (row:TableRowType) => row.dim_red,
    sortable: false,
  },
];

type Props = {
  downloadFilteredData: () => void,
  inDistributionThreshold: number,
  plotDataForSamples: PlotDataForSample[],
}

const FilteredTable = ({
  downloadFilteredData,
  inDistributionThreshold,
  plotDataForSamples,
}: Props) => {
  const darkMode = useAppSelector(state => state.uiSettings.darkMode)

  const tableData:TableRowType[] = useMemo(() => (
    plotDataForSamples.map((plotDataForSample, sampleIndex) => {
      const { processedClassProbabilities } = plotDataForSample

      return {
        id: sampleIndex,
        labels: Object.keys(processedClassProbabilities).filter((label:string) => processedClassProbabilities[label]===1).join(", "),
        dim_red: (
          <LocalPlot
            inDistributionThreshold={inDistributionThreshold}
            plotDataForSample={plotDataForSample}
          />
        ),
      }
    })
  ), [inDistributionThreshold, plotDataForSamples])


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
            //@ts-ignore
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



function LocalPlot({
  inDistributionThreshold,
  plotDataForSample: {
    getPrototypeSupportEmbeddings,
    labelsSortedByProbability,
    processedClassProbabilities,
    sample,
    sampleCondition,
  },
}:{
  inDistributionThreshold: number,
  plotDataForSample: PlotDataForSample,
}) {
  const {
    inputDataType,
    modelName,
    runId,
  } = useAppSelector(state => state.inferenceSettings)
  const serverUrl = useAppSelector(state => state.uiSettings.serverUrl)

  
  const confidenceMsg: React.ReactNode = getSampleConditionText(sampleCondition, labelsSortedByProbability)

  return (
    <div>
      <br/>
      {(
        <div>
          <p style={{width: "calc(900px + 2em)"}}>{confidenceMsg}</p>
          {getPrototypeSupportEmbeddings ? (
            <ScatterUQDataWrapper
              inDistributionThreshold={inDistributionThreshold}
              inputDataType={inputDataType}
              modelName={modelName}
              processedClassesProbabilities={[processedClassProbabilities]}
              prototypeSupportEmbeddings={getPrototypeSupportEmbeddings}
              runId={runId}
              samples={[sample]}
              serverUrl={serverUrl}
            >
              {props => <ScatterUQ {...props}/>}
            </ScatterUQDataWrapper>
          ) : <p>There was an error getting the prototype support embeddings for this sample.</p>}
        </div>
      )}

      <br/>
    </div>
  )
}
