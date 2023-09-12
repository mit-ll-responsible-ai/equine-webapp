// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import processConfidenceThresholds, { setProcessedAppClass } from "../processConfidenceThresholds"
const SAMPLE = {
  "app_class":{
    "C2":0.000003999493003948323,
    "C1":0.00001175577260670263,
    "C3":0.0000034071670881619813,
    "C4":0.9999807222637824,
    "C5":1.1530351865514989e-7
  },
  "ood": 0.6
}

describe("processConfidenceThresholds", () => {
  const SAMPLES = [
    {
      ...SAMPLE, 
      ood: 0.7, 
      app_class: {
        C2:0.25, C1:0.1, C3:0.15,
        C4:0.2, C5:0.15, OTHER: 0.15,
      } 
    },
    {
      ...SAMPLE, 
      ood: 0.2, 
      app_class: {
        C2:0.01, C1:0.9, C3:0.02,
        C4:0.02, C5:0.03, OTHER: 0.01,
      } 
    },
  ]

  test("everything meets threshold", () => {
    const samplesCopy = JSON.parse(JSON.stringify(SAMPLES))

    const result = processConfidenceThresholds(samplesCopy, 0,100)
    expect(samplesCopy).toEqual(SAMPLES) //input was not modified
    expect(result).toEqual([
      {
        ...SAMPLES[0],
        processed_app_class: {
          C2:1, C1:1, C3:1,
          C4:1, C5:1, OTHER: 0,
        } 
      },
      {
        ...SAMPLES[1],
        processed_app_class: {
          C2:1, C1:1, C3:1,
          C4:1, C5:1, OTHER: 0,
        } 
      },
    ])
  })


  test("some meet class threshold", () => {
    const samplesCopy = JSON.parse(JSON.stringify(SAMPLES))

    const result = processConfidenceThresholds(samplesCopy, 20,100)
    expect(samplesCopy).toEqual(SAMPLES) //input was not modified
    expect(result).toEqual([
      {
        ...SAMPLES[0],
        processed_app_class: {
          C2:1, C1:0, C3:0,
          C4:1, C5:0, OTHER: 0,
        } 
      },
      {
        ...SAMPLES[1],
        processed_app_class: {
          C2:0, C1:1, C3:0,
          C4:0, C5:0, OTHER: 0,
        } 
      },
    ])
  }) 


  test("one meets class threshold", () => {
    const samplesCopy = JSON.parse(JSON.stringify(SAMPLES))

    const result = processConfidenceThresholds(samplesCopy, 80,100)
    expect(samplesCopy).toEqual(SAMPLES) //input was not modified
    expect(result).toEqual([
      {
        ...SAMPLES[0],
        processed_app_class: {
          C2:0, C1:0, C3:0,
          C4:0, C5:0, OTHER: 1,
        } 
      },
      {
        ...SAMPLES[1],
        processed_app_class: {
          C2:0, C1:1, C3:0,
          C4:0, C5:0, OTHER: 0,
        } 
      },
    ])
  }) 


  test("none meet class threshold", () => {
    const samplesCopy = JSON.parse(JSON.stringify(SAMPLES))

    const result = processConfidenceThresholds(samplesCopy, 95,100)
    expect(samplesCopy).toEqual(SAMPLES) //input was not modified
    expect(result).toEqual([
      {
        ...SAMPLES[0],
        processed_app_class: {
          C2:0, C1:0, C3:0,
          C4:0, C5:0, OTHER: 1,
        } 
      },
      {
        ...SAMPLES[1],
        processed_app_class: {
          C2:0, C1:0, C3:0,
          C4:0, C5:0, OTHER: 1,
        } 
      },
    ])
  })


  test("one meets OOD threhsold", () => {
    const samplesCopy = JSON.parse(JSON.stringify(SAMPLES))

    const result = processConfidenceThresholds(samplesCopy, 0,50)
    expect(samplesCopy).toEqual(SAMPLES) //input was not modified
    expect(result).toEqual([
      {
        ...SAMPLES[0],
        processed_app_class: {
          C2:0, C1:0, C3:0,
          C4:0, C5:0, OTHER: 1,
        } 
      },
      {
        ...SAMPLES[1],
        processed_app_class: {
          C2:1, C1:1, C3:1,
          C4:1, C5:1, OTHER: 0,
        } 
      },
    ])
  }) 


  test("none meet both thresholds", () => {
    const samplesCopy = JSON.parse(JSON.stringify(SAMPLES))

    const result = processConfidenceThresholds(samplesCopy, 95,50)
    expect(samplesCopy).toEqual(SAMPLES) //input was not modified
    expect(result).toEqual([
      {
        ...SAMPLES[0],
        processed_app_class: {
          C2:0, C1:0, C3:0,
          C4:0, C5:0, OTHER: 1,
        } 
      },
      {
        ...SAMPLES[1],
        processed_app_class: {
          C2:0, C1:0, C3:0,
          C4:0, C5:0, OTHER: 1,
        } 
      },
    ])
  }) 
})




describe("setProcessedAppClass", () => {
  test("everything meets thresholds", () => {
    const sampleCopy = JSON.parse(JSON.stringify(SAMPLE))
    setProcessedAppClass(sampleCopy, 0, 100)

    expect(sampleCopy).toEqual({
      ...SAMPLE,
      processed_app_class: {
        C2:1, C1:1, C3:1,
        C4:1, C5:1, OTHER: 0,
      }
    })
  })

  test("only one class meets confidence, meets OOD", () => {
    const sampleCopy = JSON.parse(JSON.stringify(SAMPLE))
    setProcessedAppClass(sampleCopy, 50, 100)

    expect(sampleCopy).toEqual({
      ...SAMPLE,
      processed_app_class: {
        C2:0, C1:0, C3:0,
        C4:1, C5:0, OTHER: 0,
      }
    })
  })

  test("no classes meet threshold, meets OOD", () => {
    const sampleCopy = JSON.parse(JSON.stringify(SAMPLE))
    setProcessedAppClass(sampleCopy, 100, 100)

    expect(sampleCopy).toEqual({
      ...SAMPLE,
      processed_app_class: {
        C2:0, C1:0, C3:0,
        C4:0, C5:0, OTHER: 1,
      }
    })
  })

  test("does not meet OOD", () => {
    const sampleCopy = JSON.parse(JSON.stringify(SAMPLE))
    setProcessedAppClass(sampleCopy, 0, 40)

    expect(sampleCopy).toEqual({
      ...SAMPLE,
      processed_app_class: {
        C2:0, C1:0, C3:0,
        C4:0, C5:0, OTHER: 1,
      }
    })
  })

  test("does not meet any threshold", () => {
    const sampleCopy = JSON.parse(JSON.stringify(SAMPLE))
    setProcessedAppClass(sampleCopy, 100, 40)

    expect(sampleCopy).toEqual({
      ...SAMPLE,
      processed_app_class: {
        C2:0, C1:0, C3:0,
        C4:0, C5:0, OTHER: 1,
      }
    })
  })
})