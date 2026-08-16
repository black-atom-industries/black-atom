import type { AdapterEditableField, AppConfig } from "../../../bindings.ts";
import type {
    LinkThemesRowResult,
    PathKind,
    TestApplyResult,
    VerifyPathResult,
} from "../adapter-shared/index.ts";
import type { SetUpOutcome } from "../../../lib/adapter-setup.ts";

/** Fields an adapter updater may read, declared by the backend registry. */
export type AdapterField = AdapterEditableField;

/** Props every per-adapter settings page receives — one shape, one
    component per adapter, with field visibility supplied by the backend. */
export type AdapterPageProps = {
    appConfig: AppConfig;
    editableFields: ReadonlySet<AdapterField>;
    detected: boolean;
    onToggleEnabled: () => void;
    onFieldCommit: (field: AdapterField, value: string) => void;
    firstFieldRef?: React.RefObject<HTMLInputElement>;
    onPickPath: (kind: PathKind) => Promise<string | null>;
    onOpenUrl?: (url: string) => void;

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
