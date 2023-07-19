// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import downloadFile from "../downloadFile";

describe("downloadFile", () => {
  it("should run", () => {
    global.URL.createObjectURL = jest.fn()
    downloadFile("{}", "test.json", "hello world")
  })

  //TODO test if the file actually downloads?
})
