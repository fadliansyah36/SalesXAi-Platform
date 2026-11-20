import { access, cp, mkdir } from "node:fs/promises";
import path from "node:path";

const appRoot = process.cwd();
const repositoryRoot = path.resolve(appRoot, "../..");
const appRelativePath = path.relative(repositoryRoot, appRoot).split(path.sep).join("/");
const standaloneRoot = path.join(appRoot, ".next", "standalone");
const standaloneAppRoot = path.join(standaloneRoot, appRelativePath);
const serverFile = path.join(standaloneAppRoot, "server.js");
const staticSource = path.join(appRoot, ".next", "static");
const staticTarget = path.join(standaloneAppRoot, ".next", "static");
const publicSource = path.join(repositoryRoot, "public");
const publicTarget = path.join(standaloneAppRoot, "public");

await access(serverFile);
await access(staticSource);
await access(publicSource);
await mkdir(path.dirname(staticTarget), { recursive: true });
await cp(staticSource, staticTarget, { recursive: true, force: true });
await cp(publicSource, publicTarget, { recursive: true, force: true, dereference: true });
console.log("Prepared standalone runtime:", serverFile);
