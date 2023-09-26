// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import { useAppSelector } from '@/redux/reduxHooks'
import { RootState } from '@/redux/store'
import { createSelector } from 'reselect'
import { DEFAULT_OOD_COLOR_THRESHOLDS } from '@/utils/labelColors'

//This selector depends on oodColorIntervals in uiSettings in redux
//It returns the oodThresholds array, given how many are desired
const selectOodIntervals = createSelector(
  (state: RootState) => ({
    oodColorIntervals: state.uiSettings.oodColorIntervals,
    oodColorMode: state.uiSettings.oodColorMode,
  }),
  ({oodColorIntervals, oodColorMode}) => (
    oodColorMode 
    ? DEFAULT_OOD_COLOR_THRESHOLDS
    //? [...[0],...Array.from(Array(oodColorIntervals-1).keys()).map(d => DEFAULT_CONFIDENCE_FLOOR + (d / (oodColorIntervals-1))*(1-DEFAULT_CONFIDENCE_FLOOR))]
    : [0]
  )
)

/**
 * This hook returns the array of ood thresholds, given the oodColorThresholds value in uiSettings in redux
 * @returns ood thresholds, ex [0, 0.25, 0.5, 0.75]
 */
export default function useOodThresholds():number[] {
  return useAppSelector(selectOodIntervals)
}