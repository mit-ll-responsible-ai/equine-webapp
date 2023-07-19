// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { render  } from 'redux/testUtils'
import { waitFor } from '@testing-library/dom'

import FilteredTable from 'Components/FilteredTable/FilteredTable'
import { ReduxFiltersState } from 'redux/reducers/filters'

describe('<FilteredTable/>', () => {
  it('should render the table and download button', async () => {
    const { store, utils } = render(
      <FilteredTable
        data={[]}
        downloadFilteredData={() => {}}
      />
    )

    const buttons = utils.container.querySelectorAll('button')
    expect(buttons.length).toEqual(1)
  })


  it('should run the download function when the button is clicked', async () => {
    let testDownloadFunctionRan = 0

    const { store, utils } = render(
      <FilteredTable
        data={[]}
        downloadFilteredData={() => {testDownloadFunctionRan++}}
      />
    )

    const buttons = utils.container.querySelectorAll('button')
    expect(buttons.length).toEqual(1)
    fireEvent.click(buttons[0])
    expect(testDownloadFunctionRan).toEqual(1)
  })

  it('should render data as a table', async () => {
    const { store, utils } = render(
      <FilteredTable
        data={[{
          processed_app_class: {C2: 0, C1: 1, C3: 0, C4: 0, C5: 0, OTHER:0},
          original_app_class: {C2: 0.00004384172468394855, C1: 0.9994855042656815, C3: 0.000017988526682561748, C4: 0.0004501380879592873, C5: 0.0000025273949925715064},
        }]}
        downloadFilteredData={() => {}}
      />
    )

    //table headings
    expect(screen.queryByText("Labels")).toBeInTheDocument()

    //data
    expect(screen.queryByText("C1")).toBeInTheDocument()
  })

  //TODO test sorting and pagination?
})
