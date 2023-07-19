// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
/**
 * this function returns the relative position of the mouse in an element from the event.
 * since the clientX and clientY are relative to the viewport, not the element
 * we need to find the bounds of the element on screen, then subtract to find the relative position.
 * https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/clientX
 * @param  event   React Synthetic event
 * @param  element DOM element, ie React Ref.current
 * @return         an object with keys x and y with relative values, ie {x: 10, y: 15}
 */
export default function getRelativePositionFromEvent(
  event: React.MouseEvent | React.WheelEvent,
  element: HTMLElement,
) {
  const bounds = element.getBoundingClientRect() //get the bounds of the element

  return {
    x: event.clientX - bounds.left,
    y: event.clientY - bounds.top,
  }
}
