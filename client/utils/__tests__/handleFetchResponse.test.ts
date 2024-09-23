// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT

import { expect, it } from 'vitest'

import handleFetchResponse from "../handleFetchResponse"

it("returns the response if it is ok", async () => {
  const res = new Response(null, { status: 200 })

  expect(await handleFetchResponse(res)).toEqual(res)
})

it("throws an error from text() if the response is not ok", async () => {
  const res = new Response("testing123", { status: 400, statusText: "server error message" })

  try {
    await handleFetchResponse(res)
    throw "this should not run"
  }
  catch(err) {
    expect((err as Error).message).toEqual("testing123")
  }
})

it("throws an error from statusText if the response is not ok", async () => {
  const res = new Response(null, { status: 400, statusText: "server error message" })

  try {
    await handleFetchResponse(res)
    throw "this should not run"
  }
  catch(err) {
    expect((err as Error).message).toEqual("server error message")
  }
})
