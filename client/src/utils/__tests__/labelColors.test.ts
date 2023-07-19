// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import { scalePow } from 'd3'
import { COLORS } from 'utils/colors'
import toHex from 'utils/toHex'
import {
  buildGetColorFromLabelFunction,
  colors,
  createLabelColorsMap,
  labels,
  mapLabelToColor,
  MapLabelToColorType,
} from "../labelColors"

describe("createLabelColorsMap", () => {
  let spy = null
  beforeEach(() => {
    spy = jest.spyOn(console, 'warn').mockImplementation()
  })
  afterEach(() => {
    spy.mockRestore()
  })

  function validateMap(
    map: MapLabelToColorType,
    expectedLabelColors: {[label:string]: string}
  ) {
    //confirm that the expected labels are exaactly present
    expect(Object.keys(map).sort()).toStrictEqual(Object.keys(expectedLabelColors).sort())


    Object.entries(map).forEach(([label, colorFunction]) => {
      expect(typeof colorFunction).toStrictEqual("function")

      //confirm that with an ood valid of 0, the color is returned as expected
      expect(colorFunction(0)).toEqual(expectedLabelColors[label])
    })
  }

  test("warns for empty labels", () => {
    expect(spy).toHaveBeenCalledTimes(0)

    const result = createLabelColorsMap([], ["#123456"])

    validateMap(result, { OTHER: "#999999" })
    expect(spy).toHaveBeenCalledWith("No valid labels. label-colors map will only have OTHER")
  })

  test("warns for OTHER label", () => {
    expect(spy).toHaveBeenCalledTimes(0)

    const result = createLabelColorsMap(["other"], ["#123456"])

    validateMap(result, { OTHER: "#999999" })
    expect(spy).toHaveBeenCalledWith("'OTHER' is a reserved label and will be skipped")
    expect(spy).toHaveBeenCalledWith("No valid labels. label-colors map will only have OTHER")
  })

  test("warns for no colors", () => {
    expect(spy).toHaveBeenCalledTimes(0)

    const result = createLabelColorsMap(["my custom label"], [])

    validateMap(result, {
      "MY CUSTOM LABEL": "#999999",
      OTHER: "#999999"
    })
    expect(spy).toHaveBeenCalledWith("No valid colors. All labels will be #999999")
  })

  test("warns for only one color", () => {
    expect(spy).toHaveBeenCalledTimes(0)

    const result = createLabelColorsMap(["my custom label", "another label"], ["#123456"])

    validateMap(result, {
      "ANOTHER LABEL": "#123456",
      "MY CUSTOM LABEL": "#123456",
      OTHER: "#999999"
    })
    expect(spy).toHaveBeenCalledWith("Only one color provided. All labels will have the same color #123456")
  })


  test("more colors than labels", () => {
    expect(spy).toHaveBeenCalledTimes(0)

    const result = createLabelColorsMap(
      [ "my custom label", "another label", "a third label" ],
      [ "#000000", "#111111", "#222222", "#333333" ]
    )

    validateMap(result, {
      "A THIRD LABEL": "#222222",
      "ANOTHER LABEL": "#111111",
      "MY CUSTOM LABEL": "#000000",
      OTHER: "#999999"
    })
    expect(spy).toHaveBeenCalledTimes(0)
  })


  test("more labels than colors, repeats colors", () => {
    expect(spy).toHaveBeenCalledTimes(0)

    const result = createLabelColorsMap(
      [ "my custom label", "another label", "a third label", "fourth label" ],
      [ "#000000", "#111111" ]
    )

    validateMap(result, {
      "A THIRD LABEL": "#000000", //repeat
      "ANOTHER LABEL": "#111111",
      "FOURTH LABEL": "#111111", //repeat
      "MY CUSTOM LABEL": "#000000",
      OTHER: "#999999"
    })
    expect(spy).toHaveBeenCalledTimes(0)
  })


  test("redo existing map", () => {
    expect(spy).toHaveBeenCalledTimes(0)

    const result = createLabelColorsMap(
      [ "my custom label", "another label", "a third label", "a new label" ],
      [ "#000000", "#111111", "#222222" ],
      undefined,
      {
        "A THIRD LABEL": () => "#000000", //this should be set to #222222
        "ANOTHER LABEL": () => "#111111",
        "this should be deleted": () => "#111111",
        "MY CUSTOM LABEL": () => "#000000",
        OTHER: () => "#999999"
      }
    )

    validateMap(result, {
      "A NEW LABEL": "#000000",
      "A THIRD LABEL": "#222222",
      "ANOTHER LABEL": "#111111",
      "MY CUSTOM LABEL": "#000000",
      OTHER: "#999999"
    })
    expect(spy).toHaveBeenCalledTimes(0)
  })

  
  test("oodColorIntervals properly interpolates", () => {
    const result = createLabelColorsMap(
      [ "my custom label", "another label", "a third label", "fourth label" ],
      [ "#000000", "#111111" ]
    )

    validateMap(result, {
      "A THIRD LABEL": "#000000", //repeat
      "ANOTHER LABEL": "#111111",
      "FOURTH LABEL": "#111111", //repeat
      "MY CUSTOM LABEL": "#000000",
      OTHER: "#999999"
    })

    const thirdLabelFunction = result["A THIRD LABEL"]
    expect(thirdLabelFunction(0)).toEqual("#000000")
    expect(thirdLabelFunction(0.001)).toEqual("#000000")
    expect(thirdLabelFunction(Math.cbrt(0.10))).toEqual("#1A1A1A")
    expect(thirdLabelFunction(Math.cbrt(0.25))).toEqual("#404040")
    expect(thirdLabelFunction(Math.cbrt(0.5))).toEqual("#808080")
    expect(thirdLabelFunction(Math.cbrt(0.6))).toEqual("#999999")
    expect(thirdLabelFunction(Math.cbrt(0.7))).toEqual("#B2B2B2")
    expect(thirdLabelFunction(Math.cbrt(0.75))).toEqual("#BFBFBF")
    expect(thirdLabelFunction(Math.cbrt(0.96))).toEqual("#F5F5F5")
    expect(thirdLabelFunction(1)).toEqual("#FFFFFF")


    const anotherLabelFunction = result["ANOTHER LABEL"]
    expect(anotherLabelFunction(0)).toEqual("#111111")
    expect(anotherLabelFunction(0.001)).toEqual("#111111")
    expect(anotherLabelFunction(Math.cbrt(0.10))).toEqual("#292929")
    expect(anotherLabelFunction(Math.cbrt(0.25))).toEqual("#4D4D4D")
    expect(anotherLabelFunction(Math.cbrt(0.5))).toEqual("#888888")
    expect(anotherLabelFunction(Math.cbrt(0.6))).toEqual("#A0A0A0")
    expect(anotherLabelFunction(Math.cbrt(0.7))).toEqual("#B8B8B8")
    expect(anotherLabelFunction(Math.cbrt(0.75))).toEqual("#C4C4C4")
    expect(anotherLabelFunction(Math.cbrt(0.96))).toEqual("#F5F5F5")
    expect(anotherLabelFunction(1)).toEqual("#FFFFFF")
  })


  test("properly interpolates colors", () => {
    const result = createLabelColorsMap(
      [ "my custom label", "another label", "a third label", "fourth label" ],
      [ "#000000", "#111111" ]
    )

    validateMap(result, {
      "A THIRD LABEL": "#000000", //repeat
      "ANOTHER LABEL": "#111111",
      "FOURTH LABEL": "#111111", //repeat
      "MY CUSTOM LABEL": "#000000",
      OTHER: "#999999"
    })

    const thirdLabelFunction = result["A THIRD LABEL"]
    expect(thirdLabelFunction(0)).toEqual("#000000")
    expect(thirdLabelFunction(0.001)).toEqual("#000000")
    expect(thirdLabelFunction(Math.cbrt(0.10))).toEqual("#1A1A1A")
    expect(thirdLabelFunction(Math.cbrt(0.25))).toEqual("#404040")
    expect(thirdLabelFunction(Math.cbrt(0.5))).toEqual("#808080")
    expect(thirdLabelFunction(Math.cbrt(0.6))).toEqual("#999999")
    expect(thirdLabelFunction(Math.cbrt(0.7))).toEqual("#B2B2B2")
    expect(thirdLabelFunction(Math.cbrt(0.75))).toEqual("#BFBFBF")
    expect(thirdLabelFunction(Math.cbrt(0.96))).toEqual("#F5F5F5")
    expect(thirdLabelFunction(1)).toEqual("#FFFFFF")


    const anotherLabelFunction = result["ANOTHER LABEL"]
    expect(anotherLabelFunction(0)).toEqual("#111111")
    expect(anotherLabelFunction(0.001)).toEqual("#111111")
    expect(anotherLabelFunction(Math.cbrt(0.10))).toEqual("#292929")
    expect(anotherLabelFunction(Math.cbrt(0.25))).toEqual("#4D4D4D")
    expect(anotherLabelFunction(Math.cbrt(0.5))).toEqual("#888888")
    expect(anotherLabelFunction(Math.cbrt(0.6))).toEqual("#A0A0A0")
    expect(anotherLabelFunction(Math.cbrt(0.7))).toEqual("#B8B8B8")
    expect(anotherLabelFunction(Math.cbrt(0.75))).toEqual("#C4C4C4")
    expect(anotherLabelFunction(Math.cbrt(0.96))).toEqual("#F5F5F5")
    expect(anotherLabelFunction(1)).toEqual("#FFFFFF")
  })


  test("oodColorMode false, no interpolation", () => {
    const result = createLabelColorsMap(
      [ "my custom label", "another label", "a third label", "fourth label" ],
      [ "#000000", "#111111" ],
      false
    )

    validateMap(result, {
      "A THIRD LABEL": "#000000", //repeat
      "ANOTHER LABEL": "#111111",
      "FOURTH LABEL": "#111111", //repeat
      "MY CUSTOM LABEL": "#000000",
      OTHER: "#999999"
    })

    const anotherLabelFunction = result["ANOTHER LABEL"]
    const thirdLabelFunction = result["A THIRD LABEL"]
    for(let i=0; i<=100; ++i) {
      const threshold = i / 100
      expect(anotherLabelFunction(threshold)).toEqual("#111111")
      expect(thirdLabelFunction(threshold)).toEqual("#000000")
    }
  })
})



describe("buildGetColorFromLabelFunction", () => {
  let spy = null
  beforeEach(() => {
    spy = jest.spyOn(console, 'warn').mockImplementation()
  })
  afterEach(() => {
    spy.mockRestore()
  })

  //test adding a class
  const testKey = "my-class".toUpperCase()
  const labelsCopy = JSON.parse(JSON.stringify(labels.concat(testKey)))
  const testScale = scalePow().exponent(3).domain([0,1]).range([COLORS.BLUE, "white"])
  const mapLabelToColorCopy = {...mapLabelToColor, [testKey]: (n: number) => toHex(testScale(n))}

  function checkMapEquality(map1:MapLabelToColorType, map2:MapLabelToColorType) {
    expect(Object.keys(map1).sort()).toEqual(Object.keys(map2).sort())

    Object.keys(map1).forEach(label => {
      const func1 = map1[label]
      const func2 = map2[label]
      for(let i=0; i<=100; ++i) {
        const threshold = i / 100
        expect(func1(threshold)).toEqual(func2(threshold))
      }
    })
  }
  
  describe("oodColorMode true", () => {
    const getColorFromLabel = buildGetColorFromLabelFunction(colors, true, mapLabelToColor)

    test("shows warning for bad ood values", () => {
      getColorFromLabel(testKey, -0.5)
      expect(spy).toHaveBeenCalledWith("Expected ood value between 0 and 1. Received -0.5")

      getColorFromLabel(testKey, 1.1)
      expect(spy).toHaveBeenCalledWith("Expected ood value between 0 and 1. Received 1.1")
    })

    test("getColorFromLabel returns values for existing labels", () => {
      Object.keys(mapLabelToColor).forEach(label => {
        expect(getColorFromLabel(label)).toStrictEqual(mapLabelToColor[label](0))
      })

      console.log("test","labels",labels)
      console.log("test","labelsCopy",labelsCopy)

      //values were not changed
      expect(labels).toStrictEqual(labelsCopy)
      checkMapEquality(mapLabelToColor, mapLabelToColorCopy)
    })

    //NOTE this test assumes that "my new label" is not already in labels
    test("getColorFromLabel adds new labels and recreates map", () => {
      const expectedColor = colors[ labels.length % colors.length ]
      expect(getColorFromLabel("my new label")).toEqual(expectedColor)

      expect(labels).toStrictEqual([
        ...labelsCopy, "my new label"
      ])
      const expectedScale = scalePow().exponent(3).domain([0,1]).range([expectedColor, "white"])
      checkMapEquality(mapLabelToColor, {
        ...mapLabelToColorCopy, "MY NEW LABEL": (n: number) => toHex(expectedScale(n))
      })

      //set values back to original
      labels.pop()
      delete mapLabelToColor["MY NEW LABEL"]
      expect(labels).toStrictEqual(labelsCopy)
      checkMapEquality(mapLabelToColor, mapLabelToColorCopy)
    })
  })

  //TODO test oodColorMode false
  //TODO test ood color mode changes
})