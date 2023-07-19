// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { render  } from 'redux/testUtils'
import { waitFor } from '@testing-library/dom'
import { act } from 'react-dom/test-utils'
import fetchMock from 'fetch-mock'

import DownloadPage from 'Components/DownloadPage/DownloadPage'

describe('<DownloadPage/>', () => {
  beforeEach(() => {
    process.env.REACT_APP_SERVER_URL = `http://localhost`
  })
  afterEach(() => {
    fetchMock.restore()
  })

  it('should render nothing if fetch returns an empty array', async () => {
    fetchMock.post(`http://localhost/graphql`,{
      status: 200,
      body: JSON.stringify({data:{models:[
        {name: 'test', last_modified: 100000},
        {name: 'model.h5', last_modified: 100000},
      ]}})
    })

    await act( async () => {
      const {store, utils} = render(<DownloadPage/>)

      await waitFor(() => {
        expect(screen.queryByText("test")).toBeInTheDocument()
        expect(screen.queryByText("model.h5")).toBeInTheDocument()
      })
    })
  })

  it('should render nothing if fetch returns an empty array', async () => {
    fetchMock.post(`http://localhost/graphql`,{
      status: 200,
      body: JSON.stringify({data:{models:[]}})
    })

    await act( async () => {
      const {store, utils} = render(<DownloadPage/>)
      
      await waitFor(() => {
        expect(screen.queryByText("There are no available models on the server.")).toBeInTheDocument()
      })
    })
  })
})
