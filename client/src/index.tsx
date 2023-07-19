// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import React from 'react'
import ReactDOM from 'react-dom'
import { HashRouter } from "react-router-dom"

import { Provider } from "react-redux"
import store from 'redux/store'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import App from 'App'
import "customScroll"
import 'bootstrap/dist/css/bootstrap.min.css'
import "bootstrapOverrides.scss"
import 'react-bootstrap-typeahead/css/Typeahead.css'
import "icon.scss"
import "index.scss"

const queryClient = new QueryClient()

ReactDOM.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <HashRouter>
          <App/>
        </HashRouter>
      </Provider>
    </QueryClientProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
