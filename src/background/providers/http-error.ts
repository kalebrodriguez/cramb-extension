/**
 * Build a detailed error from a failed provider response. Includes the HTTP
 * status and a snippet of the response body so failures are diagnosable instead
 * of collapsing to a bare "PROVIDER_ERROR". The body comes from the provider's
 * own error JSON and never contains the user's API key (which is only ever sent
 * in request headers/query, never echoed back).
 */
export async function providerError(response: Response, code = 'PROVIDER_ERROR'): Promise<Error> {
  let body = '';
  try {
    body = (await response.text()).slice(0, 300).replace(/\s+/g, ' ').trim();
  } catch {
    // ignore body read failures — status alone is still useful
  }
  return new Error(`${code} (HTTP ${response.status})${body ? `: ${body}` : ''}`);
}
