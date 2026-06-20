export const ErrorCode = {
  NO_MODEL_CONFIG: 'NO_MODEL_CONFIG',
  INVALID_KEY: 'INVALID_KEY',
  RATE_LIMITED: 'RATE_LIMITED',
  PROVIDER_ERROR: 'PROVIDER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  EXTRACTION_EMPTY: 'EXTRACTION_EMPTY',
  BAD_LLM_OUTPUT: 'BAD_LLM_OUTPUT',
  OLLAMA_UNREACHABLE: 'OLLAMA_UNREACHABLE',
  QUOTA_PRESSURE: 'QUOTA_PRESSURE',
  UNKNOWN: 'UNKNOWN',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface AppError {
  code: ErrorCode;
  message: string;
}

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: AppError };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function err<T = never>(code: ErrorCode, message: string): Result<T> {
  return { ok: false, error: { code, message } };
}

export const friendlyMessages: Record<ErrorCode, string> = {
  NO_MODEL_CONFIG: 'Set up a model to generate cards.',
  INVALID_KEY: 'Your API key may be invalid or out of quota.',
  RATE_LIMITED: 'Rate limited — retrying shortly.',
  PROVIDER_ERROR: 'The model provider returned an error.',
  NETWORK_ERROR: 'Network error — check your connection.',
  EXTRACTION_EMPTY: 'No content found on this page. Try selecting text instead.',
  BAD_LLM_OUTPUT: 'The model returned an unexpected response. Try again.',
  OLLAMA_UNREACHABLE: "Can't reach Ollama at localhost:11434 — is it running?",
  QUOTA_PRESSURE: 'Storage is getting full. Consider exporting and pruning old sources.',
  UNKNOWN: 'Something went wrong. Please try again.',
};
