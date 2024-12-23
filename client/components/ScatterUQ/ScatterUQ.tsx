import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { axisBottom, axisLeft, contourDensity, geoPath, ScaleLinear, scaleLinear, select } from 'd3'

import { ClassProbabilitiesType, InputDataType, SampleType } from '@/redux/inferenceSettings'

import useGetColorFromLabel from '@/hooks/useGetColorFromLabel'
import { Sample, GetPrototypeSupportEmbeddingsQuery } from '@/graphql/generated'

import InfoTooltip from '@/components/InfoTooltip/InfoTooltip'

import RenderInput from './RenderInput'
import { Coordinate2DType, ScatterUQDataProps, StructuredDimRedOutputType, WeightedCoordinate2DType } from './types'

import styles from "./ScatterUQ.module.scss"

type Props = ScatterUQDataProps & {
  startingHeight?: number,
  startingWidth?: number,
  thresholds?: number,
}

const PADDING = {t:10,l:40,b:30,r:10}

type FocusPointType = { msg:React.ReactNode, x: number, y: number }

const contourToPath = geoPath()
const getX = (d:Coordinate2DType | WeightedCoordinate2DType) => d.x
const getY = (d:Coordinate2DType | WeightedCoordinate2DType) => d.y
const getWeight = (d:WeightedCoordinate2DType) => d.weight //used for weighing points in the contours

export default function ScatterUQ({
  // classConfidenceThreshold,
  continuity,
  getInferenceSampleImageSrc,
  getInferenceSampleTabularData,
  getSupportExampleImageSrc,
  getSupportExampleTabularData,
  inDistributionThreshold,
  inputDataType,
  stress,
  processedClassesProbabilities,
  samples,
  scree,
  srho,
  startingHeight=400,
  startingWidth=500,
  structuredEmbeddings,
  thresholds=10,
  trustworthiness,
  prototypeSupportEmbeddings,
}:Props) {
  const height = startingHeight
  const [width, setWidth] = useState<number>(startingWidth)
  const resizeObserver = useRef<ResizeObserver | null>(null)
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    resizeObserver.current = new ResizeObserver(entries => {
      window.requestAnimationFrame(() => { //https://stackoverflow.com/a/58701523
        if (!Array.isArray(entries) || !entries.length) {
          return;
        }
        setWidth(entries[0].contentRect.width)
      });
    })
  },[])
  useEffect(() => {
    if(resizeObserver.current && ref.current) {
      resizeObserver.current.observe(ref.current)
    }
    return () => resizeObserver.current?.disconnect()
  }, [resizeObserver, ref])

  //calculate the domain of the data, ie the min and max values for the data of the x and y axes
  const { domainX, domainY } = useMemo(() => {
    const domainX:[number,number] = [0,0]
    const domainY:[number,number] = [0,0]

    //update the domains based on the training examples
    structuredEmbeddings.labels.forEach((label, i) => {
      updateDomains(domainX,domainY,getX(label.prototype),getY(label.prototype), i===0)
      label.trainingExamples.forEach(p => updateDomains(domainX,domainY,getX(p),getY(p)))
    })

    //update the domains based on the inference samples
    structuredEmbeddings.samples.forEach(s => {
      updateDomains(domainX,domainY,getX(s),getY(s))
    })
    
    return { domainX, domainY }
  }, [structuredEmbeddings])

  //calculate the aspect-ratio preserved range of the data, ie the min and max values of the pixels for the x and y axes
  //we want to preserve the aspect ratio of the data otherwise distances will be skewed
  const { rangeX, rangeY, usedWidth } = useMemo(() => {
    const aspectRatio = (domainX[1]-domainX[0]) / (domainY[1]-domainY[0]) //width/height of the data
    const availableHeight = height - PADDING.b - PADDING.t //height minus padding
    const availableWidth = width - PADDING.r - PADDING.l //width minus padding

    //get the desired width based off the height and aspect ratio, and restrict to the available width
    //then calculate the used height from the used width
    const usedWidth = Math.min(availableWidth, availableHeight*aspectRatio) //the pixel width we will actually use
    const usedHeight = usedWidth / aspectRatio //the pixel height we will actually use

    return {
      rangeX: [PADDING.l, PADDING.l + usedWidth] as [number,number],
      rangeY: [PADDING.t + usedHeight, PADDING.t] as [number,number],
      usedHeight,
      usedWidth,
    }
  }, [domainX, domainY, height, width])


  /* Scales, Axes, Contours */
  const scaleX = useMemo(() => {
    return scaleLinear().domain(domainX).range(rangeX)
  }, [domainX, rangeX])
  const scaleY = useMemo(() => {
    return scaleLinear().domain(domainY).range(rangeY)
  }, [domainY, rangeY])
  const getColorFromLabel = useGetColorFromLabel()
  
  const xAxisRef = useRef<SVGGElement | null>(null)
  useEffect(() => {
    const xAxis = axisBottom(scaleX).ticks(Math.max(5, usedWidth/100))
    //@ts-ignore
    xAxisRef.current?.replaceChildren()
    select(xAxisRef.current).append("g").call(xAxis)
  }, [scaleX, usedWidth])

  const yAxisRef = useRef<SVGGElement | null>(null)
  useEffect(() => {
    const yAxis = axisLeft(scaleY).ticks(5)
    //@ts-ignore
    yAxisRef.current?.replaceChildren()
    select(yAxisRef.current).append("g").call(yAxis)
  }, [scaleY])

  const contours = useMemo(() => {
    return structuredEmbeddings.labels.map((l,i) => ( //concat the prototype and training examples into one array
      [l.prototype].concat(l.trainingExamples)
    )).map((labelPoints,i) => { //for each label
      //initialize a contour function for this label
      const contourFunction = contourDensity<WeightedCoordinate2DType>().size([width, height])
      .cellSize(4).thresholds(thresholds).bandwidth(40).weight(getWeight).x(getX).y(getY)
      
      return contourFunction( //calculate the contours for all the points for this label
        //transform all the UMAP points into the svg pixel space
        labelPoints.map(d => ({
          //it's important that we weight the contours by how confident the model was for each point (prototypes have weight 1)
          weight: getWeight(d),
          x: scaleX(getX(d)),
          y: scaleY(getY(d)),
        }))
      )
    })
  }, [height, scaleX, scaleY, structuredEmbeddings, thresholds, width])
  
  const opacityScales = contours.map((c,i) => (
    scaleLinear().domain([0, c.length]).range([0.08, 0.5])
  ))



  /* Focus Interactions */
  const [leftFocusPoint, setLeftFocusPoint] = useState<FocusPointType | null>(null)
  const [rightFocusPoint, setRightFocusPoint] = useState<FocusPointType | null>(null)
  const onMouseEnterPoint = useCallback((x: number, y: number, msg: React.ReactNode) => {
    setRightFocusPoint({ msg, x, y }) //only update the right focus point
  }, [samples])
  const onClickPoint = useCallback((x: number, y: number, msg: React.ReactNode) => {
    if(!samples || samples.length > 1) { //if there are multiple samples (ex dashboard global view) or no samples (ex model summary page)
      setLeftFocusPoint({ msg, x, y }) //update the left hover point
    }
    //else there is only one sample, don't do anything
  }, [samples])



  /* Set the initial content for the focus points when the data loads or changes */
  useEffect(() => {
    //if the data is now ready or has changed
    if(prototypeSupportEmbeddings && structuredEmbeddings.labels.length>0) {
      if(inDistributionThreshold && processedClassesProbabilities && samples) { //if there are samples (ex dashboard)
        //the left focus point will always be the first sample
        setLeftFocusPoint(
          getSampleFocusPointDetails({
            sampleIndex: 0, //use the first sample
            getInferenceSampleImageSrc, getInferenceSampleTabularData, inputDataType,
            processedClassesProbabilities, samples, scaleX, scaleY, structuredEmbeddings,
          })
        )

        if(samples?.length > 1) { //if there are multiple samples (ex dashboard global plot), pick the next sample to highlight
          setRightFocusPoint(
            getSampleFocusPointDetails({
              sampleIndex: 1, //use the second sample
              getInferenceSampleImageSrc, getInferenceSampleTabularData, inputDataType,
              processedClassesProbabilities, samples, scaleX, scaleY, structuredEmbeddings,
            })
          )
        }
        else { //else there is only one sample (ex local sample plot), set the right focus point to the closest training example
          const firstSample = samples[0]
  
          const { //find the closest training example in the high dimensional space
            closestLabelIdx,
            closestPointIdx,
          } = prototypeSupportEmbeddings.getPrototypeSupportEmbeddings.reduce((acc, label, labelIdx) => {
            label.trainingExamples.forEach((point, pointIdx) => {
              const distance = Math.hypot( //calculate the distance between the training example and the first sample
                ...point.coordinates.map( //spread the differences
                  (c,i) => c-firstSample.coordinates[i] //for this dimension, calculate the distance between this training example and the first sample
                )
              )
  
              //if we should update the new closest training example
              if(acc.closestDistance===null || acc.closestDistance>distance) {
                acc.closestDistance = distance
                acc.closestLabelIdx = labelIdx
                acc.closestPointIdx = pointIdx
              }
            })
            return acc
          }, {closestLabelIdx: null, closestPointIdx: null, closestDistance: null} as {closestLabelIdx: number|null, closestPointIdx: number|null, closestDistance: number|null})
          
          if(closestLabelIdx!==null && closestPointIdx!==null) { //if we found a training example
            setRightFocusPoint(
              getTrainingSampleFocusPointDetails({
                getSupportExampleImageSrc,
                getSupportExampleTabularData,
                inputDataType,
                labelIdx: closestLabelIdx,
                pointIdx: closestPointIdx,
                scaleX,
                scaleY,
                structuredEmbeddings,
                prototypeSupportEmbeddings,
              })
            )
          }
        }
      }
      else { //else there are no samples, ex model summary page
        //ASSUME there are at least two classes that each have at least one training example
        const args = {
          getSupportExampleImageSrc, getSupportExampleTabularData, inputDataType,
          scaleX, scaleY, structuredEmbeddings, prototypeSupportEmbeddings
        } as const
        setLeftFocusPoint(
          getTrainingSampleFocusPointDetails({
            labelIdx: 0, //use the first label
            pointIdx: 0, //use the first training example for this label
            ...args,
          })
        )
        setRightFocusPoint(
          getTrainingSampleFocusPointDetails({
            labelIdx: 1, //use the second label
            pointIdx: 0, //use the first training example for this label
            ...args,
          })
        )
      }
    }
  }, [
    getInferenceSampleImageSrc, getInferenceSampleTabularData,
    getSupportExampleImageSrc, getSupportExampleTabularData,
    inDistributionThreshold, inputDataType, processedClassesProbabilities, samples,
    scaleX, scaleY, structuredEmbeddings, prototypeSupportEmbeddings
  ])



  return (
    <div className={styles["uq-viz-container"]}>
      <div className={styles["uq-viz-sidebar"]} style={{marginRight: "1rem"}}>
        {leftFocusPoint && leftFocusPoint.msg}
      </div>

      <div>
        <div ref={ref} style={{position: "relative"}}>
          <svg
            style={{ width, height }}
            // onClick={onClickInvertSvgPixelSpace}
          >
            <g className="xAxis" ref={xAxisRef} transform={`translate(0,${height - 20})`}/>
            <g className="yAxis" ref={yAxisRef} transform={`translate(30,0)`}/>

            {contours.map((contoursForLabel, labelIdx) => {
              const color = getColorFromLabel(prototypeSupportEmbeddings?.getPrototypeSupportEmbeddings[labelIdx].label)
              const opacityScale = opacityScales[labelIdx]
              return contoursForLabel.map((c,i) => {
                const d = contourToPath(c) || ""
                return (
                  <g key={i}>
                    <path
                      fill={color}
                      d={d}
                      opacity={0.05}
                      stroke="none"
                      strokeWidth={0}
                    />
                    <path
                      fill="none"
                      d={d}
                      opacity={opacityScale(i)}
                      stroke={color}
                      strokeWidth={1}
                    />
                  </g>
                )
              })
            })}

            {prototypeSupportEmbeddings?.getPrototypeSupportEmbeddings.map((label, labelIdx) => {
              const dimRedLabel = structuredEmbeddings.labels[labelIdx]

              return (
                <g key={labelIdx}>
                  {label.trainingExamples.map((point, pointIdx) => {
                    //get the confidence associated with this label
                    const confidence = point.labels.find((l) => l.label === label.label)?.confidence || 1
                    const dimRedPoint = dimRedLabel.trainingExamples[pointIdx]

                    const cx = scaleX(getX(dimRedPoint))
                    const cy = scaleY(getY(dimRedPoint))

                    const msg = <TrainingLabelMessage
                      getSupportExampleImageSrc={getSupportExampleImageSrc}
                      getSupportExampleTabularData={getSupportExampleTabularData}
                      inputDataType={inputDataType}
                      label={label.label}
                      sample={point}
                    />

                    return (
                      <circle
                        key={pointIdx}
    
                        className="point"
                        cx={cx}
                        cy={cy}
                        fill={getColorFromLabel(label.label)}
                        onClick={() => onClickPoint(cx, cy, msg)}
                        onMouseEnter={() => onMouseEnterPoint(cx, cy, msg)}
                        opacity={samples ? confidence/2 + 0.5 : 1}
                        r={5}
                        stroke="white"
                        strokeWidth="2"
                      />
                    )
                  })}
                </g>
              )
            })}

            {prototypeSupportEmbeddings?.getPrototypeSupportEmbeddings.map((label, labelIdx) => {
              const dimRedPrototype = structuredEmbeddings.labels[labelIdx].prototype
              const cx = scaleX(getX(dimRedPrototype))
              const cy = scaleY(getY(dimRedPrototype))

              const msg = <PrototypeMessage label={label.label}/>

              return (
                <g key={labelIdx}>
                  <circle
                    className="prototype point"
                    cx={cx}
                    cy={cy}
                    fill="black"
                    onClick={() => onClickPoint(cx, cy, msg)}
                    onMouseEnter={() => onMouseEnterPoint(cx, cy, msg)}
                    r={5}
                    stroke="white"
                    strokeWidth="2"
                  />
                </g>
              )
            })}

            <g>
              {processedClassesProbabilities && samples && samples.map((s,sIdx) => {
                const processedClassProbabilities = processedClassesProbabilities[sIdx]
                const dimRedSample = structuredEmbeddings.samples[sIdx]
                const cx = scaleX(getX(dimRedSample))
                const cy = scaleY(getY(dimRedSample))

                const msg = <InferenceExampleMessage
                  getInferenceSampleImageSrc={getInferenceSampleImageSrc}
                  getInferenceSampleTabularData={getInferenceSampleTabularData}
                  inputDataType={inputDataType}
                  processedClassProbabilities={processedClassProbabilities}
                  sample={s}
                />

                return (
                  <circle
                    key={sIdx}
  
                    className="point"
                    cx={cx}
                    cy={cy}
                    fill={getColorFromLabel(getMaxLabel(processedClassProbabilities))}
                    onClick={() => onClickPoint(cx, cy, msg)}
                    onMouseEnter={() => onMouseEnterPoint(cx, cy, msg)}
                    r={7}
                    stroke="black"
                    strokeWidth="2"
                  />
                )
              })}
            </g>
          </svg>

          {rightFocusPoint && <div style={{
            position: "absolute",
            top: rightFocusPoint.y - 2,
            left: rightFocusPoint.x + 7,
            right: "-1rem",
            border: "2px dashed gray",
          }}/>}

          {leftFocusPoint && <div style={{
            position: "absolute",
            top: leftFocusPoint.y - 2,
            left: "-1rem",
            right: width - leftFocusPoint.x + 7,
            border: "2px dashed gray",
          }}/>}
          
          <div style={{position: "absolute", top: 0, right: 0}}>
            <InfoTooltip placement='left' tooltipContent={(
              <div style={{textAlign: "left"}}>
                <p><b>Dimensionality Reduction Metrics</b></p>
                <div style={{width: "100%"}}>
                  <p style={{marginBottom: "0"}}><b>Continuity:</b> <span style={{float: "right"}}>{formatConfidence(continuity, 5)}</span></p>
                  <p style={{marginBottom: "0"}}><b>Stress: &nbsp;</b> <span style={{float: "right"}}>{formatConfidence(stress, 5)}</span></p>
                  {scree && <p style={{marginBottom: "0"}}><b>Scree Values:</b>&nbsp;<span style={{float: "right"}}>[{scree.map(s => s.toFixed(2)).join(", ")}]</span></p>}
                  <p style={{marginBottom: "0"}}><b>Spearman&apos;s Rank:</b> <span style={{float: "right"}}>{formatConfidence(srho, 5)}</span></p>
                  <p style={{marginBottom: "0"}}><b>Trustworthiness:</b> <span style={{float: "right"}}>{formatConfidence(trustworthiness, 5)}</span></p>
                </div>
              </div>
            )}/>
          </div>
        </div>
        
      </div>

      <div className={styles["uq-viz-sidebar"]} style={{marginLeft: "1rem"}}>
        {rightFocusPoint && rightFocusPoint.msg}
      </div>
    </div>
  )
}


const TrainingLabelMessage = ({
  getSupportExampleImageSrc,
  getSupportExampleTabularData,
  inputDataType,
  label,
  sample,
}:{
  getSupportExampleImageSrc: ScatterUQDataProps["getSupportExampleImageSrc"],
  getSupportExampleTabularData: ScatterUQDataProps["getSupportExampleTabularData"],
  inputDataType: InputDataType,
  label: string,
  sample: Sample,
}) => {
  const pedictiveLabels = [...sample.labels].sort((a,b) => Math.sign(b.confidence-a.confidence))
  return (
    <div>
      <RenderInput
        dataIndex={sample.inputData.dataIndex}
        getSupportExampleImageSrc={getSupportExampleImageSrc}
        getSupportExampleTabularData={getSupportExampleTabularData}
        inputDataType={inputDataType}
      />

      <div style={{padding: "0.5em"}}>
        <p>This is an example from training with a true label of <LabelAndCircle label={label}/></p>
        <p><b>Class Confidence Scores</b></p>
        <div style={{height: "3rem", overflowY: "auto"}}>
          <table>
            <tbody>
              {pedictiveLabels.map(({label,confidence}) => (
                <tr key={label}>
                  <td style={{textAlign:"left"}}><b>{label}:</b></td>
                  <td style={{textAlign:"right"}}>{formatConfidence(confidence)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <hr/>

        <p><b>Outlier Score:</b> {(sample.ood).toFixed(2)}</p>
      </div>
    </div>
  )
}

const InferenceExampleMessage = ({
  getInferenceSampleImageSrc,
  getInferenceSampleTabularData,
  inputDataType,
  processedClassProbabilities,
  sample,
}:{
  getInferenceSampleImageSrc: ScatterUQDataProps["getInferenceSampleImageSrc"],
  getInferenceSampleTabularData: ScatterUQDataProps["getInferenceSampleTabularData"],
  inputDataType: InputDataType,
  processedClassProbabilities: ClassProbabilitiesType,
  sample:SampleType,
}) => {
  return (
    <div>
      <RenderInput
        dataIndex={sample.inputData.dataIndex}
        getInferenceSampleImageSrc={getInferenceSampleImageSrc}
        getInferenceSampleTabularData={getInferenceSampleTabularData}
        inputDataType={inputDataType}
      />
      
      <div style={{padding: "0.5em"}}>
        <div>
          {Object.entries(processedClassProbabilities).filter(
            ([label,confidence]) => confidence === 1
          ).map(([label,confidence]) => (
            <p key={label}>This is an inference sample with prediction <LabelAndCircle label={label}/></p>
          ))}
        </div>
        <p><b>Class Confidence Scores</b></p>
        <div style={{height: "3rem", overflowY: "auto"}}>
          <table>
            <tbody>
              {Object.entries(sample.classProbabilities).sort(
                ([aKey,aValue],[bKey,bValue]) => Math.sign(bValue-aValue)
              ).map(([label,confidence]) => (
                <tr key={label}>
                  <td style={{textAlign:"left"}}><b>{label}:</b></td>
                  <td style={{textAlign:"right"}}>{formatConfidence(confidence)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <hr/>

        <p><b>Outlier Score:</b> {(sample.ood).toFixed(2)}</p>
      </div>
    </div>
  )
}

function PrototypeMessage({label}:{label: string}) {
  return (
    <div style={{padding: "0.5em"}}>
      <p>This is the prototype for the label <LabelAndCircle label={label}/>.</p>
      <p>There is no input associated with the prototype.</p>
    </div>
  )
}


const LabelAndCircle = (props:{label:string}) => {
  const label = props.label
  const getColorFromLabel = useGetColorFromLabel()
  return (
    <b style={{whiteSpace: "nowrap"}}>{label} <span className="circle" style={{backgroundColor:getColorFromLabel(label)}}></span></b>
  )
}

/**
 * updates the min and max values for the x and y domains in place
 * @param domainX [min x value, max x value]
 * @param domainY [min y value, max y value]
 * @param x       the point's x value
 * @param y       the point's y value
 * @param force   whether to force an update, ex to take the values from the very first point
 */
function updateDomains(
  domainX: [number, number], 
  domainY: [number, number], 
  x: number,
  y: number,
  force:boolean=false,
) {
  domainX[0] = force ? x : Math.min(domainX[0],x)
  domainX[1] = force ? x : Math.max(domainX[1],x)
  domainY[0] = force ? y : Math.min(domainY[0],y)
  domainY[1] = force ? y : Math.max(domainY[1],y)
}

function getMaxLabel(classProbabilities: ClassProbabilitiesType) {
  let maxLabel = ""
  let maxValue = 0

  Object.keys(classProbabilities).forEach((label) => {
    if(classProbabilities[label] > maxValue) {
      maxLabel = label
      maxValue = classProbabilities[label]
    }
  })

  return maxLabel
}

function formatConfidence(n:number, toFixedValue:number=2) {
  const toFixed = n.toFixed(toFixedValue)
  if(toFixed === "0.00") {
    return n.toExponential(1)
  }
  return toFixed
}

/**
 * This function is used to get the details necessary for focusing on a sample point and displaying the info 
 * @param sampleIndex 
 * @param processedClassesProbabilities 
 * @param samples 
 * @param scaleX 
 * @param scaleY 
 * @param structuredEmbeddings 
 * @returns 
 */
function getSampleFocusPointDetails({
  getInferenceSampleImageSrc,
  getInferenceSampleTabularData,
  inputDataType,
  processedClassesProbabilities,
  sampleIndex,
  samples,
  scaleX,
  scaleY,
  structuredEmbeddings,

}: {
  getInferenceSampleImageSrc: ScatterUQDataProps["getInferenceSampleImageSrc"],
  getInferenceSampleTabularData: ScatterUQDataProps["getInferenceSampleTabularData"],
  inputDataType: InputDataType,
  processedClassesProbabilities: ClassProbabilitiesType[],
  sampleIndex: number,
  samples: SampleType[],
  scaleX: ScaleLinear<number, number, never>,
  scaleY: ScaleLinear<number, number, never>,
  structuredEmbeddings: StructuredDimRedOutputType,

}) {
  const firstSampleDimRed = structuredEmbeddings.samples[sampleIndex]
  const firstSampleCx = scaleX(getX(firstSampleDimRed))
  const firstSampleCy = scaleY(getY(firstSampleDimRed))
  const processedClassProbabilities = processedClassesProbabilities[sampleIndex]
  return { //set the initial content for the focus point
    x: firstSampleCx, y: firstSampleCy,
    msg: <InferenceExampleMessage
      getInferenceSampleImageSrc={getInferenceSampleImageSrc}
      getInferenceSampleTabularData={getInferenceSampleTabularData}
      inputDataType={inputDataType}
      processedClassProbabilities={processedClassProbabilities}
      sample={samples[sampleIndex]}
    />
  }
}

function getTrainingSampleFocusPointDetails({
  getSupportExampleImageSrc,
  getSupportExampleTabularData,
  inputDataType,
  labelIdx,
  pointIdx,
  scaleX,
  scaleY,
  structuredEmbeddings,
  prototypeSupportEmbeddings,
}:{
  getSupportExampleImageSrc: ScatterUQDataProps["getSupportExampleImageSrc"],
  getSupportExampleTabularData: ScatterUQDataProps["getSupportExampleTabularData"],
  inputDataType: InputDataType,
  labelIdx: number,
  pointIdx: number,
  scaleX: ScaleLinear<number, number, never>,
  scaleY: ScaleLinear<number, number, never>,
  structuredEmbeddings: StructuredDimRedOutputType,
  prototypeSupportEmbeddings: GetPrototypeSupportEmbeddingsQuery,

}) {
  const dimRedPoint = structuredEmbeddings.labels[labelIdx].trainingExamples[pointIdx]
  const cx = scaleX(getX(dimRedPoint))
  const cy = scaleY(getY(dimRedPoint))
  const label = prototypeSupportEmbeddings.getPrototypeSupportEmbeddings[labelIdx]

  return { //set the initial content for the focus point
    x: cx, y: cy,
    msg: <TrainingLabelMessage
      getSupportExampleImageSrc={getSupportExampleImageSrc}
      getSupportExampleTabularData={getSupportExampleTabularData}
      inputDataType={inputDataType}
      label={label.label}
      sample={label.trainingExamples[pointIdx]}
    />
  }
}