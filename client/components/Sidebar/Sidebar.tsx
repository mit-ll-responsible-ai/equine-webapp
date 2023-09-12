// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT

import React from "react"
import Link from "next/link"

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
import { ROUTES } from "@/utils/routes"

import styles from "./Sidebar.module.scss"


export default function Sidebar() {
  return (
    <div id={styles.sidebar}>
      <Link href={ROUTES.LANDING}>
        <div className={styles.navLink}>
          Home <FontAwesomeIcon icon={faHome}/>
        </div>
      </Link>

      <Link href={ROUTES.DASHBOARD}>
        <div className={styles.navLink}>
          Inference Dashboard <FontAwesomeIcon icon={faChartBar}/>
        </div>
      </Link>

      <Link href={ROUTES.TRAINING}>
        <div className={styles.navLink}>
          Train a New Model <FontAwesomeIcon icon={faSitemap}/>
        </div>
      </Link>

      <Link href={ROUTES.MODEL_SUMMARY_PAGE}>
        <div className={styles.navLink}>
          Model Summary Page <FontAwesomeIcon icon={faNewspaper}/>
        </div>
      </Link>

      <Link href={ROUTES.DOWNLOAD_PAGE}>
        <div className={styles.navLink}>
          Download Page <FontAwesomeIcon icon={faDownload}/>
        </div>
      </Link>

      <br/><br/>

      <Link href={ROUTES.DEMO}>
        <div className={styles.navLink}>
          ScatterUQ Demo <FontAwesomeIcon icon={faMagnifyingGlassChart}/>
        </div>
      </Link>

      <br/><br/>

      <Link href={ROUTES.SETTINGS}>
        <div className={styles.navLink}>
          Settings Page <FontAwesomeIcon icon={faGear}/>
        </div>
      </Link>
    </div>
  )
}
