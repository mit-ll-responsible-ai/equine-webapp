// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { render  } from 'redux/testUtils'
import { waitFor } from '@testing-library/dom'

import Filters from 'Components/Filters/Filters'
import { ReduxFiltersState } from 'redux/reducers/filters'

describe('<Filters/>', () => {
  const LABELS = ["C1","C2","C3","C4","C5","OTHER"]

  it('should render inputs for filters', async () => {
    const { store, utils } = render(
      <Filters
        appClassCounts={{}}
        data={[]}
        labels={LABELS}
        toggleFilterValue={(filterKey:keyof ReduxFiltersState,value:string) => {}}
      />
    )

    expect(screen.queryByText("Filter Labels")).toBeInTheDocument()
    const inputs = utils.container.querySelectorAll('input')
    expect(inputs.length).toEqual(6)
  })


  it('should run the toggleFilterValue on clicking a label checkbox', async () => {
    let toggleFilterValueTest = 0

    const { store, utils } = render(
      <Filters
        appClassCounts={{}}
        data={[]}
        labels={LABELS}
        toggleFilterValue={(filterKey:keyof ReduxFiltersState,value:string) => {toggleFilterValueTest++}}
      />
    )

    expect(screen.queryByText("Filter Labels")).toBeInTheDocument()
    const checkboxes = Array.from( utils.container.querySelectorAll('input') )
    expect(checkboxes.length).toEqual(6)
    checkboxes.forEach((checkbox,index) => {
      expect(checkbox.checked).toEqual(false)
      expect(toggleFilterValueTest).toEqual(index)
      fireEvent.click(checkbox)
      expect(toggleFilterValueTest).toEqual(index+1)

    })
  })



  test('select all and deselect all', async () => {

    const { store, utils } = render(
      <Filters
        appClassCounts={{}}
        data={[]}
        labels={LABELS}
        toggleFilterValue={(filterKey:keyof ReduxFiltersState,value:string) => {}}
      />
    )

    expect(store.getState().filters.labels).toStrictEqual({}) //there are no labels checked

    fireEvent.click(screen.queryByText("Select All")) //click select all
    expect(store.getState().filters.labels).toStrictEqual({ //all labels are checked
      "C2": true,
      "C1": true,
      "C3": true,
      "OTHER": true,
      "C4": true,
      "C5": true,
    })

    fireEvent.click(screen.queryByText("Deselect All")) //click deselect all
    expect(store.getState().filters.labels).toStrictEqual({}) //there are no labels checked
  })
})
