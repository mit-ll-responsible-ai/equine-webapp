// Copyright (c) 2026 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import { useAppSelector } from "@/redux/reduxHooks";

import Button from 'react-bootstrap/Button'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload } from '@fortawesome/free-solid-svg-icons'

import NoDataMessage from "@/components/NoDataMessage"
import ScatterUQ from "@/components/ScatterUQ/ScatterUQ";
import ScatterUQDataWrapper from "@/components/ScatterUQ/ScatterUQDataWrapper";

import styles from "./FilteredTable.module.scss"
import { PlotDataForSample } from "@/utils/getPlotDataForSample";
import { SampleConditionText } from "../ScatterUQ/SampleConditionText";

import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { PaginationControls } from "../PaginationControls/PaginationControls";

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
  // Define columns with custom renderers
  const columns: ColumnDef<PlotDataForSample>[] = [
    {
      accessorKey: 'id',
      cell: (info) => (
        <LocalPlot
          inDistributionThreshold={inDistributionThreshold}
          plotDataForSample={info.row.original}
        />
      ),
    },
  ];

  // Initialize table
  const table = useReactTable({
    data: plotDataForSamples,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });


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

          {plotDataForSamples.length===0 && <NoDataMessage/>}

          <div>
            <div style={{marginLeft:"-1rem",marginRight:"-1rem",marginBottom:"1rem"}}>
              {table.getRowModel().rows.map((row) => (
                <div key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <div
                      key={cell.id}
                      style={{
                        border: '1px solid #ddd',
                        padding: '1rem',
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <PaginationControls numRows={plotDataForSamples.length} table={table}/>
          </div>
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

  return (
    //this styling is necessary for responsiveness in the table
    <div>
      <br/>
      {(
        <div>
          <SampleConditionText condition={sampleCondition} sortedLabels={labelsSortedByProbability}/>
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
              {props => <ScatterUQ height={800} {...props}/>}
            </ScatterUQDataWrapper>
          ) : <p>There was an error getting the prototype support embeddings for this sample.</p>}
        </div>
      )}

      <br/>
    </div>
  )
}
