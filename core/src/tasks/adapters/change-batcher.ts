export interface ChangeBatcher {
    schedule(path: string): void;
    flush: () => Promise<void>;
    cancel(): void;
}

export function createChangeBatcher(
    processChanges: (paths: string[]) => Promise<void>,
    debounceMs: number,
): ChangeBatcher {
    const pendingPaths = new Set<string>();
    let timer: ReturnType<typeof setTimeout>;
    let timerPending = false;
    let running = false;
    let currentFlush = Promise.resolve();

    const cancelTimer = () => {
        if (!timerPending) return;
        clearTimeout(timer);
        timerPending = false;
    };

    const armTimer = () => {
        cancelTimer();
        timerPending = true;
        timer = setTimeout(() => {
            timerPending = false;
            void flush();
        }, debounceMs);
    };

    const flush = (): Promise<void> => {
        cancelTimer();
        if (running) return currentFlush;

        running = true;
        currentFlush = (async () => {
            try {
                while (pendingPaths.size > 0) {
                    const paths = [...pendingPaths];
                    pendingPaths.clear();
                    await processChanges(paths);
                }
            } finally {
                running = false;
                if (pendingPaths.size > 0) armTimer();
            }
        })();
        return currentFlush;
    };

    return {
        schedule(path) {
            pendingPaths.add(path);
            if (!running) armTimer();
        },
        flush,
        cancel() {
            cancelTimer();
            pendingPaths.clear();
        },
    };
}
