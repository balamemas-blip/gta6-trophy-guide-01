// Tiny static server for trying the guide locally: serves app/ at its root
// on http://localhost:8080. No build step, no dependencies, Node 22 only.
// Usage: node serve.ts  (then open http://localhost:8080 in desktop Chrome)

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = fileURLToPath(new URL("./app", import.meta.url));
const port = Number(process.env.PORT ?? 8080);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", "http://localhost");
    let path = decodeURIComponent(url.pathname);
    if (path === "/") path = "/index.html";
    if (path.includes("..")) throw Object.assign(new Error("bad path"), { code: "BAD" });
    const body = await readFile(join(appDir, path));
    response.writeHead(200, { "content-type": MIME[extname(path)] ?? "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found\n");
  }
});

server.listen(port, () => {
  console.log(`Leonida Trophy Guide at http://localhost:${port}`);
});
