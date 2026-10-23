import { createServerFn } from "@tanstack/react-start";
import { getResponseHeader, setResponseHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import type { ApiError } from "#/api/api-error.ts";
import { products } from "#/content/products/products.ts";

const cacheControl = "s-maxage=60, stale-while-revalidate=600";
const failureCacheControl = "s-maxage=60";
const memoMs = 60_000;
const timeoutMs = 5_000;

export type GitHubResponse = { ok: true; body: unknown } | { ok: false; error: ApiError };

/** Only what a product's changelog reads, so a token never serves arbitrary repositories. */
const changelogInput = z
    .object({ repo: z.string(), path: z.string().optional() })
    .strict()
    .refine(({ repo, path }) =>
        products.some(
            (product) =>
                product.changelog.repo === repo &&
                (path === undefined || product.changelog.paths.includes(path)),
        ),
    );

function toError(response: Response): ApiError {
    const isRateLimited =
        response.status === 429 ||
        (response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0");
    if (isRateLimited) return { code: "rate-limited" };
    if (response.status === 404) return { code: "not-found" };
    return { code: "unavailable" };
}

/** Successful responses per path, so cache-busting URLs cannot spend the GitHub quota. */
const memo = new Map<string, { at: number; result: GitHubResponse }>();

/** The one place the site talks to GitHub. Uses `GITHUB_TOKEN` when it is set. */
async function requestGitHub(path: string): Promise<GitHubResponse> {
    const memoized = memo.get(path);
    if (memoized && Date.now() - memoized.at < memoMs) return memoized.result;
    const result = await fetchGitHub(path);
    if (result.ok) memo.set(path, { at: Date.now(), result });
    return result;
}

async function fetchGitHub(path: string): Promise<GitHubResponse> {
    const token = process.env.GITHUB_TOKEN;
    const response = await fetch(
        `${process.env.GITHUB_API_URL ?? "https://api.github.com"}${path}`,
        {
            headers: {
                Accept: "application/vnd.github+json",
                "User-Agent": "black-atom.industries",
                "X-GitHub-Api-Version": "2022-11-28",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            signal: AbortSignal.timeout(timeoutMs),
        },
    ).catch(() => undefined);

    if (response === undefined) return { ok: false, error: { code: "unavailable" } };
    if (!response.ok) return { ok: false, error: toError(response) };
    const body: unknown = await response.json().catch(() => undefined);
    if (body === undefined) return { ok: false, error: { code: "invalid-response" } };
    return { ok: true, body };
}

/**
 * A response that holds any failed feed is cached briefly without stale-while-revalidate, so a
 * fallback never outlives GitHub's recovery by more than a minute. Once a failure set it, a later
 * success leaves it in place, whatever order the server functions of one page finish in.
 */
async function respond(path: string): Promise<GitHubResponse> {
    const result = await requestGitHub(path);
    const hasFailed = !result.ok || getResponseHeader("Cache-Control") === failureCacheControl;
    setResponseHeader("Cache-Control", hasFailed ? failureCacheControl : cacheControl);
    return result;
}

// GitHub's JSON body is serializable, but TypeScript only knows it as `unknown`.
export const getReleases = createServerFn({ method: "GET", strict: { output: false } })
    .validator(changelogInput)
    .handler(({ data }) => respond(`/repos/${data.repo}/releases?per_page=10`));

export const getCommits = createServerFn({ method: "GET", strict: { output: false } })
    .validator(changelogInput)
    .handler(({ data }) =>
        respond(
            `/repos/${data.repo}/commits?per_page=10${data.path === undefined ? "" : `&path=${encodeURIComponent(data.path)}`}`,
        ),
    );
