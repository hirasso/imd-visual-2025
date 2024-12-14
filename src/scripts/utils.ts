import type { AlpineComponent, DirectiveCallback } from "alpinejs";

/**
 * Check if currently on a touch device
 */
export const isTouch = () => {
  return !window.matchMedia("(hover: hover)").matches;
};

/**
 * Checks if the current browser is set to prefers-reduced-motion: reduce
 */
export const prefersReducedMotion = () => {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * Define an Alpine component (wraps the function with Alpine's internals)
 */
export const defineComponent = <P, T>(fn: (params: P) => AlpineComponent<T>) => fn; // prettier-ignore

/**
 * Define an Alpine directive (wraps the function with Alpine's internals)
 */
export const defineDirective = (function_: DirectiveCallback) => function_;

/**
 * Shortcut for querySelector
 */
export const $ = <T extends HTMLElement = HTMLElement>(
  selector: string,
  container: Document | HTMLElement = document
): T | null => container.querySelector(selector) as T;

/**
 * Shortcut for querySelectorAll
 */
export const $$ = <T extends HTMLElement = HTMLElement>(
  selector: string,
  container: Document | HTMLElement = document
) => [...container.querySelectorAll(selector)] as T[];

/**
 * Create an HTML element from a string
 */
export const createElement = <T extends HTMLElement = HTMLElement>(
  html: string
) => {
  const template = document.createElement("template");
  template.innerHTML = html;
  return template.content.children[0].cloneNode(true) as T;
};

/**
 * Sleep for a given amount of milliseconds
 */
export const wait = (ms: number) => {
  return new Promise((res) => setTimeout(res, ms));
};

/**
 * Extract an element from a HTML string
 */
export function extractElement(html: string, selector: string) {
  if (!html || !html.trim()) {
    return null;
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(html as string, "text/html");
  return doc.querySelector<HTMLElement>(selector);
}