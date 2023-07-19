// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT

import React from "react"
import { Link } from "react-router-dom"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChartBar,
  faDownload,
  faGear,
  faHome,
  faMagnifyingGlassChart,
  faNewspaper,
  faSitemap,
} from '@fortawesome/free-solid-svg-icons'
import { ROUTES } from "App"

import "./sidebar.scss"


export default function Sidebar() {
  return (
    <div id="sidebar">
      <Link to={ROUTES.LANDING}>
        <div className="navLink">
          Home <FontAwesomeIcon icon={faHome}/>
        </div>
      </Link>

      <Link to={ROUTES.DASHBOARD}>
        <div className="navLink">
          Inference Dashboard <FontAwesomeIcon icon={faChartBar}/>
        </div>
      </Link>

      <Link to={ROUTES.TRAINING}>
        <div className="navLink">
          Train a New Model <FontAwesomeIcon icon={faSitemap}/>
        </div>
      </Link>

      <Link to={ROUTES.MODEL_SUMMARY_PAGE}>
        <div className="navLink">
          Model Summary Page <FontAwesomeIcon icon={faNewspaper}/>
        </div>
      </Link>

      <Link to={ROUTES.DOWNLOAD_PAGE}>
        <div className="navLink">
          Download Page <FontAwesomeIcon icon={faDownload}/>
        </div>
      </Link>

      <br/><br/>

      <Link to={ROUTES.DEMO}>
        <div className="navLink">
          ScatterUQ Demo <FontAwesomeIcon icon={faMagnifyingGlassChart}/>
        </div>
      </Link>

      <br/><br/>

      <Link to={ROUTES.SETTINGS}>
        <div className="navLink">
          Settings Page <FontAwesomeIcon icon={faGear}/>
        </div>
      </Link>
    </div>
  )
}
