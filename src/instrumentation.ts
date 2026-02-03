/**
 * Next.js Instrumentation
 * Runs once when the server starts
 */

export async function register() {
  // Only run on server
  if (typeof window === "undefined") {
    // Polyfill indexedDB for server-side rendering
    // WalletConnect tries to access indexedDB during SSR
    if (typeof globalThis.indexedDB === "undefined") {
      (globalThis as any).indexedDB = {
        open: () => ({} as any),
        deleteDatabase: () => ({} as any),
        databases: () => Promise.resolve([]),
        cmp: () => 0,
      };
    }
  }
}
