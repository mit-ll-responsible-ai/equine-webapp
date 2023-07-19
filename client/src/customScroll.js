// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
//this file is necessary to run preventDefault on scroll events
//based off this answer: https://github.com/facebook/react/issues/14856#issuecomment-478144231

const EVENTS_TO_MODIFY = ['touchstart', 'touchmove', 'touchend', 'touchcancel', 'wheel'];

const originalAddEventListener = document.addEventListener.bind();
document.addEventListener = (type, listener, options, wantsUntrusted) => {
  let modOptions = options;
  if (EVENTS_TO_MODIFY.includes(type)) {
    if (typeof options === 'boolean') {
      modOptions = {
        capture: options,
        passive: false,
      };
    } else if (typeof options === 'object') {
      modOptions = {
        passive: false,
        ...options,
      };
    }
  }

  return originalAddEventListener(type, listener, modOptions, wantsUntrusted);
};

const originalRemoveEventListener = document.removeEventListener.bind();
document.removeEventListener = (type, listener, options) => {
  let modOptions = options;
  if (EVENTS_TO_MODIFY.includes(type)) {
    if (typeof options === 'boolean') {
      modOptions = {
        capture: options,
        passive: false,
      };
    } else if (typeof options === 'object') {
      modOptions = {
        passive: false,
        ...options,
      };
    }
  }
  return originalRemoveEventListener(type, listener, modOptions);
};
