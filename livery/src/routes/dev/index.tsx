import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dev/")({
    component: DevOverview,
});

const sections = [
    {
        to: "/dev/primitives" as const,
        label: "Primitives",
        description: "Badge, Button, and other base components",
    },
    {
        to: "/dev/typography" as const,
        label: "Typography",
        description: "Font families and type scale",
    },
    {
        to: "/dev/components" as const,
        label: "Components",
        description: "AppHeader, AppFooter, ProgressBar, ThemeList, ThemeDetail",
    },
];

function DevOverview() {
    return (
        <div>
            <h1
                style={{
                    fontFamily: "var(--ba-font-display)",
                    fontSize: 14,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: 16,
                }}
            >
                Component Library
            </h1>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {sections.map((s) => (
                    <Link
                        key={s.to}
                        to={s.to}
                        style={{
                            display: "block",
                            padding: "12px 16px",
                            border: "var(--ba-border)",
                            textDecoration: "none",
                            color: "var(--ba-color-fg-default)",
                        }}
                    >
                        <div
                            style={{
                                fontSize: 12,
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                            }}
                        >
                            {s.label}
                        </div>
                        <div
                            style={{
                                fontSize: 11,
                                color: "var(--ba-color-fg-subtle)",
                                marginTop: 4,
                            }}
                        >
                            {s.description}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
