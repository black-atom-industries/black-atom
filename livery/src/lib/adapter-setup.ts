import type {
    AppName,
    AppPathVerification,
    LinkThemesResult,
    ThemeProvisioning,
} from "../bindings.ts";

export type SetUpStep = "enable" | "link" | "verify";

export type SetUpStepStatus = "pending" | "running" | "ok" | "error" | "skipped";

export type SetUpStepOutcome = {
    step: SetUpStep;
    status: SetUpStepStatus;
    message: string | null;
};

export type SetUpOutcome = {
    steps: SetUpStepOutcome[];
    /** Precondition failure — the chain never started. */
    blocked: string | null;
    link: LinkThemesResult | null;
    verify: AppPathVerification | null;
};

/** Injected commands, so the chain is testable without a Tauri backend. */
export type SetUpDeps = {
    enable: (app: AppName) => Promise<void>;
    link: (app: AppName) => Promise<LinkThemesResult>;
    verify: (app: AppName) => Promise<AppPathVerification>;
};

/** The class decides the chain; verify is always the terminal step. */
function stepsFor(provisioning: ThemeProvisioning): SetUpStep[] {
    switch (provisioning) {
        case "external":
        case "merged":
            return ["enable", "verify"];
        case "linked":
            return ["enable", "link", "verify"];
    }
}

/**
 * One-click adapter setup: enable → link → verify, trimmed to the
 * provisioning class. Linked adapters get the unpacked theme files symlinked
 * into the location they read; Merged adapters have the theme's content
 * written into their own config instead, so they only enable and verify;
 * External adapters bring their own theme files. A failed enable aborts;
 * verify always runs last so the row ends in a truthful state. Obsidian
 * requires at least one configured config_folder before the chain can start.
 */
export async function setUpAdapter(
    app: AppName,
    provisioning: ThemeProvisioning,
    configPath: string,
    deps: SetUpDeps,
    onUpdate?: (outcome: SetUpOutcome) => void,
): Promise<SetUpOutcome> {
    if (!configPath.trim()) {
        return {
            steps: [],
            blocked: app === "obsidian"
                ? "Add at least one Obsidian config folder first"
                : "Set CONFIG_PATH first — livery cannot guess it",
            link: null,
            verify: null,
        };
    }

    const outcome: SetUpOutcome = {
        steps: stepsFor(provisioning).map((step) => ({
            step,
            status: "pending",
            message: null,
        })),
        blocked: null,
        link: null,
        verify: null,
    };

    const mark = (step: SetUpStep, status: SetUpStepStatus, message: string | null = null) => {
        const entry = outcome.steps.find((s) => s.step === step);
        if (entry) {
            entry.status = status;
            entry.message = message;
        }
        onUpdate?.(structuredClone(outcome));
    };

    for (const { step } of outcome.steps) {
        mark(step, "running");
        try {
            switch (step) {
                case "enable": {
                    await deps.enable(app);
                    mark("enable", "ok");
                    break;
                }
                case "link": {
                    const result = await deps.link(app);
                    outcome.link = result;
                    if (result.status === "error") {
                        mark("link", "error", result.message ?? "linking failed");
                    } else {
                        mark("link", "ok", result.message);
                    }
                    break;
                }
                case "verify": {
                    const result = await deps.verify(app);
                    outcome.verify = result;
                    if (!result.exists) {
                        mark("verify", "error", "path not found");
                    } else if (result.pattern_matches === false) {
                        mark("verify", "error", "no pattern match");
                    } else {
                        mark("verify", "ok");
                    }
                    break;
                }
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            mark(step, "error", message);
            if (step === "enable") {
                // Nothing downstream makes sense on an un-enabled adapter.
                for (const entry of outcome.steps) {
                    if (entry.status === "pending") entry.status = "skipped";
                }
                onUpdate?.(structuredClone(outcome));
                return outcome;
            }
        }
    }

    return outcome;
}
