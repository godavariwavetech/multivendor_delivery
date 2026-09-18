/**
 * The backend answers with `{ status, message, ... }` where `status` is an
 * application code, not the HTTP code:
 *   200 ok · 202 business rejection · 401 auth · 500 server error
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }

  get isAuthFailure() {
    return this.status === 401;
  }

  /** 202 means the request was understood and refused — show the message as-is. */
  get isBusinessRejection() {
    return this.status === 202;
  }
}

export class NetworkError extends Error {
  constructor(message = 'Could not reach the server') {
    super(message);
    this.name = 'NetworkError';
  }
}
