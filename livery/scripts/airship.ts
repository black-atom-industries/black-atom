const token = Deno.env.get("LIVERY_DEV_BRIDGE_TOKEN") ?? "livery-airship-dev";
const env = { ...Deno.env.toObject(), LIVERY_DEV_BRIDGE_TOKEN: token };

const command = new Deno.Command(Deno.execPath(), {
    args: [
        "run",
        "-A",
        "npm:@airshiplabs/cli",
        "--exec",
        "deno task dev",
        "--target",
        "1420",
        "--open",
    ],
    env,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
});

const status = await command.output();
Deno.exit(status.code);
