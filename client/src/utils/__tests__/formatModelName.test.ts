// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import formatModelName from "../formatModelName"

it("formats default proto and rf", () => {
  expect(formatModelName("default_proto")).toEqual("Default Protonet")
  expect(formatModelName("default_rf")).toEqual("Default Random Forest")
  expect(formatModelName("another model")).toEqual("another model")
  expect(formatModelName("default_proto_ensemble")).toEqual("Default Protonet Ensemble")
  expect(formatModelName("model.h5")).toEqual("model.h5")
})
