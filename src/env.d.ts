/// <reference types="chrome" />

// Vite asset-URL import for the sql.js wasm (bundled + served from the extension).
declare module '*.wasm?url' {
  const url: string;
  export default url;
}
