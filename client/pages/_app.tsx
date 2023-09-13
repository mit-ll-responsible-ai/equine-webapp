import 'bootstrap/dist/css/bootstrap.min.css'
import 'react-bootstrap-typeahead/css/Typeahead.css'
import "@/styles/app.scss"
import "@/styles/icon.scss"
import '@/styles/bootstrapOverrides.scss'

import { Provider } from "react-redux"
import store from '@/redux/store'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import type { AppProps } from 'next/app'
import FeedbackModal from '@/components/FeedbackModal/FeedbackModal'
import Sidebar from '@/components/Sidebar/Sidebar'
import UiSettingsWrapper from '@/components/UiSettingsWrapper'

import 'chartkick/chart.js'

const queryClient = new QueryClient()

export default function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <UiSettingsWrapper>
          <div id="content">
            <Component {...pageProps} />
          </div>
          
          <div id="sidebarContainer"><Sidebar/></div>

          <FeedbackModal/>
        </UiSettingsWrapper>
      </Provider>
    </QueryClientProvider>
  )
}