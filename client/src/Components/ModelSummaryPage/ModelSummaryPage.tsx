// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import React, { useEffect } from 'react'
import { Link, useParams } from "react-router-dom"
import { ColumnChart } from 'react-chartkick';
import Button from 'react-bootstrap/Button'
import { timeFormat } from 'd3'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChartBar, faHome, faUndo, faAngleDoubleRight } from '@fortawesome/free-solid-svg-icons'

import { ROUTES } from "App"

import { useAppSelector } from 'redux/reduxHooks';

import ConfusionMatrix from "Components/ConfusionMatrix/ConfusionMatrix"
import InfoTooltip from "Components/InfoTooltip/InfoTooltip"
import ScatterUQ from 'Components/ScatterUQ/ScatterUQ';
import ScatterUQDataWrapper from 'Components/ScatterUQ/ScatterUQDataWrapper';

import { darkModeLibraryOptions } from "utils/chartkick"
import setDocumentTitle from "utils/setDocumentTitle"

import useGetColorFromLabel from 'hooks/useGetColorFromLabel'

import { useModelSummaryQuery, useGetPrototypeSupportEmbeddingsQuery } from 'graphql/generated'

import "./modelSummaryPage.scss"


const formatTime = timeFormat("%B %d, %Y %H:%M:%S")


const ModelSummaryPage = () => {
  const {
    inputDataType,
    runId,
    samples,
  } = useAppSelector(state => state.inferenceSettings)
  const { darkMode, serverUrl } = useAppSelector(state => state.uiSettings)

  // const getColorFromLabel = useGetColorFromLabel()

  const { modelName } = useParams() as { modelName: string }

  const { data, error, isLoading } = useModelSummaryQuery({ modelName })

  useEffect(() => setDocumentTitle(`Model Summary - ${modelName}`), [modelName])

  const {
    data: prototypeSupportEmbeddings,
    error: prototypeSupportEmbeddingsError,
    isLoading: prototypeSupportEmbeddingsIsLoading
  } = useGetPrototypeSupportEmbeddingsQuery({modelFilename: modelName.replace(".eq", "")})


  const getButtons = () => {
    if(data) {
      return (
        <React.Fragment>
          <Link to={ROUTES.RETRAINING+modelName}>
            <Button variant="secondary">Retrain Model <FontAwesomeIcon icon={faAngleDoubleRight}/></Button>
          </Link>&nbsp;

          <span>
            {
              samples.length > 0 //if there are samples
              ? ( //offer to go back to the dashboard
                <Link to={`${ROUTES.DASHBOARD}`}>
                  <Button variant="secondary">Go to Dashboard Page <FontAwesomeIcon icon={faChartBar}/></Button>
                </Link>
              )
              : ( //else offer to use this model to run the pipeline
                <Link to={`${ROUTES.LANDING}?modelName=${modelName}`}>
                  <Button variant="secondary">Analyze files with this Model <FontAwesomeIcon icon={faHome}/></Button>
                </Link>
              )
            }
          </span>
        </React.Fragment>
      )
    }
  }

  const getContent = () => {
    if(isLoading) {
      return <div className="box">Loading...</div>
    }
    else if(error) {
      return <div className="box">Error: {(error as Error).message}</div>
    }
    else if(data?.modelSummary) {
      const modelSummary = data.modelSummary

      // const colors = modelSummary.numTrainExamples.map(e => getColorFromLabel(e.label))

      return (
        <div>
          <div className="box">
            <div><b>Date Trained:</b> {formatTime(new Date(modelSummary.dateTrained))}</div>
            {/* <div><b>Accuracy:</b> {Math.round(100*modelSummary.accuracy)}%</div> */}
            {/* <div><b>Micro F1 Score:</b> {modelSummary.microF1Score.toFixed(2)}</div> */}
            <div><b>Model Type:</b> {modelSummary.modelType}</div>
            {/* <div><b>Validation Strategy:</b> {modelSummary.validation}</div> */}
          </div>

          <div className="box">
            <p>Eventually we want to add a way to test the model to evaluate accuracy, brier score, micro F1 score, and a confusion matrix.</p>
          </div>

          <div className="box">
            <h4>Uncertainty Quantification Visualization</h4>
            {(() => {
              if(prototypeSupportEmbeddingsIsLoading) {
                return <p>Loading...</p>
              }
              else if(prototypeSupportEmbeddingsError) {
                return <p>Error: {(prototypeSupportEmbeddingsError as Error).message}</p>
              }
              return (
                <ScatterUQDataWrapper
                  inputDataType={inputDataType}
                  runId={runId}
                  method="umap"
                  modelName={modelName}
                  prototypeSupportEmbeddings={prototypeSupportEmbeddings}
                  serverUrl={serverUrl}
                >
                  {props => <ScatterUQ {...props}/>}
                </ScatterUQDataWrapper>
              )
            })()}
          </div>

          {/* <div className="box">
            <h4>
              Training Files Used for Each Label: &nbsp;
              <InfoTooltip placement="top" tooltipContent="These are the names of the files and labels that were used to train this model."/>
            </h4>
            <Row>
              {modelSummary.trainingLabelFiles.map((t,i) => {
                return (
                  <Col key={t.label} xs={12} sm={6} lg={4} xl={3}>
                    <div className={`trainingLabel ${t.label==="OTHER" ? "other" : ""}`}>
                      <div className="heading">{t.label}</div>

                      <div className="content">
                        {t.files.map(name =>
                          <div key={name} className="fileName">{name}</div>
                        )}
                      </div>
                    </div>
                  </Col>
                )
              })}
            </Row>
          </div> */}

          {/* <div className="box">
            <h4>
              Number of Training Examples per Label:&nbsp;
              <InfoTooltip placement="top" tooltipContent="This graph shows how many examples per label were in the training files that were uploaded during training."/>
            </h4>
            <ColumnChart
              data={modelSummary.numTrainExamples.reduce((acc:{[label:string]: number}, t) => {
                acc[t.label] = t.numExamples
                return acc
              }, {})}
              dataset={{ backgroundColor: colors.map(c => `${c}77`), borderColor: colors }}
              ytitle={'# of Training Examples'}
              xtitle={'App Class'}
              library={{
                ...(darkMode ? darkModeLibraryOptions : {}),
              }}
            />
          </div> */}

          {/* <div className="box">
            <ConfusionMatrix
              data={modelSummary.confusionMatrix}
              labels={modelSummary.numTestExamples.map(t => t.label)}
              num_test_examples={modelSummary.numTestExamples.reduce((acc:{[label:string]: number}, t) => {
                acc[t.label] = t.numExamples
                return acc
              }, {})}
            />
          </div> */}
        </div>
      )
    }
  }

  return (
    <div id="modelSummaryPage">
      <div className="box">
        <h2>Summary for {modelName}</h2>

        <div>
          <Link to={ROUTES.MODEL_SUMMARY_PAGE}>
            <Button variant="secondary"><FontAwesomeIcon icon={faUndo}/> Upload a Different Model</Button>
          </Link>&nbsp;

        {getButtons()}
        </div>
      </div>
      
      {getContent()}
    </div>
  )
}

export default ModelSummaryPage
