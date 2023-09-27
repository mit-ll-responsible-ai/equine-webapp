// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import React from "react"
import Modal from 'react-bootstrap/Modal'

import { closeModal } from "@/redux/modal"
import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks"


export default function FeedbackModal() {
  const dispatch = useAppDispatch()
  const {
    body,
    canClose,
    footer,
    header,
    show,
  } = useAppSelector(state => state.modal)

  return (
    <Modal
      aria-labelledby="feedbackModal"
      backdrop={canClose || "static"}
      centered
      onHide={() => dispatch(closeModal())}
      show={show}
      size="lg"
    >
      {
        header && (
          <Modal.Header closeButton>
            {header}
          </Modal.Header>
        )
      }

      {
        body && (
          <Modal.Body>
            {body}
          </Modal.Body>
        )
      }

      {
        footer && (
          <Modal.Footer>
            {footer}
          </Modal.Footer>
        )
      }
    </Modal>
  )
}
