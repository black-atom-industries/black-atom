import type { NvimSettings, NvimStyle, NvimSyntax } from "../../../bindings.ts";
import { Button } from "../../primitives/button/button.tsx";
import { RadioGroup } from "../../primitives/radio-group/radio-group.tsx";
import { SectionHeader } from "../../primitives/section-header/section-header.tsx";
import { Toggle } from "../../primitives/toggle/toggle.tsx";
import { Typo } from "../../typo/index.ts";
import styles from "./nvim-settings-panel.module.css";

/** Group order matches the plugin's `styles.syntax` table. */
const SYNTAX_GROUPS = [
    "comments",
    "keywords",
    "functions",
    "strings",
    "variables",
    "messages",
] as const satisfies readonly (keyof NvimSyntax)[];

const TRANSPARENCY_OPTIONS = [
    { value: "none", label: "NONE" },
    { value: "partial", label: "PARTIAL" },
    { value: "full", label: "FULL" },
];

const CMP_KIND_OPTIONS = [
    { value: "fg", label: "FG" },
    { value: "bg", label: "BG" },
];

type Props = {
    settings: NvimSettings;
    dirty: boolean;
    saving: boolean;
    resultMessage?: string;
    resultFailed?: boolean;
    onChange: (settings: NvimSettings) => void;
    onSave: () => void;
    onReset: () => void;
};

/**
 * The Neovim plugin's options — everything Livery renders into the managed
 * Lua block. Scalars as toggles and segmented choices, the six syntax groups
 * as a bold/italic grid.
 *
 * SAVE stays live after a failed write even though the draft is clean: the
 * backend stores the settings in config before patching the block, so a
 * failure (usually a SETTINGS_PATH pointing nowhere) leaves nothing dirty to
 * re-trigger it, and retrying would otherwise be impossible.
 */
export function NvimSettingsPanel(
    { settings, dirty, saving, resultMessage, resultFailed, onChange, onSave, onReset }: Props,
) {
    const { styles: s } = settings;

    function setStyles(patch: Partial<NvimSettings["styles"]>) {
        onChange({ ...settings, styles: { ...s, ...patch } });
    }

    function setSyntax(group: keyof NvimSyntax, patch: Partial<NvimStyle>) {
        setStyles({ syntax: { ...s.syntax, [group]: { ...s.syntax[group], ...patch } } });
    }

    return (
        <div className={styles.root}>
            <SectionHeader meta={dirty ? "UNSAVED" : undefined}>PLUGIN OPTIONS</SectionHeader>
            <Typo.Small color="hint">
                Written into a managed block in SETTINGS_PATH as{" "}
                <code>vim.g.black_atom_core_config</code>. Restart Neovim to pick up a change.
            </Typo.Small>

            <div className={styles.rows}>
                <ToggleRow
                    label="TERM_COLORS"
                    note="Set the 16 terminal colors from the theme."
                    on={settings.term_colors}
                    onChange={() => onChange({ ...settings, term_colors: !settings.term_colors })}
                />
                <ToggleRow
                    label="ENDING_TILDES"
                    note="Show the end-of-buffer tildes."
                    on={s.ending_tildes}
                    onChange={() => setStyles({ ending_tildes: !s.ending_tildes })}
                />
                <ToggleRow
                    label="DARK_SIDEBARS"
                    note="Darken sidebars and the statusline."
                    on={s.dark_sidebars}
                    onChange={() => setStyles({ dark_sidebars: !s.dark_sidebars })}
                />
                <ToggleRow
                    label="DARK_FLOATS"
                    note="Darken floating windows and popups."
                    on={s.dark_floats}
                    onChange={() => setStyles({ dark_floats: !s.dark_floats })}
                />
                <ToggleRow
                    label="DIAGNOSTICS.UNDERCURL"
                    note="Underline diagnostics with a curl."
                    on={s.diagnostics.undercurl}
                    onChange={() =>
                        setStyles({
                            diagnostics: {
                                ...s.diagnostics,
                                undercurl: !s.diagnostics.undercurl,
                            },
                        })}
                />
                <ToggleRow
                    label="DIAGNOSTICS.BACKGROUND"
                    note="Tint the background behind diagnostic virtual text."
                    on={s.diagnostics.background}
                    onChange={() =>
                        setStyles({
                            diagnostics: {
                                ...s.diagnostics,
                                background: !s.diagnostics.background,
                            },
                        })}
                />
            </div>

            <div className={styles.choiceRow}>
                <span className={styles.rowTitle}>TRANSPARENCY</span>
                <RadioGroup
                    name="nvim-transparency"
                    options={TRANSPARENCY_OPTIONS}
                    value={s.transparency}
                    onChange={(value) => setStyles({ transparency: value })}
                />
            </div>
            <div className={styles.choiceRow}>
                <span className={styles.rowTitle}>CMP_KIND_COLOR_MODE</span>
                <RadioGroup
                    name="nvim-cmp-kind"
                    options={CMP_KIND_OPTIONS}
                    value={s.cmp_kind_color_mode}
                    onChange={(value) => setStyles({ cmp_kind_color_mode: value })}
                />
            </div>

            <SectionHeader>SYNTAX</SectionHeader>
            <div className={styles.grid}>
                <span className={styles.gridHead} />
                <span className={styles.gridHead}>BOLD</span>
                <span className={styles.gridHead}>ITALIC</span>
                {SYNTAX_GROUPS.map((group) => (
                    <GridRow
                        key={group}
                        group={group}
                        style={s.syntax[group]}
                        onToggle={(flag) => setSyntax(group, { [flag]: !s.syntax[group][flag] })}
                    />
                ))}
            </div>

            <div className={styles.actions}>
                <Button
                    intent="primary"
                    onClick={onSave}
                    disabled={(!dirty && !resultFailed) || saving}
                >
                    {saving ? "SAVING…" : "SAVE SETTINGS"}
                </Button>
                <Button intent="ghost" onClick={onReset} disabled={!dirty || saving}>
                    DISCARD
                </Button>
                {resultMessage && (
                    <Typo.Small color={resultFailed ? "warn" : "hint"}>{resultMessage}</Typo.Small>
                )}
            </div>
        </div>
    );
}

function ToggleRow(
    { label, note, on, onChange }: {
        label: string;
        note: string;
        on: boolean;
        onChange: () => void;
    },
) {
    return (
        <div className={styles.row}>
            <Toggle on={on} onChange={onChange} />
            <div className={styles.rowCopy}>
                <span className={styles.rowTitle}>{label}</span>
                <Typo.Small color="hint">{note}</Typo.Small>
            </div>
        </div>
    );
}

function GridRow(
    { group, style, onToggle }: {
        group: keyof NvimSyntax;
        style: NvimStyle;
        onToggle: (flag: keyof NvimStyle) => void;
    },
) {
    return (
        <>
            <span className={styles.gridLabel}>{group.toUpperCase()}</span>
            <Toggle on={style.bold} onChange={() => onToggle("bold")} />
            <Toggle on={style.italic} onChange={() => onToggle("italic")} />
        </>
    );
}
