// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import { act } from '@testing-library/react-hooks'
import { toggleOodColorMode } from 'redux/actions/uiSettings'
import { renderHook } from 'redux/testUtils'
import { labels, colors } from 'utils/labelColors'
import useGetColorFromLabel, { GetColorFromLabelType } from '../useGetColorFromLabel'

test('oodColorMode true', () => {
  const { store, utils } = renderHook(() => useGetColorFromLabel())

  expect(store.getState().uiSettings.oodColorMode).toEqual(true) //we expect oodColorMode to be true

  labels.forEach((label, i) => {
    const color = colors[i]
    const getColorFromLabel = utils.result.current as GetColorFromLabelType
    expect(getColorFromLabel(label)).toEqual(color)
    expect(getColorFromLabel(label, 1)).toEqual("#FFFFFF") //high ood value becomes white
  })
})

test('oodColorMode false', () => {
  const { store, utils } = renderHook(() => useGetColorFromLabel())

  expect(store.getState().uiSettings.oodColorMode).toEqual(true) //we expect oodColorMode to be true
  store.dispatch(toggleOodColorMode()) //now toggle the oodColorMode
  expect(store.getState().uiSettings.oodColorMode).toEqual(false) //we expect oodColorMode to be false

  labels.forEach((label, i) => {
    const color = colors[i]
    const getColorFromLabel = utils.result.current as GetColorFromLabelType
    expect(getColorFromLabel(label)).toEqual(color)
    expect(getColorFromLabel(label, 1)).toEqual(color) //ood value is ignored
  })
})