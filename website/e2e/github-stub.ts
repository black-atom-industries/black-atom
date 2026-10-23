import { readFileSync } from "node:fs";
import { createServer } from "node:http";

/**
 * Answers the site's GitHub requests from the fixtures, so the e2e suite never reads the live API.
 * Commits on `livery/` answer with GitHub's rate limit, so one feed always shows the failure state.
 */
const port = Number(process.argv[2] ?? 4329);
const fixtures = new URL("../src/api/github/fixtures/", import.meta.url);

createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://localhost");
    const match = /^\/repos\/black-atom-industries\/([\w.-]+)\/(releases|commits)$/.exec(
        url.pathname,
    );
    const send = (status: number, body: unknown, headers: Record<string, string> = {}) => {
        response.writeHead(status, { "content-type": "application/json", ...headers });
        response.end(JSON.stringify(body));
    };

    if (url.pathname === "/") return send(200, { ok: true });
    if (match === null) return send(404, { message: "Not Found" });
    if (url.searchParams.get("path") === "livery/") {
        return send(403, { message: "API rate limit exceeded" }, { "x-ratelimit-remaining": "0" });
    }
    const [, repo = "", kind = ""] = match;
    const file = new URL(`${repo.replace(".nvim", "")}-${kind}.json`, fixtures);
    return send(200, JSON.parse(readFileSync(file, "utf8")));
}).listen(port);
