// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT

import React from "react"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUpload, faTimes } from '@fortawesome/free-solid-svg-icons'

import copyArrayThenDelete from "@/utils/copyArrayThenDelete"

import { showModal } from "@/redux/modal"
import { useAppDispatch } from "@/redux/reduxHooks"

import styles from "./UploadSampleFiles.module.scss"


export default function UploadSampleFiles({
  sampleFiles,
  setSampleFiles,
  title,
}: {
  sampleFiles: File[],
  setSampleFiles: React.Dispatch<React.SetStateAction<File[]>>,
  title: string,
}) {
  const dispatch = useAppDispatch()

  const selectSampleFiles = async (e:React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if(files) {
      const alreadyExistFileNames:string[] = []
      const newFilesToUpload = Array.from(files).filter(newFile => {
        const isNewFileName = sampleFiles.find(f => f.name ===newFile.name) === undefined
        if(isNewFileName) {
          return true
        }

        alreadyExistFileNames.push(newFile.name)
        return false
      })

      setSampleFiles(sampleFiles.concat(newFilesToUpload))

      if(alreadyExistFileNames.length > 0) {
        dispatch(showModal({
          body: (
            <ul>
              {alreadyExistFileNames.map((name, i) =>
                <li key={i}>{name}</li>
              )}
            </ul>
          ),
          canClose: true,
          header: "You have already selected these files to be uploaded",
        }))
      }
    }

    //this is important for allowing the user to select the same file
    //so that the onChange event fires every time
    //ie the user mistakenly deleted a file, then wants to re-add it
    //https://stackoverflow.com/questions/12030686/html-input-file-selection-event-not-firing-upon-selecting-the-same-file
    e.target.value = ""
  }

  const deleteSampleFile = (fileIndex: number) => {
    if(sampleFiles[fileIndex]) {
      setSampleFiles(copyArrayThenDelete(sampleFiles, fileIndex))
    }
  }


  return (
    <div className={styles.uploadSampleFiles}>
      <div>
        {/* THIS MUST BE A LABEL FOR loadSampleFiles */}
        <label htmlFor={styles.loadSampleFiles} className="btn btn-primary">{title} <FontAwesomeIcon icon={faUpload}/></label> &nbsp;
        <input id={styles.loadSampleFiles} type="file" multiple onChange={selectSampleFiles}/>
      </div>

      <div>
        {sampleFiles && Array.from(sampleFiles).map((f,i) =>
          <div key={i}>
            {f.name}
            &nbsp;<span className="icon remove" onClick={e => deleteSampleFile(i)}>
              <FontAwesomeIcon icon={faTimes}/>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
