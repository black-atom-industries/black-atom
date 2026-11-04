type Task = () => Promise<void>;

/**
 * Runs one task at a time, and none while `isBusy` says something else is
 * running. Only the newest waiting task survives. `drain` starts it once the
 * outside work is done.
 */
export function createLatestWinsQueue(isBusy: () => boolean) {
    let running = false;
    let waiting: Task | null = null;

    async function run(task: Task) {
        running = true;
        try {
            await task();
        } catch (error) {
            console.error(error);
        } finally {
            running = false;
            drain();
        }
    }

    function drain() {
        if (running || !waiting || isBusy()) return;
        const task = waiting;
        waiting = null;
        void run(task);
    }

    return {
        submit(task: Task) {
            waiting = task;
            drain();
        },
        drain,
    };
}
