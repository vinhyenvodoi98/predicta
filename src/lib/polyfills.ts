/**
 * Polyfills for server-side rendering
 * Prevents errors when browser-only APIs are accessed during SSR
 */

// Polyfill indexedDB for server-side rendering
if (typeof global !== "undefined" && typeof global.indexedDB === "undefined") {
  // @ts-ignore - Adding global polyfill
  global.indexedDB = {} as IDBFactory;
}

export {};
