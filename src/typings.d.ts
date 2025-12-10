// Minimal module declarations for Prism.js to satisfy TypeScript compiler
// This file prevents TS7016: "Could not find a declaration file for module 'prismjs'"
// If you prefer full types, run: npm i --save-dev @types/prismjs

declare module 'prismjs';
declare module 'prismjs/components/*';
declare module 'prismjs/plugins/*';
