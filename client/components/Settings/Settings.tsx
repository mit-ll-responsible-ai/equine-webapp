// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT

import React from "react"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faLink,
  faMoon,
  faPalette,
} from '@fortawesome/free-solid-svg-icons'
import { Container, Form } from "react-bootstrap";

import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks";
import { setServerUrl, setColorBlindMode, setDarkMode } from "@/redux/uiSettings";


export default function Settings() {
  const colorBlindMode = useAppSelector(state => state.uiSettings.colorBlindMode)
  const darkMode = useAppSelector(state => state.uiSettings.darkMode)
  const serverUrl = useAppSelector(state => state.uiSettings.serverUrl)

  const dispatch = useAppDispatch()


  return (
    <div style={{padding: "1em"}}>
      <Container>
        <h2 style={{textAlign:"center"}}>Settings</h2>
        <br/>
        <Form>
          <Form.Group controlId="formBasicEmail">
            <Form.Label>Server URL <FontAwesomeIcon icon={faLink}/></Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter server url, ex: http://localhost:8080"
              onChange={(e) => dispatch(setServerUrl(e.target.value))}
              value={serverUrl}
            />
          </Form.Group>

          <br/>
          
          <Form.Group>
            <Form.Check 
              checked={colorBlindMode}
              id="color-blind-mode-switch"
              label={<>Color Blind Mode <FontAwesomeIcon icon={faPalette}/></>}
              onChange={() => dispatch(setColorBlindMode(!colorBlindMode))}
              type="switch"
            />
          </Form.Group>

          <br/>

          <Form.Group>
            <Form.Check 
              checked={darkMode}
              id="dark-mode-switch"
              label={<>Dark Mode <FontAwesomeIcon icon={faMoon}/></>}
              onChange={() => dispatch(setDarkMode(!darkMode))}
              type="switch"
            />
          </Form.Group>
        </Form>
      </Container>
    </div>
  )
}
