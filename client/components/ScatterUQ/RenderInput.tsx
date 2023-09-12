// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import React from "react"
import { InputDataType } from "@/redux/inferenceSettings";
import { ScatterUQDataProps } from "./types";
import { useQuery } from "@tanstack/react-query";

type RenderInputProps = {
  dataIndex: number,
  getInferenceSampleImageSrc?: ScatterUQDataProps["getInferenceSampleImageSrc"],
  getInferenceSampleTabularData?: ScatterUQDataProps["getInferenceSampleTabularData"],
  getSupportExampleImageSrc?: ScatterUQDataProps["getSupportExampleImageSrc"],
  getSupportExampleTabularData?: ScatterUQDataProps["getSupportExampleTabularData"],
  inputDataType: InputDataType,
}

export default function RenderInput(props:RenderInputProps) {
  if(props.inputDataType === "Image") {
    return <RenderInputAsImage {...props}/>
  }
  //if you want to render other input types, create a new component to handle that
  return <QueryAndRenderInputAsTabular {...props}/>
}




function RenderInputAsImage({
  dataIndex,
  getInferenceSampleImageSrc,
  getSupportExampleImageSrc,
}:RenderInputProps) {
  if(getInferenceSampleImageSrc && getSupportExampleImageSrc) {
    const text = "The RenderInputAsImage component expects either getInferenceSampleImageSrc or getSupportExampleImageSrc props to be defined, but not both to be defined"
    console.warn(text)
    return <p>{text}</p>
  }
  else if(getInferenceSampleImageSrc) {
    return (
      <img src={getInferenceSampleImageSrc(dataIndex)} alt="inference sample"/>
    )
  }
  else if(getSupportExampleImageSrc) {
    return (
      <img src={getSupportExampleImageSrc(dataIndex)} alt="support example"/>
    )
  }
  else {
    const text = "The RenderInputAsImage component expects either getInferenceSampleImageSrc or getSupportExampleImageSrc props to be defined, but both are undefined"
    console.warn(text)
    return <p>{text}</p>
  }
}




//In React we're not supposed to conditionally use hooks
//Instead this parent component picks which respective child component to render
//An each child component uses a different hook
function QueryAndRenderInputAsTabular({
  dataIndex,
  getInferenceSampleTabularData,
  getSupportExampleTabularData,
}:RenderInputProps) {
  const {data, error, isLoading} = useQuery({
    //the query key is important, otherwise react-query will cache the last result and incorrectly reuse the same result for different samples
    queryKey: [getInferenceSampleTabularData ? `renderInferenceFeatureData-${dataIndex}` : `renderSupportFeatureData-${dataIndex}`],
    queryFn: async () => {
      if(getInferenceSampleTabularData && getSupportExampleTabularData) return
      else if(getInferenceSampleTabularData) return (await getInferenceSampleTabularData(dataIndex))?.renderInferenceFeatureData
      else if(getSupportExampleTabularData) return (await getSupportExampleTabularData(dataIndex))?.renderSupportFeatureData
      else return
    }
  })
  if(isLoading) {
    return <p>Loading...</p>
  }
  else if(data) {
    const formattedData = data.columnHeaders.reduce((acc, heading, i) => {
      if(i < data.featureData.length) {
        acc[heading] = parseFloat(data.featureData[i].toFixed(2))
      }
      return acc
    }, {} as {[key:string]: number})

    return (
      <pre>
        {JSON.stringify(formattedData, undefined, 2)}
      </pre>
    )
  }
  else if(error) {
    if(error instanceof Error) {
      return <p>{error.message}</p>
    }
  }
  else if(getInferenceSampleTabularData && getSupportExampleTabularData) {
    const text = "The QueryAndRenderInputAsTabular component expects either getInferenceSampleTabularData or getSupportExampleTabularData props to be defined, but not both to be defined"
    console.warn(text)
    return <p>{text}</p>
  }
  else if(!getInferenceSampleTabularData && !getSupportExampleTabularData) {
    const text = "The QueryAndRenderInputAsTabular component expects either getInferenceSampleTabularData or getSupportExampleTabularData props to be defined, but both are undefined"
    console.warn(text)
    return <p>{text}</p>
  }
  
  return <p>Something in the component went wrong</p>
}

