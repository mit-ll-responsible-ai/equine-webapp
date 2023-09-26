// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import React from 'react'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'
import { Placement } from 'react-bootstrap/esm/types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons'

import styles from "./InfoTooltip.module.scss"

type InfoTooltipProps = {
  children?:JSX.Element,
  placement?: Placement,
  tooltipContent: JSX.Element | string,
}

const InfoTooltip = (props:InfoTooltipProps) => {
  return (
    <OverlayTrigger
      placement={props.placement || "right"}
      delay={{ show: 100, hide: 1000 }}
      overlay={(bootstrapProps:any) => (
        <Tooltip {...bootstrapProps}>
          {props.tooltipContent}
        </Tooltip>
      )}
    >
      {props.children || (<FontAwesomeIcon className={styles.infoTooltip} icon={faQuestionCircle}/>)}
    </OverlayTrigger>
  )
}

export default InfoTooltip
