import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { extname, join, normalize, sep } from "node:path";
import { brotliCompressSync, constants, gzipSync } from "node:zlib";
import * as participants from "../api/participants.js";
import * as profile from "../api/profile.js";

// Production server for hosts without Vercel functions (fly.io, reachable from mainland China where
// *.vercel.app is not): serves the built site from dist/ and the api/ handlers unchanged.

type Handler = (request: Request) => Promise<Response>;
const ROUTES: Record<string, Partial<Record<string, Handler>>> = { participants, profile };

const DIST = join(process.cwd(), "dist");
const PORT = Number(process.env.PORT ?? 8080);
const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".json": "application/json",
};

// dist/ never changes while the process runs, so each file is compressed once and kept in memory.
const COMPRESSIBLE = new Set([".html", ".js", ".css", ".svg", ".json"]);
const compressed = new Map<string, Buffer>();

async function compressedFile(file: string, encoding: "br" | "gzip"): Promise<Buffer> {
  const key = `${encoding}:${file}`;
  let body = compressed.get(key);
  if (!body) {
    const raw = await readFile(file);
    body =
      encoding === "br"
        ? brotliCompressSync(raw, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } })
        : gzipSync(raw, { level: 9 });
    compressed.set(key, body);
  }
  return body;
}

function pickEncoding(req: IncomingMessage): "br" | "gzip" | null {
  const accepted = String(req.headers["accept-encoding"] ?? "");
  if (/\bbr\b/.test(accepted)) return "br";
  if (/\bgzip\b/.test(accepted)) return "gzip";
  return null;
}

async function readBody(req: IncomingMessage): Promise<Buffer | undefined> {
  if (req.method === "GET" || req.method === "HEAD") return undefined;
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks);
}

async function serveApi(name: string, url: URL, req: IncomingMessage, res: ServerResponse) {
  const handler = ROUTES[name]?.[req.method ?? "GET"];
  if (!handler) {
    res.statusCode = ROUTES[name] ? 405 : 404;
    res.end();
    return;
  }
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === "string") headers.set(key, value);
  }
  // fly's edge sets Fly-Client-IP; a client-sent X-Real-IP must not reach the rate limiter.
  headers.set("x-real-ip", (req.headers["fly-client-ip"] as string | undefined) ?? req.socket.remoteAddress ?? "unknown");
  const response = await handler(new Request(url, { method: req.method, headers, body: await readBody(req) }));
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.end(Buffer.from(await response.arrayBuffer()));
}

async function serveFile(pathname: string, req: IncomingMessage, res: ServerResponse) {
  let file = normalize(join(DIST, decodeURIComponent(pathname)));
  if (!file.startsWith(DIST + sep) && file !== DIST) {
    res.statusCode = 400;
    res.end();
    return;
  }
  const info = await stat(file).catch(() => null);
  // Unknown paths (e.g. /r/<id> share links) render the app, which routes on the client.
  if (!info || info.isDirectory()) file = join(DIST, "index.html");
  const hashed = file.startsWith(join(DIST, "assets") + sep);
  res.setHeader("content-type", TYPES[extname(file)] ?? "application/octet-stream");
  res.setHeader("cache-control", hashed ? "public, max-age=31536000, immutable" : "no-cache");
  const encoding = COMPRESSIBLE.has(extname(file)) ? pickEncoding(req) : null;
  if (!encoding) {
    createReadStream(file).pipe(res);
    return;
  }
  res.setHeader("vary", "accept-encoding");
  res.setHeader("content-encoding", encoding);
  res.end(await compressedFile(file, encoding));
}

createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const api = /^\/api\/([a-z-]+)\/?$/.exec(url.pathname);
  const work = api ? serveApi(api[1], url, req, res) : serveFile(url.pathname, req, res);
  work.catch((e: unknown) => {
    console.error("request failed", { errorType: e instanceof Error ? e.name : typeof e });
    if (!res.headersSent) res.statusCode = 500;
    res.end();
  });
}).listen(PORT, () => console.log(`listening on ${PORT}`));
