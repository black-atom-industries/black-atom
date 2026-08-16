import { AppShell } from "./app-shell.tsx";
import { SplitPanel } from "./split-panel.tsx";

/**
 * Layout components exposed as a compound namespace.
 *
 * Usage:
 *   <App.Shell header={...} footer={...}>content</App.Shell>
 *   <App.SplitPanel left={...} right={...} />
 */
export const App = {
    Shell: AppShell,
    SplitPanel,
} as const;
