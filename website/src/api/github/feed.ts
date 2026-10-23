import type { z } from "zod";
import type { ApiError } from "#/api/api-error.ts";
import type { GitHubResponse } from "#/server/github.ts";

export type Feed<T> = { ok: true; data: T } | { ok: false; error: ApiError };

export function toFeed<T>(response: GitHubResponse, schema: z.ZodType<T>): Feed<T> {
    if (!response.ok) return response;
    const parsed = schema.safeParse(response.body);
    return parsed.success
        ? { ok: true, data: parsed.data }
        : { ok: false, error: { code: "invalid-response" } };
}
