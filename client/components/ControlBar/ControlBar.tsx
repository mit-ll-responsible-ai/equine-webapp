// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import React, { useCallback, useEffect, useState } from "react"
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons'

import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks"
import { toggleOodColorMode } from "@/redux/uiSettings"

import { DEFAULT_CONFIDENCE_FLOOR } from "@/utils/labelColors"

import styles from "./ControlBar.module.scss"

interface Props {
  changeClassConfidenceThreshold: (n: number) => void,
  changeInDistributionThreshold: (n: number) => void,
  classConfidenceThreshold: number,
  inDistributionThreshold: number,
}

const ControlBar = (props: Props) => {
  const {
    changeClassConfidenceThreshold,
    changeInDistributionThreshold,
    classConfidenceThreshold: initialClassConfidenceThreshold,
    inDistributionThreshold: initialInDistributionThreshold,
  } = props

  const dispatch = useAppDispatch()
  const oodColorMode = useAppSelector(state => state.uiSettings.oodColorMode)

  const [classConfidenceThreshold, setClassConfidenceThreshold] = useState<number>(initialClassConfidenceThreshold)
  const [inDistributionThreshold, setInDistributionThreshold] = useState<number>(initialInDistributionThreshold)
  

  useDebouncedEffect(
    () => changeClassConfidenceThreshold(classConfidenceThreshold),
    250,
    [classConfidenceThreshold]
  )

  useDebouncedEffect(
    () => changeInDistributionThreshold(inDistributionThreshold),
    250,
    [inDistributionThreshold]
  )

  
  return (
    <div id={styles.controlBar}>
      <div id={styles.confidenceThresholdsContainer}>
        <div>
          <b>
            Outlier Tolerance: &nbsp;
            <OverlayTrigger
              overlay={
                <Tooltip id="inDistributionThresholdTooltip">
                   <p>Screen out predictions for data that the model may not have seen before.</p>
                   <p>Moves to &quot;out of distribution&quot; (OOD) those examples that are farther from the mean of the predicted class than {Math.min(inDistributionThreshold, 99)}% of the training data. 
                   A high tolerance lets the model make its best guess from its known classes; a low tolerance filters out more outliers to OOD.</p>
                </Tooltip>
              }
              placement="bottom"
            >
              <FontAwesomeIcon icon={faQuestionCircle}/>
            </OverlayTrigger>
          </b>
          <span>
            <input
              aria-label="inDistributionThresholdInput"
              max="100"
              min={DEFAULT_CONFIDENCE_FLOOR}
              onChange={e => setInDistributionThreshold(parseInt(e.target.value))}
              step={1}
              type="range"
              value={inDistributionThreshold}
            />
            &nbsp; {inDistributionThreshold}%
          </span>

          <div>
            <label htmlFor="oodColorCheckbox"><b>Enable Outlier Color Scale:</b></label>&nbsp;
            <input
              checked={oodColorMode}
              id="oodColorCheckbox"
              onChange={e => dispatch(toggleOodColorMode())}
              type="checkbox"
            />
          </div>
        </div>

        <br/>

        <div>
          <b>
            Class Confidence Threshold: &nbsp;
            <OverlayTrigger
              overlay={
                <Tooltip id="classConfidenceThresholdTooltip">
                 &quot;I want the model to be at least {classConfidenceThreshold}% confident that the label is correct.&quot;
                </Tooltip>
              }
              placement="bottom"
            >
              <FontAwesomeIcon icon={faQuestionCircle}/>
            </OverlayTrigger>
          </b>
          <span>
            <input
              aria-label="classConfidenceThresholdInput"
              max="99"
              min={0}
              onChange={e => setClassConfidenceThreshold(parseInt(e.target.value))}
              step={1}
              type="range"
              value={classConfidenceThreshold}
            />
            &nbsp; {classConfidenceThreshold}%
          </span>
        </div>
      </div>
    </div>
  )
}

export default ControlBar


//https://stackoverflow.com/questions/54666401/how-to-use-throttle-or-debounce-with-react-hook/54666498
const useDebouncedEffect = (effect:(...args: any[]) => any, delay: number, deps: any[]) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const callback = useCallback(effect, deps)

  useEffect(() => {
    const timeout = setTimeout(callback, delay) //set the timeout
    return () => clearTimeout(timeout) //clear any previous timeout
  }, [callback, delay])
}