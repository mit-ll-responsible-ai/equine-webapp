// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import React, { useState } from 'react';

type Props = {
  children: React.FC<{inDropZone: boolean}>,
  onDrop: (e: React.DragEvent) => void,
}

//This component is a wrapper to handle drag and drop events events, ie for files or other custom events.
//Pass a Functional Component as the child of this wrapper, and you are also able to access the inDropZone variable,
//which you can use to style your child component.
//Based off https://github.com/chidimo/react-dnd/blob/04-finish-handlers/src/DragAndDrop.js
const FileDragDrop = (props: Props) => {
  const {
    children: Children,
    onDrop,
  } = props

  const [inDropZone, setInDropZone] = useState<boolean>(false)

  const stopEventDefault = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e: React.DragEvent) => {
    stopEventDefault(e)
    e.dataTransfer.effectAllowed = "all"
  }

  const handleDragLeave = (e: React.DragEvent) => {
    stopEventDefault(e)
    setInDropZone(false) //mark we are not in the drop zone anymore
  }

  const handleDragOver = (e: React.DragEvent) => {
    stopEventDefault(e)
    setInDropZone(true) //mark we are in the drop zone
  }

  const handleDrop = (e: React.DragEvent) => {
    stopEventDefault(e)
    onDrop(e) //run the on drop prop callback
    setInDropZone(false) //mark we are not in the drop zone anymore
  }

  return (
    <span
      onDrop={e => handleDrop(e)}
      onDragOver={e => handleDragOver(e)}
      onDragEnter={e => handleDragEnter(e)}
      onDragLeave={e => handleDragLeave(e)}
    >
      <Children inDropZone={inDropZone}/>
    </span>
  );
};

export default FileDragDrop