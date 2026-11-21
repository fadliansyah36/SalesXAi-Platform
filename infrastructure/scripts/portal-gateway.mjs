import http from "node:http";
import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

const groups = {
  website: [
    { name: "website", directory: "apps/website", basePath: "", port: 3101, isDefault: true },
    { name: "sales", directory: "apps/sales-portal", basePath: "/sales", port: 3102 },
  ],
  company: [
    { name: "company", directory: "apps/company-portal", basePath: "", port: 3201, isDefault: true },
    { name: "distributor", directory: "apps/distributor-portal", basePath: "/distributor", port: 3202 },
    { name: "principal", directory: "apps/principal-portal", basePath: "/principal", port: 3203 },
    { name: "supervisor", directory: "apps/supervisor-portal", basePath: "/supervisor", port: 3204 },
    { name: "admin", directory: "apps/super-admin", basePath: "/admin", port: 3205 },
  ],
};

const groupName = process.argv[2];
const apps = groups[groupName];
if (!apps) {
  process.stderr.write("Usage: node infrastructure/scripts/portal-gateway.mjs <website|company>\n");
  process.exit(1);
}

const root = process.cwd();
const defaultApp = apps.find((app) => app.isDefault);
const children = new Map();
let stopping = false;

function appServerPath(app) {
  return path.join(root, app.directory, ".next", "standalone", app.directory, "server.js");
}

function stopChildren(signal = "SIGTERM") {
  for (const child of children.values()) {
    if (child.exitCode === null && child.signalCode === null) child.kill(signal);
  }
}

function shutdown(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  stopChildren("SIGTERM");
  server.close(() => process.exit(exitCode));
  setTimeout(() => {
    stopChildren("SIGKILL");
    process.exit(exitCode);
  }, 8000).unref();
}

function startApp(app) {
  const entry = appServerPath(app);
  if (!existsSync(entry)) {
    throw new Error("Missing standalone server for " + app.name + ": " + entry);
  }
  const child = spawn(process.execPath, [entry], {
    cwd: root,
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(app.port),
      HOSTNAME: "127.0.0.1",
      NEXT_TELEMETRY_DISABLED: "1",
    },
    stdio: "inherit",
  });
  children.set(app.name, child);
  child.on("error", (error) => {
    process.stderr.write("Portal process failed (" + app.name + "): " + error.message + "\n");
    shutdown(1);
  });
  child.on("exit", (code, signal) => {
    if (!stopping) {
      process.stderr.write("Portal process exited (" + app.name + "): code=" + code + " signal=" + signal + "\n");
      shutdown(code && code > 0 ? code : 1);
    }
  });
}

function resolveApp(requestUrl) {
  const pathname = new URL(requestUrl || "/", "http://salesx.internal").pathname;
  return apps.find((app) => app.basePath && (
    pathname === app.basePath || pathname.startsWith(app.basePath + "/")
  )) || defaultApp;
}

function firstStaticAsset(app, extension) {
  const staticRoot = path.join(root, app.directory, ".next", "standalone", app.directory, ".next", "static");
  if (!existsSync(staticRoot)) return null;
  const pending = [staticRoot];
  while (pending.length) {
    const directory = pending.pop();
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) pending.push(fullPath);
      else if (entry.isFile() && entry.name.endsWith(extension)) {
        return path.relative(staticRoot, fullPath).split(path.sep).join("/");
      }
    }
  }
  return null;
}

function requestStatus(app, route) {
  return new Promise((resolve) => {
    const request = http.get({
      hostname: "127.0.0.1",
      port: app.port,
      path: route,
      timeout: 2500,
      headers: { host: "127.0.0.1:" + app.port },
    }, (response) => {
      const status = response.statusCode || 500;
      response.resume();
      resolve(status);
    });
    request.on("timeout", () => request.destroy(new Error("health timeout")));
    request.on("error", () => resolve(0));
  });
}

function routeResponds(status) {
  return (status >= 200 && status < 400) || status === 401 || status === 403;
}

async function readiness() {
  const [apiStatus, bffStatus] = await Promise.all([
    requestStatus(defaultApp, "/api/health"),
    requestStatus(defaultApp, "/api/auth/csrf"),
  ]);
  const portalResults = await Promise.all(apps.map(async (app) => {
    const prefix = app.basePath || "";
    const jsAsset = firstStaticAsset(app, ".js");
    const cssAsset = firstStaticAsset(app, ".css");
    const [rootStatus, deepLinkStatus, jsStatus, cssStatus, manifestStatus, serviceWorkerStatus] = await Promise.all([
      requestStatus(app, prefix || "/"),
      requestStatus(app, prefix + "/portal"),
      jsAsset ? requestStatus(app, prefix + "/_next/static/" + jsAsset) : Promise.resolve(0),
      cssAsset ? requestStatus(app, prefix + "/_next/static/" + cssAsset) : Promise.resolve(0),
      requestStatus(app, prefix + "/manifest.webmanifest"),
      requestStatus(app, prefix + "/sw.js"),
    ]);
    return {
      root: routeResponds(rootStatus),
      deepLink: routeResponds(deepLinkStatus),
      staticAssets: jsStatus === 200 && cssStatus === 200,
      stylesheets: cssStatus === 200,
      manifest: manifestStatus === 200,
      serviceWorker: serviceWorkerStatus === 200,
      status: {
        root: rootStatus,
        deepLink: deepLinkStatus,
        javascript: jsStatus,
        stylesheet: cssStatus,
        manifest: manifestStatus,
        serviceWorker: serviceWorkerStatus,
      },
    };
  }));
  const portalStatus = Object.fromEntries(apps.map((app, index) => [app.name, portalResults[index]]));
  const healthy = apiStatus === 200 && bffStatus === 200 && portalResults.every((result) =>
    result.root && result.deepLink && result.staticAssets && result.stylesheets && result.manifest && result.serviceWorker);
  return {
    healthy,
    api: apiStatus === 200 ? "ready" : "not_ready",
    bff: bffStatus === 200 ? "ready" : "not_ready",
    apps: portalStatus,
  };
}

function forwardedHeaders(request, port) {
  const headers = { ...request.headers };
  const remoteAddress = request.socket.remoteAddress || "";
  headers["x-forwarded-host"] = request.headers.host || "";
  headers["x-forwarded-proto"] = request.headers["x-forwarded-proto"] ||
    (request.socket.encrypted ? "https" : "http");
  headers["x-forwarded-port"] = request.headers["x-forwarded-port"] ||
    (headers["x-forwarded-proto"] === "https" ? "443" : "80");
  headers["x-forwarded-for"] = [request.headers["x-forwarded-for"], remoteAddress]
    .filter(Boolean).join(", ");
  headers.host = request.headers.host || "127.0.0.1:" + port;
  return headers;
}

const server = http.createServer((request, response) => {
  const pathname = new URL(request.url || "/", "http://salesx.internal").pathname;
  if (request.method === "GET" && pathname === "/api/health") {
    readiness().then((state) => {
      response.writeHead(state.healthy ? 200 : 503, {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      });
      response.end(JSON.stringify({
        status: state.healthy ? "ok" : "degraded",
        group: groupName,
        api: state.api,
        portals: state.apps,
      }));
    }).catch(() => {
      response.writeHead(503, { "content-type": "application/json", "cache-control": "no-store" });
      response.end(JSON.stringify({ status: "degraded", group: groupName }));
    });
    return;
  }

  const app = resolveApp(request.url);
  const upstream = http.request({
    hostname: "127.0.0.1",
    port: app.port,
    path: request.url || "/",
    method: request.method,
    headers: forwardedHeaders(request, app.port),
  }, (upstreamResponse) => {
    response.writeHead(upstreamResponse.statusCode || 502, upstreamResponse.headers);
    upstreamResponse.pipe(response);
  });
  upstream.on("error", () => {
    if (!response.headersSent) {
      response.writeHead(502, { "content-type": "application/json", "cache-control": "no-store" });
    }
    response.end(JSON.stringify({ error: "portal_upstream_unavailable", portal: app.name }));
  });
  request.on("aborted", () => upstream.destroy());
  request.pipe(upstream);
});

server.on("upgrade", (request, socket, head) => {
  const app = resolveApp(request.url);
  const upstream = http.request({
    hostname: "127.0.0.1",
    port: app.port,
    path: request.url || "/",
    method: "GET",
    headers: forwardedHeaders(request, app.port),
  });
  upstream.on("upgrade", (upstreamResponse, upstreamSocket, upstreamHead) => {
    const lines = ["HTTP/1.1 " + (upstreamResponse.statusCode || 101) + " " + (upstreamResponse.statusMessage || "Switching Protocols")];
    for (const [name, value] of Object.entries(upstreamResponse.headers)) {
      if (Array.isArray(value)) value.forEach((item) => lines.push(name + ": " + item));
      else if (value !== undefined) lines.push(name + ": " + value);
    }
    socket.write(lines.join("\r\n") + "\r\n\r\n");
    if (head.length) upstreamSocket.write(head);
    if (upstreamHead.length) socket.write(upstreamHead);
    socket.pipe(upstreamSocket);
    upstreamSocket.pipe(socket);
  });
  upstream.on("response", (upstreamResponse) => {
    socket.end("HTTP/1.1 " + (upstreamResponse.statusCode || 502) + " " + (upstreamResponse.statusMessage || "Bad Gateway") + "\r\n\r\n");
    upstreamResponse.resume();
  });
  upstream.on("error", () => socket.destroy());
  upstream.end();
});

server.on("error", (error) => {
  process.stderr.write("Portal gateway error: " + error.message + "\n");
  shutdown(1);
});

for (const app of apps) startApp(app);

const publicPort = Number(process.env.PORT || 3000);
server.listen(publicPort, "0.0.0.0", () => {
  process.stdout.write("SalesX portal gateway listening on 0.0.0.0:" + publicPort +
    " group=" + groupName + " routes=" +
    apps.map((app) => (app.basePath || "/") + "->" + app.name).join(",") + "\n");
});

process.on("SIGTERM", () => shutdown(0));
process.on("SIGINT", () => shutdown(0));
