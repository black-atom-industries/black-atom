import { queryOptions } from "@tanstack/react-query";
import * as github from "#/server/github.ts";
import { toFeed } from "./feed.ts";
import { releasesSchema } from "./releases.schema.ts";

export function getReleases(repo: string) {
    return queryOptions({
        queryKey: ["github", "releases", repo],
        queryFn: async () => toFeed(await github.getReleases({ data: { repo } }), releasesSchema),
        staleTime: 60_000,
        retry: false,
    });
}
