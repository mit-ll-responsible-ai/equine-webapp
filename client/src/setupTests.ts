// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import '@testing-library/jest-dom/extend-expect'

//console logs used during development are often annoying and clog up the terminal screen during testing
//this function only logs to the console if the first argument matches the test regex
//this will print: console.log("test", "will print during testing")
//this will not: console.log("ignored during testing")
const originalLog = console.log
beforeAll(() => {
  console.log = (...args) => {
    if (!/test/.test(args[0])) {
      return
    }
    originalLog.call(console, ...args)
  }
})


//mock createRange for use during testing
//https://stackoverflow.com/questions/42213522/mocking-document-createrange-for-jest
global.document.createRange = () => ({
  setStart: () => {},
  setEnd: () => {},
  commonAncestorContainer: {
    nodeName: 'BODY',
    ownerDocument: document,
  },
})


//the default DOM print character limit is 7000 which is sometimes too short
//this sets the character limit higher
//https://testing-library.com/docs/dom-testing-library/api-debugging/
process.env.DEBUG_PRINT_LIMIT = 20000


//this is important for running tests that rely on the route
//https://stackoverflow.com/questions/59954101/jest-error-when-set-or-assign-window-location
const location = new URL('http://localhost:3000')
location.assign = jest.fn()
location.replace = jest.fn()
location.reload = jest.fn()
delete window.location
window.location = location


//mock the canvas for testing
HTMLCanvasElement.prototype.getContext = () => ({
  font: "",
  measureText: () => ({width: 1})
});

global.setImmediate = jest.useRealTimers as unknown as typeof setImmediate;
global.clearImmediate = jest.useRealTimers as unknown as typeof clearImmediate;