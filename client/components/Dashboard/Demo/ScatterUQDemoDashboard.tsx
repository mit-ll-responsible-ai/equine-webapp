// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import React, { useEffect, useMemo, useState } from "react"

import Alert from "react-bootstrap/Alert"
import Button from "react-bootstrap/Button"

import DataTable from "react-data-table-component"

import { useAppSelector } from "@/redux/reduxHooks"
import type { ClassProbabilitiesType, InputDataType, SampleType } from "@/redux/inferenceSettings"

import { GetPrototypeSupportEmbeddingsQuery } from "@/graphql/generated"

import useFilters, { sampleMatchesFilters } from "@/hooks/useFilters"

import ControlBar from "@/components/ControlBar/ControlBar"
import Filters from "@/components/Filters/Filters"
import InfoTooltip from "@/components/InfoTooltip/InfoTooltip"
import NoDataMessage from "@/components/NoDataMessage"
import SamplesBarChart from "@/components/SamplesBarChart/SamplesBarChart"
import ScatterUQ from "@/components/ScatterUQ/ScatterUQ"
import { ScatterUQDataProps, StructuredDimRedOutputType } from "@/components/ScatterUQ/types"

import determineSampleCondition, { getSampleConditionText } from "@/utils/determineSampleCondition"
import getLabelsSortedByProbability from "@/utils/getLabelsSortedByProbability"
import setDocumentTitle from "@/utils/setDocumentTitle"

import getClassCounts from "../getClassCounts"
import processConfidenceThresholds from "../processConfidenceThresholds"

import mnistInferenceSamples from "./mnist-inference-samples.json"
import mnistPrototypeSupportExamples from "./mnist-prototype-support-examples.json"
import mnistTableDataUnpopulated from "./mnist-table-data.json"
import mnistGlobalUmapUnpopulated from "./mnist-global-umap.json"

import vnatInferenceSamples from "./vnat-inference-samples.json"
import vnatPrototypeSupportExamples from "./vnat-prototype-support-examples.json"
import vnatTableDataUnpopulated from "./vnat-table-data.json"
import vnatInferenceSamplesInput from "./vnat-inference-samples-input.json"
import vnatSupportExamplesInput from "./vnat-support-examples-input.json"
import vnatGlobalUmapUnpopulated from "./vnat-global-umap.json"

import styles from "./ScatterUQDemoDashboard.module.scss"


//these values are hard coded since having them be truly dynamic would require a live server to recalculate DR and metrics
const CLASS_CONFIDENCE_THRESHOLD = 70
const IN_DISTRO_THRESHOLD = 95


//these unpopulated data types have placeholders for the samples and prototypeSupportEmbeddings
//since these are often repeated and take up a lot of space if we store it as is in JSON stringified form
type UnpopulatedRowDataType = {
  continuity: number,
  inDistributionThreshold: number,
  stress: number,
  processedClassesProbabilities: ClassProbabilitiesType[],
  prototypeSupportEmbeddings: { getPrototypeSupportEmbeddings: string[] }, //we will replace the label strings with the actual prototypeSupportEmbedding
  samples: number[], //we will replace the dataIndex numbers with the actual inference sample
  srho: number,
  structuredEmbeddings: StructuredDimRedOutputType;
  trustworthiness: number;
}
type UnpopulatedGlobalUmapType = {
  continuity: number,
  inDistributionThreshold: number,
  stress: number,
  prototypeSupportEmbeddings: { getPrototypeSupportEmbeddings: string[] }, //we will replace the label strings with the actual prototypeSupportEmbedding
  samples: number[], //we will replace the dataIndex numbers with the actual inference sample
  srho: number,
  structuredEmbeddings: StructuredDimRedOutputType;
  trustworthiness: number;
}
//we used these populating functions to replace the number placeholders with the actual samples, and the label placeholders with the actual prototypeSupportEmbeddings
function populateGlobalUmap(
  unpopulatedGlobalUmap: UnpopulatedGlobalUmapType,
  inferenceSamples: SampleType[],
  prototypeSupportExamples: GetPrototypeSupportEmbeddingsQuery["getPrototypeSupportEmbeddings"],
) {
  return {
    ...unpopulatedGlobalUmap,
    processedClassesProbabilities: processConfidenceThresholds(unpopulatedGlobalUmap.samples.map(n =>  inferenceSamples[n]), CLASS_CONFIDENCE_THRESHOLD, IN_DISTRO_THRESHOLD),
    samples: unpopulatedGlobalUmap.samples.map(n =>  inferenceSamples[n]),
    prototypeSupportEmbeddings: {
      getPrototypeSupportEmbeddings: unpopulatedGlobalUmap.prototypeSupportEmbeddings.getPrototypeSupportEmbeddings.map(label => {
        return prototypeSupportExamples.find(e => e.label === label)
      })
    } as GetPrototypeSupportEmbeddingsQuery
  }
}
function populateTableData(
  unpopulatedTableData: UnpopulatedRowDataType[],
  inferenceSamples: SampleType[],
  prototypeSupportExamples: GetPrototypeSupportEmbeddingsQuery["getPrototypeSupportEmbeddings"],
) {
  return unpopulatedTableData.map((e) => {
    return {
      ...e,
      samples: e.samples.map(n =>  inferenceSamples[n]),
      prototypeSupportEmbeddings: {
        getPrototypeSupportEmbeddings: e.prototypeSupportEmbeddings.getPrototypeSupportEmbeddings.map(label => {
          return prototypeSupportExamples.find(e => e.label === label)
        })
      } as GetPrototypeSupportEmbeddingsQuery
    }
  })
}

const mnistGlobalUmap = populateGlobalUmap(mnistGlobalUmapUnpopulated, mnistInferenceSamples, mnistPrototypeSupportExamples)
const mnistTableData = populateTableData(mnistTableDataUnpopulated, mnistInferenceSamples, mnistPrototypeSupportExamples)

const vnatGlobalUmap = populateGlobalUmap(vnatGlobalUmapUnpopulated, vnatInferenceSamples, vnatPrototypeSupportExamples)
const vnatTableData = populateTableData(vnatTableDataUnpopulated, vnatInferenceSamples, vnatPrototypeSupportExamples)

const DATA_OPTIONS = [
  {
    inputDataType: "Image" as InputDataType,
    globalUmapData: mnistGlobalUmap,
    scatterUqData: mnistTableData,
    getInferenceSampleImageSrc: (dataIndex: number) => `./ScatterUQ-demo-images/FashionMNIST-ID_MNIST-OOD/images/sample-${dataIndex}.jpg`,
    getInferenceSampleTabularData: async (dataIndex: number) => ({
      renderInferenceFeatureData: {columnHeaders: [], featureData: []} //this doesn't do anything
    }),
    getSupportExampleImageSrc:(dataIndex: number) => {
      const numSupportExamplesPerClass = mnistPrototypeSupportExamples[0].trainingExamples.length
      const supportIndex = dataIndex % numSupportExamplesPerClass
      const classIndex = Math.floor(dataIndex / numSupportExamplesPerClass)
      return `./ScatterUQ-demo-images/FashionMNIST-ID_MNIST-OOD/images/class-${classIndex}_support-${supportIndex}.jpg`
    },
    getSupportExampleTabularData: async (dataIndex: number) => ({
      renderSupportFeatureData: {columnHeaders: [], featureData: []} //this doesn't do anything
    }),
  },
  {
    inputDataType: "Tabular" as InputDataType,
    globalUmapData: vnatGlobalUmap,
    scatterUqData: vnatTableData,
    getInferenceSampleImageSrc: (dataIndex: number) => "", //this doesn't do anything
    getInferenceSampleTabularData: async (dataIndex: number) => ({
      renderInferenceFeatureData: vnatInferenceSamplesInput[dataIndex]
    }),
    getSupportExampleImageSrc:(dataIndex: number) => "", //this doesn't do anything
    getSupportExampleTabularData:async (dataIndex: number) => ({
      renderSupportFeatureData: vnatSupportExamplesInput[dataIndex]
    }),
  }
]



export default function ScatterUQDemoDashboard() {
  useEffect(() => setDocumentTitle("Scatter UQ Demo Dashboard"))

  const [index, setIndex] = useState<number>(0)
  const {
    inputDataType,
    globalUmapData,
    scatterUqData,
    getInferenceSampleImageSrc,
    getInferenceSampleTabularData,
    getSupportExampleImageSrc,
    getSupportExampleTabularData,
  } = DATA_OPTIONS[index]


  //memoize processing the samples and application class counts
  const processedClassesProbabilities = useMemo(() => processConfidenceThresholds(
    globalUmapData.samples,
    CLASS_CONFIDENCE_THRESHOLD,
    IN_DISTRO_THRESHOLD,
  ),[globalUmapData.samples])

  //memoize saving the processed classes probabilities to the respective inference samples
  useMemo(() => {
    scatterUqData.forEach((s,i) => {
      //s.processedClassesProbabilities is initially an empty array
      //add the processedClassProbabilities for this sample we just calculated above
      s.processedClassesProbabilities = [ processedClassesProbabilities[i] ]
    })
  }, [processedClassesProbabilities, scatterUqData])


  const { classCounts, labels } = useMemo(() => getClassCounts(processedClassesProbabilities), [processedClassesProbabilities])

  const { filters, setFilters, toggleFilter } = useFilters(labels)

  
  const filteredTableData = scatterUqData.filter(({processedClassesProbabilities},i) => sampleMatchesFilters(filters, processedClassesProbabilities[0]))


  return (
    <div id="isData">
      <div className="box">
        <h2>ScatterUQ Demo</h2>
        <p>This page is a demo for the paper <a href="https://www.computer.org/csdl/proceedings-article/vis/2023/255700a246/1T3cOAGFXbi" target="_blank"><i>ScatterUQ: Interactive Uncertainty Visualizations for Multiclass Deep Learning Problems</i></a>.</p> 

        {["MNIST Example", "VNAT Example"].map((text, i) => 
          <span key={i}>
            <Button variant={index===i?"primary":"outline-primary"} onClick={() => setIndex(i)}>{text}</Button>
            &nbsp;
          </span>
        )}
      </div>

      <div className="box">
        <Alert variant="warning">Normally the user can use the sliders below to adjust the outlier tolerance and class confidence threshold. When the sliders are changed, the use case that each inference sample falls under may change. However, since this is a static demo without a model and running server, these values are fixed in place.</Alert>
        <div className={styles.demoSlidersContainer}>
          <ControlBar
            classConfidenceThreshold={CLASS_CONFIDENCE_THRESHOLD}
            inDistributionThreshold={IN_DISTRO_THRESHOLD}
            changeClassConfidenceThreshold={() => {}}
            changeInDistributionThreshold={() => {}}
          />
        </div>
      </div>

      <div className="box">
        <h3>
          Number of Samples in Each Label &nbsp;
          <InfoTooltip placement="top" tooltipContent="This chart shows the breakdown of samples-per-label based on the above confidence thresholds."/>
        </h3>
        <SamplesBarChart
          labels={labels}
          processedClassesProbabilities={processedClassesProbabilities}
          samples={globalUmapData.samples}
        />
      </div>

      <Filters
        classCounts={classCounts}
        filters={filters}
        labels={labels}
        setFilters={setFilters}
        toggleFilter={toggleFilter}
      />

      <FilteredTable
        data={filteredTableData}
        getInferenceSampleImageSrc={getInferenceSampleImageSrc}
        getInferenceSampleTabularData={getInferenceSampleTabularData}
        getSupportExampleImageSrc={getSupportExampleImageSrc}
        getSupportExampleTabularData={getSupportExampleTabularData}
        inputDataType={inputDataType}
      />

      <div className="box">
        <h4>Global Scatterplot with UMAP</h4>
        
        <ScatterUQ
          {...globalUmapData}
          inputDataType={inputDataType}
          getInferenceSampleImageSrc={getInferenceSampleImageSrc}
          getInferenceSampleTabularData={getInferenceSampleTabularData}
          getSupportExampleImageSrc={getSupportExampleImageSrc}
          getSupportExampleTabularData={getSupportExampleTabularData}
          startingHeight={400}
          startingWidth={500}
          thresholds={10}
        />
      </div>
      
    </div>
  )
}


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

const FilteredTable = ({
  data,
  getInferenceSampleImageSrc,
  getInferenceSampleTabularData,
  getSupportExampleImageSrc,
  getSupportExampleTabularData,
  inputDataType,
}: {
  data: {
    continuity: number,
    inDistributionThreshold: number,
    stress: number,
    processedClassesProbabilities: ClassProbabilitiesType[],
    prototypeSupportEmbeddings: GetPrototypeSupportEmbeddingsQuery,
    samples: SampleType[],
    scree?: number[] | null,
    srho: number,
    structuredEmbeddings: StructuredDimRedOutputType,
    trustworthiness: number,
  }[],
  getInferenceSampleImageSrc: ScatterUQDataProps["getInferenceSampleImageSrc"],
  getInferenceSampleTabularData: ScatterUQDataProps["getInferenceSampleTabularData"],
  getSupportExampleImageSrc: ScatterUQDataProps["getSupportExampleImageSrc"],
  getSupportExampleTabularData: ScatterUQDataProps["getSupportExampleTabularData"],
  inputDataType: InputDataType,
}) => {
  const darkMode = useAppSelector(state => state.uiSettings.darkMode)

  const tableData:TableRowType[] = data.map((d, sampleIndex: number) => {
    const labelsSortedByProbability = getLabelsSortedByProbability(d.samples[0], d.prototypeSupportEmbeddings)
  
    const sampleCondition = determineSampleCondition(d.processedClassesProbabilities[0])
    const confidenceMsg: React.ReactNode = getSampleConditionText(sampleCondition, labelsSortedByProbability)

    return {
      id: sampleIndex,
      labels: d.processedClassesProbabilities.filter(
        //@ts-ignore
        (label:string) => d.processedClassesProbabilities[label]===1
      ).join(", "),
      dim_red: (
        <div>
          <br/>
          <br/>
          <p style={{width: "calc(900px + 2em)"}}>{confidenceMsg}</p>
          <ScatterUQ
            {...d}
            inputDataType={inputDataType}
            getInferenceSampleImageSrc={getInferenceSampleImageSrc}
            getInferenceSampleTabularData={getInferenceSampleTabularData}
            getSupportExampleImageSrc={getSupportExampleImageSrc}
            getSupportExampleTabularData={getSupportExampleTabularData}
            startingHeight={400}
            startingWidth={500}
            thresholds={10}
          />
          <br/>
          <br/>
        </div>
      ),
    }
  })


  return (
    <div className="row">
      <div className="col">
        <div id={styles.filteredTable} className="box">
          <div>
            <h3>Scatter UQ Inference Samples</h3>
          </div>

          <DataTable
            //@ts-ignore
            columns={COLUMNS}
            data={tableData}
            noDataComponent={<div className="filteredTableNoData"><NoDataMessage/></div>}
            noHeader
            pagination
            theme={darkMode ? "dark" : ""}
          />
        </div>
      </div>
    </div>
  )
}