import { queryOptions } from "@tanstack/react-query";
import * as github from "#/server/github.ts";
import { commitsSchema } from "./commits.schema.ts";
import { toFeed } from "./feed.ts";

/** Commits of a repository, filtered to one path when given. */
export function getCommits(repo: string, path?: string) {
    return queryOptions({
        queryKey: ["github", "commits", repo, path ?? ""],
        queryFn: async () =>
            toFeed(await github.getCommits({ data: { repo, path } }), commitsSchema),
        staleTime: 60_000,
        retry: false,
    });
}
