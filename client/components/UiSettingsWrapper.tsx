import { useAppDispatch, useAppSelector } from '@/redux/reduxHooks'

import 'chartkick/chart.js'
import { useEffect } from 'react'
import getLocalStorageItem from '@/utils/localStorage/getLocalStorageItem'
import LOCAL_STORAGE_KEYS from '@/utils/localStorage/localStorageKeys'
import { setServerUrl, setColorBlindMode, setDarkMode } from '@/redux/uiSettings'

export default function UiSettingsWrapper({children}:{children: JSX.Element[]}) {
  //this section is important for grabbing settings from cookies since NextJS uses server side rendering 
  const dispatch = useAppDispatch()
  useEffect(() => {
    const colorBlindModeCookie = getLocalStorageItem(LOCAL_STORAGE_KEYS.colorBlindMode, false)
    dispatch(setColorBlindMode(colorBlindModeCookie))

    const darkModeCookie = getLocalStorageItem(LOCAL_STORAGE_KEYS.darkMode, false)
    dispatch(setDarkMode(darkModeCookie))

    const serverUrlCookie = getLocalStorageItem(LOCAL_STORAGE_KEYS.serverUrl, "")
    console.log("serverUrlCookie",serverUrlCookie)
    if(serverUrlCookie) {
      dispatch(setServerUrl(serverUrlCookie))
    }
  },[dispatch])

  const darkMode = useAppSelector(state => state.uiSettings.darkMode)
  return (
    <div id="app" className={darkMode ? "dark" : ""}>
      {children}
    </div>
  )
}