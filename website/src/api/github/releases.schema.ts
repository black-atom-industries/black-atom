import { z } from "zod";

export const releasesSchema = z.array(
    z.object({
        tag_name: z.string(),
        html_url: z.string(),
        draft: z.boolean(),
        prerelease: z.boolean(),
        published_at: z.string().nullable(),
        body: z.string().nullable(),
    }),
);

export type GitHubRelease = z.infer<typeof releasesSchema>[number];
