// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT

import React from "react"
import Link from "next/link"

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBars,
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
import { faGithub } from "@fortawesome/free-brands-svg-icons"


export default function Sidebar() {
  return (
    <>
      <div id={styles.sidebar}>
        <div id={styles["mobile-navbar"]}>
          <FontAwesomeIcon icon={faBars}/>
        </div>

        <div id={styles["sidebar-content"]}>
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
              Train an EQUI(NE)² Model <FontAwesomeIcon icon={faSitemap}/>
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

          <Link href={ROUTES.SETTINGS}>
            <div className={styles.navLink}>
              Settings Page <FontAwesomeIcon icon={faGear}/>
            </div>
          </Link>

          <br/><br/>

          <Link href={ROUTES.DEMO}>
            <div className={styles.navLink}>
              ScatterUQ Demo <FontAwesomeIcon icon={faMagnifyingGlassChart}/>
            </div>
          </Link>

          <Link href="https://github.com/mit-ll-responsible-ai/equine-webapp" target="_blank">
            <div className={styles.navLink}>
              GitHub Repository <FontAwesomeIcon icon={faGithub}/>
            </div>
          </Link>
        </div>
      </div>
    </>
  )
}
