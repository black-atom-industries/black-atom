import { realpathSync } from "node:fs";
import { type APIRequestContext, expect } from "@playwright/test";
import { bridgePort, bridgeToken, fixture } from "./environment.ts";

/** Call a livery command on the bridge directly, outside the UI. */
export async function invokeBridge<Result>(
    request: APIRequestContext,
    command: string,
    args: Record<string, unknown> = {},
): Promise<Result> {
    const response = await request.post(
        `http://127.0.0.1:${bridgePort}/__livery/invoke/${command}`,
        { headers: { "x-livery-dev-token": bridgeToken }, data: args },
    );
    expect(response.ok(), `${command} failed: ${await response.text()}`).toBe(true);
    return response.json();
}

/** The bridge must resolve `$HOME` to the fixture home before a test writes anything. */
export async function expectBridgeInFixtureHome(request: APIRequestContext) {
    const home = await invokeBridge<string>(request, "plugin:path|resolve_directory", {
        directory: 21,
    });
    expect(realpathSync(home)).toBe(realpathSync(fixture.home));
}
