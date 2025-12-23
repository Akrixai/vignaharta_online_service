/**
 * Axios wrapper that suppresses url.parse() deprecation warnings
 * This is a temporary fix until axios updates to use WHATWG URL API
 */

// Global suppression - must be done before any modules load
const originalEmitWarning = process.emitWarning;

process.emitWarning = function(warning, type, code, ...args) {
  // Suppress url.parse() deprecation warnings
  if (
    code === 'DEP0169' || 
    (typeof warning === 'string' && warning.includes('url.parse')) ||
    (typeof warning === 'string' && warning.includes('behavior is not standardized'))
  ) {
    return; // Suppress this warning
  }
  
  // Allow all other warnings through
  return originalEmitWarning.call(this, warning, type, code, ...args);
};

import axios from 'axios';

export default axios;
export * from 'axios';