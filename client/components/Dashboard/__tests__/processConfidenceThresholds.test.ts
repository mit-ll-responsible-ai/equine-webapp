// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT

import { describe, expect, test } from 'vitest'

import processConfidenceThresholds, { getProcessedClassProbabilities } from "../processConfidenceThresholds"
import { SampleType } from '@/redux/inferenceSettings'

const SAMPLE:SampleType = {
  classProbabilities: {
    "C1":0.000003999493003948323,
    "C2":0.00001175577260670263,
    "C3":0.0000034071670881619813,
    "C4":0.9999807222637824,
    "C5":1.1530351865514989e-7
  },
  coordinates: [],
  inputData: {dataIndex: 0},
  ood: 0.6
}

describe("processConfidenceThresholds", () => {
  const SAMPLES = [
    {
      ...SAMPLE, 
      ood: 0.7, 
      classProbabilities: {
        C1:0.1, C2:0.25, C3:0.15,
        C4:0.2, C5:0.15
      } 
    },
    {
      ...SAMPLE, 
      ood: 0.2, 
      classProbabilities: {
        C1:0.9, C2:0.01, C3:0.02,
        C4:0.02, C5:0.03
      } 
    },
  ]

  test("everything meets threshold", () => {
    const result = processConfidenceThresholds(SAMPLES, 0,100)
    expect(result).toEqual([
      {
        C1:0, C2:1, C3:0,
        C4:0, C5:0, CLASS_CONFUSION: 0, OOD: 0
      },
      {
        C1:1, C2:0, C3:0,
        C4:0, C5:0, CLASS_CONFUSION: 0, OOD: 0
      }
    ])
  })


  test("some meet class threshold", () => {
    const result = processConfidenceThresholds(SAMPLES, 20,100)
    expect(result).toEqual([
      {
        C1:0, C2:1, C3:0,
        C4:0, C5:0, CLASS_CONFUSION: 0, OOD: 0
      },
      {
        C1:1, C2:0, C3:0,
        C4:0, C5:0, CLASS_CONFUSION: 0, OOD: 0
      }
    ])
  }) 


  test("one meets class threshold", () => {
    const result = processConfidenceThresholds(SAMPLES, 80,100)
    expect(result).toEqual([
      {
        C2:0, C1:0, C3:0,
        C4:0, C5:0, CLASS_CONFUSION: 1, OOD: 0
      },
      {
        C1:1, C2:0, C3:0,
        C4:0, C5:0, CLASS_CONFUSION: 0, OOD: 0
      }
    ])
  }) 


  test("none meet class threshold", () => {
    const result = processConfidenceThresholds(SAMPLES, 95,100)
    expect(result).toEqual([
      {
        C2:0, C1:0, C3:0,
        C4:0, C5:0, CLASS_CONFUSION: 1, OOD: 0
      },
      {
        C1:0, C2:0, C3:0,
        C4:0, C5:0, CLASS_CONFUSION: 1, OOD: 0
      }
    ])
  })


  test("one meets OOD threhsold", () => {
    const result = processConfidenceThresholds(SAMPLES, 0,50)
    expect(result).toEqual([
      {
        C2:0, C1:0, C3:0,
        C4:0, C5:0, CLASS_CONFUSION: 0, OOD: 1
      },
      {
        C1:1, C2:0, C3:0,
        C4:0, C5:0, CLASS_CONFUSION: 0, OOD: 0
      }
    ])
  }) 


  test("none meet both thresholds", () => {
    const result = processConfidenceThresholds(SAMPLES, 95,50)
    expect(result).toEqual([
      {
        C2:0, C1:0, C3:0,
        C4:0, C5:0, CLASS_CONFUSION: 0, OOD: 1
      },
      {
        C1:0, C2:0, C3:0,
        C4:0, C5:0, CLASS_CONFUSION: 1, OOD: 0
      }
    ])
  }) 
})




describe("getProcessedClassProbabilities", () => {
  test("everything meets thresholds", () => {
    expect(getProcessedClassProbabilities(SAMPLE, 0, 100)).toEqual({
      C1:0, C2:0, C3:0,
      C4:1, C5:0, CLASS_CONFUSION: 0, OOD: 0
    })
  })

  test("only one class meets confidence, meets OOD", () => {
    expect(getProcessedClassProbabilities(SAMPLE, 50, 100)).toEqual({
      C1:0, C2:0, C3:0,
      C4:1, C5:0, CLASS_CONFUSION: 0, OOD: 0
    })
  })

  test("no classes meet threshold, meets OOD", () => {
    expect(getProcessedClassProbabilities(SAMPLE, 100, 100)).toEqual({
      C1:0, C2:0, C3:0,
      C4:0, C5:0, CLASS_CONFUSION: 1, OOD: 0
    })
  })

  test("does not meet OOD", () => {
    expect(getProcessedClassProbabilities(SAMPLE, 50, 50)).toEqual({
      C2:0, C1:0, C3:0,
      C4:0, C5:0, CLASS_CONFUSION: 0, OOD: 1
    })
  })

  test("does not meet any threshold", () => {
    expect(getProcessedClassProbabilities(SAMPLE, 100, 50)).toEqual({
      C2:0, C1:0, C3:0,
      C4:0, C5:0, CLASS_CONFUSION: 0, OOD: 1
    })
  })
})