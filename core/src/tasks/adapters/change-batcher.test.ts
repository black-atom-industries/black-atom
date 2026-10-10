import { assert, test } from "vitest";
import { createChangeBatcher } from "./change-batcher.ts";

test("change batcher coalesces pending paths", async () => {
    const batches: string[][] = [];
    const batcher = createChangeBatcher((paths) => {
        batches.push(paths);
        return Promise.resolve();
    }, 60_000);

    batcher.schedule("core/a.ts");
    batcher.schedule("core/b.ts");
    batcher.schedule("core/a.ts");
    await batcher.flush();

    assert.deepEqual(batches, [["core/a.ts", "core/b.ts"]]);
});

test("change batcher serializes changes received while processing", async () => {
    const batches: string[][] = [];
    const firstBatchStarted = Promise.withResolvers<void>();
    const releaseFirstBatch = Promise.withResolvers<void>();
    let activeRuns = 0;
    let maxActiveRuns = 0;

    const batcher = createChangeBatcher(async (paths) => {
        batches.push(paths);
        activeRuns += 1;
        maxActiveRuns = Math.max(maxActiveRuns, activeRuns);
        if (batches.length === 1) {
            firstBatchStarted.resolve();
            await releaseFirstBatch.promise;
        }
        activeRuns -= 1;
    }, 60_000);

    batcher.schedule("core/a.ts");
    const processing = batcher.flush();
    await firstBatchStarted.promise;

    batcher.schedule("core/b.ts");
    batcher.schedule("core/c.ts");
    releaseFirstBatch.resolve();
    await processing;

    assert.deepEqual(batches, [["core/a.ts"], ["core/b.ts", "core/c.ts"]]);
    assert.deepEqual(maxActiveRuns, 1);
});
