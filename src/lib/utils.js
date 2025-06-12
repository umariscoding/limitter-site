/**
 * Normalizes a domain by removing protocol, www, and path
 * @param {string} url - The URL to normalize
 * @returns {string} - The normalized domain
 */
export const normalizeDomain = (url) => {
  try {
    // Handle empty or invalid URLs
    if (!url) return '';

    // Remove protocol (http://, https://, etc.)
    let domain = url.replace(/^(https?:\/\/)?(www\.)?/, '');

    // Remove path and query parameters
    domain = domain.split('/')[0];

    // Remove port number if present
    domain = domain.split(':')[0];

    // Convert to lowercase
    domain = domain.toLowerCase();

    // Remove trailing dots
    domain = domain.replace(/\.$/, '');

    // Handle IP addresses
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain)) {
      return domain;
    }

    // Handle localhost
    if (domain === 'localhost') {
      return domain;
    }

    // Validate domain format
    if (!/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/.test(domain)) {
      throw new Error('Invalid domain format');
    }

    return domain;
  } catch (error) {
    console.error('Error normalizing domain:', error);
    // Return original URL if normalization fails
    return url.toLowerCase();
  }
};

/**
 * Encodes a domain for use as a Firebase Realtime Database path key
 * Replaces invalid characters with safe alternatives
 * @param {string} domain - The domain to encode
 * @returns {string} - The encoded domain safe for RTDB paths
 */
export const encodeDomainForPath = (domain) => {
  if (!domain) return '';
  
  // Replace dots with underscores
  return domain.replace(/\./g, '_');
};

/**
 * Decodes a domain from its Firebase Realtime Database path key format
 * @param {string} encodedDomain - The encoded domain to decode
 * @returns {string} - The original domain
 */
export const decodeDomainFromPath = (encodedDomain) => {
  if (!encodedDomain) return '';
  
  // Replace underscores with dots
  return encodedDomain.replace(/_/g, '.');
}; 