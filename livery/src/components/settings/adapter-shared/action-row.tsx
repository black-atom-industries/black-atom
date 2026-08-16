import type { SetUpOutcome } from "../../../lib/adapter-setup.ts";
import { Button } from "../../primitives/button/button.tsx";
import { StatusPip } from "../../primitives/status-pip/status-pip.tsx";
import {
    type LinkThemesRowResult,
    setUpRunning,
    type TestApplyResult,
    verifyFaultLabel,
    type VerifyPathResult,
} from "./results.ts";
import styles from "./adapter-shared.module.css";

type Props = {
    onSetUp: () => void;
    setUpResult?: SetUpOutcome;
    onVerifyPath: () => void;
    verifyPathResult?: VerifyPathResult;
    linkable: boolean;
    onLinkThemes: () => void;
    linkThemesResult?: LinkThemesRowResult;
    onTestApply: () => void;
    testApplyResult?: TestApplyResult;
};

/** One action per row: what it does, the actuator, and — once run — a
    result line naming what happened. */
export function ActionRow(
    {
        onSetUp,
        setUpResult,
        onVerifyPath,
        verifyPathResult,
        linkable,
        onLinkThemes,
        linkThemesResult,
        onTestApply,
        testApplyResult,
    }: Props,
) {
    const settingUp = setUpRunning(setUpResult);
    const verifyRunning = verifyPathResult?.status === "running";
    const linkRunning = linkThemesResult?.status === "running";
    // Disabled through the whole probe-then-revert window, not just the
    // initial apply — clicking again mid-revert would race the two calls.
    const testRunning = testApplyResult?.status === "running" ||
        testApplyResult?.status === "ok" ||
        testApplyResult?.status === "reverting";

    return (
        <div className={styles.actionRow}>
            <ActionEntry
                description="Enables the adapter and prepares its theme files."
                button={
                    <Button intent="primary" onClick={onSetUp} disabled={settingUp}>
                        {settingUp ? "SETTING UP…" : "SET UP"}
                    </Button>
                }
                result={<SetUpResult result={setUpResult} />}
            />
            <p className={styles.actionGroupLabel}>DIAGNOSTICS</p>
            <ActionEntry
                description="Checks the config file exists and the switch pattern still matches."
                button={
                    <Button intent="secondary" onClick={onVerifyPath} disabled={verifyRunning}>
                        {verifyRunning ? "VERIFYING…" : "VERIFY PATH"}
                    </Button>
                }
                result={<VerifyPathResultLine result={verifyPathResult} />}
            />
            {linkable && (
                <ActionEntry
                    description="Symlinks the unpacked theme files into the folder this app reads."
                    button={
                        <Button intent="secondary" onClick={onLinkThemes} disabled={linkRunning}>
                            {linkRunning ? "LINKING…" : "LINK THEMES"}
                        </Button>
                    }
                    result={<LinkThemesResultLine result={linkThemesResult} />}
                />
            )}
            <ActionEntry
                description="Briefly applies a different theme here to prove the switch works, then reverts."
                button={
                    <Button intent="secondary" onClick={onTestApply} disabled={testRunning}>
                        {testApplyResult?.status === "running" ? "TESTING…" : "TEST APPLY"}
                    </Button>
                }
                result={<TestApplyResultLine result={testApplyResult} />}
            />
        </div>
    );
}

type ActionEntryProps = {
    description: string;
    button: React.ReactNode;
    result: React.ReactNode;
};

function ActionEntry({ description, button, result }: ActionEntryProps) {
    return (
        <div className={styles.actionEntry}>
            <div className={styles.actionEntryRow}>
                <p className={styles.actionDescription}>{description}</p>
                <div className={styles.actionButtonSlot}>{button}</div>
            </div>
            {
                /* Fixed height, always rendered — a result line appearing or
                disappearing must never reflow the rows around it. */
            }
            <div className={styles.resultSlot}>{result}</div>
        </div>
    );
}

/**
 * SET UP verdict — narrates the chain steps that actually ran (trimmed to
 * the provisioning class), not a bare "OK". Link and verify outcomes stay
 * scoped to their own rows; a direct VERIFY PATH / LINK THEMES run is what
 * populates those, not this chain.
 */
function SetUpResult({ result }: { result?: SetUpOutcome }) {
    if (!result) return null;

    if (result.blocked) {
        return <ResultLine intent="error">{result.blocked}</ResultLine>;
    }

    const running = result.steps.find((s) => s.status === "running");
    if (running || setUpRunning(result)) {
        return (
            <ResultLine intent="running">
                {running ? `${running.step.toUpperCase()}…` : "SETTING UP…"}
            </ResultLine>
        );
    }

    const failed = result.steps.find((s) => s.status === "error");
    if (failed) {
        return (
            <ResultLine intent="error">
                Failed at {failed.step.toUpperCase()}
                {failed.message ? `: ${failed.message}` : ""}
            </ResultLine>
        );
    }

    const ran = result.steps.filter((s) => s.status === "ok").map((s) => s.step);
    if (ran.length === 0) return null;

    const linkedCount = result.link?.linked;
    const stepLabel = (step: (typeof ran)[number]) => {
        if (step === "link" && typeof linkedCount === "number") {
            return `LINKED ${linkedCount}`;
        }
        return step.toUpperCase();
    };

    return <ResultLine intent="ok">{ran.map(stepLabel).join(" · ")}</ResultLine>;
}

/** Link verdict: counts on success, reason on failure. */
function LinkThemesResultLine({ result }: { result?: LinkThemesRowResult }) {
    if (!result || result.status === "running") return null;

    if (result.status === "error") {
        return <ResultLine intent="error">{result.message}</ResultLine>;
    }

    return (
        <ResultLine intent="ok">
            {result.linked} linked{result.pruned > 0 ? ` · ${result.pruned} pruned` : ""}
            {result.message ? ` · ${result.message}` : ""}
        </ResultLine>
    );
}

/**
 * Verification verdict. A fault repeats the header qualifier; "unverifiable"
 * carries the reason so the row is never a dead end.
 */
function VerifyPathResultLine({ result }: { result?: VerifyPathResult }) {
    if (!result || result.status === "running") return null;

    if (result.status === "unverifiable") {
        return <ResultLine intent="warn">Could not verify: {result.message}</ResultLine>;
    }

    const fault = verifyFaultLabel(result);
    if (fault) return <ResultLine intent="warn">{fault}</ResultLine>;

    return (
        <ResultLine intent="ok">
            Path exists{result.patternMatches === true ? " · pattern matches" : ""}
        </ResultLine>
    );
}

function TestApplyResultLine({ result }: { result?: TestApplyResult }) {
    if (!result || result.status === "running") return null;

    if (result.status === "error") {
        return <ResultLine intent="error">{result.message}</ResultLine>;
    }

    if (result.status === "reverting") {
        return <ResultLine intent="running">Reverting to your current theme…</ResultLine>;
    }

    const duration = result.durationMs === null ? null : `in ${result.durationMs}ms`;
    return (
        <ResultLine intent="ok">
            Applied {result.testedThemeLabel}
            {duration ? ` ${duration}` : ""}, reverting shortly
        </ResultLine>
    );
}

type ResultLineProps = {
    intent: "ok" | "warn" | "error" | "running";
    children: React.ReactNode;
};

/** Pip + sentence-case narration — the color IS the indicator; the text
    says what actually happened. */
function ResultLine({ intent, children }: ResultLineProps) {
    const pipIntent = intent === "running" ? "running" : intent;
    return (
        <p className={styles.resultLine}>
            <StatusPip intent={pipIntent} />
            <span
                className={intent === "ok"
                    ? styles.resultOk
                    : intent === "running"
                    ? styles.resultRunning
                    : intent === "warn"
                    ? styles.resultWarn
                    : styles.resultError}
            >
                {children}
            </span>
        </p>
    );
}
