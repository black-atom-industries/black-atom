import { createContext, useContext } from "react";
import type { RefObject } from "react";
import type { AdapterEditableField, AppName, ThemeProvisioning } from "../../../bindings.ts";
import type { SetUpOutcome } from "../../../lib/adapter-setup.ts";
import type {
    LinkThemesRowResult,
    PathKind,
    TestApplyResult,
    VerifyPathResult,
} from "../../../components/settings/adapter-shared/index.ts";
import type { AdapterField } from "../../../components/settings/adapter-pages/index.ts";

/**
 * Session-local settings state, lifted above the adapters index/$adapter
 * routes so results and refs survive navigating between adapters — those
 * routes mount/unmount on every switch, unlike the old single-component
 * master-detail view.
 */
export type SettingsContextValue = {
    detecting: boolean;
    detections: Partial<Record<AppName, boolean>> | null;
    detectError: string | null;
    onAutoDetect: () => void;

    linkableApps: ReadonlySet<AppName>;
    provisioningByApp: Partial<Record<AppName, ThemeProvisioning>>;
    editableFieldsByApp: Partial<Record<AppName, ReadonlySet<AdapterEditableField>>>;

    verifyPathResults: Partial<Record<AppName, VerifyPathResult>>;
    onVerifyPath: (appName: AppName) => void;

    linkThemesResults: Partial<Record<AppName, LinkThemesRowResult>>;
    onLinkThemes: (appName: AppName) => void;

    setUpResults: Partial<Record<AppName, SetUpOutcome>>;
    onSetUp: (appName: AppName) => void;

    testApplyResults: Partial<Record<AppName, TestApplyResult>>;
    onTestApply: (appName: AppName) => void;

    onToggleEnabled: (appName: AppName) => void;
    onFieldCommit: (appName: AppName, field: AdapterField, value: string) => void;
    onPickPath: (kind: PathKind) => Promise<string | null>;
    onOpenUrl: (url: string) => void;

    firstFieldRef: RefObject<HTMLInputElement | null>;
};

export const SettingsContext = createContext<SettingsContextValue | null>(null);

export function useSettingsContext(): SettingsContextValue {
    const value = useContext(SettingsContext);
    if (!value) {
        throw new Error("useSettingsContext must be used within the settings route tree");
    }
    return value;
}
