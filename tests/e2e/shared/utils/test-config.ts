/**
 * Test configuration helper to generate URLs from environment variables
 * instead of using hardcoded localhost URLs
 */

export class TestConfig {
  /**
   * Get the frontend base URL from environment variables
   * Falls back to localhost:3000 if not configured
   */
  static getFrontendBaseUrl(): string {
    return process.env.FRONTEND_URL || 
      `http://${process.env.FRONTEND_HOST || 'localhost'}:${process.env.FRONTEND_PORT || 3000}`;
  }

  /**
   * Get the backend API URL from environment variables
   * Falls back to localhost:8080 if not configured
   */
  static getBackendBaseUrl(): string {
    return process.env.BACKEND_URL || 
      `http://${process.env.BACKEND_HOST || 'localhost'}:${process.env.BACKEND_PORT || 8080}`;
  }

  /**
   * Build a complete frontend URL with the given path
   */
  static buildFrontendUrl(path: string): string {
    const baseUrl = this.getFrontendBaseUrl();
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  }

  /**
   * Build a complete backend API URL with the given path
   */
  static buildBackendUrl(path: string): string {
    const baseUrl = this.getBackendBaseUrl();
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  }
}