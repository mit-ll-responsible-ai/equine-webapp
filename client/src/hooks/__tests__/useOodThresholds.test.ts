// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import { act } from '@testing-library/react-hooks'
import { toggleOodColorMode } from 'redux/actions/uiSettings'
import { renderHook } from 'redux/testUtils'
import useOodThresholds from '../useOodThresholds'


test('should return default 4 ood thresholds', () => {
  const { store, utils } = renderHook(() => useOodThresholds())

  expect(store.getState().uiSettings.oodColorIntervals).toEqual(5)
  expect(store.getState().uiSettings.oodColorMode).toEqual(true)
  expect(utils.result.current).toStrictEqual([0, 0.8, 0.9, 0.95, 0.99])
})


test('ood color mode off should set thresholds to [0]', () => {
  const { store, utils } = renderHook(() => useOodThresholds())

  store.dispatch(toggleOodColorMode())

  expect(store.getState().uiSettings.oodColorIntervals).toEqual(5)
  expect(store.getState().uiSettings.oodColorMode).toEqual(false)
  expect(utils.result.current).toStrictEqual([0])
})