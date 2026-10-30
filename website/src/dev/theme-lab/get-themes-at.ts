import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const snapshotTask = path.resolve(
    import.meta.dirname,
    "../../../../core/src/tasks/theme-snapshot.ts",
);

/** The theme catalog at a git revision, as the JSON the snapshot task prints. */
const getThemesAtRevision = createServerFn({ method: "GET" })
    .validator(z.object({ revision: z.string().regex(/^[\w./~^-]+$/) }))
    .handler(async ({ data }) => {
        const { stdout } = await promisify(execFile)(
            process.execPath,
            [snapshotTask, data.revision],
            {
                maxBuffer: 16 * 1024 * 1024,
            },
        );
        return stdout;
    });

export function themesAt(revision: string) {
    return queryOptions({
        queryKey: ["theme-lab", "themes-at", revision],
        queryFn: async (): Promise<unknown> =>
            JSON.parse(await getThemesAtRevision({ data: { revision } })),
        staleTime: 5_000,
    });
}
