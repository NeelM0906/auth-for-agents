export type ErrorCode =
  | 'missing_headers'
  | 'bad_auth_scheme'
  | 'policy_not_found'
  | 'operation_not_allowed'
  | 'token_invalid'
  | 'dpop_invalid'
  | 'binding_mismatch'
  | 'insufficient_scope'
  | 'ratelimited'
  | 'revoked'
  | 'internal_error';

export function errorResponse(code: ErrorCode, detail?: string, status?: number) {
  const http = status ?? defaultStatus(code);
  return { status: http, body: { error: code, detail } };
}

function defaultStatus(code: ErrorCode): number {
  switch (code) {
    case 'missing_headers':
    case 'bad_auth_scheme':
      return 401;
    case 'policy_not_found':
    case 'operation_not_allowed':
    case 'insufficient_scope':
    case 'ratelimited':
    case 'revoked':
      return 403;
    case 'token_invalid':
    case 'dpop_invalid':
      return 401;
    default:
      return 500;
  }
}


