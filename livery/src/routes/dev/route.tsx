import { useState } from "react";
import { createFileRoute, Link, Outlet, useMatches } from "@tanstack/react-router";
import { themeMap } from "@black-atom/core";
import { defaultTheme } from "../../lib/themes.ts";
import type { ThemeDefinition } from "@black-atom/core";
import { ThemeProvider } from "../../components/theme-provider/theme-provider.tsx";
import { DevLayout } from "../../components/dev-layout/dev-layout.tsx";

export const Route = createFileRoute("/dev")({
    component: Component,
});

const sections = [
    { to: "/dev", label: "Overview" },
    { to: "/dev/primitives", label: "Primitives" },
    { to: "/dev/typography", label: "Typography" },
    { to: "/dev/components", label: "Components" },
] as const;

const themes = Object.values(themeMap);

function Component() {
    const [theme, setTheme] = useState<ThemeDefinition>(
        defaultTheme,
    );

    const matches = useMatches();
    const currentPath = matches[matches.length - 1]?.fullPath ?? "/dev";

    return (
        <ThemeProvider theme={theme}>
            <DevLayout
                nav={
                    <>
                        <div
                            style={{
                                padding: "16px 12px 12px",
                                fontFamily: "var(--ba-font-mono)",
                                fontSize: 10,
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: "0.1em",
                            }}
                        >
                            Dev / Components
                        </div>
                        <div style={{ flex: 1, overflow: "auto", padding: "8px 0" }}>
                            {sections.map((s) => (
                                <Link
                                    key={s.to}
                                    to={s.to}
                                    style={{
                                        display: "block",
                                        padding: "6px 12px",
                                        fontSize: 12,
                                        textDecoration: "none",
                                        color: currentPath === s.to
                                            ? "var(--ba-color-fg-positive)"
                                            : "var(--ba-color-fg-subtle)",
                                        backgroundColor: currentPath === s.to
                                            ? "var(--ba-color-bg-hint)"
                                            : "transparent",
                                    }}
                                >
                                    {s.label}
                                </Link>
                            ))}
                        </div>
                    </>
                }
                aside={
                    <>
                        <div
                            style={{
                                padding: "16px 12px 12px",
                                fontFamily: "var(--ba-font-mono)",
                                fontSize: 10,
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: "0.1em",
                                color: "var(--ba-color-fg-subtle)",
                                borderBottom: "var(--ba-border)",
                            }}
                        >
                            Theme
                        </div>

                        <div style={{ flex: 1, overflow: "auto", padding: "4px 0" }}>
                            {themes.map((t) => (
                                <button
                                    type="button"
                                    key={t.meta.key}
                                    onClick={() => setTheme(t)}
                                    style={{
                                        display: "block",
                                        width: "100%",
                                        padding: "4px 12px",
                                        fontSize: 11,
                                        fontFamily: "inherit",
                                        textAlign: "left",
                                        cursor: "pointer",
                                        border: "none",
                                        color: t.meta.key === theme.meta.key
                                            ? "var(--ba-color-fg-positive)"
                                            : "var(--ba-color-fg-subtle)",
                                        backgroundColor: t.meta.key === theme.meta.key
                                            ? "var(--ba-color-bg-hint)"
                                            : "transparent",
                                    }}
                                >
                                    {t.meta.label}
                                </button>
                            ))}
                        </div>
                    </>
                }
            >
                <Outlet />
            </DevLayout>
        </ThemeProvider>
    );
}
