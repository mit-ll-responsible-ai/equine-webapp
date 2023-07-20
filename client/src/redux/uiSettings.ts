// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import getLocalStorageItem from "utils/localStorage/getLocalStorageItem"
import setLocalStorageItem from "utils/localStorage/setLocalStorageItem"
import {
  DEFAULT_CONFIDENCE_FLOOR,
  DEFAULT_OOD_COLOR_INTERVALS,
  DEFAULT_OOD_COLOR_MODE,
} from "utils/labelColors"
import LOCAL_STORAGE_KEYS from "utils/localStorage/localStorageKeys"

export interface ReduxUiSettingsState {
  colorBlindMode: boolean,
  darkMode: boolean,
  oodColorIntervals: number,
  oodColorMode: boolean,
  serverUrl: string,
}

export function setupInitialState() {
  return {
    colorBlindMode: getLocalStorageItem("colorBlindMode", false),
    darkMode: getLocalStorageItem("darkMode", false),
    oodColorIntervals: DEFAULT_OOD_COLOR_INTERVALS,
    oodColorMode: DEFAULT_OOD_COLOR_MODE,
    confidenceFloor: DEFAULT_CONFIDENCE_FLOOR,
    serverUrl: getLocalStorageItem(LOCAL_STORAGE_KEYS.serverUrl, "") || process.env.REACT_APP_SERVER_URL || "http://localhost:5252",
  }
}

export const INITIAL_STATE: ReduxUiSettingsState = setupInitialState()
setLocalStorageItem(LOCAL_STORAGE_KEYS.serverUrl, INITIAL_STATE.serverUrl)

const uiSettingsSlice = createSlice({
  name: 'uiSettings',
  initialState: INITIAL_STATE,
  reducers: {
    setOodColorIntervals: (state, action: PayloadAction<number>) => {
      state.oodColorIntervals = action.payload
    },
    setServerUrl: (state, action: PayloadAction<string>) => {
      state.serverUrl = action.payload
    },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode
      setLocalStorageItem("darkMode", state.darkMode)
    },
    toggleColorBlindMode: (state) => {
      state.colorBlindMode = !state.colorBlindMode
      setLocalStorageItem("colorBlindMode", state.colorBlindMode)
    },
    toggleOodColorMode: (state) => {
      state.oodColorMode = !state.oodColorMode
    },
  },
})

export const { setOodColorIntervals, setServerUrl, toggleDarkMode, toggleColorBlindMode, toggleOodColorMode } = uiSettingsSlice.actions
export default uiSettingsSlice.reducer