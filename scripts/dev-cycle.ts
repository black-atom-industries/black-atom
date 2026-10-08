import { createChangeBatcher } from "../core/src/tasks/adapters/change-batcher.ts";

export function isCliInput(path: string): boolean {
    if (/(^|\/)(target|node_modules|\.git)\/|(~|\.sw[pox]|\.tmp)$/.test(path)) return false;
    return path === "Cargo.toml" || path === "Cargo.lock" ||
        /^livery\/(cli|core)\//.test(path) ||
        /^adapters\/(delta|ghostty|herdr|lazygit|niri|obsidian|tmux|tuicr|waybar|wezterm|zed)\/themes(\/|$)/
            .test(path) ||
        /^adapters\/nvim\/(colors|lua)(\/|$)/.test(path) ||
        /^adapters\/obsidian\/(theme\.css|manifest\.json)$/.test(path);
}

interface DevCycleOptions {
    generate(paths: string[]): Promise<void>;
    build(): Promise<void>;
    reapply(): Promise<void>;
    state(value: string): void;
    isGenerationInput(path: string): boolean;
    debounceMs?: number;
}

export function createDevCycle(options: DevCycleOptions) {
    let revision = 0;
    let stopped = false;
    let generating = false;
    const generationPaths = new Set<string>();
    const batcher = createChangeBatcher(async () => {
        const current = revision;
        try {
            if (generationPaths.size > 0) {
                options.state("generating");
                generating = true;
                const paths = [...generationPaths];
                try {
                    await options.generate(paths);
                } finally {
                    generating = false;
                }
                if (current !== revision || stopped) return;
                generationPaths.clear();
            }
            if (stopped) return;
            options.state("building");
            await options.build();
            if (current !== revision || stopped) return;
            await options.reapply();
            if (current === revision && !stopped) options.state("ready");
        } catch (error) {
            if (current === revision && !stopped) {
                options.state(`failed: ${error instanceof Error ? error.message : error}`);
            }
        }
    }, options.debounceMs ?? 300);

    return {
        schedule(path: string) {
            if (stopped) return;
            const generationInput = options.isGenerationInput(path);
            if (generating && /(^|\/)adapters\//.test(path) && !generationInput) return;
            if (generationInput) generationPaths.add(path);
            revision++;
            options.state("pending");
            batcher.schedule(path);
        },
        flush: batcher.flush,
        stop() {
            stopped = true;
            batcher.cancel();
            options.state("stopped");
        },
    };
}
