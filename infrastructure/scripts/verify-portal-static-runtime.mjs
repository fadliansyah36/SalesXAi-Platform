import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const groups = {
  website: [
    { name: "website", directory: "apps/website", prefix: "" },
    { name: "sales", directory: "apps/sales-portal", prefix: "/sales" },
  ],
  customer: [
    { name: "customer", directory: "apps/customer-portal", prefix: "" },
  ],
  company: [
    { name: "company", directory: "apps/company-portal", prefix: "" },
    { name: "distributor", directory: "apps/distributor-portal", prefix: "/distributor" },
    { name: "principal", directory: "apps/principal-portal", prefix: "/principal" },
    { name: "supervisor", directory: "apps/supervisor-portal", prefix: "/supervisor" },
    { name: "admin", directory: "apps/super-admin", prefix: "/admin" },
  ],
};

const group = process.argv[2];
const apps = groups[group];
if (!apps) throw new Error("Usage: node verify-portal-static-runtime.mjs <website|customer|company>");
const port = Number(process.env.PORT || 3000);
const root = process.cwd();

function staticFiles(directory, extension) {
  const staticRoot = path.join(root, directory, ".next", "standalone", directory, ".next", "static");
  if (!fs.existsSync(staticRoot)) throw new Error("Missing standalone static directory: " + staticRoot);
  const found = [];
  const pending = [staticRoot];
  while (pending.length) {
    const current = pending.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) pending.push(full);
      else if (entry.isFile() && entry.name.endsWith(extension)) {
        found.push(path.relative(staticRoot, full).split(path.sep).join("/"));
      }
    }
  }
  return found;
}

function get(urlPath) {
  return new Promise((resolve, reject) => {
    const request = http.get({ hostname: "127.0.0.1", port, path: urlPath, timeout: 5000 }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => resolve({
        status: response.statusCode || 0,
        contentType: String(response.headers["content-type"] || ""),
        body: Buffer.concat(chunks).toString("utf8"),
      }));
    });
    request.on("timeout", () => request.destroy(new Error("request timeout: " + urlPath)));
    request.on("error", reject);
  });
}

async function retryGet(urlPath, deadline) {
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await get(urlPath);
      if (response.status === 200) return response;
      lastError = new Error(urlPath + " returned HTTP " + response.status);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw lastError || new Error("Timed out waiting for " + urlPath);
}

const deadline = Date.now() + 60000;
for (const app of apps) {
  const css = staticFiles(app.directory, ".css");
  const js = staticFiles(app.directory, ".js");
  if (!css.length) throw new Error(app.name + " build emitted no CSS files");
  if (!js.length) throw new Error(app.name + " build emitted no JavaScript chunks");

  const page = await retryGet(app.prefix || "/", deadline);
  const linkedStylesheets = [...page.body.matchAll(/href=["']([^"']+\.css(?:\?[^"']*)?)["']/g)].map((match) => match[1]);
  const linkedScripts = [...page.body.matchAll(/<script[^>]+src=["']([^"']+\.js(?:\?[^"']*)?)["']/g)].map((match) => match[1]);
  if (!linkedStylesheets.length) throw new Error(app.name + " HTML does not reference a stylesheet; check App Router CSS import");
  if (!linkedScripts.length) throw new Error(app.name + " HTML does not reference a JavaScript bundle; hydration cannot be verified");

  for (const href of linkedStylesheets) {
    const response = await retryGet(href, deadline);
    if (!response.contentType.includes("text/css") || response.body.length === 0) {
      throw new Error(app.name + " stylesheet is not delivered as CSS: " + href);
    }
  }
  for (const src of linkedScripts) {
    const response = await retryGet(src, deadline);
    if (!/(javascript|ecmascript)/i.test(response.contentType) || response.body.length === 0) {
      throw new Error(app.name + " JavaScript bundle is not delivered correctly: " + src);
    }
  }

  let tokenStylesheet = null;
  for (const file of css) {
    const asset = await retryGet((app.prefix || "") + "/_next/static/" + file, deadline);
    if (!asset.contentType.includes("text/css") || asset.body.length === 0) {
      throw new Error(app.name + " standalone CSS asset is missing or invalid: " + file);
    }
    if (/--salesx-color-background|--font-sans|--color-background/.test(asset.body)) tokenStylesheet = file;
  }
  if (!tokenStylesheet) throw new Error(app.name + " CSS assets do not contain canonical SalesX styling tokens");

  process.stdout.write("Static runtime OK: " + app.name +
    " page=" + (app.prefix || "/") +
    " css=" + linkedStylesheets.length +
    " js=" + linkedScripts.length +
    " tokenCSS=" + tokenStylesheet + "\n");
}
process.stdout.write("Portal group CSS/JS static runtime verified: " + group + "\n");
