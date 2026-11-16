import { z } from "zod";

export const commitsSchema = z.array(
    z.object({
        sha: z.string(),
        html_url: z.string(),
        commit: z.object({
            message: z.string(),
            author: z.object({ date: z.string() }).nullable(),
        }),
    }),
);

export type GitHubCommit = z.infer<typeof commitsSchema>[number];
