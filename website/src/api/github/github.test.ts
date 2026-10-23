import { QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type * as GitHubServer from "#/server/github.ts";
import radarReleases from "./fixtures/radar-releases.json";
import type * as Commits from "./get-commits.ts";
import type * as Releases from "./get-releases.ts";

const headers = vi.hoisted(() => new Map<string, string>());

vi.mock("@tanstack/react-start/server", () => ({
    getResponseHeader: (name: string) => headers.get(name),
    setResponseHeader: (name: string, value: string) => headers.set(name, value),
}));

// Outside the Start runtime, a server function becomes a direct call of its validator and handler.
vi.mock("@tanstack/react-start", () => ({
    createServerFn: () => ({
        validator: (schema: { parse: (input: unknown) => unknown }) => ({
            handler:
                (handler: (ctx: { data: unknown }) => unknown) =>
                ({ data }: { data: unknown }) =>
                    handler({ data: schema.parse(data) }),
        }),
    }),
}));

const fetchMock = vi.fn<typeof fetch>();

function respondWith(body: unknown, init?: ResponseInit) {
    fetchMock.mockResolvedValueOnce(Response.json(body, init));
}

let queryClient: QueryClient;
let github: typeof GitHubServer;
let getCommits: typeof Commits.getCommits;
let getReleases: typeof Releases.getReleases;

// A fresh module per test, so the server's memo of GitHub responses starts empty.
beforeEach(async () => {
    vi.resetModules();
    github = await import("#/server/github.ts");
    ({ getCommits } = await import("./get-commits.ts"));
    ({ getReleases } = await import("./get-releases.ts"));
    vi.stubGlobal("fetch", fetchMock);
    queryClient = new QueryClient();
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    fetchMock.mockReset();
    headers.clear();
});

describe("GitHub data layer", () => {
    it("parses releases and caches the response at the CDN for a minute", async () => {
        respondWith(radarReleases);

        const feed = await queryClient.query(getReleases("black-atom-industries/radar.nvim"));

        expect(feed.ok && feed.data.map((release) => release.tag_name)).toEqual(["v0.8.0"]);
        expect(fetchMock.mock.calls[0]?.[0]).toBe(
            "https://api.github.com/repos/black-atom-industries/radar.nvim/releases?per_page=10",
        );
        expect(headers.get("Cache-Control")).toBe("s-maxage=60, stale-while-revalidate=600");
    });

    it("filters commits by path", async () => {
        respondWith([]);

        await queryClient.query(getCommits("black-atom-industries/black-atom", "livery/"));

        expect(fetchMock.mock.calls[0]?.[0]).toBe(
            "https://api.github.com/repos/black-atom-industries/black-atom/commits?per_page=10&path=livery%2F",
        );
    });

    it("turns a response that fails the schema into an invalid-response error", async () => {
        respondWith([{ tag_name: "v1.0.0" }]);

        const feed = await queryClient.query(getReleases("black-atom-industries/radar.nvim"));

        expect(feed).toEqual({ ok: false, error: { code: "invalid-response" } });
    });

    it("turns GitHub's rate limit into a value the page can render", async () => {
        respondWith(
            { message: "API rate limit exceeded" },
            { status: 403, headers: { "x-ratelimit-remaining": "0" } },
        );

        const feed = await queryClient.query(getReleases("black-atom-industries/iter.nvim"));

        expect(feed).toEqual({ ok: false, error: { code: "rate-limited" } });
        expect(headers.get("Cache-Control")).toBe("s-maxage=60");
    });

    it("keeps the short cache when a success follows a failure on the same page", async () => {
        respondWith({ message: "Server Error" }, { status: 500 });
        respondWith(radarReleases);

        const failed = await queryClient.query(getCommits("black-atom-industries/radar.nvim"));
        await queryClient.query(getReleases("black-atom-industries/radar.nvim"));

        expect(failed).toEqual({ ok: false, error: { code: "unavailable" } });
        expect(headers.get("Cache-Control")).toBe("s-maxage=60");
    });

    it("turns a missing repository into not-found", async () => {
        respondWith({ message: "Not Found" }, { status: 404 });

        const feed = await queryClient.query(getReleases("black-atom-industries/radar.nvim"));

        expect(feed).toEqual({ ok: false, error: { code: "not-found" } });
    });

    it("refuses repositories and paths no product reads", async () => {
        await expect(
            queryClient.query(getCommits("black-atom-industries/black-atom", "website/")),
        ).rejects.toThrow();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("turns a network failure into an unavailable error", async () => {
        fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));

        const feed = await queryClient.query(getCommits("black-atom-industries/iter.nvim"));

        expect(feed).toEqual({ ok: false, error: { code: "unavailable" } });
    });

    it("gives up on GitHub after five seconds", async () => {
        const controller = new AbortController();
        const timeout = vi.spyOn(AbortSignal, "timeout").mockReturnValue(controller.signal);
        fetchMock.mockImplementationOnce(
            (_, init) =>
                new Promise((_resolve, reject) =>
                    init?.signal?.addEventListener("abort", () => reject(init.signal?.reason)),
                ),
        );

        const pending = queryClient.query(getCommits("black-atom-industries/iter.nvim"));
        controller.abort(new DOMException("The operation timed out.", "TimeoutError"));

        expect(timeout).toHaveBeenCalledWith(5000);
        expect(await pending).toEqual({ ok: false, error: { code: "unavailable" } });
    });

    it("refuses input with keys a changelog never sends", () => {
        const data = { repo: "black-atom-industries/iter.nvim", cacheBuster: "1" };

        expect(() => github.getCommits({ data })).toThrow();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("answers a repeated request from memory for a minute, but never a failure", async () => {
        respondWith({ message: "Server Error" }, { status: 500 });
        respondWith(radarReleases);
        const data = { repo: "black-atom-industries/radar.nvim" };

        const failed = await github.getReleases({ data });
        const first = await github.getReleases({ data });
        const second = await github.getReleases({ data });

        expect(failed.ok).toBe(false);
        expect(second).toEqual(first);
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });
});
