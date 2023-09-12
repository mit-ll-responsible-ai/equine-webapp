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
import { useAppSelector } from '@/redux/reduxHooks'

import 'chartkick/chart.js'

const queryClient = new QueryClient()

export default function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <DarkModeWrapper>
          <div id="content">
            <Component {...pageProps} />
          </div>
          <div id="sidebarContainer"><Sidebar/></div>

          <FeedbackModal/>
        </DarkModeWrapper>
      </Provider>
    </QueryClientProvider>
  )
}

const DarkModeWrapper = ({children}:{children: JSX.Element[]}) => {
  const darkMode = useAppSelector(state => state.uiSettings.darkMode)

  return (
    <div id="app" className={darkMode ? "dark" : ""}>
      {children}
    </div>
  )
}