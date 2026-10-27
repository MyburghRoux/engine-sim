// Dependency-free static server for the app.
// AudioWorklet modules must be served over HTTP(S), so opening index.html
// directly from disk will not work — run `npm start` instead.

import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { exec } from "node:child_process";

const PROJECT_ROOT = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(PROJECT_ROOT, "site");
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wasm": "application/wasm",
  ".txt": "text/plain; charset=utf-8",
};

const args = process.argv.slice(2);
const portArg = args.find((arg) => /^--port=/.test(arg));
const port = Number(portArg?.split("=")[1] ?? process.env.PORT ?? 8000);
const openBrowser = !args.includes("--no-open");

function sendFile(res, filePath, status = 200) {
  const extension = extname(filePath).toLowerCase();
  const headers = {
    "Content-Type": MIME[extension] ?? "application/octet-stream",
    "Cache-Control": "no-store",
    // Needed if you ever enable SharedArrayBuffer experiments.
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": "credentialless",
  };
  res.writeHead(status, headers);
  createReadStream(filePath).pipe(res);
}

function resolvePath(urlPath) {
  let pathname;
  try {
    pathname = decodeURIComponent(
      new URL(urlPath, "http://localhost").pathname,
    );
  } catch {
    return null;
  }

  let relative = normalize(pathname).replace(/^([/\\])+/, "");
  if (relative === "" || relative.endsWith("/")) relative += "index.html";
  const full = resolve(ROOT, relative);

  // Never serve outside the project directory.
  if (
    full !== resolve(ROOT, "index.html") &&
    !full.startsWith(resolve(ROOT) + sep)
  )
    return null;
  return full;
}

const server = createServer((req, res) => {
  if (req.url === "/" || req.url === "/index.html" || req.url === "/revving" || req.url === "/revving/index.html") {
    res.writeHead(302, { Location: "/revving/" });
    res.end();
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" });
    res.end("Method not allowed");
    return;
  }

  const filePath = resolvePath(req.url ?? "/");
  if (!filePath || !existsSync(filePath) || !statSync(filePath).isFile()) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(`Not found: ${req.url}`);
    return;
  }

  if (req.method === "HEAD") {
    res.writeHead(200, {
      "Content-Type": MIME[extname(filePath)] ?? "application/octet-stream",
    });
    res.end();
    return;
  }
  sendFile(res, filePath);
});

let activePort = port;
let attempts = 0;

server.on("error", (error) => {
  if (error.code === "EADDRINUSE" && attempts < 20) {
    attempts++;
    activePort++;
    console.warn(`Port ${activePort - 1} is busy, trying ${activePort}…`);
    server.listen(activePort);
    return;
  }
  console.error(`Could not start the server: ${error.message}`);
  process.exit(1);
});

server.listen(activePort, () => {
  const url = `http://localhost:${activePort}/`;
  console.log(`revving-revised serving ${join(ROOT)}`);
  console.log(`  ${url}`);
  console.log("  Ctrl+C to stop");
  if (openBrowser) {
    const command =
      process.platform === "darwin"
        ? `open "${url}"`
        : process.platform === "win32"
          ? `start "" "${url}"`
          : `xdg-open "${url}"`;
    exec(command, () => {
      // If no browser opener is available, the URL is printed above.
    });
  }
});
