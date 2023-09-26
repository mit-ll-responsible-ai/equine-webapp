// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import { useAppSelector } from '@/redux/reduxHooks'
import { RootState } from '@/redux/store'
import { createSelector } from 'reselect'
import { buildGetColorFromLabelFunction, colorBlindColors, colors, mapLabelToColor, mapLabelToColorBlindColor } from '@/utils/labelColors'

export type GetColorFromLabelType = (label:string, thresholdIndex?: number) => string

//This selector depends on colorBlindMode and oodColorMode in uiSettings in redux.
//It returns the getColorFromLabel function.
//If either of these values changed, then the getColorFromLabel function is recreated
//Else the memozied function is returned
const selectGetColorFromLabel = createSelector(
  (state: RootState) => state.uiSettings,
  (uiSettings: RootState["uiSettings"]) => {
    const { colorBlindMode, oodColorMode } = uiSettings
    if(colorBlindMode) {
      return buildGetColorFromLabelFunction(colorBlindColors, oodColorMode, mapLabelToColorBlindColor)
    }
    return buildGetColorFromLabelFunction(colors, oodColorMode, mapLabelToColor)
  }
)

/**
 * This hook is used to memoize the getColorFromLabel function given redux state
 * @returns getColorFromLabel function
 */
export default function useGetColorFromLabel():GetColorFromLabelType {
  return useAppSelector(selectGetColorFromLabel)
}