const apiErrorCodes = ["rate-limited", "not-found", "unavailable", "invalid-response"] as const;

type ApiErrorCode = (typeof apiErrorCodes)[number];

/** A failed request. Returned as a value, so a GitHub outage renders a fallback instead of an error boundary. */
export type ApiError = { code: ApiErrorCode };
