/*
 * Polyfills required by Node-style libs.
 * This file MUST be imported before any other module.
 */
import { Buffer } from 'buffer';

globalThis.Buffer = Buffer;
window.Buffer = Buffer;

// Some libs also expect process
if (typeof globalThis.process === 'undefined') {
  globalThis.process = { env: {}, version: '', browser: true };
}
