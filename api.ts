/**
 * API and URL resolution helper for VibeChat deployment
 */

export function getBackendUrl(): string {
  // Check if a remote backend URL is provided via Vite environment variables
  const envUrl = (import.meta as any).env?.VITE_BACKEND_URL;
  if (envUrl) {
    // Strip trailing slash if present
    return envUrl.replace(/\/$/, '');
  }
  // Fall back to current origin if none specified (development sandbox / unified host)
  return window.location.origin;
}

export function getWebSocketUrl(): string {
  const backendUrl = getBackendUrl();
  // Parse standard HTTP/HTTPS URLs and map to WS/WSS protocols
  const wsProtocol = backendUrl.startsWith('https:') ? 'wss:' : 'ws:';
  
  // Strip the protocol prefix from backendUrl
  const hostPath = backendUrl.replace(/^https?:\/\//, '');
  
  return `${wsProtocol}//${hostPath}`;
}
