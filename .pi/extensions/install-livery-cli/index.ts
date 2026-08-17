import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
    pi.on("agent_settled", async (_event, ctx) => {
        const result = await pi.exec(
            "cargo",
            ["install", "--locked", "--path", "livery/cli", "--force"],
            { cwd: ctx.cwd },
        );

        if (!ctx.hasUI) return;

        if (result.code === 0) {
            ctx.ui.notify("Reinstalled the Livery CLI.", "info");
            return;
        }

        ctx.ui.notify("Livery CLI install failed.", "error");
    });
}
