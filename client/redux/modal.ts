// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface ReduxModalState {
  body: JSX.Element | string,
  canClose: boolean,
  footer: JSX.Element | string,
  header: JSX.Element | string,
  show: boolean,
}

export type ShowModalArgsType = {
  body?: JSX.Element | string,
  canClose?: boolean,
  footer?: JSX.Element | string,
  header?: JSX.Element | string,
}

const INITIAL_STATE: ReduxModalState = {
  body: "",
  canClose: true,
  footer: "",
  header: "",
  show: false,
}

const modalSlice = createSlice({
  name: 'modal',
  initialState: INITIAL_STATE,
  reducers: {
    closeModal: (state) => {
      state.show = false
    },
    showModal: (state, action: PayloadAction<ShowModalArgsType>) => {
      state.body = action.payload.body || ""
      state.canClose = action.payload.canClose === true
      state.footer = action.payload.footer || ""
      state.header = action.payload.header || ""
      state.show = true
    },
  },
})

export const { closeModal, showModal } = modalSlice.actions
export default modalSlice.reducer