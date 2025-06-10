import { MouseEvent, FormEvent } from 'react';

/**
 * Prevents event from bubbling up and triggering default behavior
 * Useful for dropdown menus, modals, and overlay interactions
 */
export const stopEvent = (e: MouseEvent | FormEvent) => {
  e.preventDefault();
  e.stopPropagation();
};

/**
 * Higher-order function that wraps a callback with event stopping
 * Usage: onClick={withStopEvent(() => doSomething())}
 */
export const withStopEvent = <T extends unknown[]>(
  callback: (...args: T) => void
) => {
  return (e: MouseEvent | FormEvent, ...args: T) => {
    stopEvent(e);
    callback(...args);
  };
};

/**
 * Just prevents propagation (useful when you want default behavior but no bubbling)
 */
export const stopPropagation = (e: MouseEvent | FormEvent) => {
  e.stopPropagation();
};

/**
 * Just prevents default behavior (useful for forms, links, etc.)
 */
export const preventDefault = (e: MouseEvent | FormEvent) => {
  e.preventDefault();
};

