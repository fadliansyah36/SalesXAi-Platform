import { access, cp, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const appRoot = process.cwd();
const repositoryRoot = path.resolve(appRoot, "../..");
const appRelativePath = path.relative(repositoryRoot, appRoot).split(path.sep).join("/");
const standaloneRoot = path.join(appRoot, ".next", "standalone");
const standaloneAppRoot = path.join(standaloneRoot, appRelativePath);
const serverFile = path.join(standaloneAppRoot, "server.js");
const staticSource = path.join(appRoot, ".next", "static");
const staticTarget = path.join(standaloneAppRoot, ".next", "static");
const sharedPublicSource = path.join(repositoryRoot, "public");
const appPublicSource = path.join(appRoot, "public");
const publicTarget = path.join(standaloneAppRoot, "public");

await access(serverFile);
await access(staticSource);
await mkdir(path.dirname(staticTarget), { recursive: true });
await cp(staticSource, staticTarget, { recursive: true, force: true });
if (existsSync(sharedPublicSource)) {
  await cp(sharedPublicSource, publicTarget, { recursive: true, force: true, dereference: true });
}
if (existsSync(appPublicSource)) {
  await cp(appPublicSource, publicTarget, { recursive: true, force: true, dereference: true });
}
await access(path.join(publicTarget, "icon.svg")).catch(() => {});
console.log("Prepared standalone runtime with Next static assets and public assets:", serverFile);
