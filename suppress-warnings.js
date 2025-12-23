/**
 * Global Node.js deprecation warning suppression
 * This file should be loaded before any other modules
 */

if (typeof process !== 'undefined') {
  const originalEmitWarning = process.emitWarning;
  
  process.emitWarning = function(warning, type, code, ...args) {
    // Suppress specific deprecation warnings that come from dependencies
    if (
      code === 'DEP0169' || // url.parse() deprecation
      (typeof warning === 'string' && warning.includes('url.parse')) ||
      (typeof warning === 'string' && warning.includes('behavior is not standardized'))
    ) {
      return; // Suppress this warning
    }
    
    // Allow all other warnings through
    return originalEmitWarning.call(this, warning, type, code, ...args);
  };
}