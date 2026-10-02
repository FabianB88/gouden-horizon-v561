import { cpSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "dist");

rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });

for (const file of ["index.html", "styles.css", "favicon.svg", ".nojekyll"]) {
  cpSync(resolve(root, file), resolve(output, file));
}
for (const directory of ["assets", "src"]) {
  cpSync(resolve(root, directory), resolve(output, directory), { recursive: true });
}

console.log("Static game assembled in dist/.");
