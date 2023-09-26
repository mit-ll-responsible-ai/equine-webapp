// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import React, { useCallback, useMemo } from 'react'
import { scaleLinear } from 'd3'

import { useAppSelector } from '@/redux/reduxHooks'

import ColoredLabel from "@/components/ColoredLabel/ColoredLabel"
import InfoTooltip from "@/components/InfoTooltip/InfoTooltip"
import Matrix from "@/components/Matrix/Matrix"

import useGetColorFromLabel from '@/hooks/useGetColorFromLabel'

import { COLORS, COLOR_BLIND_COLORS } from '@/utils/colors'

import "./confusionMatrix.scss"

type Props = {
  data: number[][],
  labels: string[],
  num_test_examples: {
    [label:string]: number,
  }
}

const ConfusionMatrix = ({
  data,
  labels,
  num_test_examples,
}: Props) => {
  const colorBlindMode = useAppSelector(state => state.uiSettings.colorBlindMode)
  const getColorFromLabel = useGetColorFromLabel()

  const columns = useMemo(() => {
    return labels.map((l,i) => ({ //make an array of column headings
      name: l,
      count: (() => { //sum the values along this column
        let sum = 0 //start the sum at 0
        data.forEach(d => //for each row in the data
          sum += Math.round(100*d[i]) //sum the value at this column
        )
        return sum / 100 //return the sum
      })(), //self invoking function
    }))
  }, [data, labels])

  const rows = useMemo(() => {
    return labels.map((l,i) => ({
      name: l,
      count: data[i].reduce( //sum the values in this row
        (acc:number, value:number) => acc + Math.round(100*value),
        0,
      ) / 100,
    }))
  }, [data, labels])
  // console.log(labels)
  const orders = useMemo(() => {
    return {
      rows: {
        name: Array.from(Array(rows.length).keys()), //sort alphabetically
        // count: Array.from(Array(rows.length).keys()).sort((a:number, b:number) => rows[b].count - rows[a].count) //sort by count
      },
      columns: {
        name: Array.from(Array(columns.length).keys()), //sort alphabetically
        // count: Array.from(Array(columns.length).keys()).sort((a:number, b:number) => columns[b].count - columns[a].count) //sort by count
      }
    }
  }, [rows, columns])

  const colors = colorBlindMode ? COLOR_BLIND_COLORS : COLORS
  const colorScales:{
    green: (value: number) => string,
    red: (value: number) => string,
  } = useMemo(() => ({
    green: scaleLinear<string>().domain([0,0.001,1]).range(["#bbb", colors.LIGHT_GREEN, colors.MEDIUM_GREEN]),
    red: scaleLinear<string>().domain([0,0.001,1]).range(["#eee", colors.LIGHT_PINK, colors.PINK]),
  }), [colors])

  const matrixData = useMemo(() => data.map((row, i) => {
    const colorFunction = (i: number, j: number, value: number) => {
      const proportion = value / (num_test_examples?.[labels?.[i]] || 1)
    
      if(i === j) { //if we are along the diagonal, high values are good
        return colorScales.green(proportion)
      }
      //else high values are bad
      return colorScales.red(proportion)
    }

    return row.map((value, j) => ({
      r: i,
      c: j,
      z: value,
      fill: colorFunction(i,j,value)
    }))
  }), [colorScales, data, labels, num_test_examples])

  const getTooltipContent = useCallback(
    (i: number, j: number) => {
      const labelTrue = labels[i]
      const labelPredicted = labels[j]
      const value = matrixData[i][j].z
      const plural = value !== 1

      //build an initial string
      
      let postContent = ""

      const correctPrediction = i === j

      // if(value > 0) { //if there were data points in this cell
      //   if(correctPrediction) { //if this is along the identity diagonal
      //     postContent = " This means the model was not confused, which is good!"
      //   }
      //   else { //else the model was confused
      //     postContent = " This means the model confused these two labels, which is not good. To improve the model, you may need to provide more distinguishable training data for these labels. Or possibly, the training labels are difficult to distinguish, and you could combine them."
      //   }
      // }

      return (
        <span>
          There {plural?"were":"was"} {value} data point{plural?"s":""} with label <ColoredLabel color={getColorFromLabel(labelTrue)} label={labelTrue}/> that the model {correctPrediction?"":"in"}correctly predicted to be <ColoredLabel color={getColorFromLabel(labelPredicted)} label={labelPredicted}/>. {postContent}
        </span>
      )
    },
    [getColorFromLabel, labels, matrixData]
  )


  return (
    <div className="confusionMatrixContainer">
      <h4>
        Confusion Matrix:&nbsp;
        <InfoTooltip placement="top" tooltipContent={EXPLANATION}/>
      </h4>

      <div className="confusionMatrix">
        <div className="trueAxis">True Label</div>
        <div className="predictedAxis">Predicted Label</div>

        <Matrix
          columns={columns}
          data={matrixData}
          orderBy="name"
          orders={orders}
          rows={rows}

          formatColHeading={(text:string, count:number) => [text, ""]}
          formatRowHeading={(text:string, count:number) => [text, ""]}
          getTooltipContent={getTooltipContent}
        />
      </div>
    </div>
  )
}

export default ConfusionMatrix

const EXPLANATION = "A confusion matrix evaluates model performance by comparing the predicted (X axis) versus the actual (Y axis) classes  for some test data. A perfect model will correctly predict the actual classes, filling entries along the top-left to bottom-right diagonal cells. Mispredictions occur off the diagonal."