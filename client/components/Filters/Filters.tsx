// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import React from "react"

import type { LabelCounter } from "@/components/Dashboard/getAppClassCounts"

import styles from "./Filters.module.scss"

type Props = {
  appClassCounts: LabelCounter,
  filters: string[],
  labels: string[],
  toggleFilter: (label:string) => void,
  setFilters: (filters: string[]) => void,
}


const Filters = ({
  appClassCounts,
  filters,
  labels,
  setFilters,
  toggleFilter,
}: Props) => {
  const labelsMapper = (label:string) => {
    const id = "label-" + label

    return (
      <div key={label}>
        <input id={id} type="checkbox" checked={filters.includes(label)} onChange={e => toggleFilter(label)}/>
        {" "}<label htmlFor={id}>{label} ({appClassCounts[label]})</label>
      </div>
    )
  }

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

          <div style={{display:"flex", justifyContent: "space-between"}}>
            {labels.map(labelsMapper)}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Filters;
