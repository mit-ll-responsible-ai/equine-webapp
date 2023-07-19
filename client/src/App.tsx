// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import React from "react"
import {
  Switch,
  Route,
} from "react-router-dom"
import 'chartkick/chart.js'

import { useAppSelector } from "redux/reduxHooks"

import Dashboard from "Components/Dashboard/Dashboard"
import DownloadPage from "Components/DownloadPage/DownloadPage"
import FeedbackModal from "Components/FeedbackModal/FeedbackModal"
import Landing from "Components/Landing/Landing"
import ModelSummaryEmptyPage from "Components/ModelSummaryPage/ModelSummaryEmptyPage"
import ModelSummaryPage from "Components/ModelSummaryPage/ModelSummaryPage"
import ScatterUQDemoDashboard from "Components/Dashboard/Demo/ScatterUQDemoDashboard"
import Settings from "Components/Settings/Settings"
import Sidebar from "Components/Sidebar/Sidebar"
import Training from "Components/Training/Training"


import "app.scss"

export const ROUTES = {
  DASHBOARD: "/dashboard",
  DEMO: "/demo",
  DOWNLOAD_PAGE: "/download",
  LANDING: "/",
  MODEL_SUMMARY_PAGE: "/model-summary-page",
  SETTINGS: "/settings",
  TRAINING: "/training",
  RETRAINING: "/training?retrainModelName="
}

const App = () => {
  const darkMode = useAppSelector(state => state.uiSettings.darkMode)

  return (
    <div id="app" className={darkMode ? "dark" : ""}>
      <div id="content">
          <Switch>
            <Route path={ROUTES.DASHBOARD}>
              <Dashboard/>
            </Route>
            
            <Route path={ROUTES.DEMO}>
              <ScatterUQDemoDashboard/>
            </Route>
            
            <Route path={ROUTES.DOWNLOAD_PAGE}>
              <DownloadPage/>
            </Route>

            <Route path={`${ROUTES.MODEL_SUMMARY_PAGE}/:modelName`}>
              <ModelSummaryPage/>
            </Route>
            <Route path={ROUTES.MODEL_SUMMARY_PAGE}>
              <ModelSummaryEmptyPage/>
            </Route>

            <Route path={ROUTES.SETTINGS}>
              <Settings/>
            </Route>

            <Route path={ROUTES.TRAINING}>
              <Training/>
            </Route>

            {/* --------- */}

            <Route path={ROUTES.LANDING}>
              <Landing/>
            </Route>
          </Switch>
      </div>
      <div id="sidebarContainer"><Sidebar/></div>

      <FeedbackModal/>
    </div>
  )
}

export default App
