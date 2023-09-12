import { configureStore } from '@reduxjs/toolkit'
import inferenceSettingsReducer from './inferenceSettings'
import modalReducer from './modal'
import uiSettingsReducer from './uiSettings'

const store = configureStore({
  reducer: {
    inferenceSettings: inferenceSettingsReducer,
    modal: modalReducer,
    uiSettings: uiSettingsReducer,
  },
})
export default store

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
