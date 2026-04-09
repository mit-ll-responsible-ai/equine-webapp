// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import React, { useMemo } from "react";

import { useAppSelector } from "@/redux/reduxHooks";

import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
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
  const columns = useMemo<ColumnDef<PlotDataForSample>[]>(
    () => [
      {
        accessorKey: 'id',
        cell: (info) => (
          <LocalPlot
            inDistributionThreshold={inDistributionThreshold}
            plotDataForSample={info.row.original}
          />
        ),
      },
    ],
    []
  );

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

            {/* Pagination Controls */}
            <div id={styles["pagination-container"]}>
              <div id={styles["pagination-buttons"]}>
                <Button
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                  size="sm"
                >
                  First
                </Button>
                <Button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  size="sm"
                >
                  Prev
                </Button>
                <Button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  size="sm"
                >
                  Next
                </Button>
                <Button
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                  size="sm"
                >
                  Last
                </Button>
              </div>
              
              <span>
                Page{' '}
                <strong>
                  {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </strong>
              </span>
              
              <span>
                Go to page
                <Form.Control
                  type="number"
                  defaultValue={table.getState().pagination.pageIndex + 1}
                  min={1}
                  max={table.getPageCount()}
                  onChange={(e) => {
                    const page = e.target.value ? Number(e.target.value) - 1 : 0;
                    table.setPageIndex(page);
                  }}
                />
              </span>
              
              <Form.Select
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
              >
                {[5, 10, 20, 50].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    Show {pageSize}
                  </option>
                ))}
              </Form.Select>
              
              <span style={{ marginLeft: '10px' }}>
                Total Records: {plotDataForSamples.length}
              </span>
            </div>
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
              {props => <ScatterUQ height={600} {...props}/>}
            </ScatterUQDataWrapper>
          ) : <p>There was an error getting the prototype support embeddings for this sample.</p>}
        </div>
      )}

      <br/>
    </div>
  )
}
