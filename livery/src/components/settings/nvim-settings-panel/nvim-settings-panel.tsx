import type { NvimOverride, NvimSettings, NvimStyle, NvimSyntax } from "../../../bindings.ts";
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

const GUTTER_PADDING_OPTIONS = ["0", "1", "2", "3", "4"].map((value) => ({ value, label: value }));

type Props = {
    settings: NvimSettings;
    /** Lines of the user's Neovim config that override Livery. */
    overrides: NvimOverride[];
    dirty: boolean;
    saving: boolean;
    resultMessage?: string;
    resultFailed?: boolean;
    onChange: (settings: NvimSettings) => void;
    onSave: () => void;
    onReset: () => void;
};

/**
 * The Neovim plugin's options, stored as `apps.nvim.settings` in Livery's
 * config. Scalars as toggles and segmented choices, the six syntax groups as a
 * bold/italic grid.
 *
 * An `options` override makes the panel read-only, because the user's own
 * table wins over anything saved here. A `colorscheme` override only gets a
 * note.
 *
 * SAVE stays live after a failure even though the draft is clean: a failed
 * reload follows a successful save, so nothing is dirty to re-trigger it, and
 * retrying would otherwise be impossible.
 */
export function NvimSettingsPanel({
    settings,
    overrides,
    dirty,
    saving,
    resultMessage,
    resultFailed,
    onChange,
    onSave,
    onReset,
}: Props) {
    const { styles: s } = settings;
    const optionsOverride = overrides.find((o) => o.kind === "options");
    const colorschemeOverride = overrides.find((o) => o.kind === "colorscheme");
    const readOnly = optionsOverride !== undefined;

    function setStyles(patch: Partial<NvimSettings["styles"]>) {
        onChange({ ...settings, styles: { ...s, ...patch } });
    }

    function setSyntax(group: keyof NvimSyntax, patch: Partial<NvimStyle>) {
        setStyles({ syntax: { ...s.syntax, [group]: { ...s.syntax[group], ...patch } } });
    }

    return (
        <div className={styles.root}>
            <SectionHeader meta={dirty ? "UNSAVED" : undefined}>PLUGIN OPTIONS</SectionHeader>
            {optionsOverride ? (
                <Typo.Small color="warn" data-testid="nvim-options-override">
                    Read-only. Your Neovim config sets <code>vim.g.black_atom_core_config</code> at{" "}
                    <code>{location(optionsOverride)}</code>, and it wins over these options. Change
                    them there.
                </Typo.Small>
            ) : (
                <Typo.Small color="hint">
                    Stored in Livery&apos;s config as <code>apps.nvim.settings</code>, where the
                    plugin reads them. Running Neovims reload on save.
                </Typo.Small>
            )}
            {colorschemeOverride && (
                <Typo.Small color="hint" data-testid="nvim-colorscheme-override">
                    Neovim starts in the theme set at <code>{location(colorschemeOverride)}</code>.
                    Livery still reloads running instances.
                </Typo.Small>
            )}

            <div className={styles.rows}>
                <ToggleRow
                    disabled={readOnly}
                    label="TERM_COLORS"
                    note="Set the 16 terminal colors from the theme."
                    on={settings.term_colors}
                    onChange={() => onChange({ ...settings, term_colors: !settings.term_colors })}
                />
                <ToggleRow
                    disabled={readOnly}
                    label="ENDING_TILDES"
                    note="Show the end-of-buffer tildes."
                    on={s.ending_tildes}
                    onChange={() => setStyles({ ending_tildes: !s.ending_tildes })}
                />
                <ToggleRow
                    disabled={readOnly}
                    label="DARK_SIDEBARS"
                    note="Darken sidebars and the statusline."
                    on={s.dark_sidebars}
                    onChange={() => setStyles({ dark_sidebars: !s.dark_sidebars })}
                />
                <ToggleRow
                    disabled={readOnly}
                    label="DARK_FLOATS"
                    note="Darken floating windows and popups."
                    on={s.dark_floats}
                    onChange={() => setStyles({ dark_floats: !s.dark_floats })}
                />
                <ToggleRow
                    disabled={readOnly}
                    label="DARK_GUTTER"
                    note="Darken the line number, sign and fold columns."
                    on={s.dark_gutter ?? false}
                    onChange={() => setStyles({ dark_gutter: !s.dark_gutter })}
                />
                <ToggleRow
                    disabled={readOnly}
                    label="DIAGNOSTICS.UNDERCURL"
                    note="Underline diagnostics with a curl."
                    on={s.diagnostics.undercurl}
                    onChange={() =>
                        setStyles({
                            diagnostics: {
                                ...s.diagnostics,
                                undercurl: !s.diagnostics.undercurl,
                            },
                        })
                    }
                />
                <ToggleRow
                    disabled={readOnly}
                    label="DIAGNOSTICS.BACKGROUND"
                    note="Tint the background behind diagnostic virtual text."
                    on={s.diagnostics.background}
                    onChange={() =>
                        setStyles({
                            diagnostics: {
                                ...s.diagnostics,
                                background: !s.diagnostics.background,
                            },
                        })
                    }
                />
            </div>

            <div className={styles.choiceRow}>
                <span className={styles.rowTitle}>TRANSPARENCY</span>
                <RadioGroup
                    name="nvim-transparency"
                    options={withDisabled(TRANSPARENCY_OPTIONS, readOnly)}
                    value={s.transparency}
                    onChange={(value) => setStyles({ transparency: value })}
                />
            </div>
            <div className={styles.choiceRow}>
                <span className={styles.rowTitle}>GUTTER_PADDING</span>
                <RadioGroup
                    name="nvim-gutter-padding"
                    options={withDisabled(GUTTER_PADDING_OPTIONS, readOnly)}
                    value={String(s.gutter_padding ?? 0)}
                    onChange={(value) => setStyles({ gutter_padding: Number(value) })}
                />
            </div>
            <div className={styles.choiceRow}>
                <span className={styles.rowTitle}>CMP_KIND_COLOR_MODE</span>
                <RadioGroup
                    name="nvim-cmp-kind"
                    options={withDisabled(CMP_KIND_OPTIONS, readOnly)}
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
                        disabled={readOnly}
                        onToggle={(flag) => setSyntax(group, { [flag]: !s.syntax[group][flag] })}
                    />
                ))}
            </div>

            {!readOnly && (
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
                        <Typo.Small color={resultFailed ? "warn" : "hint"}>
                            {resultMessage}
                        </Typo.Small>
                    )}
                </div>
            )}
        </div>
    );
}

function location({ file, line }: NvimOverride) {
    return `${file}:${line}`;
}

function withDisabled(options: { value: string; label: string }[], disabled: boolean) {
    return options.map((option) => ({ ...option, disabled }));
}

function ToggleRow({
    label,
    note,
    on,
    disabled,
    onChange,
}: {
    label: string;
    note: string;
    on: boolean;
    disabled: boolean;
    onChange: () => void;
}) {
    return (
        <div className={styles.row}>
            <Toggle on={on} disabled={disabled} onChange={onChange} />
            <div className={styles.rowCopy}>
                <span className={styles.rowTitle}>{label}</span>
                <Typo.Small color="hint">{note}</Typo.Small>
            </div>
        </div>
    );
}

function GridRow({
    group,
    style,
    disabled,
    onToggle,
}: {
    group: keyof NvimSyntax;
    style: NvimStyle;
    disabled: boolean;
    onToggle: (flag: keyof NvimStyle) => void;
}) {
    return (
        <>
            <span className={styles.gridLabel}>{group.toUpperCase()}</span>
            <Toggle on={style.bold} disabled={disabled} onChange={() => onToggle("bold")} />
            <Toggle on={style.italic} disabled={disabled} onChange={() => onToggle("italic")} />
        </>
    );
}
