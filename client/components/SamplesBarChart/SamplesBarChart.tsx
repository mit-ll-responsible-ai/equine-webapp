// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import React, { useMemo } from "react"
import { ColumnChart } from 'react-chartkick';

import type { ClassProbabilitiesType, SampleType } from "@/redux/inferenceSettings"
import { useAppSelector } from "@/redux/reduxHooks";

import { darkModeLibraryOptions } from "@/utils/chartkick"
import useOodThresholds from "@/hooks/useOodThresholds";
import useGetColorFromLabel from "@/hooks/useGetColorFromLabel";

import processStackData from "./processStackData"

import styles from "./SamplesBarChart.module.scss"

type Props = {
  labels: string[],
  processedClassesProbabilities: ClassProbabilitiesType[],
  samples: SampleType[],
}


const SamplesBarChart = ({
  labels,
  processedClassesProbabilities,
  samples,
}:Props) => {
  const darkMode = useAppSelector(state => state.uiSettings.darkMode)

  const getColorFromLabel = useGetColorFromLabel()
  const oodThresholds = useOodThresholds()

  const borderColor = useMemo(
    () => labels.map(l => getColorFromLabel(l)),
    [labels, getColorFromLabel]
  )

  const stackData = useMemo(
    () => processStackData(oodThresholds, processedClassesProbabilities, samples),
    [oodThresholds, processedClassesProbabilities, samples]
  )


  return (
    <div className={styles.samplesBarChartContainer}>
      <div className={styles.legend}>
        {labels.map(l => {
          const color = getColorFromLabel(l)
          return (
            <React.Fragment key={l}>
              <span className={styles.labelColorBox} style={{backgroundColor: color}}></span> <span>{l}</span>
            </React.Fragment>
          )
        })}
      </div>
      
      <ColumnChart
        data={stackData}
        dataset={{
          backgroundColor: (d: any) => getColorFromLabel(labels[d.dataIndex], oodThresholds[d.datasetIndex]), 
          borderColor,
        }}
        legend={false}
        library={{
          ...(darkMode ? darkModeLibraryOptions : {}),
          // onClick: (e: React.MouseEvent, element:any) => {
          //   onClickBar(e, element, labels)
          // },
        }}
        stacked
        xtitle={'Labels'}
        ytitle={'# of Samples'}
      />
    </div>
  )
}

export default SamplesBarChart
