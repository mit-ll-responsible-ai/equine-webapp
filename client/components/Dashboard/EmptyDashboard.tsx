// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import React from "react"
import Button from 'react-bootstrap/Button'
import Link from "next/link"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHome, faUpload } from '@fortawesome/free-solid-svg-icons'

import { SampleType, rawSampleSchema, setModelName, setRunId } from "@/redux/inferenceSettings"
import { closeModal, showModal } from "@/redux/modal"
import { useAppDispatch } from "@/redux/reduxHooks"

import { useProcessAndSetSamples } from "@/hooks/useProcessAndSetSamples"

import packageJson from "@/package.json"
import ajvValidate from "@/utils/ajvValidate"
import { ROUTES } from "@/utils/routes"

import styles from "./Dashboard.module.scss"

const dashboardDataSchema = {
  $id: "/dashboardDataSchema",
  type: "object",
  properties: {
    modelName: {type: "string"},
    samples: {
      type: "array",
      items: {$ref: "/rawSampleSchema"},
    },
    version: {type: "string"},
  },
  required: ["modelName", "samples", "version"]
};

export type DashboardDataType = {
  modelName: string,
  runId: number,
  samples: SampleType[],
  version: string,
}


export default function EmptyDashboard() {
  const dispatch = useAppDispatch()
  const processAndSetSamples = useProcessAndSetSamples()

  const uploadDataFile = async (e:React.ChangeEvent<HTMLInputElement>) => {
    dispatch(showModal({ //open the modal
      canClose: false,
      header: "Reading File...",
    }))

    const files = e.target.files
    if(files && files[0]) { //if there are files
      const reader = new FileReader() //initialize a file reader
      reader.onload = (evt) => { //on load callback
        try {
          if(typeof evt?.target?.result === "string") { //if the result is a string
            const data = JSON.parse(evt.target.result) as DashboardDataType //try to JSON parse the string

            ajvValidate([rawSampleSchema,dashboardDataSchema],data,"The uploaded file has an invalid schema.")
            // else if(!isValidVersion(data.version, packageJson.version)) {
            //   throw new Error(`The uploaded file has a version ${data.version} which is incompatible with the current app version ${packageJson.version}`)
            // }
            if(data.samples.length === 0) {
              throw new Error("The uploaded file has no data")
            }
            else { //parsed data successfully
              if(data.version !== packageJson.version) {
                dispatch(showModal({ //show the modal with the error message
                  body: `The uploaded file version ${data.version} is different from the current app version ${packageJson.version}. You may encounter bugs.`,
                  canClose: true,
                  header: "Warning: Mismatching Versions",
                }))
              }
              else {
                dispatch(closeModal())
              }

              //this bit of code is for backwards compatibility
              //originally I (Harry) had been using a field called original_app_class
              data.samples.forEach(d => {
                // @ts-ignore
                if(d.original_app_class) { //if the field original_app_class exists
                  // @ts-ignore
                  d.classProbabilities = d.original_app_class //rename it to classProbabilities
                  // @ts-ignore
                  delete d.original_app_class //delete original_app_class
                }

                //TODO test
                if(d.ood === undefined) { //if the ood is not defined
                  d.ood = 0 //manually set it to 0
                }
              })

              dispatch(setModelName(data.modelName))
              dispatch(setRunId(data.runId))
              processAndSetSamples(data.samples)
            }
          }
          else {
            throw new Error("There was an error reading the content of the file")
          }
        }
        catch(err) { //catch errors
          err instanceof Error && dispatch(showModal({ //show the modal with the error message
            body: err.message,
            canClose: true,
            header: "Error Reading File",
          }))
        }
      }
      reader.onerror = () => { //on error callback
        dispatch(showModal({ //show the modal with the error message
          canClose: true,
          header: "Error Reading File",
        }))
      }

      reader.readAsText(files[0]) //read the file as text
    }
    else {
      dispatch(showModal({
        canClose: true,
        header: "No File was Uploaded",
      }))
    }

    e.target.value = ""
  }

  return (
    <div id={styles.emptyDashboard}>
      <div>
        <div><b>You don&apos;t have any data for the dashboard yet. You can:</b></div>
        <br/>
        <div style={{marginBottom: "0.5em"}}>Go to the home page to run the pipeline</div>

        <Link href={ROUTES.LANDING}><Button>Home Page <FontAwesomeIcon icon={faHome}/></Button></Link>
        <br/><br/>
        <div>- or -</div>
        <br/>
        <div style={{marginBottom: "0.5em"}}>Upload a JSON data file you had previously downloaded</div>
        {/* THIS MUST BE A LABEL FOR loadDataFile */}
        <label htmlFor={styles.loadDataFile} className="btn btn-primary">Upload JSON File <FontAwesomeIcon icon={faUpload}/></label> &nbsp;
        <input id={styles.loadDataFile} type="file" accept=".json" onChange={uploadDataFile}/>
      </div>
    </div>
  )
}
