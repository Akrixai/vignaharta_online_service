/**
 * Modern URL utilities using WHATWG URL API
 * Replaces legacy url.parse() with secure alternatives
 */

/**
 * Parse URL using modern WHATWG URL API
 * @param urlString - URL string to parse
 * @param base - Optional base URL
 * @returns Parsed URL object or null if invalid
 */
export function parseUrl(urlString: string, base?: string): URL | null {
  try {
    return new URL(urlString, base);
  } catch (error) {
    console.error('Invalid URL:', urlString, error);
    return null;
  }
}

/**
 * Extract query parameters from URL
 * @param urlString - URL string
 * @returns Object with query parameters
 */
export function getQueryParams(urlString: string): Record<string, string> {
  try {
    const url = new URL(urlString);
    const params: Record<string, string> = {};
    
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    return params;
  } catch (error) {
    console.error('Error parsing query params:', error);
    return {};
  }
}

/**
 * Build URL with query parameters
 * @param baseUrl - Base URL
 * @param params - Query parameters
 * @returns Complete URL string
 */
export function buildUrl(baseUrl: string, params: Record<string, string | number>): string {
  try {
    const url = new URL(baseUrl);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
    
    return url.toString();
  } catch (error) {
    console.error('Error building URL:', error);
    return baseUrl;
  }
}

/**
 * Validate URL format
 * @param urlString - URL to validate
 * @returns true if valid URL
 */
export function isValidUrl(urlString: string): boolean {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract hostname from URL
 * @param urlString - URL string
 * @returns hostname or null if invalid
 */
export function getHostname(urlString: string): string | null {
  try {
    const url = new URL(urlString);
    return url.hostname;
  } catch {
    return null;
  }
}

/**
 * Extract pathname from URL
 * @param urlString - URL string
 * @returns pathname or null if invalid
 */
export function getPathname(urlString: string): string | null {
  try {
    const url = new URL(urlString);
    return url.pathname;
  } catch {
    return null;
  }
}