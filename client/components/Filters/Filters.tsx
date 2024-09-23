// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import React from "react"

import type { LabelCounter } from "@/components/Dashboard/getClassCounts"

import styles from "./Filters.module.scss"
import { Col, Row } from "react-bootstrap"
import { SAMPLE_CONDITIONS } from "@/utils/determineSampleCondition"

type Props = {
  classCounts: LabelCounter,
  filters: string[],
  labels: string[],
  toggleFilter: (label:string) => void,
  setFilters: (filters: string[]) => void,
}


const Filters = ({
  classCounts,
  filters,
  labels,
  setFilters,
  toggleFilter,
}: Props) => {
  const columnCount = Math.ceil(labels.length / 4)
  const sortedLabels = [...labels].sort((a,b) => {
    if(a === SAMPLE_CONDITIONS.CLASS_CONFUSION) return 1
    if(a === SAMPLE_CONDITIONS.OOD) return 1
    if(b === SAMPLE_CONDITIONS.CLASS_CONFUSION) return -1
    if(b === SAMPLE_CONDITIONS.OOD) return -1
    return a<b ? -1 : 1
  })
  const columns = Array.from(Array(4).keys()).map((_,i) => {
    return sortedLabels.slice(i*columnCount, (i+1)*columnCount)
  })


  const labelsMapper = (label:string) => {
    const id = "label-" + label

    return (
      <div key={label}>
        <input id={id} type="checkbox" checked={filters.includes(label)} onChange={e => toggleFilter(label)}/>
        {" "}<label htmlFor={id}>{label} ({classCounts[label]})</label>
      </div>
    )
  }

  const columnMapper = (c:string[], i:number) => (
    <Col key={i} sm={12} md={6}>
      {c.map(labelsMapper)}
    </Col>
  )

  return (
    <div className="box">
      <div id={styles.filters}>
        <div>
          <div><b>Filter Labels</b></div>

          <div className={styles.selectDeselectContainer}>
            <span className={styles.selectDeselectOption} onClick={e => setFilters([...labels])}>Select All</span>
            &nbsp; /
            &nbsp; <span className={styles.selectDeselectOption} onClick={e => setFilters([])}>Deselect All</span>
          </div>

          <Row>
            <Col xs={12} sm={6}>
              <Row>
                {columns.slice(0,2).map(columnMapper)}
              </Row>
            </Col>

            <Col xs={12} sm={6}>
              <Row>
                {columns.slice(2,4).map(columnMapper)}
              </Row>
            </Col>
          </Row>
        </div>
      </div>
    </div>
  )
}

export default Filters;
