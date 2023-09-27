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
import Head from 'next/head'

const queryClient = new QueryClient()

export default function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <UiSettingsWrapper>
          <Head>
            <title>EQUINE Webapp</title>
            <meta name="description" content="The companion webapp to EQUINE, and uncertainty quantification machine learning architecture for supervised multiclass classification."/>

            <meta property="og:url" content="https://mit-ll-responsible-ai.github.io/equine-webapp/"/>
            <meta property="og:type" content="website"/>
            <meta property="og:title" content="EQUINE Webapp"/>
            <meta property="og:description" content="The companion webapp to EQUINE, and uncertainty quantification machine learning architecture for supervised multiclass classification."/>
            <meta property="og:image" content="https://mit-ll-responsible-ai.github.io/equine-webapp/ood.png"/>

            <meta name="twitter:card" content="summary_large_image"/>
            <meta property="twitter:domain" content="mit-ll-responsible-ai.github.io"/>
            <meta property="twitter:url" content="https://mit-ll-responsible-ai.github.io/equine-webapp/"/>
            <meta name="twitter:title" content="EQUINE Webapp"/>
            <meta name="twitter:description" content="The companion webapp to EQUINE, and uncertainty quantification machine learning architecture for supervised multiclass classification."/>
            <meta name="twitter:image" content="https://mit-ll-responsible-ai.github.io/equine-webapp/ood.png"/>
          </Head>
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