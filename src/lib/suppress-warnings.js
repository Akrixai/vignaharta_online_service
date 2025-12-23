/**
 * Suppress Node.js deprecation warnings
 * This handles the url.parse() deprecation warning from dependencies
 */

// Only suppress warnings in production to avoid masking development issues
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
  const originalEmitWarning = process.emitWarning;
  
  process.emitWarning = function(warning, type, code, ...args) {
    // Suppress specific deprecation warnings that come from dependencies
    if (
      code === 'DEP0169' || // url.parse() deprecation
      (typeof warning === 'string' && warning.includes('url.parse'))
    ) {
      return; // Suppress this warning
    }
    
    // Allow all other warnings through
    return originalEmitWarning.call(this, warning, type, code, ...args);
  };
}

export {};